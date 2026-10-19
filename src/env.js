import { defineEnvVars } from '@sveltejs/kit/env';

/**
 * Makes a checker that stops the app with a clear message when a value is missing.
 * @param {string} name
 */
const required = (name) => (/** @type {string | undefined} */ value) => {
	if (!value || !value.trim()) {
		throw new Error(`${name} is missing. Copy ".env.example" to ".env" and fill in your Supabase values.`);
	}
	return value.trim();
};

// Both values are PUBLIC on purpose (they are visible in the browser).
// Never add the Supabase service_role / secret key here.
export const variables = defineEnvVars({
	PUBLIC_SUPABASE_URL: {
		public: true,
		static: true,
		schema: required('PUBLIC_SUPABASE_URL'),
		description: 'Your Supabase project URL'
	},
	PUBLIC_SUPABASE_KEY: {
		public: true,
		static: true,
		schema: required('PUBLIC_SUPABASE_KEY'),
		description: 'Your Supabase public (anon or publishable) key'
	},
	PUBLIC_VAPID_KEY: {
    public: true,
    static: true,
    schema: required('PUBLIC_VAPID_KEY'),
    description: 'Public VAPID key for browser push subscriptions'
}
});
