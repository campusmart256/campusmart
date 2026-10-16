// Browser-only history: no account syncing, database writes, or personal identifiers.
const KEY = 'campusmart:recently-viewed:v1';
const MAX_ITEMS = 24;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** @param {unknown} item */
function normalize(item) {
  if (!item || typeof item !== 'object') return null;
  const x = /** @type {Record<string, unknown>} */ (item);
  if (typeof x.id !== 'string' || !UUID.test(x.id)) return null;
  if (typeof x.title !== 'string' || !x.title.trim()) return null;
  const price = Number(x.price_ugx);
  return {
    id: x.id,
    title: x.title.trim().slice(0, 180),
    price_ugx: Number.isFinite(price) && price >= 0 ? price : 0,
    image: typeof x.image === 'string' && /^[a-zA-Z0-9/_ .-]+$/.test(x.image) && !x.image.includes('..') ? x.image : null,
    seenAt: typeof x.seenAt === 'number' && Number.isFinite(x.seenAt) ? x.seenAt : Date.now()
  };
}

/** @returns {Array<{id:string,title:string,price_ugx:number,image:string|null,seenAt:number}>} */
export function readRecentlyViewed() {
  if (typeof window === 'undefined') return [];
  try {
    const raw = JSON.parse(window.localStorage.getItem(KEY) || '[]');
    if (!Array.isArray(raw)) return [];
    /** @type {Set<string>} */
const ids = new Set();

/** @type {NonNullable<ReturnType<typeof normalize>>[]} */
const items = [];

for (const value of raw) {
  const item = normalize(value);
  if (!item || ids.has(item.id)) continue;

  ids.add(item.id);
  items.push(item);

  if (items.length >= MAX_ITEMS) break;
}

return items;
  } catch { return []; }
}

/** @param {{id:string,title:string,price_ugx:number,image?:string|null}} listing */
export function rememberListing(listing) {
  if (typeof window === 'undefined') return;
  const item = normalize({ ...listing, seenAt: Date.now() });
  if (!item) return;
  try {
    const rest = readRecentlyViewed().filter((entry) => entry.id !== item.id);
    window.localStorage.setItem(KEY, JSON.stringify([item, ...rest].slice(0, MAX_ITEMS)));
  } catch { /* Storage may be disabled. Browsing should still work. */ }
}

/** @param {string} id */
export function removeRecentlyViewed(id) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(readRecentlyViewed().filter((x) => x.id !== id)));
  } catch { /* Storage may be disabled. */ }
}

export function clearRecentlyViewed() {
  if (typeof window === 'undefined') return;
  try { window.localStorage.removeItem(KEY); } catch { /* Storage may be disabled. */ }
}
