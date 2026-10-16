<script>
  import { onMount } from 'svelte';
  import { readRecentlyViewed, removeRecentlyViewed, clearRecentlyViewed } from '#lib/recentlyViewed.js';
  import { formatNumber } from '#lib/format.js';

  /** @type {ReturnType<typeof readRecentlyViewed>} */
  let items = $state([]);
  let ready = $state(false);
  /** @type {Record<string, 'available' | 'sold_out' | 'unavailable' | 'unknown'>} */
  let availability = $state({});
  /** @type {Record<string, number>} */
  let currentPrices = $state({});
  let checking = $state(false);
  let requestVersion = 0;

  async function refresh() {
    items = readRecentlyViewed();
    const version = ++requestVersion;
    availability = {};
    currentPrices = {};
    if (!items.length) {
      checking = false;
      return;
    }
    checking = true;
    const ids = items.map((item) => item.id);
    try {
      const response = await fetch('/api/recently-viewed/availability', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ ids }),
        cache: 'no-store'
      });
      if (!response.ok) throw new Error('Availability lookup failed');
      const result = await response.json();
      if (!Array.isArray(result.listings)) throw new Error('Invalid availability response');
      /** @type {Record<string, 'available' | 'sold_out' | 'unavailable' | 'unknown'>} */
      const next = Object.fromEntries(ids.map((id) => [id, 'unavailable']));
      /** @type {Record<string, number>} */
      const nextPrices = {};
      for (const row of result.listings) {
        if (!row || typeof row.id !== 'string' || !Object.prototype.hasOwnProperty.call(next, row.id)) continue;
        if (row.availability === 'available' || row.availability === 'sold_out' || row.availability === 'unavailable') {
          next[row.id] = row.availability;
        }
       if (
  typeof row.current_price_ugx === 'number' &&
  Number.isFinite(row.current_price_ugx) &&
  row.current_price_ugx >= 0
) {
  nextPrices[row.id] = row.current_price_ugx;
}
      }
      if (version === requestVersion) {
        availability = next;
        currentPrices = nextPrices;
      }
    } catch {
      if (version === requestVersion) {
        availability = Object.fromEntries(ids.map((id) => [id, 'unknown']));
        currentPrices = {};
      }
    } finally {
      if (version === requestVersion) checking = false;
    }
  }
  onMount(() => {
    refresh();
    ready = true;
    const update = () => refresh();
    window.addEventListener('storage', update);
    return () => window.removeEventListener('storage', update);
  });

  /** @param {string} id */
  function removeItem(id) { removeRecentlyViewed(id); refresh(); }
  function clearAll() {
    if (!window.confirm('Clear your recently viewed history on this device?')) return;
    clearRecentlyViewed(); refresh();
  }
</script>

<svelte:head><title>Recently viewed | CampusMart</title><meta name="robots" content="noindex" /></svelte:head>

