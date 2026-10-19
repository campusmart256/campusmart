
import webpush from 'web-push';
import { env } from 'cloudflare:workers';
import { PUBLIC_VAPID_KEY } from '$app/env/public';

/**
 * Send a new-message notification to one subscribed device.
 *
 * This function must only be called by trusted server-side code
 * after determining the recipient and subscription from Supabase.
 *
 * @param {{endpoint: string, keys: {p256dh: string, auth: string}}} subscription
 * @param {string} conversationId
 */
export async function sendMessagePush(subscription, conversationId) {
    const privateKey = env.VAPID_PRIVATE_KEY;
    const subject = env.VAPID_SUBJECT;

    if (!privateKey || !subject || !PUBLIC_VAPID_KEY) {
        throw new Error('Web Push credentials are not configured.');
    }

    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)) {
        throw new Error('Invalid conversation ID.');
    }

    webpush.setVapidDetails(
        subject,
        PUBLIC_VAPID_KEY,
        privateKey
    );

    const payload = JSON.stringify({
        type: 'new_message',
        conversationId
    });

    try {
        await webpush.sendNotification(
    /** @type {Parameters<typeof webpush.sendNotification>[0]} */ (
        /** @type {unknown} */ (subscription)
    ),
    payload,
    {
        TTL: 3600,
        urgency: 'normal'
    }
);

        return { delivered: true, expired: false };
    } catch (error) {
        const status = typeof error === 'object' && error !== null && 'statusCode' in error
            ? error.statusCode
            : null;

        if (status === 404 || status === 410) {
            return { delivered: false, expired: true };
        }

        console.error('Web Push delivery failed:', status ?? 'unknown');
        return { delivered: false, expired: false };
    }
}
