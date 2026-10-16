/** Shared session, navigation, and notification counts for every page. */
export const load = async ({ locals }) => {
	const user = await locals.getUser();
	let profile = null;
	let isStaff = false;
	let unreadMessages = 0;
	let pendingVerificationRequests = 0;
	let pendingReports = 0;
	let savedPriceDropAlerts = 0;
	if (user) {
		const [profileResult, staffResult, conversationsResult] = await Promise.all([
			locals.supabase.from('profiles').select('display_name, verification_status, avatar_path').eq('id', user.id).maybeSingle(),
			locals.supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle(),
			locals.supabase.from('conversations').select('id').or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`).limit(200)
		]);
		profile = profileResult.data ?? null;
		isStaff = !!staffResult.data;

		if (isStaff) {
			const [pendingResult, reportsResult] = await Promise.all([
				locals.supabase
					.from('verification_requests')
					.select('id', { count: 'exact', head: true })
					.eq('status', 'pending'),
				locals.supabase
					.from('reports')
					.select('id', { count: 'exact', head: true })
					.eq('status', 'open')
			]);
			if (pendingResult.error) console.error('pending verification count failed:', pendingResult.error.code, pendingResult.error.message);
			else pendingVerificationRequests = pendingResult.count ?? 0;
			if (reportsResult.error) console.error('pending reports count failed:', reportsResult.error.code, reportsResult.error.message);
			else pendingReports = reportsResult.count ?? 0;
		}

		// Count only this student's active, undismissed saved-item price drops.
		// RLS applies to both queries; do not use a service-role client.
		const savedResult = await locals.supabase
			.from('saved_listings')
			.select('listing_id, price_when_saved_ugx, price_alert_dismissed_ugx')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(200);
		if (savedResult.error) {
			console.error('saved price alert lookup failed:', savedResult.error.code, savedResult.error.message);
		} else {
			const savedRows = savedResult.data ?? [];
			const savedIds = savedRows.map((item) => item.listing_id);
			if (savedIds.length) {
				const listingResult = await locals.supabase
					.from('listings')
					.select('id, price_ugx, expires_at')
					.in('id', savedIds)
					.eq('status', 'active');
				if (listingResult.error) {
					console.error('saved price alert listing lookup failed:', listingResult.error.code, listingResult.error.message);
				} else {
					const visiblePrices = new Map(
						(listingResult.data ?? [])
							.filter((listing) => !listing.expires_at || new Date(listing.expires_at).getTime() > Date.now())
							.map((listing) => [listing.id, listing.price_ugx])
					);
					savedPriceDropAlerts = savedRows.filter((item) => {
						const currentPrice = visiblePrices.get(item.listing_id);
						if (typeof currentPrice !== 'number') return false;
						return currentPrice < item.price_when_saved_ugx &&
							(item.price_alert_dismissed_ugx == null || currentPrice < item.price_alert_dismissed_ugx);
					}).length;
				}
			}
		}

		const conversationIds = (conversationsResult.data ?? []).map((conversation) => conversation.id);
		if (conversationIds.length) {
			const unreadResult = await locals.supabase
				.from('messages')
				.select('id', { count: 'exact', head: true })
				.in('conversation_id', conversationIds)
				.neq('sender_id', user.id)
				.is('read_at', null);
			unreadMessages = unreadResult.count ?? 0;
		}
	}
	return { user, profile, isStaff, unreadMessages, pendingVerificationRequests, pendingReports, savedPriceDropAlerts };
};
