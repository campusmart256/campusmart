<script>
    import { page } from '$app/state';
    import Avatar from '#lib/components/Avatar.svelte';
    import ListingCard from '#lib/components/ListingCard.svelte';
    import Icon from '#lib/components/Icon.svelte';
    import ShareLinks from '#lib/components/ShareLinks.svelte';
    import { formatDate } from '#lib/format.js';
    /** @type {{data: any}} */
    let { data } = $props();
    /**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   category: string,
 *   price: number,
 *   condition: string,
 *   negotiable: boolean,
 *   seller: string,
 *   cover: string | null,
 *   verified: boolean,
 *   own: boolean,
 *   saved?: boolean
 * }} SellerListing
 */

/**
 * @typedef {{
 *   rating: number | string,
 *   reviewer_name?: string,
 *   created_at: string,
 *   item_title: string,
 *   comment?: string | null
 * }} SellerReview
 */

const sellerListings = $derived(
    /** @type {SellerListing[]} */ (data.listings)
);

const sellerReviews = $derived(
    /** @type {SellerReview[]} */ (data.reviews)
);
    const name = $derived(data.profile.display_name || 'CampusMart seller');
    let itemSearch = $state('');
    let categoryFilter = $state('all');
    let reviewRating = $state('all');
   const categories = $derived(
    [...new Set(sellerListings.map((item) => item.category).filter(Boolean))]
        .sort((a, b) => a.localeCompare(b))
);

        const visibleListings = $derived(
            sellerListings.filter((item) => {
        const matchesName = item.title.toLocaleLowerCase()
            .includes(itemSearch.trim().toLocaleLowerCase());

        const matchesCategory =
            categoryFilter === 'all' || item.category === categoryFilter;

        return matchesName && matchesCategory;
    })
);

    const visibleReviews = $derived(
    sellerReviews.filter((review) =>
        reviewRating === 'all' ||
        Number(review.rating) === Number(reviewRating)
    )
);
    const resetItemFilters = () => { itemSearch = ''; categoryFilter = 'all'; };

</script>

<svelte:head>
    <title>{name} | Seller profile | CampusMart</title>
    <meta name="description" content="Browse active listings and purchase reviews for {name} on CampusMart." />
</svelte:head>

