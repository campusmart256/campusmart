import { env } from 'cloudflare:workers';

export const MAX_PHOTOS = 5;
export const MAX_PHOTO_BYTES = 2_500_000; // after the browser has shrunk them, photos are usually under 500 KB
export const PHOTO_KEY_RE = /^(listings|avatars)\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/**
 * Looks at the first bytes of a file to find out what it really is.
 * (We never trust the file name or the type the browser claims.)
 * @param {Uint8Array} b
 * @returns {{ type: string, ext: string } | null}
 */
export function sniffImage(b) {
	if (b.length > 12 && b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return { type: 'image/jpeg', ext: 'jpg' };
	if (b.length > 12 && b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 && b[4] === 0x0d && b[5] === 0x0a && b[6] === 0x1a && b[7] === 0x0a) return { type: 'image/png', ext: 'png' };
	if (b.length > 12 && b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46 && b[8] === 0x57 && b[9] === 0x45 && b[10] === 0x42 && b[11] === 0x50) return { type: 'image/webp', ext: 'webp' };
	return null;
}

/**
 * Checks uploaded files without any rule about how many there should be.
 * Empty file slots are ignored. Returns the cleaned images or an error message.
 * @param {FormDataEntryValue[]} entries
 * @param {number} [maxBytes]
 * @returns {Promise<{ photos: { bytes: Uint8Array, type: string, ext: string }[] } | { error: string }>}
 */
export async function readImageFiles(entries, maxBytes = MAX_PHOTO_BYTES) {
	const files = entries.filter((e) => typeof e !== 'string' && e.size > 0);
	const photos = [];
	for (const file of files) {
		if (typeof file === 'string') continue;
		if (file.size > maxBytes) return { error: 'One of the pictures is too large. Try a smaller one.' };
		const bytes = new Uint8Array(await file.arrayBuffer());
		const kind = sniffImage(bytes);
		if (!kind) return { error: 'Only JPG, PNG or WebP pictures are allowed.' };
		photos.push({ bytes, ...kind });
	}
	return { photos };
}

/**
 * Checks every uploaded file. Returns the cleaned photos or an error message.
 * @param {FormDataEntryValue[]} entries
 * @returns {Promise<{ photos: { bytes: Uint8Array, type: string, ext: string }[] } | { error: string }>}
 */
export async function readPhotos(entries) {
	const files = entries.filter((e) => typeof e !== 'string' && e.size > 0);
	if (files.length < 1) return { error: 'Add at least one photo.' };
	if (files.length > MAX_PHOTOS) return { error: `You can add up to ${MAX_PHOTOS} photos.` };
	const photos = [];
	for (const file of files) {
		if (typeof file === 'string') continue;
		if (file.size > MAX_PHOTO_BYTES) return { error: 'One of the photos is too large. Try a smaller photo.' };
		const bytes = new Uint8Array(await file.arrayBuffer());
		const kind = sniffImage(bytes);
		if (!kind) return { error: 'Only JPG, PNG or WebP photos are allowed.' };
		photos.push({ bytes, ...kind });
	}
	return { photos };
}

/**
 * Stores the photos and returns their keys, in order. If anything fails, removes what was stored.
 * @param {string} listingId
 * @param {{ bytes: Uint8Array, type: string, ext: string }[]} photos
 */
export async function storePhotos(listingId, photos) {
	/** @type {string[]} */
	const keys = [];
	try {
		for (const p of photos) {
			const key = `listings/${listingId}/${crypto.randomUUID()}.${p.ext}`;
			await env.PHOTOS.put(key, p.bytes, { httpMetadata: { contentType: p.type, cacheControl: 'public, max-age=31536000, immutable' } });
			keys.push(key);
		}
		return keys;
	} catch (e) {
		await removePhotos(keys);
		throw e;
	}
}

/**
 * Stores one profile picture and returns its key.
 * @param {string} userId
 * @param {{ bytes: Uint8Array, type: string, ext: string }} photo
 */
export async function storeAvatar(userId, photo) {
	const key = `avatars/${userId}/${crypto.randomUUID()}.${photo.ext}`;
	await env.PHOTOS.put(key, photo.bytes, { httpMetadata: { contentType: photo.type, cacheControl: 'public, max-age=31536000, immutable' } });
	return key;
}

/** @param {string[]} keys */
export async function removePhotos(keys) {
	if (keys.length) await env.PHOTOS.delete(keys).catch(() => {});
}
