import { json } from '@sveltejs/kit';

// Same-origin, authenticated polling for browser notifications.
// The Supabase session (and RLS) determines which messages are visible.
export const GET = async ({ locals }) => {
	const user = await locals.getUser();
	if (!user) return json({ enabled: false, messages: [] }, { status: 401, headers: { 'cache-control': 'no-store' } });

	const settings = await locals.supabase
		.from('private_settings')
		.select('notify_push')
		.eq('user_id', user.id)
		.maybeSingle();
	if (settings.error) return json({ error: 'Settings unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
	if (!settings.data?.notify_push) return json({ enabled: false, messages: [] }, { headers: { 'cache-control': 'no-store' } });

	const conversations = await locals.supabase
		.from('conversations')
		.select('id')
		.or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
		.limit(200);
	if (conversations.error) return json({ error: 'Conversations unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
	const ids = (conversations.data ?? []).map((item) => item.id);
	if (!ids.length) return json({ enabled: true, messages: [] }, { headers: { 'cache-control': 'no-store' } });

	const unread = await locals.supabase
		.from('messages')
		.select('id, conversation_id')
		.in('conversation_id', ids)
		.neq('sender_id', user.id)
		.is('read_at', null)
		.is('unsent_at', null)
		.order('created_at', { ascending: false })
		.limit(50);
	if (unread.error) return json({ error: 'Messages unavailable' }, { status: 503, headers: { 'cache-control': 'no-store' } });
	return json({ enabled: true, messages: unread.data ?? [] }, { headers: { 'cache-control': 'no-store' } });
};
