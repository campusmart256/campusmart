import { error, fail, redirect } from '@sveltejs/kit';

const statuses = new Set(['active', 'limited', 'suspended', 'banned']);
const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @param {import('./$types').PageServerLoadEvent['locals']} locals */
async function requireStaff(locals) {
    const user = await locals.getUser();
    if (!user) redirect(303, '/signin?next=/admin/users');
    const { data, error: staffError } = await locals.supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle();
    if (staffError) {
        console.error('account detail role check failed:', staffError.code, staffError.message);
        error(503, 'Staff permissions could not be verified');
    }
    if (!data || !['moderator','super_admin'].includes(data.role)) error(403, 'Not authorized');
    return { user, role: data.role };
}

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals, params, url }) => {
    const staff = await requireStaff(locals);
    if (!uuidPattern.test(params.id)) error(404, 'Account not found');
    const [profileResult, standingResult, staffResult, historyResult] = await Promise.all([
        locals.supabase.from('profiles').select('id, display_name, verification_status, created_at').eq('id', params.id).maybeSingle(),
        locals.supabase.from('account_standing').select('user_id, status, reason, updated_at').eq('user_id', params.id).maybeSingle(),
        locals.supabase.from('staff').select('user_id, role').eq('user_id', params.id).maybeSingle(),
        locals.supabase.from('audit_log').select('id, actor_id, action, reason, created_at').eq('target_type','user').eq('target_id',params.id).order('created_at',{ ascending:false }).limit(20)
    ]);
    if (profileResult.error) { console.error('account detail profile failed:', profileResult.error.code, profileResult.error.message); error(503, 'Account cannot be loaded'); }
    if (!profileResult.data) error(404, 'Account not found');
    if (standingResult.error || staffResult.error) {
        console.error('account detail standing or role lookup failed:', standingResult.error?.message, staffResult.error?.message);
        error(503, 'Account permissions or standing cannot be loaded');
    }
    return {
        role: staff.role,
        user: { ...profileResult.data, standing: standingResult.data, staffRole: staffResult.data?.role ?? null },
        history: historyResult.error ? [] : (historyResult.data ?? []),
        message: historyResult.error ? 'Moderation history is currently unavailable.' : null,
        updated: url.searchParams.get('updated') === '1'
    };
};

/** @type {import('./$types').Actions} */
export const actions = {
    setStatus: async ({ locals, params, request }) => {
        const staff = await requireStaff(locals);
        if (!uuidPattern.test(params.id)) return fail(400, { message:'Invalid account.' });
        const form = await request.formData();
        const targetId = String(form.get('userId') ?? '').trim();
        const status = String(form.get('status') ?? '').trim();
        const reason = String(form.get('reason') ?? '').trim();
        if (targetId !== params.id) return fail(400, { message: 'Account mismatch.' });
        if (!statuses.has(status)) return fail(400, { message: 'Invalid account status.' });
        if (reason.length < 3 || reason.length > 500) return fail(400, { message: 'Provide a reason between 3 and 500 characters.' });
        if (targetId === staff.user.id) return fail(403, { message: 'You cannot moderate your own account.' });
        if (status === 'banned' && staff.role !== 'super_admin') return fail(403, { message: 'Only super admins can ban accounts.' });
        const { error: rpcError } = await locals.supabase.rpc('staff_set_account_status', {
            p_user_id: targetId, p_status: status, p_reason: reason
        });
        if (rpcError) {
            console.error('admin account status update failed:', rpcError.code, rpcError.message);
            return fail(400, { message: 'Could not update account. The action may be restricted or the server may be unavailable.' });
        }
        redirect(303, `/admin/users/${params.id}?updated=1`);
    }
};
