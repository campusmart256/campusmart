<script>
  import { page } from '$app/state';
  import Icon from '#lib/components/Icon.svelte';
  import ListingCard from '#lib/components/ListingCard.svelte';
  import { formatNumber, CONDITION_LABELS } from '#lib/format.js';

  /** @type {{ data: any, form: any }} */
  let { data, form } = $props();
  /**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   price: number,
 *   condition: string,
 *   negotiable: boolean,
 *   category: string,
 *   seller: string,
 *   cover: string | null,
 *   verified: boolean,
 *   saved: boolean
 * }} SavedItem
 */

const savedListings = $derived(
    /** @type {SavedItem[]} */ (data.listings)
);

  let search = $state('');
  let category = $state('all');
  let sort = $state('recent');
  /** @type {string[]} */
  let selectedIds = $state([]);
  let selectionMessage = $state('');

  const categories = $derived(
    [...new Set(savedListings.map((item) => item.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
);
  const visibleListings = $derived.by(() => {
    const query = search.trim().toLocaleLowerCase();
    const matches = savedListings.filter((item) =>
      (!query || `${item.title} ${item.seller} ${item.category}`.toLocaleLowerCase().includes(query)) &&
      (category === 'all' || item.category === category)
    );
    if (sort === 'low') return [...matches].sort((a, b) => a.price - b.price);
    if (sort === 'high') return [...matches].sort((a, b) => b.price - a.price);
    if (sort === 'title') return [...matches].sort((a, b) => a.title.localeCompare(b.title));
    return matches; // Saved most recently first, as returned by the server.
  });
  const compared = $derived(
    selectedIds
        .map((id) => savedListings.find((item) => item.id === id))
        .filter((item) => item !== undefined)
);

  /** @param {string} id */
  function toggleCompare(id) {
    selectionMessage = '';
    if (selectedIds.includes(id)) {
      selectedIds = selectedIds.filter((value) => value !== id);
    } else if (selectedIds.length < 3) {
      selectedIds = [...selectedIds, id];
    } else {
      selectionMessage = 'You can compare up to 3 items. Remove one to add another.';
    }
  }
  function resetFilters() { search = ''; category = 'all'; sort = 'recent'; }
  function clearComparison() { selectedIds = []; selectionMessage = ''; }
</script>

<svelte:head><title>Saved items | CampusMart</title></svelte:head>

<div class="page wide saved-page">
  <header class="saved-heading">
    <div>
      <h1><Icon name="heart" size={26} /> Saved items</h1>
      <p class="muted">Keep track of listings you like. Only you can see your saved items.</p>
    </div>
    <a class="browse-link" href="/">Browse items</a>
  </header>

  {#if page.url.searchParams.get('error') || data.loadError || form?.message}
    <div class="notice error" role="alert">{data.loadError || form?.message || 'Could not update saved items. Please try again.'}</div>
  {/if}

  {#if data.listings.length}
    <div class="saved-count">{data.listings.length} available saved {data.listings.length === 1 ? 'item' : 'items'}</div>
    <div class="saved-filters" role="search" aria-label="Filter saved items">
      <label class="field"><span>Search saved items</span><input type="search" bind:value={search} placeholder="Item, seller, or category" autocomplete="off" /></label>
      <label class="field"><span>Category</span><select bind:value={category}><option value="all">All categories</option>{#each categories as c (c)}<option value={c}>{c}</option>{/each}</select></label>
      <label class="field"><span>Sort by</span><select bind:value={sort}><option value="recent">Recently saved</option><option value="low">Price: low to high</option><option value="high">Price: high to low</option><option value="title">Name: A–Z</option></select></label>
      <button class="btn btn2 reset" type="button" onclick={resetFilters} disabled={!search && category === 'all' && sort === 'recent'}>Reset filters</button>
    </div>
    <p class="muted result-count" aria-live="polite">Showing {visibleListings.length} of {data.listings.length} available saved items. Select 2 or 3 items to compare.</p>

    {#if compared.length}
      <section class="comparison card" aria-labelledby="compare-heading">
        <div class="comparison-header">
          <div><h2 id="compare-heading">Compare items ({compared.length}/3)</h2><p class="muted">{compared.length < 2 ? 'Choose at least one more item to see the comparison.' : 'Compare details, then open a listing for the latest information.'}</p></div>
          <button class="btn btn2" type="button" onclick={clearComparison}>Clear selection</button>
        </div>
        {#if compared.length >= 2}
          <div class="compare-scroll" role="region" aria-label="Side-by-side saved item comparison">
            <table>
              <thead><tr><th scope="col">Details</th>{#each compared as item (item.id)}<th scope="col"><a href="/listing/{item.id}">{item.title}</a></th>{/each}</tr></thead>
              <tbody>
                <tr><th scope="row">Price</th>{#each compared as item (item.id)}<td>UGX {formatNumber(item.price)}</td>{/each}</tr>
                <tr><th scope="row">Condition</th>{#each compared as item (item.id)}<td>{CONDITION_LABELS[item.condition] ?? item.condition}</td>{/each}</tr>
                <tr><th scope="row">Category</th>{#each compared as item (item.id)}<td>{item.category || 'Not specified'}</td>{/each}</tr>
                <tr><th scope="row">Seller</th>{#each compared as item (item.id)}<td>{item.seller || 'CampusMart seller'}</td>{/each}</tr>
                <tr><th scope="row">Verified seller</th>{#each compared as item (item.id)}<td>{item.verified ? 'Yes' : 'Not verified'}</td>{/each}</tr>
                <tr><th scope="row">Negotiable</th>{#each compared as item (item.id)}<td>{item.negotiable ? 'Yes' : 'Not marked negotiable'}</td>{/each}</tr>
                <tr><th scope="row">View item</th>{#each compared as item (item.id)}<td><a href="/listing/{item.id}">Open listing →</a></td>{/each}</tr>
              </tbody>
            </table>
          </div>
          <p class="muted compare-note">Details reflect currently loaded active listings. Verify price, condition, and availability with the seller before buying.</p>
        {/if}
      </section>
    {/if}
    {#if selectionMessage}<p class="selection-message" role="status">{selectionMessage}</p>{/if}

    {#if visibleListings.length}
      <div class="grid2 saved-grid">
        {#each visibleListings as l (l.id)}
          <div class="saved-entry">
            <ListingCard l={l} signedIn={true} returnTo="/saved" />
            <button type="button" class="compare-toggle" class:chosen={selectedIds.includes(l.id)} aria-pressed={selectedIds.includes(l.id)} onclick={() => toggleCompare(l.id)}>
              {selectedIds.includes(l.id) ? '✓ Selected for comparison' : '+ Add to comparison'}
            </button>
          </div>
        {/each}
      </div>
    {:else}
      <div class="card no-matches">No saved items match these filters. <button type="button" onclick={resetFilters}>Clear filters</button></div>
    {/if}
    <p class="muted saved-tip">Tap the red heart on any item to remove it from your saved list.</p>
  {:else if !data.loadError}
    <section class="empty card">
      <div class="heart"><Icon name="heart" size={34} /></div>
      <h2>No saved items yet</h2>
      <p>When you find something you like, tap the heart to save it here for later.</p>
      <a class="btn" href="/">Explore marketplace</a>
    </section>
  {/if}

  {#if data.unavailableCount > 0}
    <p class="muted">{data.unavailableCount} saved {data.unavailableCount === 1 ? 'listing is' : 'listings are'} no longer available (sold or removed), so {data.unavailableCount === 1 ? 'it is' : 'they are'} hidden from this page.</p>
  {/if}
</div>

<style>
  .saved-page { padding-top: 22px; }
  .saved-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; margin-bottom: 20px; }
  h1 { display: flex; align-items: center; gap: 10px; }
  h1 :global(svg) { color: var(--red); }
  .saved-heading p { margin: 6px 0 0; }
  .browse-link { display: inline-flex; align-items: center; padding: 10px 14px; background: #fff; border: 1px solid var(--line); border-radius: 12px; }
  .saved-count { font-weight: 800; font-size: 14px; margin-bottom: 12px; }
  .saved-filters { display: grid; grid-template-columns: minmax(180px,2fr) repeat(2,minmax(140px,1fr)) auto; align-items: end; gap: 10px; margin-bottom: 12px; }
  .field { display: flex; flex-direction: column; gap: 5px; font-size: 13px; font-weight: 700; }
  .field input, .field select { width: 100%; min-width: 0; padding: 10px 11px; border: 1px solid var(--line); border-radius: 10px; background: white; color: inherit; font: inherit; font-weight: 400; }
  .reset { min-height: 40px; }
  .result-count { font-size: 13px; margin: 0 0 14px; }
  .saved-grid { margin-bottom: 16px; }
  .saved-entry { min-width: 0; display: flex; flex-direction: column; gap: 7px; }
  .compare-toggle { border: 1px solid var(--line); background: white; color: inherit; border-radius: 9px; padding: 9px 12px; font-weight: 700; cursor: pointer; }
  .compare-toggle.chosen { background: #e6f7ef; border-color: #8acfac; color: #146c42; }
  .compare-toggle:focus-visible, .no-matches button:focus-visible { outline: 3px solid #f2a3b0; outline-offset: 2px; }
  .comparison { margin: 12px 0 20px; padding: 16px; }
  .comparison-header { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 12px; margin-bottom: 10px; }
  .comparison h2 { font-size: 19px; margin: 0 0 4px; }
  .comparison p { margin: 0; font-size: 13px; }
  .compare-scroll { overflow-x: auto; max-width: 100%; border: 1px solid var(--line); border-radius: 10px; }
  table { border-collapse: collapse; min-width: 580px; width: 100%; font-size: 14px; }
  th, td { padding: 11px 12px; border-bottom: 1px solid var(--line); text-align: left; vertical-align: top; }
  th { font-weight: 800; }
  th:first-child { width: 130px; background: #faf9f7; }
  thead th { background: #faf9f7; }
  td a, thead a { color: var(--red); text-decoration: underline; }
  .compare-note { margin-top: 10px !important; }
  .selection-message { color: #9a5012; font-weight: 700; font-size: 13px; }
  .no-matches { padding: 20px; }
  .no-matches button { border: 0; background: transparent; text-decoration: underline; color: var(--red); cursor: pointer; font: inherit; }
  .saved-tip { margin-top: 10px; }
  .empty { text-align: center; max-width: 480px; margin: 34px auto; padding: 30px 22px; }
  .heart { display: inline-flex; padding: 16px; border-radius: 50%; background: #fdecef; color: var(--red); }
  .empty h2 { margin: 14px 0 8px; font-size: 20px; }
  .empty p { color: var(--mute); margin: 0; }
  .empty .btn { max-width: 260px; margin: 22px auto 0; }
  @media (max-width: 800px) { .saved-filters { grid-template-columns: repeat(2, minmax(0, 1fr)); } .field:first-child { grid-column: 1 / -1; } }
  @media (max-width: 520px) { .saved-filters { grid-template-columns: 1fr; } .field:first-child { grid-column: auto; } .comparison { padding: 12px; } }
</style>
