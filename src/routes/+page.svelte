<script>
	import { goto } from '$app/navigation';
	import { onMount } from 'svelte';
	import { readRecentlyViewed } from '#lib/recentlyViewed.js';
	import { formatNumber } from '#lib/format.js';
	import { page } from '$app/state';
	import Icon from '#lib/components/Icon.svelte';
	import ListingCard from '#lib/components/ListingCard.svelte';

	/** @type {{ data: any }} */
	let { data } = $props();

	/** @type {Record<string, string>} */
	const ICONS = { electronics: 'plug', phones: 'phone', computers: 'laptop', books: 'cap', furniture: 'home', clothing: 'shirt', appliances: 'plug', gaming: 'game', sports: 'ball', other: 'sliders' };

	/** Preserve all filters except those explicitly changed. @param {Record<string, string>} change */
	function href(change) {
		const next = { q: data.filters.q, category: data.filters.category, sort: data.filters.sort, verified: data.filters.verifiedOnly ? '1' : '', ...change };
		const params = new URLSearchParams();
		if (next.q) params.set('q', next.q);
		if (next.category) params.set('category', next.category);
		if (next.sort && next.sort !== 'new') params.set('sort', next.sort);
		if (next.verified) params.set('verified', '1');
		return params.toString() ? `/?${params.toString()}` : '/';
	}

	/** @param {string} url */
	function navigate(url) { goto(url, { reset: false }); }

	/** @type {ReturnType<typeof readRecentlyViewed>} */
	let recentItems = $state([]);

	onMount(() => {
		const refreshHistory = () => { recentItems = readRecentlyViewed().slice(0, 12); };
		refreshHistory();
		window.addEventListener('storage', refreshHistory);
		return () => window.removeEventListener('storage', refreshHistory);
	});

	const hasFilters = $derived(Boolean(data.filters.category || data.filters.verifiedOnly || data.filters.q));
const activeCategory = $derived(
    data.categories.find(
        /** @param {{ id: string, slug: string, name: string }} c */
        (c) => c.slug === data.filters.category
    )?.name ?? ''
);
</script>

<svelte:head>
	<title>CampusMart — Discover items from students on campus</title>
	<meta name="description" content="Explore pre-loved electronics, books, furniture and more listed by university students on CampusMart." />
</svelte:head>

