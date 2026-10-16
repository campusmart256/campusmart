import { error, fail, redirect } from '@sveltejs/kit';
import { isUuid, validateListing } from '#lib/validation.js';
import { readImageFiles, storePhotos, removePhotos, MAX_PHOTOS } from '#lib/server/photos.js';
import { readListingFields, listingColumns, publishNotice } from '#lib/server/listings.js';

const EDITABLE = ['draft', 'active', 'expired'];

/**
 * Loads one of the user's own listings, or stops with "not found".
 * @param {App.Locals} locals @param {string} userId @param {string} id
 */
async function loadOwn(locals, userId, id) {
	if (!isUuid(id)) error(404, 'Listing not found');
	const { data, error: dbError } = await locals.supabase
		.from('listings')
		.select('id, title, description, price_ugx, condition, is_negotiable, status, campus_id, category_id, meetup_spot_id, seller_id, quantity_available, listing_images(storage_path, position)')
		.eq('id', id)
		.eq('seller_id', userId)
		.maybeSingle();
	if (dbError) console.error('edit load failed:', dbError.code, dbError.message);
	if (!data) error(404, 'Listing not found');
	return /** @type {any} */ (data);
}

export const load = async ({ locals, params }) => {
	const user = await locals.getUser();
	if (!user) redirect(303, `/signin?next=/my-listings/${params.id}/edit`);
	const listing = await loadOwn(locals, user.id, params.id);
	if (!EDITABLE.includes(listing.status)) redirect(303, '/my-listings');

	const [categories, spots] = await Promise.all([
		locals.supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
		locals.supabase.from('meetup_spots').select('id, name').eq('campus_id', listing.campus_id).eq('is_active', true).order('name')
	]);
	/** @type {{ storage_path: string, position: number }[]} */
	const imageRows = listing.listing_images ?? [];
	return {
		categories: categories.data ?? [],
		spots: spots.data ?? [],
		listingId: listing.id,
		status: listing.status,
		photos: [...imageRows].sort((a, b) => a.position - b.position).map((i) => i.storage_path),
		defaults: {
			title: listing.title,
			description: listing.description,
			priceText: String(listing.price_ugx),
			condition: listing.condition,
			categoryId: listing.category_id,
			meetupSpotId: listing.meetup_spot_id ?? '',
			negotiable: listing.is_negotiable,
			quantity: listing.quantity_available
		}
	};
};

