// Shared, framework-free helpers for forms. Server code re-checks everything.

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Trim and squash repeated spaces. Always returns a string.
 * @param {unknown} value
 */
export function cleanText(value) {
	return typeof value === 'string' ? value.trim().replace(/\s+/g, ' ') : '';
}

/** @param {unknown} value */
export function cleanEmail(value) {
	return typeof value === 'string' ? value.trim().toLowerCase() : '';
}

/**
 * Only allow redirects to paths on this site (stops open-redirect tricks
 * such as ?next=https://evil.com or ?next=//evil.com).
 * @param {unknown} next
 * @param {string} [fallback]
 */
export function safeNext(next, fallback = '/') {
	if (typeof next === 'string' && next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\')) {
		return next;
	}
	return fallback;
}

/**
 * @param {{ displayName: string, email: string, password: string, terms: boolean }} input
 * @returns {Record<string,string>} field name -> message (empty object means valid)
 */
export function validateSignup({ displayName, email, password, terms }) {
	/** @type {Record<string,string>} */
	const errors = {};
	if (displayName.length < 2 || displayName.length > 50) errors.displayName = 'Enter a name of 2 to 50 characters.';
	if (!EMAIL_RE.test(email) || email.length > 254) errors.email = 'Enter a valid email address.';
	if (password.length < 8) errors.password = 'Use at least 8 characters.';
	else if (password.length > 72) errors.password = 'Use 72 characters or fewer.';
	if (!terms) errors.terms = 'Please accept the Terms of Use and Privacy Policy.';
	return errors;
}

/**
 * @param {string} password
 * @param {string} confirm
 * @returns {Record<string,string>}
 */
export function validateNewPassword(password, confirm) {
	/** @type {Record<string,string>} */
	const errors = {};
	if (password.length < 8) errors.password = 'Use at least 8 characters.';
	else if (password.length > 72) errors.password = 'Use 72 characters or fewer.';
	else if (password !== confirm) errors.confirm = 'The two passwords do not match.';
	return errors;
}

/**
 * Display names: 2 to 50 characters after tidying.
 * @param {string} name
 * @returns {string | null} an error message, or null when fine
 */
export function validateDisplayName(name) {
	if (name.length < 2 || name.length > 50) return 'Enter a name of 2 to 50 characters.';
	return null;
}

/**
 * Turns the ways people type a phone number into international format (+<country code><number>).
 *  - Ugandan numbers may start with 0:  0772 123 456  ->  +256772123456
 *  - Other countries need the country code with + or 00:  +254 712 345 678, 0044 7911 123456
 *  - Ugandan numbers (+256) must be mobile numbers (start with 7); other countries are checked
 *    only for a sensible length (8 to 15 digits in total), because we cannot know every rule.
 * Empty input is allowed and means "no number".
 * @param {unknown} input
 * @returns {{ value: string | null, error?: undefined } | { error: string, value?: undefined }}
 */
export function normalizePhone(input) {
	const raw = typeof input === 'string' ? input.trim() : '';
	if (!raw) return { value: null };

	let digits = raw.replace(/[\s\-().]/g, '');
	let international = false;
	if (digits.startsWith('+')) { international = true; digits = digits.slice(1); }
	else if (digits.startsWith('00')) { international = true; digits = digits.slice(2); }
	if (!/^\d+$/.test(digits)) return { error: 'Use digits only, for example +254 712 345 678.' };

	const ugandaError = 'Enter a Ugandan mobile number, for example 0772 123 456.';
	if (!international) {
		if (digits.startsWith('0')) {
			const rest = digits.slice(1);
			return /^7\d{8}$/.test(rest) ? { value: '+256' + rest } : { error: ugandaError };
		}
		if (digits.startsWith('256')) international = true;
		else return { error: 'For numbers outside Uganda, start with the country code, for example +254 712 345 678.' };
	}

	if (digits.startsWith('256')) {
		let rest = digits.slice(3);
		if (rest.length === 10 && rest.startsWith('0')) rest = rest.slice(1); // "+256 0772 ..." slip
		return /^7\d{8}$/.test(rest) ? { value: '+256' + rest } : { error: ugandaError };
	}
	if (!/^[1-9]\d{7,14}$/.test(digits)) {
		return { error: 'Enter the full number with the country code, for example +254 712 345 678.' };
	}
	return { value: '+' + digits };
}

export const CONDITIONS = ['new', 'like_new', 'good', 'fair', 'used'];
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
export const isUuid = (/** @type {unknown} */ v) => typeof v === 'string' && UUID_RE.test(v);

/**
 * Accepts "45000", "45,000" or "45 000". Returns a whole number or NaN.
 * @param {unknown} input
 */
export function parsePrice(input) {
	const digits = typeof input === 'string' ? input.replace(/[,\s]/g, '') : '';
	return /^\d{1,10}$/.test(digits) ? Number(digits) : NaN;
}

/**
 * @param {{ title: string, description: string, priceText: string, condition: string, categoryId: string, meetupSpotId: string }} v
 * @returns {Record<string,string>}
 */
export function validateListing(v) {
	/** @type {Record<string,string>} */
	const errors = {};
	if (v.title.length < 3 || v.title.length > 100) errors.title = 'Enter a title of 3 to 100 characters.';
	if (v.description.length < 10 || v.description.length > 2000) errors.description = 'Describe the item in 10 to 2000 characters.';
	const price = parsePrice(v.priceText);
	if (Number.isNaN(price)) errors.price = 'Enter the price as a number, for example 45000.';
	else if (price < 100) errors.price = 'The price must be at least UGX 100.';
	else if (price > 1000000000) errors.price = 'That price is too high.';
	if (!CONDITIONS.includes(v.condition)) errors.condition = 'Choose the condition.';
	if (!isUuid(v.categoryId)) errors.category = 'Choose a category.';
	if (v.meetupSpotId && !isUuid(v.meetupSpotId)) errors.meetup = 'Choose a meetup spot from the list.';
	return errors;
}

/**
 * Turns what someone typed in the search bar into a few safe words.
 * Keeps letters, numbers and hyphens only (so wildcard and filter symbols can never
 * change how the database search works), at most 5 words of 30 characters.
 * @param {unknown} input
 * @returns {string[]}
 */
export function cleanSearchWords(input) {
	if (typeof input !== 'string') return [];
	return input
		.slice(0, 120)
		.replace(/[^\p{L}\p{N}\s-]/gu, ' ')
		.split(/\s+/)
		.map((w) => w.replace(/^-+|-+$/g, '').slice(0, 30))
		.filter((w) => w.length > 0)
		.slice(0, 5);
}
