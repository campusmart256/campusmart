
/// <reference lib="webworker" />

import { immutable, assets } from '$app/manifest';
import { version } from '$app/env';
import { resolve } from '$app/paths';

/** @type {ServiceWorkerGlobalScope} */
const worker = /** @type {any} */ (self);

const CACHE_NAME = `campusmart-static-${version}`;

const ASSETS = [
    ...new Set(
        [...immutable, ...assets].map((path) => resolve(path))
    )
];

// Install without allowing failed asset requests to block notifications.
worker.addEventListener('install', (event) => {
    event.waitUntil(
        (async () => {
            try {
                const cache = await caches.open(CACHE_NAME);

                const results = await Promise.allSettled(
                    ASSETS.map(async (path) => {
                        const response = await fetch(path);

                        if (response.ok) {
                            await cache.put(path, response);
                        }
                    })
                );

                const failed = results.filter(
                    (result) => result.status === 'rejected'
                ).length;

                if (failed > 0) {
                    console.warn(
                        'CampusMart: some static assets could not be cached:',
                        failed
                    );
                }
            } catch (error) {
                console.warn(
                    'CampusMart: optional static caching failed:',
                    error
                );
            }
        })()
    );

    worker.skipWaiting();
});

// Remove old static caches and activate the new worker.
worker.addEventListener('activate', (event) => {
    event.waitUntil(
        (async () => {
            try {
                const keys = await caches.keys();

                await Promise.allSettled(
                    keys
                        .filter(
                            (key) =>
                                key.startsWith('campusmart-static-') &&
                                key !== CACHE_NAME
                        )
                        .map((key) => caches.delete(key))
                );
            } finally {
                await worker.clients.claim();
            }
        })()
    );
});

// Display a generic notification without exposing message content.
worker.addEventListener('push', (event) => {
    /** @type {{ conversationId?: string }} */
    let payload = {};

    try {
        payload = event.data?.json() ?? {};
    } catch {
        payload = {};
    }

    const conversationId =
        typeof payload.conversationId === 'string' &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            payload.conversationId
        )
            ? payload.conversationId
            : null;

    const target = conversationId
        ? `/messages/${conversationId}`
        : '/messages';

    event.waitUntil(
        worker.registration.showNotification('CampusMart', {
            body: 'You have a new message.',
            icon: '/icon-192.png',
            badge: '/icon-192.png',
            tag: conversationId
                ? `campusmart-${conversationId}`
                : 'campusmart-message',
            data: { url: target }
        })
    );
});

// Open the relevant conversation when a notification is clicked.
// Temporary diagnostic: use Cache Storage so the app can inspect whether
// iOS invoked this event, even if navigation fails.
worker.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        (async () => {
            const destination = event.notification.data?.url ?? null;

            // Record the click before attempting any window navigation.
            try {
                const cache = await caches.open('campusmart-notification-debug');
                await cache.put(
                    new URL('/__campusmart_notification_click_debug__', worker.location.origin),
                    new Response(
                        JSON.stringify({
                            clickedAt: new Date().toISOString(),
                            destination
                        }),
                        { headers: { 'Content-Type': 'application/json' } }
                    )
                );
            } catch (error) {
                console.warn('CampusMart notification diagnostic failed:', error);
            }

            const target = new URL(destination ?? '/messages', worker.location.origin);

            if (
                target.origin !== worker.location.origin ||
                !/^\/messages(?:\/[0-9a-f-]{36})?$/i.test(target.pathname)
            ) {
                return;
            }

            const clients = await worker.clients.matchAll({
                type: 'window',
                includeUncontrolled: true
            });

            // Keep the existing navigation behavior while diagnosing iOS.
            for (const client of clients) {
                if (new URL(client.url).origin !== target.origin) continue;

                const conversationId = target.pathname
                    .match(/^\/messages\/([0-9a-f-]{36})$/i)?.[1];

                try {
                    await client.focus();

                    if (conversationId) {
                        client.postMessage({
                            type: 'CAMPUSMART_OPEN_CHAT',
                            conversationId
                        });
                    }

                    if (client.url !== target.href) {
                        await client.navigate(target.href);
                    }

                    return;
                } catch (error) {
                    console.warn('CampusMart notification navigation failed:', error);
                }
            }

            await worker.clients.openWindow(target.href);
        })()
    );
});
