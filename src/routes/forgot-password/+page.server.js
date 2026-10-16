import { fail } from '@sveltejs/kit';
import { cleanEmail, EMAIL_RE } from '#lib/validation.js';

export const actions = {
	default: async ({ request, locals }) => {
		const email = cleanEmail((await request.formData()).get('email'));
		if (!EMAIL_RE.test(email)) return fail(400, { email, message: 'Enter a valid email address.' });

		// The link in the email is built by the Supabase email template (see README).
		const { error } = await locals.supabase.auth.resetPasswordForEmail(email);
		if (error) {
			console.error('reset request failed:', error.code ?? error.status, error.message);
			if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
				return fail(429, { email, message: 'Please wait a few minutes before asking again.' });
			}
		}
		// Same answer whether or not the email has an account (stops people probing for accounts).
		return { sent: true, email };
	}
};
