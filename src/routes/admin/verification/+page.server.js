import { fail, redirect } from '@sveltejs/kit';
import { cleanText } from '#lib/validation.js';

async function requireStaff(locals) {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/admin/verification');

	const { data, error } = await locals.supabase
		.from('staff')
		.select('role')
		.eq('user_id', user.id)
		.maybeSingle();

	if (error) {
		console.error('staff check failed:', error.code, error.message);
		throw redirect(303, '/');
	}
	if (!data) redirect(303, '/');
	return { user, role: data.role };
}

export const load = async ({ locals, url }) => {
	const staff = await requireStaff(locals);
	const status = url.searchParams.get('status') ?? 'pending';
	const safeStatus = ['pending', 'approved', 'rejected'].includes(status) ? status : 'pending';

	const requestsResult = await locals.supabase
		.from('verification_requests')
		.select('id, user_id, full_name, course, year_of_study, registration_number, status, reject_reason, reviewed_at, created_at, document_name, document_mime, document_size, document_kind')
		.eq('status', safeStatus)
		.order('created_at', { ascending: safeStatus !== 'pending' })
		.limit(50);

	if (requestsResult.error) {
		console.error('verification requests load failed:', requestsResult.error.code, requestsResult.error.message);
		return { role: staff.role, status: safeStatus, requests: [], message: 'Could not load verification requests.' };
	}

	const requests = requestsResult.data ?? [];
	const userIds = [...new Set(requests.map((r) => r.user_id).filter(Boolean))];
	let profiles = new Map();

	if (userIds.length) {
		const profilesResult = await locals.supabase
			.from('profiles')
			.select('id, display_name, verification_status, campuses(name)')
			.in('id', userIds);
		if (profilesResult.error) console.error('verification profiles load failed:', profilesResult.error.code, profilesResult.error.message);
		else profiles = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));
	}

	return {
		role: staff.role,
		status: safeStatus,
		requests: requests.map((request) => ({ ...request, profile: profiles.get(request.user_id) ?? null })),
		decided: url.searchParams.get('decided') === '1'
	};
};

export const actions = {
	approve: async ({ request, locals }) => {
		await requireStaff(locals);
		const form = await request.formData();
		const requestId = cleanText(form.get('requestId'));
		if (!requestId) return fail(400, { message: 'Missing verification request.' });

		const result = await locals.supabase.rpc('staff_review_verification', {
			p_request_id: requestId,
			p_approve: true,
			p_reason: null
		});

		if (result.error) {
			console.error('verification approve failed:', result.error.code, result.error.message);
			return fail(400, { message: result.error.message || 'Could not approve this request.' });
		}

		redirect(303, '/admin/verification?decided=1');
	},

	reject: async ({ request, locals }) => {
		await requireStaff(locals);
		const form = await request.formData();
		const requestId = cleanText(form.get('requestId'));
		const reason = cleanText(form.get('reason'));
		if (!requestId) return fail(400, { message: 'Missing verification request.' });
		if (reason.length < 3) return fail(400, { message: 'Add a short reason before rejecting.' });

		const result = await locals.supabase.rpc('staff_review_verification', {
			p_request_id: requestId,
			p_approve: false,
			p_reason: reason
		});

		if (result.error) {
			console.error('verification reject failed:', result.error.code, result.error.message);
			return fail(400, { message: result.error.message || 'Could not reject this request.' });
		}

		redirect(303, '/admin/verification?decided=1');
	}
};
