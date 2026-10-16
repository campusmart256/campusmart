import { error, fail, redirect } from '@sveltejs/kit';
import { isUuid } from '#lib/validation.js';

export const load = async ({ locals, params }) => {
	const user = await locals.getUser();
	if (!user) redirect(303, `/signin?next=/my-listings/${params.id}/sold`);
	if (!isUuid(params.id)) error(404, 'Listing not found');

	const { data: listing } = await locals.supabase
		.from('listings')
		.select('id, title, price_ugx, status, quantity_available')
		.eq('id', params.id)
		.eq('seller_id', user.id)
		.maybeSingle();
	if (!listing) error(404, 'Listing not found');
	if (listing.status !== 'active') redirect(303, '/my-listings');

	// People who messaged about this item (empty until messaging is built)
	const { data, error: convError } = await locals.supabase
		.from('conversations')
		.select('buyer_id, profiles!conversations_buyer_id_fkey(display_name, verification_status)')
		.eq('listing_id', params.id)
		.eq('seller_id', user.id);
	if (convError) console.error('buyers load failed:', convError.code, convError.message);
	const buyers = /** @type {any[]} */ (data ?? []).map((c) => ({
		id: c.buyer_id,
		name: c.profiles?.display_name ?? 'Member',
		verified: c.profiles?.verification_status === 'verified'
	}));
	return { listing, buyers };
};

export const actions = {
	default: async ({ request, locals, params }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/my-listings/${params.id}/sold`);
		if (!isUuid(params.id)) error(404, 'Listing not found');

		const form = await request.formData();
		const skip = form.get('skip') === '1';
		const choice = String(form.get('buyer') ?? '');
		const quantityText = String(form.get('quantity') ?? '').trim();
		const quantity = Number(quantityText);
		if (!/^[1-9]\d*$/.test(quantityText) || !Number.isSafeInteger(quantity) || quantity > 100000) {
			return fail(400, { message: 'Enter a valid quantity of units sold.', choice });
		}
		if (!skip && !isUuid(choice) && choice !== 'outside') {
			return fail(400, { message: 'Choose who bought it, or select "Skip buyer and record sale".', choice });
		}
		const buyerId = !skip && isUuid(choice) ? choice : null;
		const outside = !skip && choice === 'outside';

		const { data: remaining, error: rpcError } = await locals.supabase.rpc('record_listing_sale', {
			p_listing_id: params.id,
			p_buyer_id: buyerId,
			p_outside: outside,
			p_quantity: quantity
		});
		if (rpcError) {
			console.error('mark sold failed:', rpcError.code, rpcError.message);
			const message = /not messaged/i.test(rpcError.message) ? 'That person has not messaged you about this item.' : rpcError.message || 'We could not record the sale. Please try again.';
			return fail(400, { message, choice });
		}
		redirect(303, `/my-listings?tab=${remaining === 0 ? 'sold' : 'active'}&sold=1`);
	}
};
