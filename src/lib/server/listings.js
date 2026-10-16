import { parsePrice, cleanText, validateListing } from '#lib/validation.js';

/** Reads the listing fields from a submitted form. @param {FormData} form */
export function readListingFields(form) {
	return {
		title: cleanText(form.get('title')),
		description: String(form.get('description') ?? '').replace(/\r\n/g, '\n').trim(),
		priceText: String(form.get('price') ?? '').trim(),
		condition: String(form.get('condition') ?? ''),
		categoryId: String(form.get('category') ?? ''),
		meetupSpotId: String(form.get('meetup') ?? ''),
		negotiable: form.get('negotiable') === 'on'
	};
}

/** @param {ReturnType<typeof readListingFields>} values */
export function checkListingFields(values) {
	return validateListing(values);
}

/** @param {ReturnType<typeof readListingFields>} values */
export function listingColumns(values) {
	return {
		category_id: values.categoryId,
		title: values.title,
		description: values.description,
		price_ugx: parsePrice(values.priceText),
		condition: values.condition,
		is_negotiable: values.negotiable,
		meetup_spot_id: values.meetupSpotId || null
	};
}

/**
 * Turns a database message about publishing into a short code for the page.
 * @param {string | undefined} message
 */
export function publishNotice(message) {
	return /listing limit/i.test(message ?? '') ? 'limit' : 'error';
}

/** @param {string | undefined} message */
export function friendlyPublishError(message) {
	if (/listing limit/i.test(message ?? '')) return 'You have reached the limit of active listings. Mark an old one as sold, delete one, or get the green check to list more.';
	if (/photo/i.test(message ?? '')) return 'Add at least one photo before publishing.';
	if (/confirm your email/i.test(message ?? '')) return 'Please confirm your email address first.';
	if (/cannot|locked|not allowed/i.test(message ?? '')) return 'This listing cannot be changed right now.';
	return 'We could not do that just now. Please try again.';
}
