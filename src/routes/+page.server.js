import { cleanSearchWords } from '#lib/validation.js';

const SORTS = ['new', 'price_asc', 'price_desc'];
const PAGE_SIZE = 12;
const MAX_PAGE = 1000;
const SELECT =
	'id, title, description, price_ugx, condition, is_negotiable, published_at, seller_id, categories(name), listing_images(storage_path, position), profiles!listings_seller_id_fkey(display_name, verification_status)';

/** The newest active listings, visible to everyone, with search and simple filters from the address. */
export const load = async ({ locals, url }) => {
	// Category visibility is public, so load it alongside authentication.
	const userPromise = locals.getUser();
	const categoriesPromise = locals.supabase
		.from('categories')
		.select('id, name, slug')
		.eq('is_active', true)
		.order('sort_order');
	const slug = url.searchParams.get('category') ?? '';
	const sortParam = url.searchParams.get('sort') ?? '';
	const sort = SORTS.includes(sortParam) ? sortParam : 'new';
	const verifiedOnly = url.searchParams.get('verified') === '1';
	const words = cleanSearchWords(url.searchParams.get('q'));
	const q = words.join(' ');
	const rawPage = url.searchParams.get('page') ?? '1';
	const requestedPage = /^\d{1,4}$/.test(rawPage) ? Math.min(MAX_PAGE, Math.max(1, Number(rawPage))) : 1;

	const [user, categoriesResult] = await Promise.all([userPromise, categoriesPromise]);
	if (categoriesResult.error) console.error('categories load failed:', categoriesResult.error.code, categoriesResult.error.message);
	const categories = categoriesResult.data ?? [];
	const selected = categories.find((c) => c.slug === slug) ?? null;

	/** @type {any[]} */
	let rows = [];
	let currentPage = requestedPage;
	let total = 0;
	let hasNext = false;
	if (!words.length) {
		// Database pagination: filter, sort and count before choosing a page.
		// !inner ensures the verified filter applies BEFORE limiting the results.
		const columns = verifiedOnly
			? SELECT.replace('profiles!listings_seller_id_fkey(', 'profiles!listings_seller_id_fkey!inner(')
			: SELECT;
		let query = locals.supabase.from('listings').select(columns, { count: 'exact' }).eq('status', 'active');
		if (selected) query = query.eq('category_id', selected.id);
		if (verifiedOnly) query = query.eq('profiles.verification_status', 'verified');
		if (sort === 'price_asc') query = query.order('price_ugx', { ascending: true }).order('id');
		else if (sort === 'price_desc') query = query.order('price_ugx', { ascending: false }).order('id');
		else query = query.order('published_at', { ascending: false }).order('id');
		// Always return a valid page if a listing disappears while navigating.
		const start = (currentPage - 1) * PAGE_SIZE;
		let result = await query.range(start, start + PAGE_SIZE - 1);
		if (result.error) console.error('feed load failed:', result.error.code, result.error.message);
		total = result.count ?? 0;
		const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
		if (!result.error && currentPage > lastPage) {
			currentPage = lastPage;
			const lastStart = (currentPage - 1) * PAGE_SIZE;
			result = await query.range(lastStart, lastStart + PAGE_SIZE - 1);
			if (result.error) console.error('feed page reload failed:', result.error.code, result.error.message);
		}
		rows = /** @type {any[]} */ (result.data ?? []);
		hasNext = currentPage * PAGE_SIZE < total;
	} else {
		// Database-side search across listing title, description and seller name.
		// The RPC runs as the caller and respects listings/profiles RLS.
		const searchArgs = (/** @type {number} */ page) => ({
			p_words: words,
			p_category_id: selected?.id ?? null,
			p_verified_only: verifiedOnly,
			p_sort: sort,
			p_page: page,
			p_page_size: PAGE_SIZE
		});
		let { data: search, error: searchError } = await locals.supabase.rpc('campusmart_search_listing_ids', searchArgs(currentPage));
		if (searchError) console.error('search RPC failed:', searchError.code, searchError.message);
		if (!searchError && search) {
			total = Number(search.total) || 0;
			const lastPage = Math.max(1, Math.ceil(total / PAGE_SIZE));
			if (currentPage > lastPage) {
				currentPage = lastPage;
				const retry = await locals.supabase.rpc('campusmart_search_listing_ids', searchArgs(currentPage));
				if (retry.error) console.error('search page reload failed:', retry.error.code, retry.error.message);
				else search = retry.data;
			}
			const ids = Array.isArray(search?.ids) ? search.ids : [];
			if (ids.length) {
				// Fetch card details through normal PostgREST/RLS; preserve the RPC's sort order.
				const { data, error } = await locals.supabase.from('listings').select(SELECT).in('id', ids).eq('status', 'active');
				if (error) console.error('search card fetch failed:', error.code, error.message);
				const lookup = new Map((data ?? []).map((listing) => [listing.id, listing]));
				rows = ids.map((/** @type {string} */ id) => lookup.get(id)).filter(Boolean);
			}
			hasNext = currentPage * PAGE_SIZE < total;
		}

	}

	let listings = rows.map((l) => {
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

    if (user && listings.length) {
        const { data: savedRows, error: savedError } = await locals.supabase
            .from('saved_listings').select('listing_id').eq('user_id', user.id)
            .in('listing_id', listings.map((l) => l.id));
        if (savedError) console.error('saved items (home) failed:', savedError.code, savedError.message);
        const savedIds = new Set((savedRows ?? []).map((r) => r.listing_id));
        listings = listings.map((l) => ({ ...l, saved: savedIds.has(l.id) }));
    }

	return { listings, user, signedIn: !!user, categories, filters: { category: selected?.slug ?? '', sort, verifiedOnly, q }, pagination: { page: currentPage, pageSize: PAGE_SIZE, total, hasPrevious: currentPage > 1, hasNext, searchLimited: false } };
};
