import { fail } from '@sveltejs/kit';
import { cleanEmail, EMAIL_RE } from '#lib/validation.js';

export const load = ({ url }) => {
	const email = cleanEmail(url.searchParams.get('email') ?? '');
	return { email: EMAIL_RE.test(email) ? email : '' };
};

export const actions = {
	resend: async ({ request, locals, url }) => {
		const email = cleanEmail((await request.formData()).get('email'));
		if (!EMAIL_RE.test(email)) return fail(400, { message: 'Enter your email on the sign-up page again.' });
		const { error } = await locals.supabase.auth.resend({
			type: 'signup',
			email,
			options: { emailRedirectTo: `${url.origin}/auth/confirm` }
		});
		if (error) {
			console.error('resend failed:', error.code ?? error.status, error.message);
			if (error.status === 429 || error.code === 'over_email_send_rate_limit') {
				return fail(429, { message: 'Please wait a minute before asking for another email.' });
			}
			return fail(500, { message: 'We could not send the email. Please try again later.' });
		}
		return { sent: true };
	}
};
