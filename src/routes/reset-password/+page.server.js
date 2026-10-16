import { fail, redirect } from '@sveltejs/kit';
import { validateNewPassword } from '#lib/validation.js';

export const load = async ({ locals }) => {
	if (!(await locals.getUser())) redirect(303, '/forgot-password');
	return {};
};

export const actions = {
	default: async ({ request, locals }) => {
		if (!(await locals.getUser())) redirect(303, '/forgot-password');
		const form = await request.formData();
		const password = String(form.get('password') ?? '');
		const confirm = String(form.get('confirm') ?? '');
		const errors = validateNewPassword(password, confirm);
		if (Object.keys(errors).length) return fail(400, { errors });

		const { error } = await locals.supabase.auth.updateUser({ password });
		if (error) {
			console.error('updateUser failed:', error.code ?? error.status, error.message);
			if (error.code === 'weak_password') return fail(400, { errors: { password: 'Choose a stronger password.' } });
			if (error.code === 'same_password') return fail(400, { errors: { password: 'Choose a different password from your old one.' } });
			return fail(500, { errors: {}, message: 'We could not change your password. Please try again.' });
		}
		redirect(303, '/account?password=changed');
	}
};
