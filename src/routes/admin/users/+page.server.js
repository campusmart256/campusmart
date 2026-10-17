import { redirect } from '@sveltejs/kit';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @param {import('./$types').PageServerLoadEvent['locals']} locals */
async function requireStaff(locals) {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/admin/users');
	const { data, error } = await locals.supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle();
	if (error) {
		console.error('admin users role check failed:', error.code, error.message);
		redirect(303, '/');
	}
	if (!data || !['moderator', 'super_admin'].includes(data.role)) redirect(303, '/');
	return { user, role: data.role };
}

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals, url }) => {
	const staff = await requireStaff(locals);
	const query = (url.searchParams.get('q') ?? '').trim().slice(0, 80);
	const pageRaw = Number(url.searchParams.get('page') ?? '1');
	const page = Number.isSafeInteger(pageRaw) && pageRaw >= 1 ? Math.min(pageRaw, 1000) : 1;
	const pageSize = 20;
	let profilesQuery = locals.supabase
		.from('profiles')
		.select('id, display_name, verification_status, created_at', { count: 'exact' })
		.order('created_at', { ascending: false });

	// Exact UUID lookup, or literal display-name search. Escape LIKE wildcard characters.
	if (query) {
		if (uuidPattern.test(query)) profilesQuery = profilesQuery.eq('id', query);
		else profilesQuery = profilesQuery.ilike('display_name', `%${query.replace(/[\\%_]/g, '\\$&')}%`);
	}
	const profilesResult = await profilesQuery.range((page - 1) * pageSize, page * pageSize - 1);
	if (profilesResult.error) {
		console.error('admin users profiles failed:', profilesResult.error.code, profilesResult.error.message);
		return { role: staff.role, query, page, total: 0, pageSize, users: [], message: 'Could not load user profiles.' };
	}

	const profiles = profilesResult.data ?? [];
	const ids = profiles.map((p) => p.id);
	/** @type {{ user_id: string, status: string, reason: string | null, updated_at: string }[]} */
let standings = [];

/** @type {{ user_id: string, role: string }[]} */
let staffAccounts = [];
	if (ids.length) {
		const [standingResult, staffResult] = await Promise.all([
			locals.supabase.from('account_standing').select('user_id, status, reason, updated_at').in('user_id', ids),
			locals.supabase.from('staff').select('user_id, role').in('user_id', ids)
		]);
		if (standingResult.error) console.error('admin users standing failed:', standingResult.error.code, standingResult.error.message);
		else standings = standingResult.data ?? [];
		if (staffResult.error) console.error('admin users staff labels failed:', staffResult.error.code, staffResult.error.message);
		else staffAccounts = staffResult.data ?? [];
	}
	const standingById = new Map(standings.map((s) => [s.user_id, s]));
	const roleById = new Map(staffAccounts.map((s) => [s.user_id, s.role]));
	const users = profiles.map((profile) => ({
		...profile,
		standing: standingById.get(profile.id) ?? null,
		staffRole: roleById.get(profile.id) ?? null
	}));

	return {
		role: staff.role, query, page, pageSize, total: profilesResult.count ?? 0,
		users, message: null
	};
};
