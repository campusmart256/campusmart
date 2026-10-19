
import { PUBLIC_VAPID_KEY } from '$app/env/public';

/**
 * Convert a base64url VAPID key into bytes accepted by PushManager.
 * @param {string} value
 */
function decodeVapidKey(value) {
    const padding = '='.repeat((4 - (value.length % 4)) % 4);
    const base64 = (value + padding).replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);

    for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
    }

    return bytes;
}

/**
 * Check whether this device supports Web Push.
 */
export function supportsPush() {
    return typeof window !== 'undefined'
        && window.isSecureContext
        && 'serviceWorker' in navigator
        && 'PushManager' in window
        && 'Notification' in window;
}

/**
 * Request permission and subscribe this device.
 * Call only from a direct user interaction.
 */
export async function subscribeDevice() {
    if (!supportsPush()) {
    const isIOS =
        /iPhone|iPad|iPod/i.test(navigator.userAgent) ||
        (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    const isInstalled =
    window.matchMedia('(display-mode: standalone)').matches ||
    /** @type {Navigator & { standalone?: boolean }} */ (navigator).standalone === true;

    if (isIOS || !isInstalled) {
        throw new Error(
            'To enable background notifications on iPhone, install CampusMart: open the website in Safari, tap Share, select Add to Home Screen, then open CampusMart from your Home Screen and enable notifications in Account settings.'
        );
    }

}

    const permission = await Notification.requestPermission();

    if (permission !== 'granted') {
        throw new Error('Notification permission was not granted.');
    }

    const registration = await navigator.serviceWorker.register('/service-worker.js', {
        scope: '/'
    });

    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: decodeVapidKey(PUBLIC_VAPID_KEY)
        });
    }

    return subscription.toJSON();
}

/**
 * Read this device's existing subscription.
 */
export async function getDeviceSubscription() {
    if (!supportsPush()) return null;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    return subscription?.toJSON() ?? null;
}

/**
 * Unsubscribe this device from Web Push.
 */
export async function unsubscribeDevice() {
    if (!supportsPush()) return;

    const registration = await navigator.serviceWorker.ready;
    const subscription = await registration.pushManager.getSubscription();

    if (subscription) {
        await subscription.unsubscribe();
    }
}

/**
 * Remove this device's push subscription before signing out.
 * Other devices belonging to the student are unaffected.
 */
export async function cleanupPushOnLogout() {
    if (!supportsPush()) return;

    const subscription = await getDeviceSubscription();
    if (!subscription?.endpoint) return;

    const response = await fetch('/api/notifications/subscription', {
        method: 'DELETE',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            endpoint: subscription.endpoint
        })
    });

    if (!response.ok) {
        throw new Error('Could not remove this device from push notifications.');
    }

    await unsubscribeDevice();
}
