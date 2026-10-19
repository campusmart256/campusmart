
import { json } from '@sveltejs/kit';

const noStore = { 'cache-control': 'no-store' };

export const POST = async ({ request, locals }) => {
    const user = await locals.getUser();

    if (!user) {
        return json({ error: 'Authentication required' }, {
            status: 401,
            headers: noStore
        });
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return json({ error: 'Invalid request' }, {
            status: 400,
            headers: noStore
        });
    }

    const endpoint = payload?.endpoint;
    const p256dh = payload?.keys?.p256dh;
    const authKey = payload?.keys?.auth;

    if (
        typeof endpoint !== 'string' ||
        typeof p256dh !== 'string' ||
        typeof authKey !== 'string'
    ) {
        return json({ error: 'Invalid push subscription' }, {
            status: 400,
            headers: noStore
        });
    }

    const { error } = await locals.supabase.rpc('save_push_subscription', {
        p_endpoint: endpoint,
        p_p256dh: p256dh,
        p_auth_key: authKey
    });

    if (error) {
        console.error('Push subscription save failed:', error.code);
        return json({ error: 'Could not register device' }, {
            status: 400,
            headers: noStore
        });
    }

    return json({ saved: true }, { headers: noStore });
};

export const DELETE = async ({ request, locals }) => {
    const user = await locals.getUser();

    if (!user) {
        return json({ error: 'Authentication required' }, {
            status: 401,
            headers: noStore
        });
    }

    let payload;

    try {
        payload = await request.json();
    } catch {
        return json({ error: 'Invalid request' }, {
            status: 400,
            headers: noStore
        });
    }

    if (typeof payload?.endpoint !== 'string') {
        return json({ error: 'Invalid endpoint' }, {
            status: 400,
            headers: noStore
        });
    }

    const { error } = await locals.supabase.rpc('remove_push_subscription', {
        p_endpoint: payload.endpoint
    });

    if (error) {
        console.error('Push subscription removal failed:', error.code);
        return json({ error: 'Could not remove device' }, {
            status: 400,
            headers: noStore
        });
    }

    return json({ removed: true }, { headers: noStore });
};
