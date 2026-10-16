<script>
	import Avatar from '#lib/components/Avatar.svelte';
	import Icon from '#lib/components/Icon.svelte';

	let { data } = $props();
	let search = $state('');
	let unreadOnly = $state(false);
	const unreadTotal = $derived(Object.values(data.unreadByConversation ?? {}).reduce((sum, count) => sum + Number(count || 0), 0));
	const filteredConversations = $derived((data.conversations ?? []).filter((c) => {
		if (unreadOnly && !(data.unreadByConversation?.[c.id] > 0)) return false;
		const person = otherPerson(c);
		const text = [person?.display_name, c.listings?.title, data.latestByConversation?.[c.id]?.body].join(' ').toLowerCase();
		return text.includes(search.trim().toLowerCase());
	}));

	function previewText(message) {
		if (!message?.body) return 'No messages yet';
		const prefix = message.sender_id === data.userId ? 'You: ' : '';
		const text = message.body.replace(/\s+/g, ' ').trim();
		const preview = text.length > 90 ? `${text.slice(0, 90)}…` : text;
		return `${prefix}${preview}`;
	}

	function previewTime(message) {
		if (!message?.created_at) return '';
		return new Date(message.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
	}

	function otherPerson(conversation) {
		return conversation.buyer_id === data.userId ? conversation.seller : conversation.buyer;
	}

	function otherRole(conversation) {
		return conversation.buyer_id === data.userId ? 'seller' : 'buyer';
	}

	function listingCover(conversation) {
		const images = conversation.listings?.listing_images ?? [];
		const first = [...images].sort((a, b) => (a.position ?? 0) - (b.position ?? 0))[0];
		return first?.storage_path ? `/photos/${first.storage_path}` : null;
	}
</script>
<svelte:head><title>Messages | campusmart</title></svelte:head>

<div class="page wide messages-page">
	<header class="inbox-hero">
		<div class="inbox-hero-copy">
			<span class="eyebrow"><span class="eyebrow-dot"></span> CAMPUSMART CONVERSATIONS</span>
			<h1>Your messages<span class="hero-period">.</span></h1>
			<p>Keep every campus deal in one place. Find a conversation and pick up where you left off.</p>
		</div>
		<div class="hero-summary" aria-label={`${data.conversations.length} conversations, ${unreadTotal} unread messages`}>
			<span class="hero-summary-icon" aria-hidden="true">✉</span>
			<strong>{data.conversations.length}</strong>
			<span>Conversations</span>
			{#if unreadTotal > 0}<small>{unreadTotal} unread</small>{:else}<small>All caught up</small>{/if}
		</div>
	</header>

	<section class="inbox-content" aria-label="Your conversations">
		<div class="inbox-section-heading">
			<div><span class="section-kicker">YOUR INBOX</span><h2>Conversations</h2></div>
			<a class="browse-link" href="/">Browse listings <span aria-hidden="true">↗</span></a>
		</div>
		{#if data.loadFailed}
			<div class="notice warn" role="alert">Could not load conversations. Please try again.</div>
		{:else if !data.conversations.length}
			<div class="inbox-empty">
				<div class="empty-symbol" aria-hidden="true">✉</div>
				<h3>No conversations yet</h3>
				<p>Found something you like? Open the listing and tap Message seller to start chatting.</p>
				<a class="btn empty-action" href="/">Explore listings ↗</a>
			</div>
		{:else}
			<div class="inbox-controls">
				<label class="inbox-search">
					<span class="search-glyph" aria-hidden="true">⌕</span>
					<span class="sr-only">Search conversations</span>
					<input type="search" placeholder="Search people, items or messages" bind:value={search} />
				</label>
				<button class:filter-active={unreadOnly} class="unread-filter" type="button" aria-pressed={unreadOnly} onclick={() => (unreadOnly = !unreadOnly)}>
					<span class="filter-dot" aria-hidden="true"></span> Unread only
				</button>
			</div>
			<div class="inbox-result-count" aria-live="polite">Showing {filteredConversations.length} of {data.conversations.length} conversations</div>
			{#if !filteredConversations.length}
				<div class="filter-empty"><strong>No matching conversations</strong><p>Try another search or turn off the unread filter.</p><button type="button" onclick={() => { search = ''; unreadOnly = false; }}>Clear filters</button></div>
			{:else}
				<div class="conversation-list">
			{#each filteredConversations as c (c.id)}
					{@const unread = data.unreadByConversation?.[c.id] ?? 0}
					{@const latest = data.latestByConversation?.[c.id]}
					{@const person = otherPerson(c)}
					{@const cover = listingCover(c)}
					<a class:unread={unread > 0} href="/messages/{c.id}">
						<div class="thumb-wrap" aria-hidden="true">
							{#if cover}<img class="listing-thumb" src={cover} alt="" loading="lazy" />{:else}<div class="listing-thumb placeholder">⌂</div>{/if}
							<span class="profile-bubble"><Avatar path={person?.avatar_path} name={person?.display_name ?? otherRole(c)} size={26} /></span>
						</div>
						<div class="conversation-copy">
							<div class="conversation-top">
								<strong class="person-name"><span>{person?.display_name ?? (c.buyer_id === data.userId ? 'Seller' : 'Buyer')}</span>
									{#if person?.verification_status === 'verified'}<span class="verified-dot" title="Verified student" aria-label="Verified student"><Icon name="verified" size={13} /></span>{/if}
								</strong>
								{#if previewTime(latest)}<time datetime={latest.created_at}>{previewTime(latest)}</time>{/if}
							</div>
							<div class="item-title">{c.listings?.title ?? 'Item'}</div>
							<div class="message-preview">{previewText(latest)}</div>
						</div>
						{#if unread > 0}<span class="unread-badge" aria-label={`${unread} unread messages`}>{unread > 99 ? '99+' : unread}</span>{:else}<span class="row-chevron" aria-hidden="true">›</span>{/if}
					</a>
				{/each}
				</div>
			{/if}
		{/if}
	</section>
</div>

<style>
	.messages-page { --inbox-navy: #142337; --inbox-red: #cb0c32; max-width: 1120px; padding-top: 26px; padding-bottom: 60px; }
	.inbox-hero { background: linear-gradient(118deg,#142337 0%,#1c3048 70%,#233a53 100%); color: white; border-radius: 27px; padding: clamp(25px,4vw,44px); display: flex; align-items: center; justify-content: space-between; gap: 24px; overflow: hidden; position: relative; box-shadow: 0 18px 36px rgba(20,35,55,.13); }
	.inbox-hero::after { content: ''; position: absolute; width: 250px; height: 250px; border: 1px solid rgba(255,255,255,.08); border-radius: 50%; right: -100px; top: -130px; pointer-events: none; }
	.eyebrow { color: #ffbdca; font-size: 11px; font-weight: 900; letter-spacing: .16em; display: inline-flex; align-items: center; gap: 8px; }
	.eyebrow-dot { width: 7px; height: 7px; background: #f53c60; border-radius: 50%; }
	.inbox-hero h1 { font-size: clamp(30px,4.5vw,52px); line-height: 1.08; letter-spacing: -.045em; margin: 13px 0 12px; color: #fff; }
	.hero-period { color: #ff496b; }
	.inbox-hero p { max-width: 480px; color: #cbd5e1; line-height: 1.65; font-size: 15px; margin: 0; }
	.hero-summary { position: relative; z-index: 1; min-width: 150px; background: rgba(255,255,255,.09); border: 1px solid rgba(255,255,255,.17); border-radius: 22px; padding: 18px 20px; display: grid; gap: 2px; backdrop-filter: blur(7px); }
	.hero-summary-icon { font-size: 21px; color: #ff9db0; }
	.hero-summary strong { font-size: 32px; line-height: 1.1; color: white; }
	.hero-summary span:not(.hero-summary-icon) { font-size: 12px; color: #e3e9f1; }
	.hero-summary small { margin-top: 6px; font-size: 11px; color: #ffbac8; font-weight: 800; }
	.inbox-content { margin-top: 28px; }
	.inbox-section-heading { display: flex; align-items: end; justify-content: space-between; gap: 14px; margin-bottom: 17px; }
	.section-kicker { color: var(--inbox-red); font-size: 11px; letter-spacing: .13em; font-weight: 900; }
	.inbox-section-heading h2 { margin: 5px 0 0; font-size: clamp(22px,3vw,28px); letter-spacing: -.04em; color: var(--inbox-navy); }
	.browse-link { color: var(--inbox-red); font-size: 13px; font-weight: 800; white-space: nowrap; text-decoration: none; }
	.browse-link:hover { text-decoration: underline; }
	.inbox-controls { display: flex; gap: 10px; align-items: stretch; }
	.inbox-search { flex: 1; min-width: 0; position: relative; }
	.inbox-search input { width: 100%; height: 49px; padding: 10px 14px 10px 43px; border-radius: 15px; border: 1px solid #e3e7ed; background: #fff; font-size: 14px; color: var(--inbox-navy); }
	.inbox-search input:focus { outline: 2px solid rgba(203,12,50,.24); border-color: var(--inbox-red); }
	.search-glyph { position: absolute; top: 6px; left: 14px; color: #69758a; font-size: 28px; line-height: 1.2; }
	.unread-filter { border: 1px solid #e3e7ed; border-radius: 15px; background: #fff; padding: 0 16px; color: #435168; font-weight: 800; font-size: 13px; cursor: pointer; white-space: nowrap; display: inline-flex; align-items: center; gap: 8px; }
	.unread-filter:hover, .unread-filter:focus-visible { border-color: var(--inbox-red); }
	.unread-filter.filter-active { background: #fff0f3; border-color: #ed9aac; color: var(--inbox-red); }
	.filter-dot { width: 8px; height: 8px; border-radius: 50%; background: #d0d6df; }
	.filter-active .filter-dot { background: var(--inbox-red); }
	.inbox-result-count { font-size: 12px; color: #6c7686; margin: 11px 0 12px; }
	.conversation-list { border: 1px solid #e6e8ed; background: #fff; border-radius: 22px; overflow: hidden; box-shadow: 0 10px 30px rgba(20,35,55,.04); }
	.conversation-list a { display: flex; align-items: center; gap: 15px; padding: 17px 19px; border-bottom: 1px solid #eff0f3; color: inherit; text-decoration: none; transition: background .18s ease, transform .18s ease; }
	.conversation-list a:last-child { border-bottom: 0; }
	.conversation-list a:hover { background: #f7f9fc; text-decoration: none; }
	.conversation-list a:focus-visible { outline: 2px solid var(--inbox-red); outline-offset: -2px; }
	.conversation-list a.unread { background: #fff7f8; }
	.conversation-list a.unread:hover { background: #fff0f3; }
	.thumb-wrap { width: 70px; height: 70px; position: relative; flex: none; }
	.listing-thumb { width: 70px; height: 70px; border-radius: 17px; object-fit: cover; display: block; background: #f4edeb; border: 1px solid #e8e3e1; }
	.listing-thumb.placeholder { display: flex; align-items: center; justify-content: center; color: #8a94a3; font-size: 25px; }
	.profile-bubble { position: absolute; right: -5px; bottom: -5px; width: 34px; height: 34px; border-radius: 999px; display: flex; align-items: center; justify-content: center; background: #fff; border: 3px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,.13); overflow: hidden; }
	.conversation-copy { min-width: 0; flex: 1; display: grid; gap: 5px; }
	.conversation-top { display: flex; align-items: baseline; justify-content: space-between; gap: 10px; }
	.person-name { display: inline-flex; align-items: center; gap: 6px; min-width: 0; font-size: 16px; color: var(--inbox-navy); }
	.person-name span:first-child { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.verified-dot { width: 19px; height: 19px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; flex: none; background: #dff7ea; color: #10a857; border: 1px solid #b9edcd; }
	.conversation-top time { font-size: 11px; white-space: nowrap; color: #7b8493; }
	.item-title { color: #c40d35; font-size: 12px; font-weight: 850; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.message-preview { color: #647083; font-size: 13px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.conversation-list a.unread .message-preview { font-weight: 800; color: var(--inbox-navy); }
	.unread-badge { min-width: 25px; height: 25px; padding: 0 7px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: var(--inbox-red); color: #fff; font-size: 12px; font-weight: 900; flex: none; }
	.row-chevron { font-size: 28px; color: #b3bbc7; margin-left: 4px; }
	.inbox-empty, .filter-empty { border: 1px solid #e6e8ed; border-radius: 22px; padding: 38px 22px; background: #fff; text-align: center; }
	.empty-symbol { width: 70px; height: 70px; border-radius: 20px; background: #fff0f3; color: var(--inbox-red); display: grid; place-items: center; font-size: 34px; margin: 0 auto 14px; }
	.inbox-empty h3 { margin: 0 0 8px; color: var(--inbox-navy); }
	.inbox-empty p, .filter-empty p { color: #6b7688; max-width: 390px; margin: 0 auto 18px; line-height: 1.6; }
	.empty-action { display: inline-flex; }
	.filter-empty button { background: transparent; color: var(--inbox-red); border: 0; font-weight: 800; cursor: pointer; }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; border: 0; }
	@media (max-width: 620px) {
		.messages-page { padding-top: 12px; padding-bottom: 90px; }
		.inbox-hero { padding: 24px 20px; border-radius: 20px; }
		.inbox-hero h1 { font-size: 30px; }
		.inbox-hero p { font-size: 13px; }
		.hero-summary { min-width: 95px; padding: 12px; }
		.hero-summary strong { font-size: 26px; }
		.hero-summary-icon { font-size: 17px; }
		.inbox-content { margin-top: 24px; }
		.conversation-list a { padding: 13px 11px; gap: 11px; }
		.thumb-wrap, .listing-thumb { width: 58px; height: 58px; }
		.person-name { font-size: 14px; }
		.message-preview { font-size: 12px; }
	}
	@media (max-width: 390px) {
		.hero-summary { display: none; }
		.inbox-controls { flex-wrap: wrap; }
		.inbox-search { flex-basis: 100%; }
		.unread-filter { min-height: 40px; }
		.inbox-section-heading h2 { font-size: 23px; }
	}
	@media (prefers-reduced-motion: reduce) { .conversation-list a { transition: none; } }
</style>
