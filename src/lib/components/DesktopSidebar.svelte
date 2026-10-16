<script>
	import Logo from './Logo.svelte';
	import Icon from './Icon.svelte';
	import Avatar from './Avatar.svelte';

	/** @type {{ user: any, profile?: any, isStaff: boolean, pathname: string, unreadMessages?: number, pendingVerificationRequests?: number, pendingReports?: number, savedPriceDropAlerts?: number, compact?: boolean }} */
	let { user, profile, isStaff, pathname, unreadMessages = 0, pendingVerificationRequests = 0, pendingReports = 0, savedPriceDropAlerts = 0, compact = false } = $props();

	const marketplace = $derived([
		{ label: 'Browse marketplace', href: '/', icon: 'home' },
		{ label: 'Saved items', href: '/saved', icon: 'heart', count: savedPriceDropAlerts },
		{ label: 'Recently viewed', href: '/recently-viewed', icon: 'search' },
		{ label: 'Safety center', href: '/safety', icon: 'shield' },
		{ label: 'Messages', href: '/messages', icon: 'chat', count: unreadMessages },
		{ label: 'My listings', href: '/my-listings', icon: 'tag' },
		{ label: 'Sell an item', href: '/sell', icon: 'plus', primary: true }
	]);

	/** @param {string} href */
function active(href) {
		return pathname === href || (href !== '/' && pathname.startsWith(href + '/'));
	}
</script>

