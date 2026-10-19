
import { sendMessageNotification } from './sender.js';

const MAX_JOBS = 10;
const MAX_ATTEMPTS = 5;

export default {
    async fetch() {
        return new Response('Not found', { status: 404 });
    },

    async scheduled(controller, env, ctx) {
        ctx.waitUntil(processPushQueue(env));
    }
};

function headers(env) {
    return {
        apikey: env.SUPABASE_SECRET_KEY,
        Authorization: `Bearer ${env.SUPABASE_SECRET_KEY}`,
        'Content-Type': 'application/json'
    };
}

async function supabaseRequest(env, path, options = {}) {
    const response = await fetch(
        new URL(path, env.SUPABASE_URL),
        {
            ...options,
            headers: {
                ...headers(env),
                ...options.headers
            }
        }
    );

    if (!response.ok) {
        throw new Error(
            `Supabase request failed: ${response.status}`
        );
    }

    const body = await response.text();
    return body ? JSON.parse(body) : null;
}

async function supabaseGet(env, table, parameters) {
    const url = new URL(`/rest/v1/${table}`, env.SUPABASE_URL);

    for (const [key, value] of Object.entries(parameters)) {
        url.searchParams.set(key, value);
    }

    return supabaseRequest(env, url.pathname + url.search);
}

async function rpc(env, name, parameters) {
    return supabaseRequest(env, `/rest/v1/rpc/${name}`, {
        method: 'POST',
        body: JSON.stringify(parameters)
    });
}

async function finishJob(env, job, outcome) {
    const completed = await rpc(
        env,
        'finish_push_notification_job',
        {
            p_message_id: job.message_id,
            p_claim_token: job.claim_token,
            p_outcome: outcome
        }
    );

    if (completed !== true) {
        console.warn('Job completion not confirmed:', job.message_id);
    }
}

async function removeExpiredSubscription(env, id) {
    const url = new URL(
        '/rest/v1/push_subscriptions',
        env.SUPABASE_URL
    );

    url.searchParams.set('id', `eq.${id}`);

    await supabaseRequest(env, url.pathname + url.search, {
        method: 'DELETE'
    });
}

async function processJob(env, job) {
    const settings = await supabaseGet(
        env,
        'private_settings',
        {
            select: 'notify_push',
            user_id: `eq.${job.recipient_id}`,
            limit: '1'
        }
    );

    if (settings[0]?.notify_push !== true) {
        await finishJob(env, job, 'disabled');
        return;
    }

    const subscriptions = await supabaseGet(
        env,
        'push_subscriptions',
        {
            select: 'id,endpoint,p256dh,auth_key',
            user_id: `eq.${job.recipient_id}`
        }
    );

    if (subscriptions.length === 0) {
        await finishJob(env, job, 'no_subscription');
        return;
    }

    const previousDeliveries = await supabaseGet(
    env,
    'push_notification_deliveries',
    {
        select: 'subscription_id',
        message_id: `eq.${job.message_id}`
    }
);

const deliveredDeviceIds = new Set(
    previousDeliveries.map((record) => record.subscription_id)
);
    let delivered = 0;
    let expired = 0;
    let failed = 0;

    for (const subscription of subscriptions) {
    if (deliveredDeviceIds.has(subscription.id)) {
        console.log('Skipping previously delivered device');
        continue;
    }

    try {
            const result = await sendMessageNotification(
                env,
                subscription,
                job.conversation_id
            );

            if (result.delivered) {
    await supabaseRequest(
        env,
        '/rest/v1/push_notification_deliveries?on_conflict=message_id,subscription_id',
        {
            method: 'POST',
            headers: {
                Prefer: 'resolution=ignore-duplicates'
            },
            body: JSON.stringify({
                message_id: job.message_id,
                subscription_id: subscription.id
            })
        }
    );

    delivered++;
            } else if (result.expired) {
                expired++;

                await removeExpiredSubscription(
                    env,
                    subscription.id
                );
            } else {
                failed++;
            }
        } catch (error) {
            failed++;
            console.error(
                'Push delivery exception:',
                job.message_id,
                error?.name ?? 'Unknown'
            );
        }
    }

    console.log('Push job result:', {
        messageId: job.message_id,
        delivered,
        expired,
        failed
    });

    if (failed > 0 && job.attempts < MAX_ATTEMPTS) {
        // Leave the claim active. The database function
        // permits retrying after the claim expires.
        console.warn('Job awaiting retry:', job.message_id);
        return;
    }

    let outcome;

    if (failed > 0) {
        outcome = 'failed';
    } else if (delivered > 0) {
        outcome = 'sent';
    } else {
        outcome = 'expired';
    }

    await finishJob(env, job, outcome);
}

async function processPushQueue(env) {
    console.log('CampusMart push processor started');

    if (
        !env.SUPABASE_URL ||
        !env.SUPABASE_SECRET_KEY ||
        !env.VAPID_SUBJECT ||
        !env.VAPID_PUBLIC_KEY ||
        !env.VAPID_PRIVATE_KEY
    ) {
        console.error('Missing push worker configuration');
        return;
    }

    try {
        // Delivery must be explicitly enabled.
        if (env.ENABLE_PUSH_DELIVERY !== 'true') {
            const jobs = await supabaseGet(
                env,
                'push_notification_jobs',
                {
                    select: 'message_id',
                    processed_at: 'is.null',
                    order: 'created_at.asc',
                    limit: String(MAX_JOBS)
                }
            );

            console.log('DRY RUN:', {
                pendingJobsInspected: jobs.length,
                deliveryEnabled: false
            });

            return;
        }

      const testMessageId = Number(env.TEST_PUSH_MESSAGE_ID);

if (
    env.ENABLE_PUSH_DELIVERY === 'true' &&
    env.PUSH_TEST_MODE === 'true' &&
    (!Number.isSafeInteger(testMessageId) || testMessageId <= 0)
) {
    console.error('Test mode requires a valid message ID');
    return;
}

const testMode = env.PUSH_TEST_MODE === 'true';

if (
    testMode &&
    (!Number.isSafeInteger(testMessageId) || testMessageId <= 0)
) {
    console.error('Invalid test message ID. Refusing delivery.');
    return;
}

const jobs = testMode
    ? await rpc(
        env,
        'claim_test_push_notification_job',
        { p_message_id: testMessageId }
    )
    : await rpc(
        env,
        'claim_push_notification_jobs',
        { p_limit: MAX_JOBS }
    );

        if (!Array.isArray(jobs)) {
            throw new Error('Unexpected claim response');
        }

        console.log('Claimed notification jobs:', jobs.length);

        for (const job of jobs) {
            try {
                await processJob(env, job);
            } catch (error) {
                console.error(
                    'Job processing failed:',
                    job.message_id,
                    error?.message ?? 'Unknown error'
                );

                if (job.attempts >= MAX_ATTEMPTS) {
                    try {
                        await finishJob(env, job, 'failed');
                    } catch {
                        console.error(
                            'Could not finalize job:',
                            job.message_id
                        );
                    }
                }
            }
        }

        console.log('Push processing cycle complete');
    } catch (error) {
        console.error(
            'Push processor error:',
            error?.message ?? 'Unknown error'
        );
    }
}
