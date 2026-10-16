<script>
	import { goto } from '$app/navigation';
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

	const hasFilters = $derived(Boolean(data.filters.category || data.filters.verifiedOnly || data.filters.q));
	const activeCategory = $derived(data.categories.find((c) => c.slug === data.filters.category)?.name ?? '');
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

</style>