<aside class:compact class="desktop-side" aria-label={compact ? 'Compact desktop navigation' : 'Desktop navigation'}>
	<div class="brand"><Logo height={28} /></div>

	<div class="campus">
		<Icon name="pin" size={18} />
		<div>
			<div class="small">Your campus</div>
			<div class="strong">International University of East Africa</div>
		</div>
	</div>

	<nav aria-label="Marketplace" class="navgroup">
		<div class="group">Marketplace</div>
		{#each marketplace as item (item.href)}
			<a class:item-primary={item.primary} class="item" href={item.href} title={item.label} aria-label={item.label} aria-current={active(item.href) ? 'page' : undefined}>
				<Icon name={item.icon} size={20} />
				<span class="label">{item.label}</span>
	{#if (item.count ?? 0) > 0}
    <span class="badge" aria-label={item.href === '/saved' ? `${item.count} saved item price-drop alerts` : `${item.count} unread messages`}>
        {(item.count ?? 0) > 99 ? '99+' : item.count}
    </span>
{/if}
			</a>
		{/each}
	</nav>

	<nav aria-label="Your account" class="navgroup">
		<div class="group">Your account</div>
		{#if user}
			<a class="user-card" href="/account" title="Profile & verification" aria-label="Profile & verification" aria-current={pathname === '/account' ? 'page' : undefined}>
				<Avatar path={profile?.avatar_path} name={profile?.display_name ?? user?.email} size={38} />
				<span>
					<span class="label">Profile &amp; verification</span>
					<span class="small">{profile?.display_name ?? user?.email}</span>
				</span>
			</a>
			{#if isStaff}
				<a class="item" href="/admin/reports" title="Reports" aria-label="Reports" aria-current={active('/admin/reports') ? 'page' : undefined}>
					<Icon name="shield" size={20} />
					<span class="label">Reports</span>
					{#if pendingReports > 0}<span class="badge" aria-label={`${pendingReports} open reports`}>{pendingReports > 99 ? '99+' : pendingReports}</span>{/if}
				</a>
				<a class="item" href="/admin/verification" title="Verification requests" aria-label="Verification requests" aria-current={active('/admin/verification') ? 'page' : undefined}>
					<Icon name="shield" size={20} />
					<span class="label">Verification requests</span>
					{#if pendingVerificationRequests > 0}<span class="badge" aria-label={`${pendingVerificationRequests} pending verification requests`}>{pendingVerificationRequests > 99 ? '99+' : pendingVerificationRequests}</span>{/if}
				</a>
			{/if}
			<form method="POST" action="/signout"><button class="item btnrow" type="submit" title="Sign out" aria-label="Sign out"><Icon name="logout" size={20} /><span class="label">Sign out</span></button></form>
		{:else}
			<a class="item" href="/signin" title="Sign in / Sign up" aria-label="Sign in / Sign up" aria-current={pathname === '/signin' || pathname === '/signup' ? 'page' : undefined}><Icon name="login" size={20} /><span class="label">Sign in / Sign up</span></a>
		{/if}
	</nav>

	<div class="foot">
		<div class="strong">Trade safely on campus.</div>
		<p>Meet in public. Check the item. Pay only when you are happy.</p>
	</div>
</aside>

<style>
	.desktop-side { display: none; }
	@media (min-width: 900px) {
		.desktop-side { position: fixed; top: 0; left: 0; bottom: 0; z-index: 25; width: 280px; display: flex; flex-direction: column; gap: 10px; overflow-y: auto; padding: 18px 14px 20px; background: #fff; border-right: 1px solid var(--line); transition: width 0.15s ease, padding 0.15s ease; }
		.desktop-side.compact { width: 72px; padding: 12px 8px; align-items: center; gap: 8px; overflow-x: hidden; }
		.brand { padding: 2px 8px 8px; min-height: 44px; display: flex; align-items: center; }
		.campus { display: flex; gap: 10px; align-items: flex-start; margin: 2px 4px 4px; padding: 12px; border-radius: 14px; background: var(--bg); border: 1px solid var(--line); color: var(--red); }
		.small { display: block; color: var(--mute); font-size: 12px; font-weight: 600; line-height: 1.25; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; max-width: 180px; }
		.strong { color: var(--ink); font-weight: 800; font-size: 14px; line-height: 1.25; }
		.group { margin: 14px 8px 6px; font-size: 12px; font-weight: 800; letter-spacing: 0.06em; text-transform: uppercase; color: var(--mute); }
		.navgroup { display: grid; gap: 2px; }
		.item, .user-card { display: flex; align-items: center; gap: 12px; min-height: 46px; padding: 0 12px; border-radius: 13px; color: var(--ink); font-weight: 700; text-decoration: none; width: 100%; text-align: left; font-family: inherit; font-size: 15px; }
		.item:hover, .user-card:hover { background: #f8f2f0; text-decoration: none; }
		.item[aria-current='page'], .user-card[aria-current='page'] { background: #fdecef; color: var(--red); }
		.item-primary { background: var(--red); color: #fff; margin-top: 6px; }
		.item-primary:hover, .item-primary[aria-current='page'] { background: var(--red-dark); color: #fff; }
		.label { flex: 1; min-width: 0; }
		.badge { min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: var(--red); color: #fff; font-size: 12px; font-weight: 900; }
		.btnrow { background: none; border: 0; cursor: pointer; }
		form { margin: 0; }
		.foot { margin-top: auto; padding: 16px 12px 0; border-top: 1px solid var(--line); }
		.foot p { margin: 4px 0 0; color: var(--body); font-size: 13px; line-height: 1.35; }

		/* Listing detail focus mode: keep navigation available, but minimize it. */
		.compact .brand { justify-content: center; padding: 0 0 8px; width: 100%; overflow: hidden; }
		.compact .brand :global(.logo span) { display: none; }
		.compact .campus, .compact .group, .compact .foot { display: none; }
		.compact .navgroup { width: 100%; gap: 8px; }
		.compact .item, .compact .user-card { width: 52px; height: 52px; min-height: 52px; padding: 0; justify-content: center; gap: 0; border-radius: 16px; position: relative; }
		.compact .item-primary { margin-top: 0; }
		.compact .label, .compact .small { display: none; }
		.compact .badge { position: absolute; top: -4px; right: -4px; min-width: 20px; height: 20px; padding: 0 6px; font-size: 11px; box-shadow: 0 0 0 2px #fff; }
		.compact form { width: 52px; }
	}
	/* Phase 59.3: polished compact navigation on listing detail pages. */
	@media (min-width: 900px) {
		.desktop-side { scrollbar-width: thin; scrollbar-color: #d9dce2 transparent; }
		.desktop-side.compact { width: 76px; padding: 13px 10px; gap: 10px; overflow-y: auto; overflow-x: hidden; scrollbar-width: none; background: #fff; border-right: 1px solid #ece9ea; }
		.desktop-side.compact::-webkit-scrollbar { display: none; }
		.compact .brand { flex: 0 0 auto; min-height: 48px; padding: 4px 0 12px; }
		.compact .navgroup { width: 100%; gap: 5px; display: flex; flex-direction: column; align-items: center; flex: 0 0 auto; }
		.compact .navgroup + .navgroup { margin-top: 12px; padding-top: 12px; border-top: 1px solid #eee9e9; }
		.compact .item, .compact .user-card { width: 52px; height: 50px; min-height: 50px; border-radius: 15px; flex: 0 0 auto; transition: transform .2s cubic-bezier(.2,.8,.2,1), background-color .2s ease, color .2s ease, box-shadow .2s ease; }
		.compact .item:hover, .compact .user-card:hover { transform: translateY(-2px); background: #fff0f2; color: #c8102e; box-shadow: 0 5px 12px rgba(200,16,46,.09); }
		.compact .item[aria-current='page'], .compact .user-card[aria-current='page'] { background: #fdecef; color: #c8102e; box-shadow: inset 3px 0 #c8102e; }
		.compact .item-primary { background: #c8102e; color: #fff; box-shadow: 0 5px 14px rgba(200,16,46,.19); }
		.compact .item-primary:hover, .compact .item-primary[aria-current='page'] { background: #a30d25; color: #fff; box-shadow: 0 8px 20px rgba(200,16,46,.22); }
		.compact form { display: flex; justify-content: center; width: 100%; }
		.compact .badge { top: -3px; right: -4px; }
	}

	/* Phase 59.5: a clean, scrollbar-free sidebar on all desktop pages.
	   The navigation remains independently scrollable with wheel, touchpad,
	   touch and keyboard; only its intrusive visual track is hidden. */
	@media (min-width: 900px) {
		.desktop-side, .desktop-side.compact {
			scrollbar-width: none;
			-ms-overflow-style: none;
			overscroll-behavior-y: contain;
		}
		.desktop-side::-webkit-scrollbar, .desktop-side.compact::-webkit-scrollbar {
			display: none;
			width: 0;
			height: 0;
		}
		.desktop-side:not(.compact) {
			width: 280px;
			padding: 20px 15px 24px;
			gap: 13px;
			border-right: 1px solid #ebe8eb;
			box-shadow: 5px 0 24px rgba(15, 23, 42, .025);
		}
		.desktop-side:not(.compact) .brand { padding: 4px 10px 10px; }
		.desktop-side:not(.compact) .campus {
			margin: 0 5px 7px;
			padding: 14px 13px;
			border: 1px solid #ebe5e6;
			background: linear-gradient(145deg, #fbf8f8, #f7f4f3);
			border-radius: 18px;
		}
		.desktop-side:not(.compact) .group {
			margin: 17px 11px 8px;
			font-size: 11px;
			letter-spacing: .095em;
		}
		.desktop-side:not(.compact) .navgroup { gap: 4px; }
		.desktop-side:not(.compact) .item, .desktop-side:not(.compact) .user-card {
			min-height: 49px;
			padding-inline: 14px;
			border-radius: 15px;
			transition: background-color .18s ease, color .18s ease, transform .18s ease, box-shadow .18s ease;
		}
		.desktop-side:not(.compact) .item:hover, .desktop-side:not(.compact) .user-card:hover {
			background: #fff1f3;
			color: #bc1230;
			transform: translateX(3px);
		}
		.desktop-side:not(.compact) .item[aria-current='page'], .desktop-side:not(.compact) .user-card[aria-current='page'] {
			background: #fdecef;
			color: #c8102e;
			box-shadow: inset 3px 0 #c8102e;
		}
		.desktop-side:not(.compact) .item-primary {
			min-height: 54px;
			background: #c8102e;
			color: #fff;
			box-shadow: 0 8px 18px rgba(200,16,46,.15);
		}
		.desktop-side:not(.compact) .item-primary:hover,
		.desktop-side:not(.compact) .item-primary[aria-current='page'] {
			background: #a30d25;
			color: #fff;
			transform: translateY(-1px);
			box-shadow: 0 11px 20px rgba(200,16,46,.2);
		}
		.desktop-side:not(.compact) .foot {
			margin-top: 18px;
			padding: 16px 13px 0;
		}
	}

	@media (prefers-reduced-motion: reduce) { .item, .user-card { transition: none !important; transform: none !important; } }
</style>
