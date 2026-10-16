import { json } from '@sveltejs/kit';

const MAX_ITEMS = 24;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @type {import('./$types').RequestHandler} */
export const POST = async ({ request, locals }) => {
  /** @type {unknown} */
  let body;
  try {
    body = await request.json();
  } catch {
    return json({ message: 'Invalid request.' }, { status: 400 });
  }

  const rawIds = body && typeof body === 'object' && 'ids' in body ? body.ids : null;
  if (!Array.isArray(rawIds) || rawIds.length > MAX_ITEMS || rawIds.some((id) => typeof id !== 'string' || !UUID.test(id))) {
    return json({ message: 'Invalid listing IDs.' }, { status: 400 });
  }

  const ids = [...new Set(/** @type {string[]} */ (rawIds))];
  if (!ids.length) return json({ listings: [] });

  // Use the request-scoped Supabase client. Existing listing RLS determines
  // which rows may be read; never use a service-role client here.
  const { data, error } = await locals.supabase
    .from('listings')
    .select('id, status, quantity_available, price_ugx')
    .in('id', ids);

  if (error) {
    console.error('Recently viewed availability lookup failed:', error.code, error.message);
    return json({ message: 'Availability could not be checked.' }, { status: 503 });
  }

  // Return availability and the current listing price for rows visible under RLS.
  // Do not expose seller information or any private listing details.
  const listings = (data ?? []).map((listing) => ({
    id: listing.id,
    availability: listing.status === 'sold' || listing.quantity_available === 0
      ? 'sold_out'
      : listing.status === 'active' && typeof listing.quantity_available === 'number' && listing.quantity_available > 0
        ? 'available'
        : 'unavailable',
    current_price_ugx: typeof listing.price_ugx === 'number' && Number.isFinite(listing.price_ugx) && listing.price_ugx >= 0
      ? listing.price_ugx
      : null
  }));

  return json({ listings }, { headers: { 'cache-control': 'no-store' } });
};
