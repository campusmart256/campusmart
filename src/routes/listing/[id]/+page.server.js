import { error, fail, redirect } from '@sveltejs/kit';
import { isUuid } from '#lib/validation.js';
import { rankSimilar } from '#lib/similar.js';

const reportReasons = new Set(['scam_or_fake', 'prohibited_item', 'harassment', 'other']);
const REVIEW_MIN = 1;
const REVIEW_MAX = 5;

const CARD_SELECT =
	'id, title, price_ugx, condition, is_negotiable, published_at, category_id, seller_id, categories(name), listing_images(storage_path, position), profiles!listings_seller_id_fkey(display_name, verification_status)';

export const load = async ({ params, locals, url }) => {
	if (!isUuid(params.id)) error(404, 'Listing not found');
	const user = await locals.getUser();

	const { data, error: dbError } = await locals.supabase
		.from('listings')
		.select(
			'id, title, description, price_ugx, condition, is_negotiable, status, quantity_available, published_at, seller_id, sold_to_user_id, category_id, categories(name), meetup_spots(name), listing_images(storage_path, position), profiles!listings_seller_id_fkey(display_name, verification_status, avatar_path)'
		)
		.eq('id', params.id)
		.maybeSingle();
	if (dbError) console.error('listing load failed:', dbError.code, dbError.message);
	if (!data) error(404, 'Listing not found');

	const row = /** @type {any} */ (data);
	/** @type {{ storage_path: string, position: number }[]} */
	const imageRows = row.listing_images ?? [];
	const images = [...imageRows].sort((a, b) => a.position - b.position).map((i) => i.storage_path);
	// Similar items: only for live listings. Same category first, then the newest of anything else.
	/** @type {any[]} */
	let similar = [];
	if (row.status === 'active') {
		const sameCategory = await locals.supabase
			.from('listings')
			.select(CARD_SELECT)
			.eq('status', 'active')
			.eq('category_id', row.category_id)
			.neq('id', row.id)
			.order('published_at', { ascending: false })
			.limit(40);
		if (sameCategory.error) console.error('similar (category) failed:', sameCategory.error.code, sameCategory.error.message);
		let pool = /** @type {any[]} */ (sameCategory.data ?? []);
		if (pool.length < 6) {
			const others = await locals.supabase
				.from('listings')
				.select(CARD_SELECT)
				.eq('status', 'active')
				.neq('id', row.id)
				.order('published_at', { ascending: false })
				.limit(40);
			if (others.error) console.error('similar (others) failed:', others.error.code, others.error.message);
			pool = [...pool, .../** @type {any[]} */ (others.data ?? [])];
		}
		similar = rankSimilar(row, pool, 6).map((l) => {
			const first = [...(l.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
			return {
				id: l.id,
				title: l.title,
				price: l.price_ugx,
				condition: l.condition,
				negotiable: l.is_negotiable,
				category: l.categories?.name ?? '',
				seller: l.profiles?.display_name ?? '',
				cover: first?.storage_path ?? null,
				verified: l.profiles?.verification_status === 'verified',
                own: l.seller_id === user?.id
			};
		});
	}

	// Seller feedback is shared across every listing owned by this seller.
	// The read-only RPC exposes only public review fields from completed sales.
	let sellerReviews = [];
	let sellerReviewsUnavailable = false;
	try {
		const { data: reviews, error: reviewsError } = await locals.supabase.rpc('get_public_seller_reviews', {
			p_seller_id: row.seller_id
		});
		if (reviewsError) {
			sellerReviewsUnavailable = true;
			console.error('public seller reviews load failed:', reviewsError.code, reviewsError.message);
		}
		else sellerReviews = reviews ?? [];
	} catch (reviewsError) {
		sellerReviewsUnavailable = true;
		console.error('public seller reviews load crashed:', reviewsError);
	}
	const sellerFeedbackCount = sellerReviews.length;
	const sellerRatingAverage = sellerFeedbackCount
		? sellerReviews.reduce((sum, review) => sum + Number(review.rating), 0) / sellerFeedbackCount
		: null;

	let buyerReview = null;
	let hasPurchased = !!user?.id && row.status === 'sold' && row.sold_to_user_id === user.id;
	if (user?.id && !hasPurchased) {
		const { data: sale } = await locals.supabase.from('listing_sales').select('id').eq('listing_id', row.id).eq('buyer_id', user.id).limit(1).maybeSingle();
		hasPurchased = !!sale;
	}
	if (hasPurchased) {
		try {
			const { data: review, error: buyerReviewError } = await locals.supabase
				.from('item_reviews')
				.select('id, rating, comment, created_at')
				.eq('listing_id', row.id)
				.eq('buyer_id', user.id)
				.maybeSingle();
			if (buyerReviewError) console.error('buyer review load failed:', buyerReviewError.code, buyerReviewError.message);
			buyerReview = review ?? null;
		} catch (reviewError) {
			console.error('buyer review load crashed:', reviewError);
		}
	}

    let isSaved = false;
    if (user && row.status === 'active') {
        const savedIds = [row.id, ...similar.map((l) => l.id)];
        const { data: savedRows, error: savedError } = await locals.supabase
            .from('saved_listings').select('listing_id').eq('user_id', user.id).in('listing_id', savedIds);
        if (savedError) console.error('saved items (listing) failed:', savedError.code, savedError.message);
        const savedSet = new Set((savedRows ?? []).map((r) => r.listing_id));
        isSaved = savedSet.has(row.id);
        similar = similar.map((l) => ({ ...l, saved: savedSet.has(l.id) }));
    }

	return {
        signedIn: !!user,
        isSaved,
		similar,
		sellerFeedbackCount,
		sellerReviews,
		sellerReviewsUnavailable,
		sellerRatingAverage,
		buyerReview,
		canReview: hasPurchased && !buyerReview,
		listing: { ...row, images },
		isOwner: user?.id === data.seller_id,
		notice: url.searchParams.get('notice') ?? ''
	};
};

export const actions = {
	message: async ({ params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/listing/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { messageError: 'Invalid listing' });
		const { data, error: dbError } = await locals.supabase.rpc('start_conversation', { p_listing_id: params.id });
		if (dbError || !isUuid(data)) return fail(400, { messageError: dbError?.message ?? 'Could not start conversation' });
		redirect(303, `/messages/${data}`);
	},

	reviewItem: async ({ request, params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/listing/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { reviewMessage: 'Invalid listing' });

		const form = await request.formData();
		const rating = Number(form.get('rating'));
		const comment = String(form.get('comment') ?? '').trim();

		if (!Number.isInteger(rating) || rating < REVIEW_MIN || rating > REVIEW_MAX) {
			return fail(400, { reviewMessage: 'Choose a rating from 1 to 5 stars' });
		}
		if (comment.length > 500) return fail(400, { reviewMessage: 'Review must be 500 characters or less' });

		const { error: reviewError } = await locals.supabase.rpc('submit_item_review', {
			p_listing_id: params.id,
			p_rating: rating,
			p_comment: comment || null
		});

		if (reviewError) {
			console.error('submit review failed:', reviewError.code, reviewError.message);
			const message = /already/i.test(reviewError.message)
				? 'You have already reviewed this item.'
				: /buyer/i.test(reviewError.message) || /bought/i.test(reviewError.message)
					? 'Only the buyer can review this item after it is marked sold.'
					: reviewError.message || 'Could not send review';
			return fail(400, { reviewMessage: message });
		}

		return { reviewSuccess: 'Review sent. Thanks for helping other students buy safely.' };
	},

	reportItem: async ({ request, params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/listing/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { reportMessage: 'Invalid listing' });

		const form = await request.formData();
		const reason = String(form.get('reason') ?? '').trim();
		const note = String(form.get('note') ?? '').trim();

		if (!reportReasons.has(reason)) return fail(400, { reportMessage: 'Choose a report reason' });
		if (note.length > 500) return fail(400, { reportMessage: 'Report note must be 500 characters or less' });

		const { data: listing, error: listingError } = await locals.supabase
			.from('listings')
			.select('id, seller_id')
			.eq('id', params.id)
			.maybeSingle();

		if (listingError || !listing) return fail(400, { reportMessage: 'Listing not found' });
		if (listing.seller_id === user.id) return fail(400, { reportMessage: 'You cannot report your own listing' });

		const { error: reportError } = await locals.supabase.from('reports').insert({
			reporter_id: user.id,
			target_user_id: listing.seller_id,
			listing_id: listing.id,
			reason,
			note: note || null
		});

		if (reportError) {
			console.error('listing report failed:', reportError.code, reportError.message);
			return fail(400, { reportMessage: reportError.message || 'Could not send report' });
		}

		return { reportSuccess: 'Report sent. A moderator can review this listing.' };
	}
};
