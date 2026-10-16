const STOP = new Set(['the', 'and', 'for', 'with', 'new', 'used', 'good', 'like', 'in', 'of', 'a', 'an', 'to', 'is', 'my', 'sale', 'selling']);

/** Lower-case words (3+ letters or digits) from a title, without very common words. @param {string} text */
export function titleWords(text) {
	return new Set(
		(text ?? '')
			.toLowerCase()
			.split(/[^\p{L}\p{N}]+/u)
			.filter((w) => w.length >= 3 && !STOP.has(w))
	);
}

/**
 * Picks the listings most like the one being viewed.
 *  - same category: +3
 *  - close price: +2 (within 30%) or +1 (within 60%)
 *  - same condition: +1
 *  - shared words in the title: +1 each, up to 2
 *  - a different seller: +0.5 (so the page is not just one person's items)
 * Ties go to the newer listing.
 * @param {{ id: string, category_id: string, price_ugx: number, condition: string, title: string, seller_id: string }} current
 * @param {any[]} candidates
 * @param {number} [limit]
 */
export function rankSimilar(current, candidates, limit = 6) {
	const words = titleWords(current.title);
	const seen = new Set();
	return candidates
		.filter((c) => c.id !== current.id && !seen.has(c.id) && seen.add(c.id))
		.map((c) => {
			let score = 0;
			if (c.category_id === current.category_id) score += 3;
			const low = Math.min(c.price_ugx, current.price_ugx);
			const high = Math.max(c.price_ugx, current.price_ugx) || 1;
			const closeness = low / high;
			if (closeness >= 0.7) score += 2;
			else if (closeness >= 0.4) score += 1;
			if (c.condition === current.condition) score += 1;
			let shared = 0;
			for (const w of titleWords(c.title)) if (words.has(w)) shared++;
			score += Math.min(2, shared);
			if (c.seller_id !== current.seller_id) score += 0.5;
			return { c, score };
		})
		.sort((a, b) => b.score - a.score || String(b.c.published_at).localeCompare(String(a.c.published_at)))
		.slice(0, limit)
		.map((x) => x.c);
}
