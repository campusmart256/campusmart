import { fail, redirect } from '@sveltejs/kit';
import { cleanText, cleanEmail, validateSignup } from '#lib/validation.js';

export const load = async ({ locals }) => {
	if (await locals.getUser()) redirect(303, '/account');
	return {};
};

export const actions = {
	default: async ({ request, locals, url }) => {
		const form = await request.formData();
		const values = {
			displayName: cleanText(form.get('displayName')),
			email: cleanEmail(form.get('email')),
			terms: form.get('terms') === 'on'
		};
		const password = typeof form.get('password') === 'string' ? /** @type {string} */ (form.get('password')) : '';

		const errors = validateSignup({ ...values, password });
		if (Object.keys(errors).length) return fail(400, { values, errors });

		const { error } = await locals.supabase.auth.signUp({
			email: values.email,
			password,
			options: {
				data: { display_name: values.displayName },
				emailRedirectTo: `${url.origin}/auth/confirm`
			}
		});

		if (error) {
			console.error('signUp failed:', error.code ?? error.status, error.message);
			if (error.code === 'weak_password') return fail(400, { values, errors: { password: 'Choose a stronger password.' } });
			if (error.code === 'email_address_invalid') return fail(400, { values, errors: { email: 'That email address is not accepted.' } });
			if (error.status === 429 || error.code === 'over_email_send_rate_limit' || error.code === 'over_request_rate_limit') {
				return fail(429, { values, errors: {}, message: 'Too many attempts. Please wait a few minutes and try again.' });
			}
			return fail(500, { values, errors: {}, message: 'We could not create your account right now. Please try again.' });
		}

		redirect(303, `/check-email?email=${encodeURIComponent(values.email)}`);
	}
};
