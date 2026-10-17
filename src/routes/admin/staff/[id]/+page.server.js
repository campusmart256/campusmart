import { fail, redirect, error } from '@sveltejs/kit';

const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const validActions = new Set(['add', 'set_role', 'remove']);
const validRoles = new Set(['moderator', 'super_admin']);

/** @param {import('./$types').PageServerLoadEvent['locals']} locals */
async function requireSuperAdmin(locals) {
  const user = await locals.getUser();
  if (!user) redirect(303, '/signin?next=/admin/staff');
  const { data, error: staffError } = await locals.supabase.from('staff').select('role').eq('user_id', user.id).maybeSingle();
  if (staffError) {
    console.error('staff detail authorization failed:', staffError.code, staffError.message);
    redirect(303, '/admin');
  }
  if (data?.role !== 'super_admin') redirect(303, '/admin');
  return user;
}

/** @type {import('./$types').PageServerLoad} */
export const load = async ({ locals, params, url }) => {
  const actor = await requireSuperAdmin(locals);
  if (!uuidPattern.test(params.id)) error(404, 'Account not found');
  const [profileResult, staffResult, auditResult] = await Promise.all([
    locals.supabase.from('profiles').select('id, display_name, verification_status, created_at').eq('id', params.id).maybeSingle(),
    locals.supabase.from('staff').select('user_id, role, created_at').eq('user_id', params.id).maybeSingle(),
    locals.supabase.from('audit_log').select('id, actor_id, action, reason, created_at').eq('target_type', 'user').eq('target_id', params.id).in('action', ['staff_add', 'staff_set_role', 'staff_remove']).order('created_at', { ascending: false }).limit(30)
  ]);
  if (profileResult.error || staffResult.error) {
    console.error('staff detail load failed:', profileResult.error?.message, staffResult.error?.message);
    error(500, 'Unable to load this account');
  }
  if (!profileResult.data) error(404, 'Account not found');
  if (auditResult.error) console.error('staff detail audit failed:', auditResult.error.code, auditResult.error.message);
  return {
    account: profileResult.data,
    membership: staffResult.data,
    currentUserId: actor.id,
    history: auditResult.data ?? [],
    historyError: Boolean(auditResult.error),
    updated: url.searchParams.get('updated') === '1'
  };
};

/** @type {import('./$types').Actions} */
export const actions = {
  manage: async ({ locals, params, request }) => {
    const actor = await requireSuperAdmin(locals);
    if (!uuidPattern.test(params.id)) return fail(400, { message: 'Invalid account.' });
    if (params.id === actor.id) return fail(403, { message: 'You cannot change your own staff role.' });
    const form = await request.formData();
    const action = String(form.get('action') ?? '').trim();
    const role = String(form.get('role') ?? '').trim();
    const reason = String(form.get('reason') ?? '').trim();
    const confirmation = String(form.get('confirmation') ?? '').trim();
    if (!validActions.has(action)) return fail(400, { message: 'Invalid staff action.' });
    if (action !== 'remove' && !validRoles.has(role)) return fail(400, { message: 'Invalid staff role.' });
    if (action === 'add' && role !== 'moderator') return fail(400, { message: 'New staff must first be added as moderators.' });
    if (reason.length < 3 || reason.length > 500) return fail(400, { message: 'Reason must be 3–500 characters.' });
    if (confirmation !== 'CONFIRM') return fail(400, { message: 'Type CONFIRM to continue.' });
    const { error: rpcError } = await locals.supabase.rpc('manage_staff', {
      p_user_id: params.id,
      p_action: action,
      p_role: action === 'remove' ? null : role,
      p_reason: reason
    });
    if (rpcError) {
      console.error('staff detail manage failed:', rpcError.code, rpcError.message);
      return fail(400, { message: 'Staff change not completed. Check permissions and selected action.' });
    }
    redirect(303, `/admin/staff/${params.id}?updated=1`);
  }
};
