import { fail, redirect } from '@sveltejs/kit';
import { safeNext } from '#lib/validation.js';

const ALLOWED_TYPES = ['signup', 'email', 'recovery', 'invite', 'magiclink', 'email_change'];

/**
 * The email link opens this page. We ask for one tap before using the one-time
 * token, because some email apps pre-open links and would use the token up.
 */
export const load = ({ url }) => {
	const tokenHash = url.searchParams.get('token_hash');
	const type = url.searchParams.get('type');
	if (!tokenHash || !type || !ALLOWED_TYPES.includes(type)) redirect(303, '/auth/error');
	return { type };
};

export const actions = {
	default: async ({ request, url, locals }) => {
		const form = await request.formData();
		const tokenHash = String(form.get('token_hash') ?? '');
		const type = String(form.get('type') ?? '');
		if (!tokenHash || !ALLOWED_TYPES.includes(type)) redirect(303, '/auth/error');

		const { error } = await locals.supabase.auth.verifyOtp({ type: /** @type {any} */ (type), token_hash: tokenHash });
		if (error) {
			console.error('verifyOtp failed:', error.code ?? error.status, error.message);
			redirect(303, '/auth/error');
		}
		const fallback = type === 'recovery' ? '/reset-password' : '/account';
		redirect(303, safeNext(url.searchParams.get('next'), fallback));
	}
};
