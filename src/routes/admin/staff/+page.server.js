import { redirect } from '@sveltejs/kit';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @param {import('./$types').PageServerLoadEvent['locals']} locals */
async function requireSuperAdmin(locals) {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/admin/staff');
	const { data, error } = await locals.supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle();
	if (error) {
		console.error('staff management authorization failed:', error.code, error.message);
		redirect(303, '/admin');
	}
	if (data?.role !== 'super_admin') redirect(303, '/admin');
	return user;
}

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals, url }) => {
	const user = await requireSuperAdmin(locals);
	const query = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
	const [staffResult, historyResult] = await Promise.all([
		locals.supabase.from('staff').select('user_id, role, created_at').order('created_at', { ascending: true }).limit(200),
		locals.supabase.from('audit_log').select('id, actor_id, action, target_id, reason, created_at').eq('target_type', 'user').in('action', ['staff_add', 'staff_set_role', 'staff_remove']).order('created_at', { ascending: false }).limit(20)
	]);
	/** @type {string[]} */
	const warnings = [];
	if (staffResult.error) warnings.push('Staff accounts could not be loaded.');
	if (historyResult.error) warnings.push('Staff activity history could not be loaded.');
	const staff = staffResult.data ?? [];
	const staffIds = staff.map((item) => item.user_id);
	const profileResult = staffIds.length
		? await locals.supabase.from('profiles').select('id, display_name, verification_status').in('id', staffIds)
		: { data: [], error: null };
	if (profileResult.error) warnings.push('Some staff display names could not be loaded.');
	const profileMap = new Map((profileResult.data ?? []).map((p) => [p.id, p]));

	/** @type {{ id: string, display_name: string | null, verification_status: string | null }[]} */
	let candidates = [];
	if (query) {
		let lookup = locals.supabase.from('profiles').select('id, display_name, verification_status').limit(10);
		if (uuidPattern.test(query)) lookup = lookup.eq('id', query);
		else lookup = lookup.ilike('display_name', `%${query.replace(/[\\%_]/g, '\\$&')}%`);
		const candidateResult = await lookup;
		if (candidateResult.error) warnings.push('Account search is temporarily unavailable.');
		else candidates = (candidateResult.data ?? []).filter((p) => !staffIds.includes(p.id));
	}

	return {
		currentUserId: user.id,
		staff: staff.map((s) => ({ ...s, display_name: profileMap.get(s.user_id)?.display_name ?? 'Unknown account', verification_status: profileMap.get(s.user_id)?.verification_status ?? null })),
		candidates,
		query,
		history: historyResult.data ?? [],
		warnings,
		updated: url.searchParams.get('updated') === '1'
	};
};
