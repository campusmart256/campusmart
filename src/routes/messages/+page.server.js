import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/messages');

	const { data, error } = await locals.supabase
		.from('conversations')
		.select('id, listing_id, buyer_id, seller_id, last_message_at, created_at, listings(title, listing_images(storage_path, position)), buyer:profiles!conversations_buyer_id_fkey(display_name, avatar_path, verification_status), seller:profiles!conversations_seller_id_fkey(display_name, avatar_path, verification_status)')
		.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
		.order('last_message_at', { ascending: false, nullsFirst: false })
		.limit(100);

	if (error) console.error('conversations load failed:', error.code, error.message);

	const conversations = data ?? [];
	const conversationIds = conversations.map((conversation) => conversation.id);
	const unreadByConversation = {};
	const latestByConversation = {};

	if (conversationIds.length) {
		const unreadResult = await locals.supabase
			.from('messages')
			.select('conversation_id')
			.in('conversation_id', conversationIds)
			.neq('sender_id', user.id)
			.is('read_at', null);

		if (unreadResult.error) {
			console.error('unread messages load failed:', unreadResult.error.code, unreadResult.error.message);
		} else {
			for (const message of unreadResult.data ?? []) {
				unreadByConversation[message.conversation_id] = (unreadByConversation[message.conversation_id] ?? 0) + 1;
			}
		}

		let latestResult = await locals.supabase
			.from('messages')
			.select('conversation_id, sender_id, body, created_at, unsent_at')
			.in('conversation_id', conversationIds)
			.order('created_at', { ascending: false })
			.limit(300);

		if (latestResult.error) {
			// The unsent_at column exists after the v0.1.7 migration. Fall back gracefully before the migration is run.
			latestResult = await locals.supabase
				.from('messages')
				.select('conversation_id, sender_id, body, created_at')
				.in('conversation_id', conversationIds)
				.order('created_at', { ascending: false })
				.limit(300);
		}

		if (latestResult.error) {
			console.error('latest message preview load failed:', latestResult.error.code, latestResult.error.message);
		} else {
			for (const message of latestResult.data ?? []) {
				if (message.unsent_at) continue;
				if (!latestByConversation[message.conversation_id]) {
					latestByConversation[message.conversation_id] = message;
				}
			}
		}
	}

	return { conversations, unreadByConversation, latestByConversation, userId: user.id, loadFailed: !!error };
};
