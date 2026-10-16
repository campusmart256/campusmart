/** Profile pictures are stored as avatars/<user id>/<random>.<ext>. */
export const AVATAR_KEY_RE = /^avatars\/[0-9a-f-]{36}\/[0-9a-f-]{36}\.(jpg|png|webp)$/;

/**
 * The address of a profile picture, or null when there is none (or the stored value
 * does not look like one of our picture files).
 * @param {string | null | undefined} path
 */
export function avatarUrl(path) {
	return typeof path === 'string' && AVATAR_KEY_RE.test(path) ? `/photos/${path}` : null;
}

/**
 * Up to two capital letters from a name.
 * @param {string | null | undefined} name
 */
export function initialsOf(name) {
	const letters = (name ?? '').trim().split(/\s+/).map((w) => w[0] ?? '').join('').slice(0, 2).toUpperCase();
	return letters || '?';
}
