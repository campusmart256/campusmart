import { error, fail, redirect } from '@sveltejs/kit';
import { isUuid } from '#lib/validation.js';

const reportReasons = new Set(['scam_or_fake', 'prohibited_item', 'harassment', 'other']);

function whatsappLink(number, listingTitle) {
	const digits = String(number ?? '').replace(/\D/g, '');
	const message = `Hi, I saw your ${listingTitle || 'item'} on CampusMart. Is it still available?`;
	return `https://wa.me/${digits}?text=${encodeURIComponent(message)}`;
}

async function loadConversation(locals, conversationId, userId) {
	const result = await locals.supabase
		.from('conversations')
		.select('id, buyer_id, seller_id, listing_id, listings(title), buyer:profiles!conversations_buyer_id_fkey(display_name), seller:profiles!conversations_seller_id_fkey(display_name)')
		.eq('id', conversationId)
		.maybeSingle();

	if (result.error) error(500, 'Could not load conversation');
	if (!result.data || ![result.data.buyer_id, result.data.seller_id].includes(userId)) error(404, 'Conversation not found');
	return result.data;
}

function otherParticipant(conversation, userId) {
	return userId === conversation.buyer_id ? conversation.seller_id : conversation.buyer_id;
}

async function loadWhatsappConversation(locals, conversationId, userId) {
	const result = await locals.supabase
		.from('conversations')
		.select('id, buyer_id, seller_id, listing_id, listings(title)')
		.eq('id', conversationId)
		.maybeSingle();

	if (result.error) {
		console.error('whatsapp conversation load failed:', result.error.code, result.error.message);
		return { error: 'Could not load this conversation. Please refresh and try again.' };
	}
	if (!result.data || ![result.data.buyer_id, result.data.seller_id].includes(userId)) {
		return { error: 'Conversation not found' };
	}
	return { conversation: result.data };
}


export const load = async ({ params, locals }) => {
	const user = await locals.getUser();
	if (!user) redirect(303, `/signin?next=/messages/${params.id}`);
	if (!isUuid(params.id)) error(404, 'Conversation not found');

	const conversation = await loadConversation(locals, params.id, user.id);
	const otherUserId = otherParticipant(conversation, user.id);

	const markRead = await locals.supabase.rpc('mark_conversation_read', { p_conversation_id: params.id });
	if (markRead.error) console.error('mark_conversation_read failed:', markRead.error.code, markRead.error.message);

	let replyStatusAvailable = true;
	let deleteStatusAvailable = true;
	let unsendStatusAvailable = true;
	let messages = await locals.supabase
		.from('messages')
		.select('id, sender_id, body, created_at, read_at, reply_to_message_id, unsent_at, unsent_by')
		.eq('conversation_id', params.id)
		.order('created_at', { ascending: false })
		.limit(100);

	if (messages.error) {
		unsendStatusAvailable = false;
		messages = await locals.supabase
			.from('messages')
			.select('id, sender_id, body, created_at, read_at, reply_to_message_id')
			.eq('conversation_id', params.id)
			.order('created_at', { ascending: false })
			.limit(100);
	}

	if (messages.error) {
		replyStatusAvailable = false;
		messages = await locals.supabase
			.from('messages')
			.select('id, sender_id, body, created_at, read_at')
			.eq('conversation_id', params.id)
			.order('created_at', { ascending: false })
			.limit(100);
	}

	if (messages.error) error(500, 'Could not load messages');

	let visibleMessages = messages.data ?? [];
	if (unsendStatusAvailable) {
		visibleMessages = visibleMessages.filter((m) => !m.unsent_at);
	}
	if (visibleMessages.length) {
		const hideResult = await locals.supabase
			.from('message_deletions')
			.select('message_id')
			.eq('user_id', user.id)
			.in('message_id', visibleMessages.map((m) => m.id));

		if (hideResult.error) {
			deleteStatusAvailable = false;
			console.error('message_deletions load failed:', hideResult.error.code, hideResult.error.message);
		} else {
			const hidden = new Set((hideResult.data ?? []).map((row) => String(row.message_id)));
			visibleMessages = visibleMessages.filter((m) => !hidden.has(String(m.id)));
		}
	}

	const blockResult = await locals.supabase
		.from('blocks')
		.select('blocked_id')
		.eq('blocker_id', user.id)
		.eq('blocked_id', otherUserId)
		.maybeSingle();
	if (blockResult.error) console.error('block status load failed:', blockResult.error.code, blockResult.error.message);

	return {
		conversation,
		messages: visibleMessages.reverse(),
		userId: user.id,
		otherUserId,
		isBlockedByMe: !!blockResult.data,
		readStatusAvailable: !markRead.error,
		replyStatusAvailable,
		deleteStatusAvailable,
		unsendStatusAvailable
	};
};

