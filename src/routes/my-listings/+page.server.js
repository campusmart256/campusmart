import { fail, redirect } from '@sveltejs/kit';
import { isUuid } from '#lib/validation.js';
import { friendlyPublishError } from '#lib/server/listings.js';

/** @type {Record<string, string[]>} */
const TABS = { dashboard: [], active: ['active'], drafts: ['draft', 'held', 'removed'], sold: ['sold'], expired: ['expired'], bought: [], sales: [], inventory: ['active'] };

export const load = async ({ locals, url }) => {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/my-listings');

	const tabParam = url.searchParams.get('tab') ?? '';
	const tab = Object.prototype.hasOwnProperty.call(TABS, tabParam) ? tabParam : 'active';

	const { data, error } = await locals.supabase
		.from('listings')
		.select('id, title, price_ugx, status, expires_at, sold_to_user_id, sold_outside, quantity_available, created_at, listing_images(storage_path, position)')
		.eq('seller_id', user.id)
		.neq('status', 'deleted')
		.order('created_at', { ascending: false })
		.limit(200);
	if (error) console.error('my listings load failed:', error.code, error.message);

	// Bought items belong to the logged-in buyer, not to the seller's listings.
	// Never rely on the browser to decide whether a purchase is reviewable.
	let boughtRows = /** @type {any[]} */ ([]);
	let boughtLoadFailed = false;
	let reviewsLoadFailed = false;
	if (tab === 'bought') {
		const sales = await locals.supabase
			.from('listing_sales')
			.select('listing_id, quantity, listings!inner(id, title, price_ugx, status, sold_to_user_id, seller_id, quantity_available, listing_images(storage_path, position))')
			.eq('buyer_id', user.id)
			.order('created_at', { ascending: false })
			.limit(200);
		if (sales.error) {
			boughtLoadFailed = true;
			console.error('purchases load failed:', sales.error.code, sales.error.message);
		} else {
			const purchaseMap = new Map();
			for (const sale of sales.data ?? []) {
				const previous = purchaseMap.get(sale.listing_id);
				if (previous) previous.purchasedQuantity += sale.quantity;
				else purchaseMap.set(sale.listing_id, { ...sale.listings, purchasedQuantity: sale.quantity });
			}
			boughtRows = [...purchaseMap.values()];
		}
		const bought = await locals.supabase
			.from('listings')
			.select('id, title, price_ugx, status, sold_to_user_id, seller_id, listing_images(storage_path, position)')
			.eq('sold_to_user_id', user.id)
			.eq('status', 'sold')
			.order('created_at', { ascending: false })
			.limit(200);
		if (bought.error) {
			boughtLoadFailed = true;
			console.error('bought items load failed:', bought.error.code, bought.error.message);
		} else {
			// Include legacy purchases recorded before quantity tracking was added.
			const ids = new Set(boughtRows.map((row) => row.id));
			boughtRows.push(...(bought.data ?? []).filter((row) => !ids.has(row.id)).map((row) => ({ ...row, purchasedQuantity: 1 })));
		}
	}
	// Seller's transaction history. Each recorded sale is a separate event, even
	// when several buyers purchase units from the same active listing.
	let salesHistory = /** @type {any[]} */ ([]);
	let salesLoadFailed = false;
	if (tab === 'sales' || tab === 'dashboard') {
		const sales = await locals.supabase
			.from('listing_sales')
			.select('id, listing_id, buyer_id, quantity, sold_outside, created_at')
			.eq('seller_id', user.id)
			.order('created_at', { ascending: false })
			.limit(200);
		if (sales.error) {
			salesLoadFailed = true;
			console.error('seller sales history failed:', sales.error.code, sales.error.message);
		} else {
			const salesRows = sales.data ?? [];
			const listingIds = [...new Set(salesRows.map((row) => row.listing_id))];
			const buyerIds = [...new Set(salesRows.map((row) => row.buyer_id).filter(Boolean))];
			const [listingNames, buyerNames] = await Promise.all([
				listingIds.length
					? locals.supabase.from('listings').select('id, title').eq('seller_id', user.id).in('id', listingIds)
					: Promise.resolve({ data: [], error: null }),
				buyerIds.length
					? locals.supabase.from('profiles').select('id, display_name').in('id', buyerIds)
					: Promise.resolve({ data: [], error: null })
			]);
			if (listingNames.error) console.error('sales listing titles failed:', listingNames.error.code, listingNames.error.message);
			if (buyerNames.error) console.error('sales buyer names failed:', buyerNames.error.code, buyerNames.error.message);
			const titles = new Map((listingNames.data ?? []).map((l) => [l.id, l.title]));
			const names = new Map((buyerNames.data ?? []).map((b) => [b.id, b.display_name]));
			salesHistory = salesRows.map((sale) => ({
				id: sale.id,
				listingId: sale.listing_id,
				itemTitle: titles.get(sale.listing_id) ?? 'Listing unavailable',
				buyerName: sale.buyer_id ? (names.get(sale.buyer_id) || 'CampusMart buyer') : sale.sold_outside ? 'Outside CampusMart' : 'Buyer not recorded',
				buyerType: sale.sold_outside ? 'outside' : sale.buyer_id ? 'campusmart' : 'unrecorded',
				quantity: sale.quantity,
				createdAt: sale.created_at
			}));
		}
	}
	let reviewsByListing = /** @type {Record<string, any>} */ ({});
	if (boughtRows.length) {
		const reviews = await locals.supabase
			.from('item_reviews')
			.select('listing_id, rating, comment, created_at')
			.eq('buyer_id', user.id)
			.in('listing_id', boughtRows.map((row) => row.id));
		if (reviews.error) {
			reviewsLoadFailed = true;
			console.error('bought item reviews load failed:', reviews.error.code, reviews.error.message);
		} else {
			reviewsByListing = Object.fromEntries((reviews.data ?? []).map((review) => [review.listing_id, review]));
		}
	}
	const rows = /** @type {any[]} */ (data ?? []);
	const counts = Object.fromEntries(Object.entries(TABS).map(([name, statuses]) => [name, rows.filter((r) => statuses.includes(r.status)).length]));
	const now = Date.now();
	const listings = (tab === 'bought' ? boughtRows : rows)
		.filter((r) => tab === 'bought' || TABS[tab].includes(r.status))
		.map((r) => {
			const cover = [...(r.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
			const daysLeft = r.expires_at ? Math.max(0, Math.ceil((new Date(r.expires_at).getTime() - now) / 86_400_000)) : null;
			return { id: r.id, title: r.title, price: r.price_ugx, status: r.status, cover: cover?.storage_path ?? null, daysLeft, soldOutside: r.sold_outside, hasBuyer: !!r.sold_to_user_id, quantityAvailable: r.quantity_available, purchasedQuantity: r.purchasedQuantity ?? 1, review: tab === 'bought' ? reviewsByListing[r.id] ?? null : null };
		});

	// Inventory is a view of active listings, ordered by the most urgent stock levels.
	// This is computed from existing listing quantities; no new database objects.
	if (tab === 'inventory') {
		listings.sort((a, b) => (a.quantityAvailable ?? 1) - (b.quantityAvailable ?? 1) || a.title.localeCompare(b.title));
	}
	const inventoryStats = {
		activeListings: rows.filter((r) => r.status === 'active').length,
		unitsAvailable: rows.filter((r) => r.status === 'active').reduce((total, r) => total + (r.quantity_available ?? 1), 0),
		lowStock: rows.filter((r) => r.status === 'active' && (r.quantity_available ?? 1) <= 3).length
	};
	// Dashboard review summary uses the seller's own reviews. A failed review query
	// should not hide the inventory or sales metrics.
	let reviewStats = { count: 0, average: null, recent: [] };
	let dashboardReviewsFailed = false;
	if (tab === 'dashboard') {
		const result = await locals.supabase
			.from('item_reviews')
			.select('listing_id, rating, created_at')
			.eq('seller_id', user.id)
			.order('created_at', { ascending: false })
			.limit(200);
		if (result.error) {
			dashboardReviewsFailed = true;
			console.error('seller dashboard reviews failed:', result.error.code, result.error.message);
		} else {
			const reviews = result.data ?? [];
			const names = new Map(rows.map((r) => [r.id, r.title]));
			reviewStats = {
				count: reviews.length,
				average: reviews.length ? Math.round(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length * 10) / 10 : null,
				recent: reviews.slice(0, 3).map((r) => ({
					listingId: r.listing_id,
					itemTitle: names.get(r.listing_id) ?? 'Previously sold item',
					rating: r.rating,
					createdAt: r.created_at
				}))
			};
		}
	}
	const dashboardStats = {
		active: inventoryStats.activeListings,
		drafts: rows.filter((r) => ['draft', 'held'].includes(r.status)).length,
		soldOut: rows.filter((r) => r.status === 'sold').length,
		unitsAvailable: inventoryStats.unitsAvailable,
		lowStock: inventoryStats.lowStock,
		transactions: salesHistory.length,
		unitsSold: salesHistory.reduce((total, sale) => total + sale.quantity, 0)
	};
	counts.bought = tab === 'bought' ? boughtRows.length : null;
	counts.sales = tab === 'sales' ? salesHistory.length : null;
	counts.inventory = inventoryStats.lowStock;
	counts.dashboard = null;
	return { tab, counts, listings, inventoryStats, salesHistory, salesLoadFailed, dashboardStats, reviewStats, dashboardReviewsFailed, loadFailed: tab === 'bought' ? boughtLoadFailed : !!error, reviewsLoadFailed, soldNotice: url.searchParams.get('sold') === '1' };
};

/**
 * Runs one status change on one of the user's own listings.
 * @param {import('@sveltejs/kit').RequestEvent} event
 * @param {string} status
 */
async function changeStatus({ request, locals }, status) {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/my-listings');
	const id = String((await request.formData()).get('id') ?? '');
	if (!isUuid(id)) return fail(400, { id, message: 'That listing was not found.' });

	const { data, error } = await locals.supabase.from('listings').update({ status }).eq('id', id).eq('seller_id', user.id).select('status');
	if (error || !data?.length) {
		console.error(`status change to ${status} failed:`, error?.code, error?.message, 'rows:', data?.length);
		return fail(400, { id, message: friendlyPublishError(error?.message) });
	}
	return { id, done: status, resultStatus: data[0].status };
}

export const actions = {
	/** Only a recorded buyer can submit a review, enforced again by the Supabase RPC. */
	reviewBought: async ({ request, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, '/signin?next=/my-listings?tab=bought');
		const form = await request.formData();
		const id = String(form.get('id') ?? '');
		const rating = Number(form.get('rating'));
		const comment = String(form.get('comment') ?? '').trim();
		if (!isUuid(id) || !Number.isInteger(rating) || rating < 1 || rating > 5 || comment.length > 500) {
			return fail(400, { reviewError: 'Choose 1–5 stars and a comment of at most 500 characters.', reviewId: id });
		}
		const [sale, legacy] = await Promise.all([
			locals.supabase.from('listing_sales').select('id').eq('listing_id', id).eq('buyer_id', user.id).limit(1).maybeSingle(),
			locals.supabase.from('listings').select('id').eq('id', id).eq('sold_to_user_id', user.id).eq('status', 'sold').maybeSingle()
		]);
		if ((sale.error || legacy.error) || (!sale.data && !legacy.data)) {
			return fail(403, { reviewError: 'This item is not recorded as bought by your account.', reviewId: id });
		}
		const { error: reviewError } = await locals.supabase.rpc('submit_item_review', {
			p_listing_id: id,
			p_rating: rating,
			p_comment: comment || null
		});
		if (reviewError) {
			console.error('bought item review failed:', reviewError.code, reviewError.message);
			return fail(400, { reviewError: /already/i.test(reviewError.message) ? 'You have already reviewed this item.' : 'Could not submit your review. Check the server log.', reviewId: id });
		}
		return { reviewSuccess: 'Your review was submitted.', reviewId: id };
	},

	/** Publish a draft. */
	publish: (event) => changeStatus(event, 'active'),
	/** Put an expired listing back on sale for another 30 days. */
	renew: (event) => changeStatus(event, 'active'),
	/** Remove a listing (it is hidden, not erased). */
	delete: (event) => changeStatus(event, 'deleted')
};