<div class="page wide history-page">
  <header class="history-header">
    <div><h1>Recently viewed</h1><p class="muted">Find items you've looked at before.</p></div>
    {#if items.length}<button class="btn btn2" type="button" onclick={clearAll}>Clear history</button>{/if}
  </header>
  <p class="muted history-note">Stored only in this browser (up to 24 items). Photos are from when you last viewed each item. Current prices and availability are checked when this page loads; open a listing to confirm the latest details.</p>
  {#if !ready}
    <p class="muted" role="status">Loading your recently viewed items…</p>
  {:else if items.length}
    <p class="history-count">{items.length} recently viewed {items.length === 1 ? 'item' : 'items'}{#if checking} <span class="muted checking">· Checking listing details…</span>{/if}</p>
    <div class="history-grid">
      {#each items as item (item.id)}
        <article class="card history-card">
          <a class="item-link" href="/listing/{item.id}" aria-label="View {item.title}">
            {#if item.image}
              <img src="/photos/{item.image}" alt="" loading="lazy" />
            {:else}
              <div class="no-photo">No photo</div>
            {/if}
            <div class="details">
              <h2>{item.title}</h2>
              <strong>UGX {formatNumber(Object.prototype.hasOwnProperty.call(currentPrices, item.id) ? currentPrices[item.id] : item.price_ugx)}</strong>
              {#if Object.prototype.hasOwnProperty.call(currentPrices, item.id) && currentPrices[item.id] !== item.price_ugx}
                <span class="price-change" class:price-drop={currentPrices[item.id] < item.price_ugx} class:price-rise={currentPrices[item.id] > item.price_ugx}>
                  {#if currentPrices[item.id] < item.price_ugx}
                    ↓ Price dropped by UGX {formatNumber(item.price_ugx - currentPrices[item.id])}
                  {:else}
                    ↑ Price increased by UGX {formatNumber(currentPrices[item.id] - item.price_ugx)}
                  {/if}
                </span>
                <span class="muted previous-price">Previously viewed at UGX {formatNumber(item.price_ugx)}</span>
              {/if}
              <span class="availability" class:available={availability[item.id] === 'available'} class:sold-out={availability[item.id] === 'sold_out'} role="status">
                {#if checking && !availability[item.id]}
                  Checking availability…
                {:else if availability[item.id] === 'available'}
                  Available
                {:else if availability[item.id] === 'sold_out'}
                  Sold out
                {:else if availability[item.id] === 'unavailable'}
                  Unavailable
                {:else}
                  Availability unknown
                {/if}
              </span>
              <span class="muted">Viewed {new Date(item.seenAt).toLocaleDateString('en-UG')}</span>
            </div>
          </a>
          <button class="remove" type="button" onclick={() => removeItem(item.id)} aria-label="Remove {item.title} from recently viewed">Remove</button>
        </article>
      {/each}
    </div>
  {:else}
    <section class="card empty"><h2>No recently viewed items yet</h2><p class="muted">Open an item from the marketplace and it will appear here.</p><a class="btn" href="/">Browse marketplace</a></section>
  {/if}
</div>

<style>
  .history-page { padding-top: 24px; padding-bottom: 45px; }
  .history-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; }
  h1 { margin: 0 0 6px; }
  .history-header p { margin: 0; }
  .history-note { max-width: 850px; margin: 16px 0 20px; font-size: .87rem; }
  .history-count { font-weight: 800; margin-bottom: 12px; }
  .checking { font-size: .82rem; font-weight: 500; }
  .availability { display: inline-flex; justify-self: start; border-radius: 999px; padding: 4px 9px; font-size: .76rem; font-weight: 750; background: rgba(100,116,139,.12); color: var(--ink); }
  .availability.available { background: rgba(22,163,74,.11); color: #176b3d; }
  .availability.sold-out { background: rgba(190,39,75,.1); color: #9e2344; }
  .price-change { display: inline-flex; justify-self: start; border-radius: 999px; padding: 4px 9px; font-size: .76rem; font-weight: 750; }
  .price-change.price-drop { background: rgba(22,163,74,.11); color: #176b3d; }
  .price-change.price-rise { background: rgba(190,110,25,.12); color: #885318; }
  .previous-price { font-size: .76rem; }
  .history-grid { display: grid; grid-template-columns: repeat(auto-fill,minmax(min(100%,240px),1fr)); gap: 16px; }
  .history-card { padding: 0; overflow: hidden; display: flex; flex-direction: column; }
  .item-link { color: inherit; text-decoration: none; display: block; flex: 1; }
  .item-link:hover { text-decoration: none; }
  img, .no-photo { width: 100%; aspect-ratio: 4/3; object-fit: cover; display: block; background: #f4f1ee; }
  .no-photo { display: grid; place-items: center; color: var(--mute); }
  .details { display: grid; gap: 7px; padding: 13px 14px; }
  h2 { font-size: 1rem; margin: 0; overflow-wrap: anywhere; }
  .details strong { color: var(--ink); }
  .details span { font-size: .8rem; }
  .remove { margin: 0 14px 14px; align-self: start; background: transparent; border: 0; color: var(--red); font: inherit; font-weight: 700; cursor: pointer; padding: 4px 0; }
  .remove:hover { text-decoration: underline; }
  .empty { text-align: center; max-width: 500px; padding: 28px; margin: 24px auto; }
  .empty p { margin: 12px 0 20px; }
  .empty .btn { display: inline-flex; }
</style>
