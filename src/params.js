/** Pages that exist in the menu but are built in later steps. */
export const SOON_PAGES = {
	moderation: { title: 'Moderation', text: 'Reports, student verification checks and held listings will be handled here.' }
};

/**
 * Route matchers (in this SvelteKit version they follow the "Standard Schema" shape).
 * The folder name "[feature=soon]" uses the "soon" matcher below, so only the pages
 * listed above exist at those addresses.
 */
export const params = {
	soon: {
		'~standard': {
			version: 1,
			vendor: 'campusmart',
			/** @param {unknown} value */
			validate: (value) =>
				typeof value === 'string' && Object.prototype.hasOwnProperty.call(SOON_PAGES, value)
					? { value }
					: { issues: [{ message: 'Not a page' }] }
		}
	}
};
