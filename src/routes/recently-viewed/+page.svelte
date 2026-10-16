<script>
  import { onMount } from 'svelte';
  import { readRecentlyViewed, removeRecentlyViewed, clearRecentlyViewed } from '#lib/recentlyViewed.js';
  import { formatNumber } from '#lib/format.js';

  /** @type {ReturnType<typeof readRecentlyViewed>} */
  let items = $state([]);
  let ready = $state(false);

  function refresh() { items = readRecentlyViewed(); }
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
  <p class="muted history-note">Stored only in this browser (up to 24 items). Prices and photos are from when you last viewed them. Open a listing to check current availability.</p>
  {#if !ready}
    <p class="muted" role="status">Loading your recently viewed items…</p>
  {:else if items.length}
    <p class="history-count">{items.length} recently viewed {items.length === 1 ? 'item' : 'items'}</p>
    <div class="history-grid">
      {#each items as item (item.id)}
        <article class="card history-card">
          <a class="item-link" href="/listing/{item.id}" aria-label="View {item.title}">
            {#if item.image}
              <img src="/photos/{item.image}" alt="" loading="lazy" />
            {:else}
              <div class="no-photo">No photo</div>
            {/if}
            <div class="details"><h2>{item.title}</h2><strong>UGX {formatNumber(item.price_ugx)}</strong><span class="muted">Viewed {new Date(item.seenAt).toLocaleDateString('en-UG')}</span></div>
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