<div class="page wide home-page">
	{#if !hasFilters}
		<section class="hero" aria-labelledby="hero-title">
			<div class="hero-copy">
				<div class="hero-topline"><span class="hero-live"></span> THE STUDENT MARKETPLACE <span class="hero-topline-divider"></span> CAMPUSMART</div>
				<h1 id="hero-title">Your campus.<br /><span>Your next find.</span></h1>
				<p class="hero-desc">Great things don't have to leave campus. Buy, sell and discover useful items from fellow students.</p>
				<div class="hero-links">
					<a class="hero-cta" href="#discover">Explore the marketplace <span aria-hidden="true">↗</span></a>
					<a class="hero-secondary" href="/sell">Sell something <span aria-hidden="true">→</span></a>
				</div>
				<div class="hero-footnote"><span class="hero-footnote-icon"><Icon name="shield" size={16}/></span> Meet safely. Check items before paying.</div>
			</div>
			<div class="hero-art" aria-hidden="true">
				<div class="art-orbit orbit-one"></div><div class="art-orbit orbit-two"></div>
				<div class="art-label art-label-top">CAMPUS FINDS <span>↗</span></div>
				<div class="art-tile art-tile-back"><span class="tile-star">✳</span><span>NEW FINDS<br />EVERY DAY</span></div>
				<div class="art-tile art-tile-front"><span class="tile-mini">STUDENT TO STUDENT</span><span class="tile-big">GOOD<br />FINDS<span class="tile-dot">.</span></span><span class="tile-bottom">RIGHT AROUND CAMPUS <span>↗</span></span></div>
				<div class="art-label art-label-bottom">BUY · SELL · CONNECT</div>
			</div>
		</section>
		<div class="benefits" aria-label="Why use CampusMart">
			<div class="benefit"><span class="benefit-icon"><Icon name="cap" size={20}/></span><div><strong>Built for campus</strong><span>Discover items from students</span></div></div>
			<div class="benefit"><span class="benefit-icon"><Icon name="chat" size={20}/></span><div><strong>Talk before you buy</strong><span>Message sellers directly</span></div></div>
			<div class="benefit"><span class="benefit-icon"><Icon name="shield" size={20}/></span><div><strong>Shop thoughtfully</strong><span>Check listings and seller details</span></div></div>
		</div>
	{:else}
		<header class="results-intro">
			<a href="/" class="back-home"><span aria-hidden="true">←</span> Back to marketplace</a>
			<p class="eyebrow">CAMPUSMART / DISCOVER</p>
			<h1>{#if data.filters.q}Search results{:else if activeCategory}{activeCategory}{:else}Browse listings{/if}</h1>
			{#if data.filters.q}<p class="results-subtitle">Showing matches for <strong>“{data.filters.q}”</strong></p>{/if}
		</header>
	{/if}

	{#if !hasFilters && recentItems.length > 0}
		<section class="continue-section" aria-labelledby="continue-heading">
			<div class="continue-heading">
				<div><p class="eyebrow">PICK UP WHERE YOU LEFT OFF</p><h2 id="continue-heading">Continue browsing</h2></div>
				<a href="/recently-viewed">View history <span aria-hidden="true">↗</span></a>
			</div>
			<div class="continue-track" aria-label="Recently viewed listings">
				{#each recentItems as item (item.id)}
					<a class="continue-card" href="/listing/{item.id}" aria-label="View {item.title}">
						{#if item.image}
							<img src="/photos/{item.image}" alt="" loading="lazy" />
						{:else}
							<div class="continue-no-photo"><Icon name="box" size={28} /><span>No photo</span></div>
						{/if}
						<div class="continue-info"><strong>{item.title}</strong><span>UGX {formatNumber(item.price_ugx)}</span></div>
					</a>
				{/each}
			</div>
			<p class="continue-note">Prices and photos are from your last visit. Open a listing to confirm its current availability.</p>
		</section>
	{/if}

	<section class="discovery" aria-label="Find items">
		<div class="discovery-heading"><div><p class="eyebrow">FIND SOMETHING GREAT</p><h2>What are you looking for?</h2></div><span class="discovery-mark" aria-hidden="true">01 / DISCOVER</span></div>
		<form class="search" method="GET" action="/" role="search">
			<label class="sr-only" for="q">Search listings or sellers</label>
			<Icon name="search" size={22} />
			<input id="q" type="search" name="q" value={data.filters.q} placeholder="Search textbooks, laptops, furniture…" maxlength="60" autocomplete="off" enterkeyhint="search" />
			{#if data.filters.category}<input type="hidden" name="category" value={data.filters.category} />{/if}
			{#if data.filters.sort !== 'new'}<input type="hidden" name="sort" value={data.filters.sort} />{/if}
			{#if data.filters.verifiedOnly}<input type="hidden" name="verified" value="1" />{/if}
			<button type="submit">Search <span aria-hidden="true">↗</span></button>
		</form>
		<div class="browse-heading"><div><p class="eyebrow">BROWSE BY INTEREST</p><h2>Popular categories</h2></div>{#if data.filters.category}<a class="reset-link" href={href({ category: '' })} data-sveltekit-reset="false">Clear category <span aria-hidden="true">×</span></a>{/if}</div>
		<nav class="chips-row" aria-label="Browse categories">
			<a class="cat" class:on={!data.filters.category} href={href({ category: '' })} data-sveltekit-reset="false" aria-current={!data.filters.category ? 'page' : undefined}><span class="cat-icon"><Icon name="box" size={21}/></span><span>All items</span><span class="cat-arrow" aria-hidden="true">↗</span></a>
			{#each data.categories as c (c.id)}
				<a class="cat" class:on={data.filters.category === c.slug} href={href({ category: c.slug })} data-sveltekit-reset="false" aria-current={data.filters.category === c.slug ? 'page' : undefined}><span class="cat-icon"><Icon name={ICONS[c.slug] ?? 'box'} size={21}/></span><span>{c.name}</span><span class="cat-arrow" aria-hidden="true">↗</span></a>
			{/each}
		</nav>
	</section>

	<section id="discover" class="listings-section" aria-labelledby="listings-title">
		<div class="listings-toolbar">
			<div class="listings-heading"><p class="eyebrow">02 / THE MARKETPLACE</p><h2 id="listings-title">{#if data.filters.q}Matching listings{:else if activeCategory}{activeCategory} finds{:else}Fresh finds on campus{/if}<span class="heading-period">.</span></h2><p class="listing-count">{data.listings.length} {data.listings.length === 1 ? 'item' : 'items'} shown · Explore what's available</p></div>
			<div class="controls">
				<label class="verified-filter"><span class="verified-icon"><Icon name="verified" size={17}/></span><span>Verified sellers</span><input class="switch" type="checkbox" role="switch" checked={data.filters.verifiedOnly} onchange={(e) => navigate(href({ verified: e.currentTarget.checked ? '1' : '' }))} /></label>
				<label class="sort"><span class="sr-only">Sort listings by</span><select value={data.filters.sort} onchange={(e) => navigate(href({ sort: e.currentTarget.value }))}><option value="new">Newest first</option><option value="price_asc">Price: low to high</option><option value="price_desc">Price: high to low</option></select></label>
			</div>
		</div>
		{#if hasFilters}<div class="active-filters" aria-label="Active filters">{#if data.filters.q}<a href={href({ q: '' })} data-sveltekit-reset="false">Search: {data.filters.q} <span aria-hidden="true">×</span></a>{/if}{#if activeCategory}<a href={href({ category: '' })} data-sveltekit-reset="false">{activeCategory} <span aria-hidden="true">×</span></a>{/if}{#if data.filters.verifiedOnly}<a href={href({ verified: '' })} data-sveltekit-reset="false">Verified only <span aria-hidden="true">×</span></a>{/if}<a class="clear-all" href="/" data-sveltekit-reset="false">Clear all</a></div>{/if}
		{#if data.listings.length}
			<div class="grid2 listing-grid">{#each data.listings as l (l.id)}<ListingCard {l} signedIn={data.signedIn} returnTo={page.url.pathname + page.url.search} />{/each}</div>
		{:else}
			<div class="empty-state"><div class="empty-symbol"><Icon name="search" size={32}/></div><h3>{#if hasFilters}No listings match just yet{:else}The marketplace is waiting for its first listing{/if}</h3><p>{#if hasFilters}Try another search, choose a different category, or remove a filter.{:else}Have something another student might need? Be the first to list it.{/if}</p><a class="empty-link" href={hasFilters ? '/' : '/sell'}>{hasFilters ? 'Browse all items' : 'List an item'} <span aria-hidden="true">↗</span></a></div>
		{/if}
	</section>

	<section class="home-footer" aria-label="Helpful safety information">
		<div class="footer-icon"><Icon name="shield" size={26}/></div>
		<div class="footer-copy"><p class="footer-eyebrow">A QUICK REMINDER</p><h2>Good deals. Safer meetups.</h2><p>Meet in a public place, inspect items before paying, and keep conversations in CampusMart messages.</p></div>
		<a class="footer-safety-link" href="/safety">Safety tips <span aria-hidden="true">↗</span></a>
	</section>
	<footer class="legal-footer" aria-label="CampusMart information and support">
		<div class="legal-footer-top">
			<div class="legal-brand">
				<span class="legal-brand-mark" aria-hidden="true"><Icon name="cap" size={23}/></span>
				<div><strong>campusmart</strong><p>Made for student-to-student discovery.</p></div>
			</div>
			<div class="legal-links">
				<div class="legal-group"><h2>CampusMart</h2><a href="/about">About CampusMart</a><a href="/terms">Terms &amp; Conditions</a><a href="/privacy">Privacy Policy</a><a href="/copyright-policy">Copyright Infringement Policy</a></div>
				<div class="legal-group"><h2>Contact &amp; support</h2><a href="mailto:campusmart256@gmail.com">campusmart256@gmail.com</a><a href="https://wa.me/256741448912" target="_blank" rel="noopener noreferrer">WhatsApp: +256 741 448 912 <span aria-hidden="true">↗</span></a></div>
			</div>
		</div>
		<div class="legal-footer-bottom"><span>© {new Date().getFullYear()} CampusMart. All rights reserved.</span><span>Buy, sell &amp; connect on campus.</span></div>
	</footer>

</div>

<style>
  .home-page { padding-top: 20px; padding-bottom: 58px; --home-navy: #111c30; --home-red: #cc0e35; --home-line: #e8e8eb; }
  .eyebrow { margin: 0 0 8px; color: #be1638; font-size: 10px; font-weight: 850; letter-spacing: .14em; }
  .hero { display: grid; grid-template-columns: minmax(0,1fr); position: relative; isolation: isolate; overflow: hidden; border-radius: 23px; color: white; background: var(--home-navy); box-shadow: 0 20px 55px #17263e1c; }
  .hero::before { content: ''; position: absolute; inset: 0; z-index: -1; background: radial-gradient(circle at 92% 6%,#263b5e 0%,transparent 48%),linear-gradient(128deg,#101b2e 10%,#1c2a43 100%); }
  .hero-copy { padding: 34px 24px 30px; position: relative; z-index: 1; }
  .hero-topline { display: flex; align-items: center; gap: 9px; font-size: 9px; letter-spacing: .13em; font-weight: 850; color: #cbd6e9; }
  .hero-live { width: 8px; height: 8px; border-radius: 50%; background: #ff4065; box-shadow: 0 0 0 4px #ff406526; flex: none; }
  .hero-topline-divider { width: 18px; height: 1px; background: #6b7992; }
  .hero h1 { margin: 22px 0 14px; max-width: 630px; font-size: clamp(36px, 7.5vw, 68px); font-weight: 900; letter-spacing: -.055em; line-height: 1.05; }
  .hero h1 span { color: #ff5675; }
  .hero-desc { max-width: 450px; margin: 0; color: #d0d9e8; font-size: 14px; line-height: 1.75; }
  .hero-links { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 24px; }
  .hero-cta,.hero-secondary { display: inline-flex; align-items: center; justify-content: center; gap: 13px; min-height: 47px; border-radius: 10px; padding: 0 16px; font-weight: 850; font-size: 12px; text-decoration: none; }
  .hero-cta { background: var(--home-red); color: white; box-shadow: 0 8px 18px #a20a3050; }
  .hero-cta:hover { color: white; background: #e01945; text-decoration: none; }
  .hero-secondary { color: white; border: 1px solid #6a7992; }
  .hero-secondary:hover { color: white; background: #ffffff18; text-decoration: none; }
  .hero-footnote { display: flex; align-items: center; gap: 9px; margin-top: 27px; color: #aebdd1; font-size: 11px; }
  .hero-footnote-icon { color: #a6f0d5; display: flex; }
  .hero-art { display: none; min-height: 380px; position: relative; }
  .art-orbit { position: absolute; border: 1px solid #ffffff16; border-radius: 50%; }
  .orbit-one { width: 420px; height: 420px; top: -30px; right: -70px; }
  .orbit-two { width: 310px; height: 310px; top: 25px; right: -15px; }
  .art-tile { position: absolute; border-radius: 18px; display: flex; flex-direction: column; justify-content: space-between; }
  .art-tile-back { top: 64px; right: 38px; width: 206px; height: 244px; background: #eeb9a6; color: #552b2c; padding: 20px; transform: rotate(12deg); font-size: 13px; font-weight: 900; letter-spacing: .08em; }
  .tile-star { font-size: 62px; line-height: 1; }
  .art-tile-front { top: 80px; right: 130px; width: 223px; height: 250px; padding: 23px; background: #f6f3ed; color: #172139; transform: rotate(-10deg); box-shadow: 0 22px 50px #060d1e55; }
  .tile-mini { font-size: 9px; font-weight: 850; letter-spacing: .12em; }
  .tile-big { font-size: 43px; font-weight: 950; letter-spacing: -.075em; line-height: .95; }
  .tile-dot { color: var(--home-red); }
  .tile-bottom { display: flex; justify-content: space-between; font-size: 9px; font-weight: 900; letter-spacing: .07em; }
  .art-label { position: absolute; z-index: 1; border-radius: 999px; font-size: 9px; font-weight: 900; letter-spacing: .1em; }
  .art-label-top { top: 44px; right: 155px; padding: 11px 16px; background: var(--home-red); color: white; transform: rotate(-8deg); }
  .art-label-top span { margin-left: 7px; }
  .art-label-bottom { right: 23px; bottom: 40px; background: white; color: #19243b; padding: 12px 17px; transform: rotate(7deg); }
  .benefits { display: grid; grid-template-columns: 1fr; gap: 0; margin-top: 14px; background: white; border: 1px solid #e9e8eb; border-radius: 17px; padding: 5px 16px; }
  .benefit { display: flex; align-items: center; gap: 12px; padding: 13px 2px; min-width: 0; }
  .benefit + .benefit { border-top: 1px solid #f0eff1; }
  .benefit-icon { width: 38px; height: 38px; border-radius: 12px; flex: none; display: flex; align-items: center; justify-content: center; color: #c90e36; background: #fff0f3; }
  .benefit div { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
  .benefit strong { color: #202b3d; font-size: 12px; }
  .benefit div span { color: #777f8c; font-size: 11px; }
  .results-intro { padding: 18px 2px 12px; }
  .back-home { display: inline-block; margin-bottom: 23px; font-size: 12px; color: #657085; }
  .results-intro h1 { font-size: clamp(29px,5vw,42px); letter-spacing: -.05em; color: #172238; }
  .results-subtitle { color: #657085; font-size: 13px; }
  .discovery { margin-top: 35px; }
  .discovery-heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 16px; }
  .discovery-heading h2 { font-size: clamp(20px,3vw,26px); letter-spacing: -.045em; margin: 0; color: #19243a; }
  .discovery-mark { display: none; font-size: 10px; font-weight: 850; color: #8c92a0; letter-spacing: .12em; }
  .search { display: flex; align-items: center; gap: 11px; padding: 7px 7px 7px 16px; background: #fff; color: #7e8797; border: 1.5px solid #dfe2e8; border-radius: 14px; box-shadow: 0 8px 25px #16233c0b; }
  .search:focus-within { border-color: #d50f3b; box-shadow: 0 0 0 3px #f7d5dd; }
  .search input[type='search'] { flex: 1; min-width: 0; min-height: 41px; scroll-margin-top: 85px; border: 0; outline: none; background: transparent; font: inherit; font-size: 14px; color: #19243a; }
  .search button { min-height: 43px; border: 0; border-radius: 9px; background: var(--home-red); color: white; padding: 0 16px; font: inherit; font-size: 12px; font-weight: 850; cursor: pointer; white-space: nowrap; }
  .search button:hover { background: #a50a2a; }
  .search button span { margin-left: 6px; }
  .browse-heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin: 32px 0 13px; }
  .browse-heading h2 { margin: 0; font-size: 20px; letter-spacing: -.04em; color: #19243a; }
  .reset-link { font-size: 12px; white-space: nowrap; }
  .chips-row { display: flex; overflow-x: auto; gap: 10px; padding: 2px 2px 12px; scroll-padding-inline: 12px; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
  .cat { flex: 0 0 auto; display: flex; align-items: center; gap: 10px; min-height: 68px; min-width: 148px; padding: 10px 12px; background: white; border: 1px solid #e5e6eb; border-radius: 14px; color: #243047; font-size: 12px; font-weight: 850; text-decoration: none; box-shadow: 0 3px 9px #15223b05; }
  .cat:hover { border-color: #c60e35; color: #a40c2e; text-decoration: none; }
  .cat.on { background: #fff1f4; border-color: #d74562; color: #a20d2c; }
  .cat-icon { flex: none; width: 39px; height: 39px; display: flex; align-items: center; justify-content: center; background: #f2f4f7; color: #45556f; border-radius: 11px; }
  .cat.on .cat-icon { background: #ffdce4; color: #b60e33; }
  .cat-arrow { margin-left: auto; color: #aab0ba; font-size: 13px; }
  .listings-section { scroll-margin-top: 90px; margin-top: 42px; }
  .listings-toolbar { display: flex; flex-direction: column; gap: 17px; border-bottom: 1px solid #e2e4e9; padding-bottom: 18px; }
  .listings-heading h2 { font-size: clamp(23px,3vw,32px); letter-spacing: -.045em; margin: 0; line-height: 1.15; color: #182339; }
  .heading-period { color: #cc0e35; }
  .listing-count { margin: 8px 0 0; font-size: 12px; color: #7b8290; }
  .controls { display: flex; align-items: center; flex-wrap: wrap; gap: 9px; }
  .verified-filter { display: inline-flex; align-items: center; gap: 7px; min-height: 43px; padding: 6px 10px; border: 1px solid #e1e4e9; border-radius: 11px; background: white; font-size: 12px; font-weight: 800; color: #27354c; cursor: pointer; }
  .verified-icon { display: flex; color: #167e69; }
  .verified-filter :global(input.switch) { transform: scale(.78); transform-origin: right center; margin-left: auto; }
  .sort { flex: 1; min-width: 142px; }
  .sort select { width: 100%; min-height: 43px; border: 1px solid #e1e4e9; border-radius: 11px; background: white; padding: 0 11px; font: inherit; font-size: 12px; font-weight: 750; color: #27354c; cursor: pointer; }
  .active-filters { display: flex; gap: 8px; align-items: center; flex-wrap: wrap; padding-top: 14px; }
  .active-filters a { display: inline-flex; gap: 10px; align-items: center; padding: 8px 12px; border-radius: 999px; background: #ffedf1; color: #a50e30; font-size: 12px; font-weight: 750; max-width: 100%; overflow-wrap: anywhere; }
  .active-filters .clear-all { background: transparent; color: #777f8c; text-decoration: underline; }
  .listing-grid { margin-top: 20px; }
  .home-page :global(.saved-card-wrap) { height: 100%; }
  .home-page :global(.lcard) { overflow: hidden; border: 1px solid #e6e8ec; border-radius: 17px; box-shadow: 0 6px 18px #1b2a420a; transition: box-shadow .2s, transform .2s; }
  .home-page :global(.lcard:hover) { box-shadow: 0 15px 32px #1b2a4218; transform: translateY(-2px); }
  .home-page :global(.lcard .pic) { aspect-ratio: 1 / .86; background: #f2f3f5; }
  .home-page :global(.lcard .meta) { padding: 13px; }
  .home-page :global(.lcard .ttl) { font-weight: 850; color: #1d2b40; }
  .empty-state { margin-top: 19px; padding: 38px 23px; text-align: center; background: white; border: 1px dashed #d6dce4; border-radius: 18px; }
  .empty-symbol { display: flex; align-items: center; justify-content: center; width: 62px; height: 62px; margin: 0 auto 16px; border-radius: 17px; background: #fff0f3; color: #c60e35; }
  .empty-state h3 { font-size: 20px; margin: 0 0 8px; color: #1b283e; }
  .empty-state p { max-width: 370px; margin: 0 auto 18px; color: #697588; font-size: 13px; line-height: 1.6; }
  .empty-link { display: inline-flex; align-items: center; gap: 12px; padding: 12px 17px; background: var(--home-red); border-radius: 10px; color: white; font-weight: 800; font-size: 12px; }
  .empty-link:hover { background: #ad0b2e; color: white; text-decoration: none; }
  .home-footer { display: grid; grid-template-columns: 42px minmax(0,1fr); gap: 14px; align-items: start; margin-top: 44px; padding: 23px; border-radius: 18px; background: #eaf3f0; border: 1px solid #d5e6df; }
  .footer-icon { display: flex; align-items: center; justify-content: center; width: 42px; height: 42px; flex: none; background: #d2e8df; border-radius: 12px; color: #14745e; }
  .footer-copy { min-width: 0; width: 100%; }
  .footer-eyebrow { margin: 0 0 6px !important; font-size: 10px !important; font-weight: 850; color: #19745d !important; letter-spacing: .12em; }
  .footer-copy h2 { margin: 0 0 7px; color: #183b35; font-size: 19px; line-height: 1.3; letter-spacing: -.03em; overflow-wrap: normal; word-break: normal; }
  .footer-copy p { margin: 0; font-size: 13px; line-height: 1.65; color: #3c655a; overflow-wrap: normal; word-break: normal; }
  .footer-safety-link { grid-column: 2; justify-self: start; display: inline-flex; align-items: center; gap: 10px; font-size: 12px; font-weight: 850; color: #146b56; }
  .footer-safety-link:hover { color: #0a4e3e; }
  @media (min-width: 680px) {
    .home-page { padding-top: 26px; }
    .hero { grid-template-columns: minmax(0,1.15fr) minmax(280px,.85fr); min-height: 390px; }
    .hero-copy { padding: 48px 32px; }
    .hero-art { display: block; }
    .benefits { grid-template-columns: repeat(3,minmax(0,1fr)); padding: 13px 12px; }
    .benefit { padding: 8px 12px; }
    .benefit + .benefit { border-top: 0; border-left: 1px solid #eeedf0; }
    .discovery-mark { display: block; }
    .listings-toolbar { flex-direction: row; align-items: end; justify-content: space-between; }
    .sort { flex: none; min-width: 176px; }
    .home-footer { grid-template-columns: 48px minmax(0,1fr) auto; align-items: center; padding: 26px; }
    .footer-safety-link { grid-column: 3; justify-self: end; }
  }
  @media (min-width: 1050px) {
    .hero { min-height: 420px; }
    .hero-copy { padding: 57px 49px; }
    .hero-art { transform: scale(1.08); transform-origin: center; }
    .chips-row { flex-wrap: wrap; overflow: visible; }
    .cat { min-width: 155px; }
    .listings-section { margin-top: 51px; }
  }
  @media (max-width: 767px) { .search input[type='search'],.sort select { font-size: 16px; } }
  @media (max-width: 430px) {
    .hero-copy { padding: 31px 21px; }
    .hero-topline { font-size: 8px; gap: 7px; }
    .hero-topline-divider { width: 10px; }
    .hero h1 { font-size: clamp(34px,10vw,45px); }
    .hero-links { flex-direction: column; align-items: stretch; }
    .hero-cta,.hero-secondary { width: 100%; }
    .search { gap: 8px; padding-left: 11px; }
    .search button { padding: 0 11px; }
    .search button span { display: none; }
    .benefits { padding: 3px 14px; }
    .home-footer { grid-template-columns: 36px minmax(0,1fr); padding: 18px; gap: 12px; }
    .footer-icon { width: 36px; height: 36px; }
    .footer-copy h2 { font-size: 17px; }
  }
  @media (prefers-reduced-motion: reduce) { .home-page :global(.lcard) { transition: none; } }
  /* Legal and support footer: final element on the homepage */
  .legal-footer { margin-top: 26px; padding: 29px 30px 17px; border-radius: 23px; color: #17243b; border: 1px solid rgba(255,255,255,.8); background: linear-gradient(128deg,rgba(255,255,255,.86),rgba(246,249,255,.72)); box-shadow: 0 14px 42px rgba(21,35,65,.07), inset 0 1px 0 rgba(255,255,255,.92); backdrop-filter: blur(15px); -webkit-backdrop-filter: blur(15px); }
  .legal-footer-top { display: grid; grid-template-columns: minmax(0,.85fr) minmax(0,1.15fr); gap: 28px; padding-bottom: 26px; }
  .legal-brand { display: flex; align-items: flex-start; gap: 12px; min-width: 0; }
  .legal-brand-mark { width: 44px; height: 44px; display: grid; place-items: center; flex: none; color: #fff; background: #cb0d35; border-radius: 13px; box-shadow: 0 7px 20px #cb0d3528; }
  .legal-brand strong { display: block; padding-top: 3px; font-size: 20px; letter-spacing: -.055em; color: #ca0e35; }
  .legal-brand p { margin: 6px 0 0; max-width: 250px; font-size: 13px; line-height: 1.55; color: #637085; }
  .legal-links { display: grid; grid-template-columns: repeat(2,minmax(0,1fr)); gap: 22px; }
  .legal-group { display: flex; flex-direction: column; align-items: flex-start; min-width: 0; gap: 12px; }
  .legal-group h2 { margin: 0 0 4px; font-size: 12px; font-weight: 850; color: #17243b; }
  .legal-group a { color: #506078; font-size: 13px; font-weight: 600; line-height: 1.5; overflow-wrap: anywhere; text-decoration: none; transition: color .18s ease, transform .18s ease; }
  .legal-group a:hover { color: #cb0d35; transform: translateX(2px); }
  .legal-group a:focus-visible { outline: 3px solid #cb0d35; outline-offset: 4px; border-radius: 3px; }
  .legal-footer-bottom { display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px 18px; padding-top: 17px; border-top: 1px solid rgba(88,106,139,.15); color: #7a8698; font-size: 11px; line-height: 1.5; }
  @media (max-width: 780px) { .legal-footer { padding: 23px 20px 17px; } .legal-footer-top { grid-template-columns: 1fr; gap: 25px; } }
  @media (max-width: 420px) { .legal-links { grid-template-columns: 1fr; gap: 25px; } .legal-footer { border-radius: 18px; padding: 22px 17px 17px; } }
  @media (prefers-reduced-transparency: reduce) { .legal-footer { background: #fff; backdrop-filter: none; -webkit-backdrop-filter: none; } }
  @media (prefers-reduced-motion: reduce) { .legal-group a { transition: none; } }

  /* Phase 62 · Existing local browsing history, presented without account tracking. */
  .continue-section { margin-top: clamp(30px,4vw,54px); min-width: 0; }
  .continue-heading { display: flex; align-items: end; justify-content: space-between; gap: 12px; margin-bottom: 17px; }
  .continue-heading h2 { margin: 3px 0 0; font-size: clamp(21px,2.4vw,30px); line-height: 1.2; letter-spacing: -.04em; color: #19263b; }
  .continue-heading > a { flex: none; color: #be1745; font-size: 12px; font-weight: 800; text-decoration: none; }
  .continue-heading > a:hover { text-decoration: underline; }
  .continue-track { display: flex; overflow-x: auto; gap: 13px; padding: 4px 2px 16px; scroll-snap-type: x proximity; overscroll-behavior-inline: contain; -webkit-overflow-scrolling: touch; scrollbar-width: thin; }
  .continue-card { flex: 0 0 clamp(166px,22vw,215px); min-width: 0; display: block; overflow: hidden; color: #19263b; text-decoration: none; border: 1px solid rgba(255,255,255,.92); border-radius: 19px; background: rgba(255,255,255,.73); box-shadow: 0 8px 24px rgba(28,44,75,.07); backdrop-filter: blur(16px) saturate(140%); -webkit-backdrop-filter: blur(16px) saturate(140%); scroll-snap-align: start; transition: transform .2s ease,box-shadow .2s ease; }
  .continue-card:hover { transform: translateY(-2px); box-shadow: 0 13px 30px rgba(28,44,75,.12); text-decoration: none; }
  .continue-card img,.continue-no-photo { width: 100%; aspect-ratio: 4/3; display: block; object-fit: cover; background: #f0f2f6; }
  .continue-no-photo { display: flex; flex-direction: column; gap: 6px; align-items: center; justify-content: center; color: #8490a3; font-size: 11px; }
  .continue-info { display: grid; gap: 6px; padding: 12px; }
.continue-info strong {
  font-size: 12px;
  line-height: 1.45;
  overflow: hidden;
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  line-clamp: 2;
}
  .continue-info span { color: #b91643; font-size: 12px; font-weight: 800; }
  .continue-note { margin: 0; color: #68768b; font-size: 11px; line-height: 1.6; }
  @media (max-width: 679px) { .continue-card { flex-basis: 168px; } .continue-heading > a { font-size: 11px; } }
  @media (prefers-reduced-transparency: reduce) { .continue-card { background: #fff; backdrop-filter: none; -webkit-backdrop-filter: none; } }
  @media (prefers-reduced-motion: reduce) { .continue-track { scroll-behavior: auto; } .continue-card { transition: none; } .continue-card:hover { transform: none; } }

  /* Phase 61 · CampusMart editorial Liquid Glass layer.
     All marketplace routes, filters and actions remain unchanged. */
  .home-page {
    --home-navy: #111b30;
    --home-red: #d11848;
    --glass-white: rgba(255,255,255,.68);
    --glass-border: rgba(255,255,255,.9);
    --ink: #19263b;
    --muted-ink: #647187;
    padding-top: clamp(15px,2.8vw,34px);
    padding-bottom: 72px;
    position: relative;
    isolation: isolate;
  }
  .home-page::before {
    content: ''; position: absolute; z-index: -1; pointer-events: none;
    inset: -45px -15px auto; height: 610px;
    background: radial-gradient(ellipse 43% 43% at 6% 0%,rgba(235,119,158,.14),transparent 95%),radial-gradient(ellipse 38% 55% at 93% 30%,rgba(102,151,211,.13),transparent 96%);
  }
  .eyebrow { color: #ab2d4f; letter-spacing: .18em; font-size: 10px; font-weight: 800; }
  .hero {
    border-radius: clamp(24px,3.3vw,38px);
    min-height: 490px;
    border: 1px solid rgba(255,255,255,.3);
    background: #101a30;
    box-shadow: 0 35px 90px rgba(20,31,55,.16),0 4px 14px rgba(20,31,55,.09),inset 0 1px rgba(255,255,255,.26);
  }
  .hero::before {
    background: radial-gradient(ellipse 68% 90% at 92% 12%,rgba(123,154,202,.26),transparent 70%),radial-gradient(ellipse 45% 60% at 19% 100%,rgba(213,49,99,.14),transparent 80%),linear-gradient(137deg,#0e192c 5%,#1b2c48 76%,#14213a);
  }
  .hero::after { content: ''; position: absolute; z-index: -1; inset: 0; opacity: .34; pointer-events: none; background-image: radial-gradient(#fff 0.5px,transparent 0.5px); background-size: 17px 17px; mask-image: linear-gradient(90deg,transparent 10%,#000 100%); }
  .hero-copy { padding: clamp(33px,5vw,74px) clamp(25px,4.6vw,72px); display: flex; flex-direction: column; justify-content: center; }
  .hero-topline { color: #d6deed; font-size: 9px; letter-spacing: .2em; font-weight: 750; }
  .hero-live { background: #ff648b; box-shadow: 0 0 0 5px rgba(255,100,139,.14),0 0 20px rgba(255,100,139,.5); }
  .hero-topline-divider { background: rgba(222,232,250,.37); }
  .hero h1 { font-size: clamp(45px,5.8vw,84px); font-weight: 840; line-height: 1.015; letter-spacing: -.075em; margin: 29px 0 22px; text-wrap: balance; }
  .hero h1 span { background: linear-gradient(110deg,#ff8ca5 0%,#fd6086 49%,#ffc2cb 100%); color: transparent; -webkit-background-clip: text; background-clip: text; }
  .hero-desc { max-width: 450px; color: #c4d0e4; font-size: clamp(14px,1.45vw,16px); line-height: 1.85; }
  .hero-links { margin-top: 32px; gap: 12px; }
  .hero-cta,.hero-secondary { min-height: 52px; padding: 0 21px; border-radius: 15px; font-size: 13px; font-weight: 750; transition: transform .2s ease,box-shadow .2s ease,background .2s ease; }
  .hero-cta { background: linear-gradient(125deg,#ea2b5a,#c4103f); box-shadow: 0 12px 30px rgba(203,14,60,.3),inset 0 1px rgba(255,255,255,.25); }
  .hero-secondary { border: 1px solid rgba(255,255,255,.28); background: rgba(255,255,255,.09); backdrop-filter: blur(22px) saturate(145%); -webkit-backdrop-filter: blur(22px) saturate(145%); }
  .hero-cta:hover,.hero-secondary:hover { transform: translateY(-2px); }
  .hero-cta:hover { background: #ed2759; box-shadow: 0 17px 36px rgba(203,14,60,.38); }
  .hero-secondary:hover { background: rgba(255,255,255,.19); }
  .hero-footnote { margin-top: 35px; font-size: 12px; color: #aebdd4; }
  .hero-art { min-height: 470px; perspective: 950px; }
  .art-orbit { border-color: rgba(255,255,255,.12); }
  .orbit-one { width: 460px; height: 460px; top: 1px; right: -83px; }
  .orbit-two { width: 330px; height: 330px; top: 65px; right: -15px; border-style: dashed; }
  .art-tile { border: 1px solid rgba(255,255,255,.38); border-radius: 29px; }
  .art-tile-back { top: 103px; right: 30px; width: 228px; height: 272px; padding: 24px; transform: rotate(14deg); color: #4d3c52; background: linear-gradient(150deg,rgba(255,233,223,.93),rgba(237,182,192,.86)); box-shadow: 0 25px 75px rgba(8,13,28,.22),inset 0 2px 0 rgba(255,255,255,.8); backdrop-filter: blur(20px); }
  .art-tile-front { top: 120px; right: 144px; width: 248px; height: 276px; padding: 25px; transform: rotate(-10deg); color: #18253d; background: linear-gradient(155deg,rgba(255,255,255,.95),rgba(231,237,248,.87)); box-shadow: 0 30px 80px rgba(7,13,29,.36),inset 0 2px 0 rgba(255,255,255,.95); backdrop-filter: blur(26px) saturate(155%); -webkit-backdrop-filter: blur(26px) saturate(155%); }
  .tile-big { font-size: 51px; letter-spacing: -.085em; }
  .tile-mini,.tile-bottom { letter-spacing: .13em; }
  .tile-dot { color: #d41647; }
  .art-label { backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); box-shadow: 0 12px 30px rgba(7,13,29,.19); }
  .art-label-top { top: 67px; right: 164px; background: rgba(218,29,76,.92); padding: 13px 17px; }
  .art-label-bottom { right: 22px; bottom: 58px; background: rgba(255,255,255,.91); padding: 14px 19px; }
  .benefits {
    margin-top: 16px; padding: 8px 16px; border-radius: 25px;
    background: linear-gradient(125deg,rgba(255,255,255,.78),rgba(255,255,255,.53));
    border: 1px solid var(--glass-border);
    box-shadow: 0 12px 36px rgba(43,63,99,.065),inset 0 1px rgba(255,255,255,.85);
    backdrop-filter: blur(24px) saturate(150%); -webkit-backdrop-filter: blur(24px) saturate(150%);
  }
  .benefit { padding: 17px 10px; gap: 14px; }
  .benefit-icon { height: 44px; width: 44px; border-radius: 15px; background: linear-gradient(145deg,rgba(255,230,237,.95),rgba(255,255,255,.65)); color: #c91b49; box-shadow: inset 0 1px rgba(255,255,255,.95); }
  .benefit strong { color: var(--ink); font-size: 13px; }
  .benefit div span { font-size: 12px; color: var(--muted-ink); }
  .discovery { margin-top: clamp(45px,5vw,80px); }
  .discovery-heading { margin-bottom: 22px; }
  .discovery-heading h2 { font-size: clamp(27px,3.1vw,40px); font-weight: 790; letter-spacing: -.055em; color: var(--ink); }
  .discovery-mark { letter-spacing: .18em; font-size: 10px; }
  .search { gap: 14px; padding: 9px 10px 9px 22px; border: 1px solid rgba(255,255,255,.92); border-radius: 21px; background: linear-gradient(135deg,rgba(255,255,255,.91),rgba(255,255,255,.62)); box-shadow: 0 16px 45px rgba(34,55,88,.08),inset 0 1px rgba(255,255,255,.98); backdrop-filter: blur(24px) saturate(155%); -webkit-backdrop-filter: blur(24px) saturate(155%); color: #67758b; transition: box-shadow .2s ease,border-color .2s ease; }
  .search:focus-within { border-color: rgba(209,24,72,.42); box-shadow: 0 0 0 4px rgba(209,24,72,.085),0 16px 45px rgba(34,55,88,.1); }
  .search input[type='search'] { min-height: 48px; color: var(--ink); font-size: 15px; }
  .search button { min-height: 49px; padding: 0 23px; border-radius: 14px; background: #c91645; font-size: 13px; font-weight: 760; }
  .browse-heading { margin-top: 37px; margin-bottom: 16px; }
  .browse-heading h2 { font-size: clamp(20px,2vw,26px); color: var(--ink); }
  .chips-row { gap: 12px; scrollbar-width: none; padding: 3px 2px 17px; }
  .chips-row::-webkit-scrollbar { display: none; }
  .cat { min-width: 155px; min-height: 78px; padding: 12px 14px; gap: 12px; border-radius: 19px; border: 1px solid rgba(255,255,255,.93); background: rgba(255,255,255,.7); box-shadow: 0 8px 25px rgba(27,43,72,.05),inset 0 1px rgba(255,255,255,.98); backdrop-filter: blur(17px) saturate(140%); -webkit-backdrop-filter: blur(17px) saturate(140%); color: #253349; font-weight: 760; transition: transform .18s ease,border-color .18s ease,background .18s ease,box-shadow .18s ease; }
  .cat:hover { transform: translateY(-3px); border-color: rgba(205,37,81,.4); color: #b91b48; box-shadow: 0 13px 27px rgba(27,43,72,.09); }
  .cat.on { background: linear-gradient(130deg,rgba(255,236,242,.91),rgba(255,255,255,.73)); border-color: rgba(207,34,79,.45); color: #ad1540; box-shadow: 0 9px 26px rgba(197,18,65,.085); }
  .cat-icon { width: 43px; height: 43px; border-radius: 14px; background: rgba(235,240,247,.89); color: #495b74; }
  .cat.on .cat-icon { background: rgba(255,213,225,.84); color: #bd1747; }
  .listings-section { margin-top: clamp(44px,5vw,70px); }
  .listings-toolbar { border-color: rgba(96,112,140,.17); padding-bottom: 23px; }
  .listings-heading h2 { font-size: clamp(27px,3.5vw,43px); font-weight: 800; letter-spacing: -.065em; color: var(--ink); }
  .listing-count { font-size: 13px; color: #68768b; margin-top: 11px; }
  .verified-filter,.sort select { min-height: 47px; background: rgba(255,255,255,.73); border: 1px solid rgba(255,255,255,.92); box-shadow: 0 5px 18px rgba(28,44,75,.06),inset 0 1px rgba(255,255,255,.9); border-radius: 14px; backdrop-filter: blur(16px); -webkit-backdrop-filter: blur(16px); color: var(--ink); }
  .verified-filter { padding: 8px 14px; font-weight: 740; }
  .sort select { padding: 0 15px; font-weight: 700; }
  .active-filters a { background: rgba(255,231,238,.85); color: #a5143e; border: 1px solid rgba(211,41,88,.12); }
  .listing-grid { margin-top: 25px; gap: clamp(13px,2vw,24px); }
  .home-page :global(.lcard) { background: rgba(255,255,255,.76); border: 1px solid rgba(255,255,255,.93); border-radius: 23px; box-shadow: 0 12px 30px rgba(32,49,81,.065),inset 0 1px rgba(255,255,255,.98); backdrop-filter: blur(14px); -webkit-backdrop-filter: blur(14px); transition: transform .28s cubic-bezier(.2,.8,.2,1),box-shadow .28s ease,border-color .28s ease; }
  .home-page :global(.lcard:hover) { transform: translateY(-5px); border-color: rgba(207,61,102,.3); box-shadow: 0 24px 50px rgba(32,49,81,.15); }
  .home-page :global(.lcard .pic) { aspect-ratio: 1 / .89; background: #eef1f6; }
  .home-page :global(.lcard .meta) { padding: 17px; }
  .home-page :global(.lcard .ttl) { font-weight: 790; letter-spacing: -.02em; color: #1c2a41; }
  .empty-state { padding: 50px 24px; border-radius: 26px; background: rgba(255,255,255,.74); border: 1px dashed rgba(119,135,164,.35); backdrop-filter: blur(18px); }
  .empty-symbol { border-radius: 19px; }
  .empty-link { border-radius: 13px; }
  .home-footer { margin-top: 66px; padding: clamp(22px,3vw,34px); border-radius: 27px; border: 1px solid rgba(255,255,255,.92); background: linear-gradient(120deg,rgba(226,246,240,.78),rgba(255,255,255,.63)); box-shadow: 0 14px 40px rgba(31,74,67,.06),inset 0 1px rgba(255,255,255,.95); backdrop-filter: blur(22px); -webkit-backdrop-filter: blur(22px); }
  .footer-icon { border-radius: 15px; }
  .footer-copy h2 { font-size: clamp(19px,2vw,25px); }
  .footer-copy p { font-size: 13px; }
  .legal-footer { margin-top: 20px; border-radius: 27px; background: linear-gradient(135deg,rgba(255,255,255,.8),rgba(240,245,255,.56)); box-shadow: 0 16px 45px rgba(21,35,65,.065),inset 0 1px rgba(255,255,255,.96); backdrop-filter: blur(26px) saturate(140%); -webkit-backdrop-filter: blur(26px) saturate(140%); }
  .results-intro h1 { font-size: clamp(34px,5vw,56px); font-weight: 810; letter-spacing: -.07em; }
  .back-home { font-weight: 730; }
  .hero :is(a,button):focus-visible,.home-page :is(a,button,input,select):focus-visible { outline: 3px solid #f04a79; outline-offset: 4px; }
  @media (min-width: 680px) {
    .hero { grid-template-columns: minmax(0,1.12fr) minmax(290px,.88fr); }
    .benefits { padding: 9px 13px; }
    .benefit { padding: 13px 15px; }
    .benefit + .benefit { border-left: 1px solid rgba(106,125,155,.13); }
    .sort { min-width: 194px; }
  }
  @media (min-width: 1050px) {
    .hero { min-height: 535px; }
    .hero-art { transform: scale(1); }
    .chips-row { flex-wrap: wrap; overflow: visible; }
    .cat { flex: 1 0 154px; }
  }
  @media (max-width: 679px) {
    .hero { min-height: auto; }
    .hero-copy { padding: 44px 27px 36px; }
    .hero h1 { font-size: clamp(42px,10vw,60px); }
    .hero-art { display: none; }
    .benefits { padding: 4px 16px; }
    .discovery { margin-top: 47px; }
    .home-footer { margin-top: 48px; }
  }
  @media (max-width: 430px) {
    .hero-copy { padding: 35px 23px; }
    .hero h1 { font-size: clamp(40px,10vw,48px); }
    .hero-topline { font-size: 8px; letter-spacing: .14em; }
    .hero-links { gap: 10px; }
    .hero-cta,.hero-secondary { min-height: 51px; }
    .search { padding-left: 13px; gap: 9px; border-radius: 17px; }
    .search button { padding: 0 13px; border-radius: 12px; }
    .cat { min-width: 151px; min-height: 72px; }
    .home-footer { border-radius: 22px; }
    .legal-footer { border-radius: 22px; }
  }
  @media (prefers-reduced-transparency: reduce) {
    .benefits,.search,.cat,.verified-filter,.sort select,.home-page :global(.lcard),.home-footer,.legal-footer { background: #fff; backdrop-filter: none; -webkit-backdrop-filter: none; }
    .hero-secondary { background: #273651; backdrop-filter: none; -webkit-backdrop-filter: none; }
  }
  @media (prefers-reduced-motion: reduce) {
    .hero-cta,.hero-secondary,.cat,.home-page :global(.lcard) { transition: none; transform: none; }
  }

</style>
