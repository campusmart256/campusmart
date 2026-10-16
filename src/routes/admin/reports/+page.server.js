import { fail, redirect } from '@sveltejs/kit';
import { cleanText, isUuid } from '#lib/validation.js';

const statusOptions = new Set(['open', 'actioned', 'dismissed']);

/** @param {import('./$types').PageServerLoadEvent['locals']} locals */
async function requireStaff(locals) {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/admin/reports');

	const { data, error } = await locals.supabase
		.from('staff')
		.select('role')
		.eq('user_id', user.id)
		.maybeSingle();

	if (error) {
		console.error('staff check failed:', error.code, error.message);
		redirect(303, '/');
	}
	if (!data) redirect(303, '/');
	return { user, role: data.role };
}

/**
 * @param {{
 *   listing_id?: string | null,
 *   target_listing_id?: string | null,
 *   conversation_id?: string | null,
 *   target_user_id?: string | null
 * }} report
 */
function reportType(report) {
	if (report.listing_id || report.target_listing_id) return 'listing';
	if (report.conversation_id) return 'conversation';
	if (report.target_user_id) return 'user';
	return 'unknown';
}

export const load = async ({ locals, url }) => {
	const staff = await requireStaff(locals);
	const requestedStatus = url.searchParams.get('status') ?? 'open';
	const status = statusOptions.has(requestedStatus) ? requestedStatus : 'open';

	const reportsResult = await locals.supabase
		.from('reports')
		.select('id, reporter_id, target_user_id, target_listing_id, listing_id, conversation_id, reason, note, status, handled_by, handled_at, resolution_note, created_at')
		.eq('status', status)
		.order('created_at', { ascending: status !== 'open' })
		.limit(80);

	if (reportsResult.error) {
		console.error('reports load failed:', reportsResult.error.code, reportsResult.error.message);
		return { role: staff.role, status, reports: [], message: reportsResult.error.message || 'Could not load reports.' };
	}

	const reports = reportsResult.data ?? [];
	const userIds = [...new Set(reports.flatMap((report) => [report.reporter_id, report.target_user_id]).filter(Boolean))];
	const listingIds = [...new Set(reports.map((report) => report.listing_id ?? report.target_listing_id).filter(Boolean))];

	let profiles = new Map();
	let listings = new Map();

	if (userIds.length) {
		const profilesResult = await locals.supabase
			.from('profiles')
			.select('id, display_name, verification_status, avatar_path')
			.in('id', userIds);
		if (profilesResult.error) console.error('report profiles load failed:', profilesResult.error.code, profilesResult.error.message);
		else profiles = new Map((profilesResult.data ?? []).map((profile) => [profile.id, profile]));
	}

	if (listingIds.length) {
		const listingsResult = await locals.supabase
			.from('listings')
			.select('id, title, price_ugx, status, seller_id, listing_images(storage_path, position)')
			.in('id', listingIds);
		if (listingsResult.error) console.error('report listings load failed:', listingsResult.error.code, listingsResult.error.message);
		else listings = new Map((listingsResult.data ?? []).map((listing) => [listing.id, listing]));
	}

	return {
		role: staff.role,
		status,
		reports: reports.map((report) => {
			const listingId = report.listing_id ?? report.target_listing_id ?? null;
			const listing = listingId ? listings.get(listingId) : null;
			const firstImage = [...(listing?.listing_images ?? [])].sort((a, b) => a.position - b.position)[0];
			return {
				...report,
				type: reportType(report),
				listingId,
				listing: listing ? { ...listing, cover: firstImage?.storage_path ?? null } : null,
				reporter: profiles.get(report.reporter_id) ?? null,
				targetUser: profiles.get(report.target_user_id) ?? null
			};
		}),
		decided: url.searchParams.get('decided') === '1'
	};
};

export const actions = {
	dismiss: async ({ request, locals }) => {
		await requireStaff(locals);
		const form = await request.formData();
		const reportId = cleanText(form.get('reportId'));
		const note = cleanText(form.get('note')) || 'Dismissed by moderator';
		if (!isUuid(reportId)) return fail(400, { message: 'Missing report.' });

		const result = await locals.supabase.rpc('staff_resolve_report', {
			p_report_id: reportId,
			p_status: 'dismissed',
			p_note: note
		});
		if (result.error) {
			console.error('dismiss report failed:', result.error.code, result.error.message);
			return fail(400, { message: result.error.message || 'Could not dismiss report.' });
		}
		redirect(303, '/admin/reports?decided=1');
	},

	markActioned: async ({ request, locals }) => {
		await requireStaff(locals);
		const form = await request.formData();
		const reportId = cleanText(form.get('reportId'));
		const note = cleanText(form.get('note')) || 'Reviewed by moderator';
		if (!isUuid(reportId)) return fail(400, { message: 'Missing report.' });

		const result = await locals.supabase.rpc('staff_resolve_report', {
			p_report_id: reportId,
			p_status: 'actioned',
			p_note: note
		});
		if (result.error) {
			console.error('action report failed:', result.error.code, result.error.message);
			return fail(400, { message: result.error.message || 'Could not update report.' });
		}
		redirect(303, '/admin/reports?decided=1');
	},

	removeListing: async ({ request, locals }) => {
		await requireStaff(locals);
		const form = await request.formData();
		const reportId = cleanText(form.get('reportId'));
		const listingId = cleanText(form.get('listingId'));
		const note = cleanText(form.get('note')) || 'Removed after report review';
		if (!isUuid(reportId) || !isUuid(listingId)) return fail(400, { message: 'Missing report or listing.' });

		const remove = await locals.supabase.rpc('staff_remove_listing', {
			p_listing_id: listingId,
			p_reason: note
		});
		if (remove.error) {
			console.error('remove listing from report failed:', remove.error.code, remove.error.message);
			return fail(400, { message: remove.error.message || 'Could not remove listing.' });
		}

		const resolve = await locals.supabase.rpc('staff_resolve_report', {
			p_report_id: reportId,
			p_status: 'actioned',
			p_note: note
		});
		if (resolve.error) {
			console.error('resolve after remove failed:', resolve.error.code, resolve.error.message);
			return fail(400, { message: resolve.error.message || 'Listing removed, but report was not closed.' });
		}
		redirect(303, '/admin/reports?decided=1');
	}
};
