import { redirect } from '@sveltejs/kit';

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals }) => {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/admin');

	// Query the trusted staff table on the server. Do not trust client-provided roles.
	const { data: staff, error: staffError } = await locals.supabase
		.from('staff')
		.select('role')
		.eq('user_id', user.id)
		.maybeSingle();

	if (staffError) {
		console.error('admin dashboard role check failed:', staffError.code, staffError.message);
		redirect(303, '/');
	}
	if (!staff || !['moderator', 'super_admin'].includes(staff.role)) redirect(303, '/');

	// Supabase RLS governs the visibility of these counts, as with the existing admin pages.
	const [reports, verification] = await Promise.all([
		locals.supabase.from('reports').select('id', { count: 'exact', head: true }).eq('status', 'open'),
		locals.supabase.from('verification_requests').select('id', { count: 'exact', head: true }).eq('status', 'pending')
	]);
	if (reports.error) console.error('admin dashboard reports count failed:', reports.error.code, reports.error.message);
	if (verification.error) console.error('admin dashboard verification count failed:', verification.error.code, verification.error.message);

	return {
		role: staff.role,
		openReports: reports.error ? null : reports.count ?? 0,
		pendingVerifications: verification.error ? null : verification.count ?? 0
	};
};
