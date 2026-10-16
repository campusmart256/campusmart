import { error } from '@sveltejs/kit';
import { env } from 'cloudflare:workers';
import { PHOTO_KEY_RE } from '#lib/server/photos.js';

/** Serves a stored photo. File names are random, so only people with the link can find them. */
export const GET = async ({ params, request }) => {
	const key = params.key;
	if (!PHOTO_KEY_RE.test(key)) error(404, 'Not found');
	const object = await env.PHOTOS.get(key);
	if (!object) error(404, 'Not found');

	const headers = new Headers({
		'content-type': object.httpMetadata?.contentType ?? 'application/octet-stream',
		'cache-control': 'public, max-age=31536000, immutable',
		'x-content-type-options': 'nosniff',
		etag: object.httpEtag
	});
	if (request.headers.get('if-none-match') === object.httpEtag) return new Response(null, { status: 304, headers });
	return new Response(object.body, { headers });
};
