import { env } from 'cloudflare:workers';
import { sniffImage } from './photos.js';

export const MAX_VERIFICATION_DOCUMENT_BYTES = 5_000_000;
export const VERIFICATION_DOCUMENT_KEY_RE = /^verification\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp|pdf)$/;

/**
 * @param {Uint8Array} bytes
 * @returns {{ type: string, ext: string } | null}
 */
function sniffDocument(bytes) {
	const image = sniffImage(bytes);
	if (image) return image;
	if (bytes.length > 5 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46 && bytes[4] === 0x2d) {
		return { type: 'application/pdf', ext: 'pdf' };
	}
	return null;
}

/**
 * @param {string} name
 */
function safeName(name) {
	const cleaned = name.replace(/[\\/\0]/g, '').trim();
	return cleaned.length > 0 ? cleaned.slice(0, 120) : 'student-proof';
}

/**
 * Checks one uploaded student-proof document.
 * Allowed: JPG, PNG, WebP, or PDF. The file name/type from the browser is not trusted.
 * @param {FormDataEntryValue | null} entry
 * @returns {Promise<{ document: { bytes: Uint8Array, type: string, ext: string, name: string, size: number } } | { error: string }>}
 */
export async function readVerificationDocument(entry) {
	if (!entry || typeof entry === 'string' || entry.size === 0) return { error: 'Upload a student ID, admission letter, or recent tuition payment receipt.' };
	if (entry.size > MAX_VERIFICATION_DOCUMENT_BYTES) return { error: 'The document is too large. Upload a file under 5 MB.' };
	const bytes = new Uint8Array(await entry.arrayBuffer());
	const kind = sniffDocument(bytes);
	if (!kind) return { error: 'Only JPG, PNG, WebP, or PDF documents are allowed.' };
	return { document: { bytes, ...kind, name: safeName(entry.name || `student-proof.${kind.ext}`), size: entry.size } };
}

/**
 * Stores one private verification document in R2 and returns its key.
 * The key is not served by /photos; staff must open it through a protected admin route.
 * @param {string} userId
 * @param {{ bytes: Uint8Array, type: string, ext: string }} document
 */
export async function storeVerificationDocument(userId, document) {
	const key = `verification/${userId}/${crypto.randomUUID()}.${document.ext}`;
	await env.PHOTOS.put(key, document.bytes, {
		httpMetadata: {
			contentType: document.type,
			cacheControl: 'private, max-age=0, no-store'
		}
	});
	return key;
}

/** @param {string[]} keys */
export async function removeVerificationDocuments(keys) {
	if (keys.length) await env.PHOTOS.delete(keys).catch(() => {});
}

/**
 * @param {string | null | undefined} key
 */
export async function getVerificationDocument(key) {
	if (!key || !VERIFICATION_DOCUMENT_KEY_RE.test(key)) return null;
	return await env.PHOTOS.get(key);
}
