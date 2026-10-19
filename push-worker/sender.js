
import { buildPushPayload } from '@block65/webcrypto-web-push';

/**
 * Sends a CampusMart new-message notification.
 *
 * The payload intentionally excludes private message text.
 */
export async function sendMessageNotification(
    env,
    subscription,
    conversationId
) {
    const vapid = {
        subject: env.VAPID_SUBJECT,
        publicKey: env.VAPID_PUBLIC_KEY,
        privateKey: env.VAPID_PRIVATE_KEY
    };

    const pushSubscription = {
        endpoint: subscription.endpoint,
        expirationTime: null,
        keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth_key
        }
    };

    const message = {
        data: JSON.stringify({
            type: 'new_message',
            conversationId
        }),
        options: {
            ttl: 3600
        }
    };

    const payload = await buildPushPayload(
        message,
        pushSubscription,
        vapid
    );

    const response = await fetch(
        pushSubscription.endpoint,
        payload
    );

    return {
        delivered: response.ok,
        expired: response.status === 404 || response.status === 410,
        status: response.status
    };
}
