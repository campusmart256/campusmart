import { fail, redirect } from '@sveltejs/kit';
import { cleanText, validateListing, parsePrice } from '#lib/validation.js';
import { readPhotos, storePhotos, removePhotos } from '#lib/server/photos.js';

export const load = async ({ locals }) => {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/sell');

	const { data: profile } = await locals.supabase.from('profiles').select('campus_id').eq('id', user.id).maybeSingle();
	const [categories, spots] = await Promise.all([
		locals.supabase.from('categories').select('id, name').eq('is_active', true).order('sort_order'),
		profile
			? locals.supabase.from('meetup_spots').select('id, name').eq('campus_id', profile.campus_id).eq('is_active', true).order('name')
			: Promise.resolve({ data: [] })
	]);
	return { categories: categories.data ?? [], spots: spots.data ?? [], hasProfile: !!profile };
};

/** @param {string} message */
function noticeFor(message) {
	return /listing limit/i.test(message) ? 'limit' : 'error';
}

export const actions = {
	default: async ({ request, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, '/signin?next=/sell');

		const form = await request.formData();
		const intent = form.get('intent') === 'draft' ? 'draft' : 'publish';
		const values = {
			title: cleanText(form.get('title')),
			description: String(form.get('description') ?? '').replace(/\r\n/g, '\n').trim(),
			priceText: String(form.get('price') ?? '').trim(),
			condition: String(form.get('condition') ?? ''),
			categoryId: String(form.get('category') ?? ''),
			meetupSpotId: String(form.get('meetup') ?? ''),
			negotiable: form.get('negotiable') === 'on',
			quantity: String(form.get('quantity') ?? '').trim()
		};

		const errors = validateListing(values);
		if (!/^[1-9]\d*$/.test(values.quantity) || Number(values.quantity) > 100000) errors.quantity = 'Enter a whole number between 1 and 100,000.';
		const photoResult = await readPhotos(form.getAll('photos'));
		if ('error' in photoResult) errors.photos = photoResult.error;
		if (Object.keys(errors).length || !('photos' in photoResult)) return fail(400, { values, errors });

		const { data: profile } = await locals.supabase.from('profiles').select('campus_id').eq('id', user.id).maybeSingle();
		if (!profile) return fail(500, { values, errors: {}, message: 'We could not find your profile. Please sign out and in again.' });

		if (values.meetupSpotId) {
			const { data: spot } = await locals.supabase.from('meetup_spots').select('id').eq('id', values.meetupSpotId).eq('campus_id', profile.campus_id).eq('is_active', true).maybeSingle();
			if (!spot) return fail(400, { values, errors: { meetup: 'Choose a meetup spot from the list.' } });
		}

		// 1. Create the listing as a draft
		const created = await locals.supabase
			.from('listings')
			.insert({
				seller_id: user.id,
				campus_id: profile.campus_id,
				category_id: values.categoryId,
				title: values.title,
				description: values.description,
				price_ugx: parsePrice(values.priceText),
				condition: values.condition,
				is_negotiable: values.negotiable,
				quantity_available: Number(values.quantity),
				meetup_spot_id: values.meetupSpotId || null
			})
			.select('id')
			.single();
		if (created.error || !created.data) {
			console.error('listing insert failed:', created.error?.code, created.error?.message);
			return fail(500, { values, errors: {}, message: 'We could not save your listing. Please try again.' });
		}
		const listingId = created.data.id;

		/** Hides a half-created listing so it never shows up. */
		const discard = async () => {
			await locals.supabase.from('listings').update({ status: 'deleted' }).eq('id', listingId);
		};

		// 2. Store the photos
		/** @type {string[]} */
		let keys = [];
		try {
			keys = await storePhotos(listingId, photoResult.photos);
		} catch (e) {
			console.error('photo storage failed:', e instanceof Error ? e.message : e);
			await discard();
			return fail(500, { values, errors: {}, message: 'We could not store your photos. Please try again.' });
		}

		// 3. Record the photos in the database
		const rows = keys.map((storage_path, i) => ({ listing_id: listingId, storage_path, position: i + 1 }));
		const imaged = await locals.supabase.from('listing_images').insert(rows);
		if (imaged.error) {
			console.error('image rows failed:', imaged.error.code, imaged.error.message);
			await removePhotos(keys);
			await discard();
			return fail(500, { values, errors: {}, message: 'We could not save your photos. Please try again.' });
		}


// 4. Publish (or keep as a draft)
if (intent === 'draft') redirect(303, `/listing/${listingId}?notice=draft`);

// Publish through the secured database function.
// The RPC checks ownership, serializes publication attempts,
// and uses the existing listings_guard trigger for validation.
const { data: publishedStatus, error: publishError } =
    await locals.supabase.rpc('publish_listing', {
        p_listing_id: listingId
    });

if (publishError || !publishedStatus) {
    console.error('publish failed:', publishError?.code, publishError?.message);
    redirect(
        303,
        `/listing/${listingId}?notice=${noticeFor(publishError?.message ?? '')}`
    );
}

redirect(
    303,
    `/listing/${listingId}?notice=${publishedStatus === 'held' ? 'held' : 'published'}`
);

}
}
