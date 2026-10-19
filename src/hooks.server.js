import { createServerClient } from '@supabase/ssr';
import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from '$app/env/public';

/** Runs on every request: gives each request its own Supabase client tied to the user's cookies. */
export const handle = async ({ event, resolve }) => {
	event.locals.supabase = createServerClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY, {
		cookies: {
			getAll: () => event.cookies.getAll(),
			setAll: (cookiesToSet) => {
				cookiesToSet.forEach(({ name, value, options }) => {
					event.cookies.set(name, value, { ...options, path: '/' });
				});
			}
		}
	});

	/**
	 * The logged-in user, or null. getClaims() checks the login token properly
	 * on every call (never trust getSession() in server code).
	 */

/** @type {Promise<{ id: string, email: string | null } | null> | null} */
let userPromise = null;

event.locals.getUser = () => {
    if (!userPromise) {
        userPromise = (async () => {
            const { data, error } =
                await event.locals.supabase.auth.getClaims();

            if (error || !data?.claims?.sub) return null;

            return {
                id: data.claims.sub,
                email: data.claims.email ?? null
            };
        })();
    }

    return userPromise;
};


	return resolve(event, {
		filterSerializedResponseHeaders: (name) => name === 'content-range' || name === 'x-supabase-api-version'
	});
};