export const actions = {
	default: async ({ request, locals, params }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/my-listings/${params.id}/edit`);
		const listing = await loadOwn(locals, user.id, params.id);
		if (!EDITABLE.includes(listing.status)) redirect(303, '/my-listings');
		const listingId = listing.id;

	const form = await request.formData();
	const intent = form.get('intent') === 'publish' && listing.status === 'draft' ? 'publish' : 'save';
	const requestedQuantity = String(form.get('quantity') ?? '').trim();

	const values = {
    ...readListingFields(form),
    quantity: requestedQuantity
};

	const errors = validateListing(values);
		if (!/^[1-9]\d*$/.test(requestedQuantity) || Number(requestedQuantity) > 100000) {
			errors.quantity = 'Enter a whole number between 1 and 100,000.';
		}

		// Which photos stay, which are new, and in what order
		/** @type {string[]} */
		const existingKeys = (listing.listing_images ?? []).map((/** @type {any} */ i) => i.storage_path);
		const read = await readImageFiles(form.getAll('photos'));
		if ('error' in read) errors.photos = read.error;
		const newPhotos = 'photos' in read ? read.photos : [];

		/** @type {({ keep: string } | { fresh: number })[]} */
		const plan = [];
		const seenKeep = new Set();
		const seenNew = new Set();
		for (const token of form.getAll('order')) {
			const t = String(token);
			if (t.startsWith('k:')) {
				const key = t.slice(2);
				if (existingKeys.includes(key) && !seenKeep.has(key)) { plan.push({ keep: key }); seenKeep.add(key); }
			} else if (t.startsWith('n:')) {
				const n = Number(t.slice(2));
				if (Number.isInteger(n) && n >= 0 && n < newPhotos.length && !seenNew.has(n)) { plan.push({ fresh: n }); seenNew.add(n); }
			}
		}
		if (!errors.photos && seenNew.size !== newPhotos.length) errors.photos = 'Something went wrong with the photos. Please try again.';
		if (!errors.photos && (plan.length < 1 || plan.length > MAX_PHOTOS)) errors.photos = plan.length < 1 ? 'Add at least one photo.' : `You can add up to ${MAX_PHOTOS} photos.`;
		if (Object.keys(errors).length) return fail(400, { values, errors });

		if (values.meetupSpotId) {
			const { data: spot } = await locals.supabase.from('meetup_spots').select('id').eq('id', values.meetupSpotId).eq('campus_id', listing.campus_id).eq('is_active', true).maybeSingle();
			if (!spot) return fail(400, { values, errors: { meetup: 'Choose a meetup spot from the list.' } });
		}

		// Change stock through a seller-only RPC, never a direct client-side quantity update.
		const stock = await locals.supabase.rpc('set_listing_stock', {
			p_listing_id: listingId,
			p_quantity: Number(requestedQuantity)
		});
		if (stock.error) {
			console.error('stock update failed:', stock.error.code, stock.error.message);
			return fail(400, { values, errors: { quantity: stock.error.message }, message: 'Stock was not updated.' });
		}

		// 1. Save the text fields
		const updated = await locals.supabase.from('listings').update(listingColumns(values)).eq('id', listingId).select('status');
		if (updated.error || !updated.data?.length) {
			console.error('listing update failed:', updated.error?.code, updated.error?.message);
			return fail(500, { values, errors: {}, message: 'We could not save your changes. Please try again.' });
		}

		// 2. Photos, only when they changed
		const keptKeys = plan.flatMap((p) => ('keep' in p ? [p.keep] : []));
		const removedKeys = existingKeys.filter((k) => !keptKeys.includes(k));
		const orderChanged = keptKeys.join('|') !== existingKeys.filter((k) => keptKeys.includes(k)).join('|');
		if (removedKeys.length || newPhotos.length || orderChanged) {
			/** @type {string[]} */
			let newKeys = [];
			try {
				newKeys = await storePhotos(listingId, newPhotos);
			} catch (e) {
				console.error('photo storage failed:', e instanceof Error ? e.message : e);
				return fail(500, { values, errors: {}, message: 'Your text was saved, but the photos could not be stored. Please try again.' });
			}
			const finalKeys = plan.map((p) => ('keep' in p ? p.keep : newKeys[p.fresh]));
			const rowsFor = (/** @type {string[]} */ keys) => keys.map((storage_path, i) => ({ listing_id: listingId, storage_path, position: i + 1 }));

			const cleared = await locals.supabase.from('listing_images').delete().eq('listing_id', listingId);
			if (cleared.error) {
				console.error('photo rows delete failed:', cleared.error.code, cleared.error.message);
				await removePhotos(newKeys);
				return fail(500, { values, errors: {}, message: 'Your text was saved, but the photos could not be updated. Please try again.' });
			}
			const inserted = await locals.supabase.from('listing_images').insert(rowsFor(finalKeys));
			if (inserted.error) {
				console.error('photo rows insert failed:', inserted.error.code, inserted.error.message);
				await locals.supabase.from('listing_images').insert(rowsFor(existingKeys)); // put the old photos back
				await removePhotos(newKeys);
				return fail(500, { values, errors: {}, message: 'Your text was saved, but the photos could not be updated. Please try again.' });
			}
			await removePhotos(removedKeys);
		}

		// 3. Publish a draft if asked
		if (intent === 'publish') {
			const published = await locals.supabase.from('listings').update({ status: 'active' }).eq('id', listingId).select('status');
			if (published.error || !published.data?.length) {
				console.error('publish failed:', published.error?.code, published.error?.message);
				redirect(303, `/listing/${listingId}?notice=${publishNotice(published.error?.message)}`);
			}
			redirect(303, `/listing/${listingId}?notice=${published.data[0].status === 'held' ? 'held' : 'published'}`);
		}
		redirect(303, `/listing/${listingId}?notice=${updated.data[0].status === 'held' ? 'held' : 'saved'}`);
	}
};
