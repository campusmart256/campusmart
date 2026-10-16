import { error } from '@sveltejs/kit';
import { isUuid } from '#lib/validation.js';

// Public seller storefront: return only fields intended for marketplace visitors.
export const load = async ({ params, locals, url }) => {
    if (!isUuid(params.id)) error(404, 'Seller not found');
    const viewer = await locals.getUser();
    const { data: profile, error: profileError } = await locals.supabase
        .from('profiles')
        .select('id, display_name, avatar_path, verification_status')
        .eq('id', params.id)
        .maybeSingle();
    if (profileError) {
        console.error('public seller profile failed:', profileError.code, profileError.message);
        error(503, 'Seller profile temporarily unavailable');
    }
    if (!profile) error(404, 'Seller not found');

    const sort = url.searchParams.get('sort') === 'price_asc' ? 'price_asc' : 'new';
    let query = locals.supabase
        .from('listings')
        .select('id, title, price_ugx, condition, is_negotiable, published_at, seller_id, categories(name), listing_images(storage_path, position)')
        .eq('seller_id', params.id)
        .eq('status', 'active');
    query = sort === 'price_asc'
        ? query.order('price_ugx', { ascending: true })
        : query.order('published_at', { ascending: false });
    const { data: items, error: listingsError } = await query.limit(60);
    if (listingsError) console.error('seller storefront listings failed:', listingsError.code, listingsError.message);
    let listings = (items ?? []).map((l) => {
        const cover = [...(l.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
        return {
            id: l.id, title: l.title, price: l.price_ugx,
            condition: l.condition, negotiable: l.is_negotiable,
            category: l.categories?.name ?? '', seller: profile.display_name ?? 'Seller',
            cover: cover?.storage_path ?? null,
            verified: profile.verification_status === 'verified',
            own: l.seller_id === viewer?.id
        };
    });
    if (viewer && listings.length) {
        const { data: savedRows, error: savedError } = await locals.supabase
            .from('saved_listings').select('listing_id').eq('user_id', viewer.id)
            .in('listing_id', listings.map((l) => l.id));
        if (savedError) console.error('seller storefront saved items failed:', savedError.code, savedError.message);
        const savedIds = new Set((savedRows ?? []).map((r) => r.listing_id));
        listings = listings.map((l) => ({ ...l, saved: savedIds.has(l.id) }));
    }

    let reviews = [];
    let reviewsUnavailable = false;
    try {
        const result = await locals.supabase.rpc('get_public_seller_reviews', { p_seller_id: params.id });
        if (result.error) {
            reviewsUnavailable = true;
            console.error('seller storefront reviews failed:', result.error.code, result.error.message);
        } else reviews = result.data ?? [];
    } catch (e) {
        reviewsUnavailable = true;
        console.error('seller storefront reviews crashed:', e);
    }
    const average = reviews.length
        ? reviews.reduce((sum, r) => sum + Number(r.rating), 0) / reviews.length
        : null;
    return {
        profile,
        listings,
        signedIn: !!viewer,
        sort,
        reviews,
        reviewsUnavailable,
        average,
        ownProfile: viewer?.id === params.id,
        listingsUnavailable: !!listingsError
    };
};