export const actions = {
	send: async ({ request, params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/messages/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { message: 'Invalid conversation' });
		const data = await request.formData();
		const body = String(data.get('body') ?? '').trim();
		const replyRaw = String(data.get('reply_to_message_id') ?? '').trim();
		const replyToMessageId = /^\d+$/.test(replyRaw) ? Number(replyRaw) : null;
		if (!body || body.length > 1000) return fail(400, { message: 'Message must be 1 to 1000 characters', body, reply_to_message_id: replyRaw });

		const rpcName = replyToMessageId ? 'send_message_reply' : 'send_message';
		const rpcArgs = replyToMessageId
			? { p_conversation_id: params.id, p_body: body, p_reply_to_message_id: replyToMessageId }
			: { p_conversation_id: params.id, p_body: body };
		const { error: dbError } = await locals.supabase.rpc(rpcName, rpcArgs);
		if (dbError) {
			const needsMigration = replyToMessageId && (dbError.message ?? '').toLowerCase().includes('send_message_reply');
			return fail(400, {
				message: needsMigration
					? 'Reply messages need the v0.1.4 SQL migration. Run database/campusmart_migration_v0.1.4_message_replies.sql in Supabase.'
					: dbError.message || 'Could not send message',
				body,
				reply_to_message_id: replyRaw
			});
		}
		redirect(303, `/messages/${params.id}`);
	},


	deleteForMe: async ({ request, params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/messages/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { deleteMessage: 'Invalid conversation' });

		const data = await request.formData();
		const rawMessageId = String(data.get('message_id') ?? '').trim();
		if (!/^\d+$/.test(rawMessageId)) return fail(400, { deleteMessage: 'Invalid message' });

		const { error: deleteError } = await locals.supabase.rpc('hide_message_for_me', {
			p_message_id: Number(rawMessageId)
		});

		if (deleteError) {
			const message = String(deleteError.message ?? '');
			const code = String(deleteError.code ?? '');
			const missingFunction = code === '42883' || message.toLowerCase().includes('hide_message_for_me');
			return fail(400, {
				deleteMessage: missingFunction
					? 'Message deletion needs the v0.1.6 SQL migration. Run database/campusmart_migration_v0.1.6_message_delete_for_me.sql in Supabase.'
					: message || 'Could not delete this message'
			});
		}

		return { deleteSuccess: 'Message deleted for you only. It remains available for safety reports.' };
	},


	unsend: async ({ request, params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/messages/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { deleteMessage: 'Invalid conversation' });

		const data = await request.formData();
		const rawMessageId = String(data.get('message_id') ?? '').trim();
		if (!/^\d+$/.test(rawMessageId)) return fail(400, { deleteMessage: 'Invalid message' });

		const { error: unsendError } = await locals.supabase.rpc('unsend_message_if_unread', {
			p_message_id: Number(rawMessageId)
		});

		if (unsendError) {
			const message = String(unsendError.message ?? '');
			const code = String(unsendError.code ?? '');
			const missingFunction = code === '42883' || message.toLowerCase().includes('unsend_message_if_unread');
			return fail(400, {
				deleteMessage: missingFunction
					? 'Unsend needs the v0.1.7 SQL migration. Run database/campusmart_migration_v0.1.7_message_unsend.sql in Supabase.'
					: message || 'Could not unsend this message'
			});
		}

		return { deleteSuccess: 'Message unsent. It is hidden from the chat but preserved for safety review.' };
	},


	whatsapp: async ({ params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/messages/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { whatsappMessage: 'Invalid conversation' });

		// Prefer the safer conversation-based function from migration v0.1.5.
		// It checks that the logged-in user is the buyer in this conversation and reveals only the seller's opt-in WhatsApp.
		const reveal = await locals.supabase.rpc('reveal_whatsapp_from_conversation', {
			p_conversation_id: params.id
		});

		if (reveal.error) {
			console.error('reveal_whatsapp_from_conversation failed:', reveal.error.code, reveal.error.message);

			const message = String(reveal.error.message ?? '');
			const code = String(reveal.error.code ?? '');
			const missingFunction = code === '42883' || message.toLowerCase().includes('reveal_whatsapp_from_conversation');

			return fail(400, {
				whatsappMessage: missingFunction
					? 'WhatsApp needs the v0.1.5 SQL migration. Run database/campusmart_migration_v0.1.5_whatsapp_from_conversation.sql in Supabase.'
					: message || 'WhatsApp contact is not available'
			});
		}

		const payload = reveal.data ?? {};
		const number = typeof payload === 'string' ? payload : payload.number;
		const listingTitle = typeof payload === 'object' && payload ? payload.listing_title : null;

		if (!number) {
			return fail(400, { whatsappMessage: 'WhatsApp contact is not available' });
		}

		return {
			whatsappSuccess: 'WhatsApp contact revealed. Only use it for this item and meet safely on campus.',
			whatsappNumber: number,
			whatsappLink: whatsappLink(number, listingTitle)
		};
	},

	report: async ({ request, params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/messages/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { reportMessage: 'Invalid conversation' });

		const conversation = await loadConversation(locals, params.id, user.id);
		const targetUserId = otherParticipant(conversation, user.id);
		const data = await request.formData();
		const reason = String(data.get('reason') ?? '').trim();
		const note = String(data.get('note') ?? '').trim();

		if (!reportReasons.has(reason)) return fail(400, { reportMessage: 'Choose a report reason' });
		if (note.length > 500) return fail(400, { reportMessage: 'Report note must be 500 characters or less' });

		const { error: reportError } = await locals.supabase.from('reports').insert({
			reporter_id: user.id,
			target_user_id: targetUserId,
			conversation_id: conversation.id,
			reason,
			note: note || null
		});

		if (reportError) return fail(400, { reportMessage: reportError.message || 'Could not send report' });
		return { reportSuccess: 'Report sent. A moderator can review this conversation.' };
	},

	block: async ({ params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/messages/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { safetyMessage: 'Invalid conversation' });

		const conversation = await loadConversation(locals, params.id, user.id);
		const targetUserId = otherParticipant(conversation, user.id);
		const { error: blockError } = await locals.supabase
			.from('blocks')
			.upsert({ blocker_id: user.id, blocked_id: targetUserId }, { onConflict: 'blocker_id,blocked_id', ignoreDuplicates: true });

		if (blockError) return fail(400, { safetyMessage: blockError.message || 'Could not block this user' });
		return { safetySuccess: 'User blocked. They cannot message you unless you unblock them.' };
	},

	unblock: async ({ params, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, `/signin?next=/messages/${params.id}`);
		if (!isUuid(params.id)) return fail(400, { safetyMessage: 'Invalid conversation' });

		const conversation = await loadConversation(locals, params.id, user.id);
		const targetUserId = otherParticipant(conversation, user.id);
		const { error: unblockError } = await locals.supabase
			.from('blocks')
			.delete()
			.eq('blocker_id', user.id)
			.eq('blocked_id', targetUserId);

		if (unblockError) return fail(400, { safetyMessage: unblockError.message || 'Could not unblock this user' });
		return { safetySuccess: 'User unblocked. You can message each other again.' };
	}
};
