/** Every page gets the logged-in user, their public profile, staff state, unread messages, and staff verification queue count. */
export const load = async ({ locals }) => {
	const user = await locals.getUser();
	let profile = null;
	let isStaff = false;
	let unreadMessages = 0;
	let pendingVerificationRequests = 0;
	let pendingReports = 0;
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
	return { user, profile, isStaff, unreadMessages, pendingVerificationRequests, pendingReports };
};
