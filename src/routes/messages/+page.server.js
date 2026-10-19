import { redirect } from '@sveltejs/kit';

/** Load inbox data from one RPC, using the original queries if the RPC is unavailable. */
export const load = async ({ locals }) => {
    const user = await locals.getUser();

    if (!user) {
        redirect(303, '/signin?next=/messages');
    }

    const rpcStart = performance.now();
    const { data: inboxData, error: inboxError } = await locals.supabase.rpc('get_messages_inbox');

    if (!inboxError && inboxData && Array.isArray(inboxData.conversations) &&
        inboxData.unreadByConversation && typeof inboxData.unreadByConversation === 'object' &&
        !Array.isArray(inboxData.unreadByConversation) &&
        inboxData.latestByConversation && typeof inboxData.latestByConversation === 'object' &&
        !Array.isArray(inboxData.latestByConversation)) {
        console.info('CAMPUSMART_INBOX_RPC', {
            durationMs: Math.round(performance.now() - rpcStart),
            fallback: false
        });

        return {
            conversations: inboxData.conversations,
            unreadByConversation: inboxData.unreadByConversation,
            latestByConversation: inboxData.latestByConversation,
            userId: user.id,
            loadFailed: false
        };
    }

    console.warn('CAMPUSMART_INBOX_RPC_FALLBACK', {
        durationMs: Math.round(performance.now() - rpcStart),
        errorCode: inboxError?.code ?? null
    });

    // Fallback: retain the existing working inbox loader if the RPC fails.
    const { data, error } = await locals.supabase
        .from('conversations')
        .select('id, listing_id, buyer_id, seller_id, last_message_at, created_at, listings(title, listing_images(storage_path, position)), buyer:profiles!conversations_buyer_id_fkey(display_name, avatar_path, verification_status), seller:profiles!conversations_seller_id_fkey(display_name, avatar_path, verification_status)')
        .or(`buyer_id.eq.${user.id},seller_id.eq.${user.id}`)
        .order('last_message_at', {
            ascending: false,
            nullsFirst: false
        })
        .limit(100);

    if (error) {
        console.error('conversations load failed:', error.code, error.message);
    }

    const conversations = data ?? [];
    const conversationIds = conversations.map((conversation) => conversation.id);

    /** @type {Record<string, number>} */
    const unreadByConversation = {};

    /** @type {Record<string, {
     * conversation_id: string,
     * sender_id: string,
     * body: string | null,
     * created_at: string,
     * unsent_at?: string | null
     * }>} */
    const latestByConversation = {};

    if (conversationIds.length > 0) {
        const [unreadResult, latestResult] = await Promise.all([
            locals.supabase
                .from('messages')
                .select('conversation_id')
                .in('conversation_id', conversationIds)
                .neq('sender_id', user.id)
                .is('read_at', null),

            locals.supabase
                .from('messages')
                .select('conversation_id, sender_id, body, created_at, unsent_at')
                .in('conversation_id', conversationIds)
                .order('created_at', { ascending: false })
                .limit(300)
        ]);

        if (unreadResult.error) {
            console.error('unread messages load failed:', unreadResult.error.code, unreadResult.error.message);
        } else {
            for (const message of unreadResult.data ?? []) {
                unreadByConversation[message.conversation_id] =
                    (unreadByConversation[message.conversation_id] ?? 0) + 1;
            }
        }

        if (latestResult.error) {
            const fallbackResult = await locals.supabase
                .from('messages')
                .select('conversation_id, sender_id, body, created_at')
                .in('conversation_id', conversationIds)
                .order('created_at', { ascending: false })
                .limit(300);

            if (fallbackResult.error) {
                console.error('latest message preview load failed:', fallbackResult.error.code, fallbackResult.error.message);
            } else {
                for (const message of fallbackResult.data ?? []) {
                    if (!latestByConversation[message.conversation_id]) {
                        latestByConversation[message.conversation_id] = message;
                    }
                }
            }
        } else {
            for (const message of latestResult.data ?? []) {
                if (message.unsent_at) continue;

                if (!latestByConversation[message.conversation_id]) {
                    latestByConversation[message.conversation_id] = message;
                }
            }
        }
    }

    return {
        conversations,
        unreadByConversation,
        latestByConversation,
        userId: user.id,
        loadFailed: !!error
    };
};
