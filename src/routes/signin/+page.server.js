import { fail, redirect } from '@sveltejs/kit';
import { cleanEmail, EMAIL_RE, safeNext } from '#lib/validation.js';

export const load = async ({ locals, url }) => {
	if (await locals.getUser()) redirect(303, safeNext(url.searchParams.get('next'), '/'));
	return {};
};

export const actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const values = { email: cleanEmail(form.get('email')) };
		const password = typeof form.get('password') === 'string' ? /** @type {string} */ (form.get('password')) : '';

		if (!EMAIL_RE.test(values.email) || !password) {
			return fail(400, { values, message: 'Enter your email and password.' });
		}

		const { error } = await locals.supabase.auth.signInWithPassword({ email: values.email, password });
		if (error) {
			console.error('signIn failed:', error.code ?? error.status, error.message);
			if (error.code === 'email_not_confirmed') {
				return fail(400, { values, message: 'Please confirm your email first. Check your inbox (and spam folder).', needsConfirm: true });
			}
			if (error.status === 429 || error.code === 'over_request_rate_limit') {
				return fail(429, { values, message: 'Too many attempts. Please wait a few minutes and try again.' });
			}
			if (error.code === 'invalid_credentials') {
				return fail(400, { values, message: 'Email or password is incorrect.' });
			}
			return fail(500, { values, message: 'We could not sign you in right now. Please try again.' });
		}

		redirect(303, safeNext(url.searchParams.get('next'), '/'));
	}
};
