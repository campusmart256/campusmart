import { fail, redirect } from '@sveltejs/kit';
import { isUuid, safeNext } from '#lib/validation.js';

const CARD_SELECT =
  'id, title, price_ugx, condition, is_negotiable, status, categories(name), listing_images(storage_path, position), profiles!listings_seller_id_fkey(display_name, verification_status)';

export const load = async ({ locals, url }) => {
  const user = await locals.getUser();
  if (!user) redirect(303, '/signin?next=/saved');

  const { data: saves, error: saveError } = await locals.supabase
    .from('saved_listings')
    .select('listing_id, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(200);

  if (saveError) {
    console.error('saved page load failed:', saveError.code, saveError.message);
    return { listings: [], unavailableCount: 0, loadError: 'Saved items could not be loaded. Make sure the Phase 48 SQL has been run.' };
  }

  const ids = (saves ?? []).map((row) => row.listing_id);
  if (!ids.length) return { listings: [], unavailableCount: 0, loadError: null };

  const { data: rows, error: listingError } = await locals.supabase
    .from('listings')
    .select(CARD_SELECT)
    .in('id', ids)
    .eq('status', 'active');

  if (listingError) {
    console.error('saved listing details failed:', listingError.code, listingError.message);
    return { listings: [], unavailableCount: 0, loadError: 'Your saved listings could not be loaded. Please try again.' };
  }

  const order = new Map(ids.map((id, index) => [id, index]));
  const listings = (rows ?? []).map((l) => {
    const first = [...(l.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];

    const category = Array.isArray(l.categories)
        ? l.categories[0]
        : l.categories;

    const sellerProfile = Array.isArray(l.profiles)
        ? l.profiles[0]
        : l.profiles;

    return {
      id: l.id,
      title: l.title,
      price: l.price_ugx,
      condition: l.condition,
      negotiable: l.is_negotiable,
      category: category?.name ?? '',
      seller: sellerProfile?.display_name ?? '',
      cover: first?.storage_path ?? null,
      verified: sellerProfile?.verification_status === 'verified',
      saved: true
    };
  }).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));

  return { listings, unavailableCount: ids.length - listings.length, loadError: null };
};

export const actions = {
  toggle: async ({ request, locals }) => {
    const user = await locals.getUser();
    if (!user) redirect(303, '/signin?next=/saved');

    const form = await request.formData();
    const listingId = String(form.get('listing_id') ?? '');
    const save = String(form.get('save') ?? '');
    const returnTo = safeNext(form.get('return_to'), '/saved');

    if (!isUuid(listingId) || !['0', '1'].includes(save)) {
      return fail(400, { message: 'Invalid saved item request.' });
    }

    if (save === '1') {
      // Never let users bookmark private, sold, removed or their own listings.
      const { data: listing, error: listingError } = await locals.supabase
        .from('listings').select('id, seller_id, status').eq('id', listingId).maybeSingle();
      if (listingError || !listing || listing.status !== 'active' || listing.seller_id === user.id) {
        return fail(400, { message: 'This item cannot be saved.' });
      }
      const { error: saveError } = await locals.supabase.from('saved_listings')
        .upsert({ user_id: user.id, listing_id: listingId }, { onConflict: 'user_id,listing_id', ignoreDuplicates: true });
      if (saveError) {
        console.error('save item failed:', saveError.code, saveError.message);
        redirect(303, '/saved?error=save');
      }
    } else {
      const { error: removeError } = await locals.supabase.from('saved_listings')
        .delete().eq('user_id', user.id).eq('listing_id', listingId);
      if (removeError) {
        console.error('remove saved item failed:', removeError.code, removeError.message);
        redirect(303, '/saved?error=remove');
      }
    }

    redirect(303, returnTo);
  }
};