<div class="page wide seller-page">
    <nav class="crumb" aria-label="Breadcrumb"><a href="/">Marketplace</a> <span aria-hidden="true">›</span> Seller profile</nav>
    <header class="card profile-head">
        <Avatar path={data.profile.avatar_path} name={name} size={72} />
        <div class="profile-info">
            <h1>{name}</h1>
            {#if data.profile.verification_status === 'verified'}
                <span class="verified"><Icon name="verified" size={18} /> Verified student</span>
            {/if}
            <p class="muted">Public seller profile · CampusMart</p>
        </div>
        {#if data.ownProfile}<a class="btn btn2" href="/my-listings?tab=dashboard">My seller dashboard</a>{/if}
        <ShareLinks title={`${name} — CampusMart seller`} text={`Browse ${name}'s listings and buyer reviews on CampusMart`} url={`${page.url.origin}${page.url.pathname}`} />
    </header>

    <div class="overview" aria-label="Seller summary">
        <div class="card stat"><strong>{data.listings.length}{data.listings.length === 60 ? '+' : ''}</strong><span>Active listings shown</span></div>
        <div class="card stat"><strong>{data.reviews.length}</strong><span>Buyer reviews</span></div>
        <div class="card stat"><strong>{data.average === null ? '—' : `★ ${data.average.toFixed(1)}`}</strong><span>Average rating / 5</span></div>
    </div>

    <section class="section" aria-labelledby="seller-items-heading">
        <div class="section-title">
            <h2 id="seller-items-heading">Items from {name}</h2>
            <div class="sorts" aria-label="Sort listings">
                <a class:chosen={data.sort === 'new'} href="?sort=new">Newest</a>
                <a class:chosen={data.sort === 'price_asc'} href="?sort=price_asc">Lowest price</a>
            </div>
        </div>
        {#if data.listingsUnavailable}
            <div class="card empty">Listings are temporarily unavailable. Please try again.</div>
        {:else if data.listings.length}
            <div class="seller-filters" role="search" aria-label="Search this seller's items">
                <label class="filter-field">
                    <span>Search items</span>
                    <input type="search" placeholder="Search by item name" bind:value={itemSearch} autocomplete="off" />
                </label>
                <label class="filter-field">
                    <span>Category</span>
                    <select bind:value={categoryFilter}>
                        <option value="all">All categories</option>
                        {#each categories as category (category)}
                            <option value={category}>{category}</option>
                        {/each}
                    </select>
                </label>
                <button class="btn btn2 clear-filters" type="button" onclick={resetItemFilters} disabled={!itemSearch && categoryFilter === 'all'}>Clear filters</button>
            </div>
            <p class="muted filter-count" aria-live="polite">Showing {visibleListings.length} of {data.listings.length} items loaded</p>
            {#if visibleListings.length}
            <div class="grid2 seller-listing-grid">
                {#each visibleListings as l (l.id)}
                    <ListingCard {l} signedIn={data.signedIn} returnTo={page.url.pathname + page.url.search} />
                {/each}
            </div>
            {:else}
                <div class="card empty">No items match your search. <button class="reset-link" type="button" onclick={resetItemFilters}>Clear filters</button></div>
            {/if}
        {:else}
            <div class="card empty">This seller has no active listings right now.</div>
        {/if}
    </section>

    <section class="section" aria-labelledby="seller-reviews-heading">
        <div class="section-title"><h2 id="seller-reviews-heading">Buyer reviews</h2></div>
        <p class="muted reviews-intro">Reviews are tied to purchases recorded on CampusMart. They are not a guarantee of a safe transaction.</p>
        {#if data.reviewsUnavailable}
            <div class="card empty">Reviews are temporarily unavailable. Please try again.</div>
        {:else if !data.reviews.length}
            <div class="card empty">No buyer reviews yet.</div>
        {:else}
            <div class="review-filters">
                <label class="filter-field">
                    <span>Filter reviews by rating</span>
                    <select bind:value={reviewRating}>
                        <option value="all">All ratings</option>
                        {#each [5, 4, 3, 2, 1] as rating}
                            <option value={String(rating)}>{rating} star{rating === 1 ? '' : 's'}</option>
                        {/each}
                    </select>
                </label>
                <span class="muted" aria-live="polite">{visibleReviews.length} of {data.reviews.length} reviews</span>
            </div>
            {#if visibleReviews.length}
            <div class="review-grid">
                {#each visibleReviews as review, index (index)}
                    <article class="card review">
                        <div class="review-top"><strong>{review.reviewer_name || 'CampusMart buyer'}</strong><time datetime={review.created_at}>{formatDate(review.created_at)}</time></div>
                        <p class="item">Purchased: {review.item_title}</p>
                        <p class="stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(Math.max(0, Math.min(5, Number(review.rating))))}{'☆'.repeat(5 - Math.max(0, Math.min(5, Number(review.rating))))}</p>
                        {#if review.comment}<p class="comment">{review.comment}</p>{:else}<p class="muted">Rating only — no written feedback.</p>{/if}
                    </article>
                {/each}
            </div>
            {:else}
                <div class="card empty">No reviews match that rating. <button class="reset-link" type="button" onclick={() => reviewRating = 'all'}>Show all reviews</button></div>
            {/if}
        {/if}
    </section>
    <div class="notice warn">For safer exchanges, meet in a public campus location, inspect items before paying, and keep conversations in CampusMart.</div>
</div>

<style>
    .seller-page { padding-top: 24px; padding-bottom: 48px; }
    .crumb { display: flex; gap: 9px; color: var(--mute); font-size: .85rem; margin-bottom: 16px; }
    .profile-head { display: flex; align-items: center; gap: 18px; flex-wrap: wrap; padding: 22px; }
    .profile-info { flex: 1; min-width: 180px; }
    h1 { font-size: clamp(1.45rem, 3vw, 2rem); margin: 0 0 8px; overflow-wrap: anywhere; }
    .profile-info p { margin: 8px 0 0; }
    .verified { display: inline-flex; gap: 5px; align-items: center; color: #098747; font-weight: 700; font-size: .86rem; }
    .overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin: 16px 0 28px; }
    .stat { padding: 16px; display: grid; gap: 4px; min-width: 0; }
    .stat strong { font-size: clamp(1.3rem, 3vw, 1.8rem); }
    .stat span { color: var(--mute); font-size: .85rem; }
    .section { margin-top: 26px; }
    .section-title { display: flex; align-items: baseline; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 14px; }
    h2 { font-size: 1.25rem; margin: 0; }
    .sorts { display: flex; flex-wrap: wrap; gap: 8px; font-size: .87rem; }
    .sorts a { padding: 7px 11px; border: 1px solid var(--line); border-radius: 9px; color: var(--body); }
    .sorts a.chosen { color: var(--red); border-color: var(--red); font-weight: 700; }
    .seller-listing-grid { margin-top: 10px; }
    .seller-filters { display: flex; flex-wrap: wrap; align-items: end; gap: 12px; margin: 10px 0 12px; }
    .filter-field { display: grid; gap: 6px; flex: 1 1 190px; min-width: 0; font-size: .84rem; font-weight: 600; }
    .filter-field input, .filter-field select { width: 100%; min-width: 0; border: 1px solid var(--line); border-radius: 9px; padding: 10px 11px; background: var(--surface, #fff); color: var(--body); font: inherit; }
    .filter-field input:focus-visible, .filter-field select:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }
    .clear-filters { min-height: 41px; }
    .filter-count { margin: 0 0 8px; font-size: .84rem; }
    .review-filters { display: flex; align-items: end; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin: 12px 0; }
    .review-filters .filter-field { flex: 0 1 260px; }
    .reset-link { border: 0; background: none; color: var(--red); font: inherit; text-decoration: underline; cursor: pointer; }
    .reset-link:focus-visible { outline: 2px solid var(--red); outline-offset: 3px; }
    .empty { padding: 22px; color: var(--mute); }
    .reviews-intro { margin: 0 0 12px; }
    .review-grid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .review { padding: 17px; min-width: 0; }
    .review-top { display: flex; align-items: baseline; justify-content: space-between; gap: 8px; flex-wrap: wrap; }
    .review-top time { color: var(--mute); font-size: .8rem; }
    .item { font-size: .85rem; color: var(--mute); margin: 10px 0 4px; }
    .stars { color: #a26d00; letter-spacing: 1px; margin: 8px 0; }
    .comment { margin: 0; overflow-wrap: anywhere; }
    @media(max-width: 640px) { .profile-head { padding: 16px; gap: 12px; } .overview { gap: 7px; } .stat { padding: 12px 8px; } .stat span { font-size: .75rem; } .review-grid { grid-template-columns: 1fr; } }
</style>
