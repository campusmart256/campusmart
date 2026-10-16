import { cleanSearchWords } from '#lib/validation.js';

const SORTS = ['new', 'price_asc', 'price_desc'];
const SELECT =
	'id, title, description, price_ugx, condition, is_negotiable, published_at, seller_id, categories(name), listing_images(storage_path, position), profiles!listings_seller_id_fkey(display_name, verification_status)';

/** The newest active listings, visible to everyone, with search and simple filters from the address. */
export const load = async ({ locals, url }) => {
	const user = await locals.getUser();
	const slug = url.searchParams.get('category') ?? '';
	const sortParam = url.searchParams.get('sort') ?? '';
	const sort = SORTS.includes(sortParam) ? sortParam : 'new';
	const verifiedOnly = url.searchParams.get('verified') === '1';
	const words = cleanSearchWords(url.searchParams.get('q'));
	const q = words.join(' ');

	const categoriesResult = await locals.supabase.from('categories').select('id, name, slug').eq('is_active', true).order('sort_order');
	if (categoriesResult.error) console.error('categories load failed:', categoriesResult.error.code, categoriesResult.error.message);
	const categories = categoriesResult.data ?? [];
	const selected = categories.find((c) => c.slug === slug) ?? null;

	/** A fresh listings query with the category filter and sorting applied. */
	const base = () => {
		let query = locals.supabase.from('listings').select(SELECT).eq('status', 'active');
		if (selected) query = query.eq('category_id', selected.id);
		if (sort === 'price_asc') query = query.order('price_ugx', { ascending: true });
		else if (sort === 'price_desc') query = query.order('price_ugx', { ascending: false });
		else query = query.order('published_at', { ascending: false });
		return query.limit(100);
	};

	/** @type {any[]} */
	let rows = [];
	if (!words.length) {
		const { data, error } = await base();
		if (error) console.error('feed load failed:', error.code, error.message);
		rows = /** @type {any[]} */ (data ?? []);
	} else {
		// Candidates: items whose title or description contains the first word, plus
		// items from sellers whose name contains it. Then every word must appear
		// somewhere in "title + description + seller name", so "brian calculator" works.
		const first = words[0];
		const itemsQuery = base().or(`title.ilike.*${first}*,description.ilike.*${first}*`);
		const sellersQuery = locals.supabase.from('profiles').select('id').ilike('display_name', `%${first}%`).limit(50);
		const [items, sellers] = await Promise.all([itemsQuery, sellersQuery]);
		if (items.error) console.error('search (items) failed:', items.error.code, items.error.message);
		if (sellers.error) console.error('search (sellers) failed:', sellers.error.code, sellers.error.message);

		const sellerIds = (sellers.data ?? []).map((p) => p.id);
		/** @type {any[]} */
		let bySeller = [];
		if (sellerIds.length) {
			const { data, error } = await base().in('seller_id', sellerIds);
			if (error) console.error('search (seller listings) failed:', error.code, error.message);
			bySeller = /** @type {any[]} */ (data ?? []);
		}
		const lower = words.map((w) => w.toLowerCase());
		const matches = (/** @type {any} */ l) => {
			const text = `${l.title} ${l.description} ${l.profiles?.display_name ?? ''}`.toLowerCase();
			return lower.every((w) => text.includes(w));
		};
		const byItem = /** @type {any[]} */ (items.data ?? []).filter(matches);
		bySeller = bySeller.filter(matches);

		const merged = new Map();
		for (const l of [...byItem, ...bySeller]) merged.set(l.id, l);
		rows = [...merged.values()];
		if (sort === 'price_asc') rows.sort((a, b) => a.price_ugx - b.price_ugx);
		else if (sort === 'price_desc') rows.sort((a, b) => b.price_ugx - a.price_ugx);
		else rows.sort((a, b) => String(b.published_at).localeCompare(String(a.published_at)));
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
	// Filtered here (not in the database query) to keep the first version simple and safe.
	if (verifiedOnly) listings = listings.filter((l) => l.verified);
	listings = listings.slice(0, 48);

    if (user && listings.length) {
        const { data: savedRows, error: savedError } = await locals.supabase
            .from('saved_listings').select('listing_id').eq('user_id', user.id)
            .in('listing_id', listings.map((l) => l.id));
        if (savedError) console.error('saved items (home) failed:', savedError.code, savedError.message);
        const savedIds = new Set((savedRows ?? []).map((r) => r.listing_id));
        listings = listings.map((l) => ({ ...l, saved: savedIds.has(l.id) }));
    }

	return { listings, user, signedIn: !!user, categories, filters: { category: selected?.slug ?? '', sort, verifiedOnly, q } };
};
