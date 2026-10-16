import { redirect } from '@sveltejs/kit';

export const POST = async ({ locals }) => {
	await locals.supabase.auth.signOut({ scope: 'local' });
	redirect(303, '/');
};
