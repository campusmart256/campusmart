/**
 * Whole number with thousands commas, same on server and in the browser.
 * @param {number} n
 */
export function formatNumber(n) {
	return new Intl.NumberFormat('en-US').format(n);
}

/** @type {Record<string, string>} */
export const CONDITION_LABELS = { new: 'New', like_new: 'Like new', good: 'Good', fair: 'Fair', used: 'Used' };

/**
 * "9 Oct 2026" in UTC, so server and browser always agree.
 * @param {string | null | undefined} iso
 */
export function formatDate(iso) {
	if (!iso) return '';
	return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}
