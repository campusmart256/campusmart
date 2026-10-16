import { error, redirect } from '@sveltejs/kit';
import { getVerificationDocument } from '#lib/server/verification-documents.js';

/** @param {import('./$types').RequestEvent['locals']} locals */
async function requireStaff(locals) {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/admin/verification');

	const { data, error: staffError } = await locals.supabase
		.from('staff')
		.select('role')
		.eq('user_id', user.id)
		.maybeSingle();

	if (staffError) {
		console.error('staff document check failed:', staffError.code, staffError.message);
		error(500, 'Could not check staff permissions');
	}
	if (!data) error(403, 'Not allowed');
	return user;
}

/** Protected staff-only viewer for student verification documents. */
export const GET = async ({ params, locals, request }) => {
	await requireStaff(locals);

	const result = await locals.supabase
		.from('verification_requests')
		.select('document_path, document_mime, document_name')
		.eq('id', params.id)
		.maybeSingle();

	if (result.error) {
		console.error('verification document lookup failed:', result.error.code, result.error.message);
		error(500, 'Could not load document');
	}
	if (!result.data?.document_path) error(404, 'Document not found');

	const object = await getVerificationDocument(result.data.document_path);
	if (!object) error(404, 'Document not found');

	const name = String(result.data.document_name ?? 'student-proof').replace(/["\r\n]/g, '');
	const headers = new Headers({
		'content-type': result.data.document_mime ?? object.httpMetadata?.contentType ?? 'application/octet-stream',
		'cache-control': 'private, max-age=0, no-store',
		'x-content-type-options': 'nosniff',
		'content-disposition': `inline; filename="${name}"`,
		etag: object.httpEtag
	});
	if (request.headers.get('if-none-match') === object.httpEtag) return new Response(null, { status: 304, headers });
	return new Response(object.body, { headers });
};
