<script>
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { afterNavigate } from '$app/navigation';
	import { tick } from 'svelte';
	import Logo from '#lib/components/Logo.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import NavDrawer from '#lib/components/NavDrawer.svelte';
	import BottomNav from '#lib/components/BottomNav.svelte';
	import DesktopSidebar from '#lib/components/DesktopSidebar.svelte';
	import Avatar from '#lib/components/Avatar.svelte';

	/** @type {{ data: any, children: import('svelte').Snippet }} */
	let { data, children } = $props();

	let menuOpen = $state(false);
	let scrollY = $state(0);
	// Scroll-linked progress: 0 = expanded/visible, 1 = hidden header and compact nav.
	// Increasing page scroll Y is an upward finger swipe; decreasing Y reveals both bars.
	let navigationProgress = $state(0);
	let previousScrollY = 0;
	const NAVIGATION_TRAVEL = 105;

	function handleScroll() {
		const current = Math.max(0, window.scrollY);
		const delta = current - previousScrollY;
		previousScrollY = current;

		if (menuOpen || current <= 12) {
			navigationProgress = 0;
			return;
		}
		// Ignore microscopic wheel / touch jitter, but otherwise track motion continuously.
		if (Math.abs(delta) < 0.35) return;
		// Hide smoothly as the user swipes up; reveal as they swipe down.
		// Individual deltas are capped to avoid a large single jump on wheel / page navigation.
		const change = Math.max(-55, Math.min(55, delta)) / NAVIGATION_TRAVEL;
		navigationProgress = Math.max(0, Math.min(1, navigationProgress + change));
	}
	/** @type {HTMLButtonElement | undefined} */
	let menuBtn = $state();

	async function closeMenu() {
		menuOpen = false;
		await tick();
		menuBtn?.focus();
	}
	afterNavigate(() => {
		menuOpen = false;
		navigationProgress = 0;
		if (typeof window !== 'undefined') previousScrollY = window.scrollY;
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>campusmart</title>
</svelte:head>

<svelte:window bind:scrollY onscroll={handleScroll} />

<DesktopSidebar user={data.user} profile={data.profile} isStaff={data.isStaff} pathname={page.url.pathname} unreadMessages={data.unreadMessages ?? 0} pendingVerificationRequests={data.pendingVerificationRequests ?? 0} savedPriceDropAlerts={data.savedPriceDropAlerts ?? 0} />

<div class="app-shell">
<header class="top" class:scrolled={scrollY > 10} style={`--header-hide: ${menuOpen ? 0 : navigationProgress}`}>
	<button class="menu" type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="site-menu" bind:this={menuBtn} onclick={() => (menuOpen = true)}>
		<Icon name="menu" />
	</button>
	<span class="brand-mark"><Logo height={26} /></span>
	<span class="grow"></span>
	<a class="sell" href="/sell"><Icon name="plus" size={18} /><span class="long">Sell an item</span><span class="short">Sell</span></a>
	{#if data.user}
		<a class="me" href="/account" aria-label="My account"><Avatar path={data.profile?.avatar_path} name={data.profile?.display_name ?? data.user?.email} size={40} /></a>
	{:else}
		<a class="signin" href="/signin">Sign in</a>
	{/if}
</header>

{#if menuOpen}
	<NavDrawer user={data.user} isStaff={data.isStaff} pathname={page.url.pathname} unreadMessages={data.unreadMessages ?? 0} pendingVerificationRequests={data.pendingVerificationRequests ?? 0} savedPriceDropAlerts={data.savedPriceDropAlerts ?? 0} onclose={closeMenu} />
{/if}

<main>{@render children()}</main>
</div>

<BottomNav pathname={page.url.pathname} signedIn={!!data.user} unreadMessages={data.unreadMessages ?? 0} savedPriceDropAlerts={data.savedPriceDropAlerts ?? 0} progress={menuOpen ? 0 : navigationProgress} />

<style>
	.app-shell { min-height: 100dvh; }
	.top { position: sticky; top: 0; z-index: 20; display: flex; align-items: center; gap: 8px; padding: 8px 12px; min-height: 60px; background: rgba(255, 255, 255, 0.74); border-bottom: 1px solid rgba(255,255,255,0.58); -webkit-backdrop-filter: blur(22px) saturate(165%); backdrop-filter: blur(22px) saturate(165%); box-shadow: 0 1px 0 rgba(15,23,42,0.035); isolation: isolate; transform: translate3d(0, calc(-102% * var(--header-hide, 0)), 0); will-change: transform; transition: transform .105s ease-out, background-color .3s ease, box-shadow .3s ease, border-color .3s ease; }
	.top[style*="--header-hide: 1"] { pointer-events: none; }
	/* A translucent sticky header: page content softly blurs behind it as you scroll. */
	.top.scrolled { background: rgba(255, 255, 255, 0.68); border-bottom-color: rgba(255,255,255,0.48); box-shadow: 0 9px 28px rgba(16, 25, 46, 0.09), 0 1px 0 rgba(16, 25, 46, 0.035); }
	/* Clear contrast and a predictable fallback where backdrop blur is unsupported. */
	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.top, .top.scrolled { background: rgba(255,255,255,.97); }
	}
	@media (prefers-reduced-transparency: reduce) {
		.top, .top.scrolled { background: #fff; -webkit-backdrop-filter: none; backdrop-filter: none; }
	}
	@media (prefers-reduced-motion: reduce) { .top { transition: none; } }
	.grow { flex: 1; }
	.menu { width: 44px; height: 44px; margin-left: -6px; border: 0; background: none; border-radius: 50%; color: var(--ink); display: flex; align-items: center; justify-content: center; cursor: pointer; flex: none; }
	.menu:hover { background: #f4eeec; }
	.sell { display: inline-flex; align-items: center; gap: 6px; background: var(--red); color: #fff; border-radius: 10px; padding: 0 12px; min-height: 40px; font-size: 14px; white-space: nowrap; }
	.sell:hover { background: var(--red-dark); text-decoration: none; }
	.sell .long { display: none; }
	.me { width: 40px; height: 40px; border-radius: 50%; display: inline-flex; flex: none; }
	.me:hover { text-decoration: none; opacity: 0.85; }
	.signin { font-size: 14px; white-space: nowrap; min-height: 40px; display: inline-flex; align-items: center; padding: 0 4px; }
	main { padding-bottom: calc(100px + env(safe-area-inset-bottom, 0px)); }
	@media (min-width: 480px) { .sell .long { display: inline; } .sell .short { display: none; } }
	@media (min-width: 768px) { main { padding-bottom: 0; } }
	@media (min-width: 900px) { .app-shell { margin-left: 280px; } .top { padding: 10px 28px; min-height: 66px; } .menu { display: none; } .sell { min-height: 42px; padding: 0 16px; } }
	@media (min-width: 1280px) { .top { padding-left: 40px; padding-right: 40px; } }
</style>
