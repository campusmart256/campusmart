import { SOON_PAGES } from '../../params.js';

export const load = ({ params }) => {
	const page = /** @type {Record<string, { title: string, text: string }>} */ (SOON_PAGES)[params.feature];
	return { title: page.title, text: page.text };
};
