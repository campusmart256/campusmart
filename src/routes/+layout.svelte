<script>
	import '../app.css';
	import favicon from '#lib/assets/favicon.svg';
	import { page } from '$app/state';
	import { afterNavigate, beforeNavigate, goto } from '$app/navigation';
	import { tick, onMount } from 'svelte';
	import Logo from '#lib/components/Logo.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import NavDrawer from '#lib/components/NavDrawer.svelte';
	import BottomNav from '#lib/components/BottomNav.svelte';
	import DesktopSidebar from '#lib/components/DesktopSidebar.svelte';
	import Avatar from '#lib/components/Avatar.svelte';

	/** @type {{ data: any, children: import('svelte').Snippet }} */
	let { data, children } = $props();

	/** @type {'light' | 'dark' | 'system'} */
	let themePreference = $state('light');
	let themeMenuOpen = $state(false);
	const themeChoices = /** @type {Array<'light' | 'dark' | 'system'>} */ (['light', 'dark', 'system']);

	/** @param {'light' | 'dark' | 'system'} preference */
	function applyTheme(preference) {
		if (typeof window === 'undefined') return;
		const dark = preference === 'dark' ||
			(preference === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
		document.documentElement.dataset.theme = dark ? 'dark' : 'light';
		document.documentElement.style.colorScheme = dark ? 'dark' : 'light';
	}

	/** @param {'light' | 'dark' | 'system'} preference */
	function setTheme(preference) {
		themePreference = preference;
		applyTheme(preference);
		try { window.localStorage.setItem('campusmart:theme:v1', preference); } catch { /* Private browsing may restrict storage. */ }
		themeMenuOpen = false;
	}

	onMount(() => {
		let stored = null;
		try { stored = window.localStorage.getItem('campusmart:theme:v1'); } catch { /* Storage may be unavailable. */ }
		themePreference = stored === 'dark' || stored === 'system' || stored === 'light' ? stored : 'light';
		applyTheme(themePreference);
		const media = window.matchMedia('(prefers-color-scheme: dark)');
		const onSystemChange = () => { if (themePreference === 'system') applyTheme('system'); };
		/** @param {StorageEvent} event */
		const onStorage = (event) => {
			if (event.key !== 'campusmart:theme:v1') return;
			const next = event.newValue;
			themePreference = next === 'dark' || next === 'system' || next === 'light' ? next : 'light';
			applyTheme(themePreference);
		};
		media.addEventListener('change', onSystemChange);
		window.addEventListener('storage', onStorage);
		return () => { media.removeEventListener('change', onSystemChange); window.removeEventListener('storage', onStorage); };
	});

	// Handle navigation requests from push notification clicks.
onMount(() => {
    if (!('serviceWorker' in navigator)) return;

    /** @param {MessageEvent} event */
    const onServiceWorkerMessage = (event) => {
        const message = event.data;

        if (message?.type !== 'CAMPUSMART_OPEN_CHAT') return;

        const conversationId = message.conversationId;

        if (
            typeof conversationId !== 'string' ||
            !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(conversationId)
        ) {
            return;
        }

        void goto(`/messages/${conversationId}`);
    };

    navigator.serviceWorker.addEventListener(
        'message',
        onServiceWorkerMessage
    );

    return () => {
        navigator.serviceWorker.removeEventListener(
            'message',
            onServiceWorkerMessage
        );
    };
});
    // Phase 68.6: register the service worker for background Web Push.
    onMount(() => {
        if (!('serviceWorker' in navigator)) return;

        const registerWorker = async () => {
            try {
                await navigator.serviceWorker.register('/service-worker.js', {
                    scope: '/'
                });
            } catch (error) {
                console.warn('CampusMart service worker registration failed:', error);
            }
        };

        void registerWorker();
    });

	// Phase 67.3: lightweight browser notifications while CampusMart is open.
	// This deliberately does not promise background Web Push when all tabs are closed.
	onMount(() => {
		/** @type {Set<string> | null} */
		let knownUnread = null;
		let polling = false;
		let stopped = false;
		let lastUserId = '';

		async function checkMessages() {
			if (polling || stopped) return;
			const userId = data.user?.id ?? '';
			if (!userId) { knownUnread = null; lastUserId = ''; return; }
			if (lastUserId !== userId) { knownUnread = null; lastUserId = userId; }
			polling = true;
			try {
				const response = await fetch('/api/notifications/unread', { cache: 'no-store' });
				if (!response.ok) return;
				const result = await response.json();
				if (!result.enabled || !('Notification' in window) || Notification.permission !== 'granted') {
					knownUnread = null;
					return;
				}
				const messages = /** @type {Array<{id:string,conversation_id:string}>} */ (result.messages ?? []);
				const nextUnread = new Set(messages.map((message) => message.id));
				if (knownUnread !== null) {
					// The oldest existing unread messages are not new notifications.
					for (const message of messages) {
						if (knownUnread.has(message.id)) continue;
						const notification = new Notification('New CampusMart message', {
							body: 'You have a new unread message.',
							tag: `campusmart-message-${message.id}`
						});
						notification.onclick = () => {
							window.focus();
							window.location.assign(`/messages/${encodeURIComponent(message.conversation_id)}`);
							notification.close();
						};
						}
				}
				knownUnread = nextUnread;
			} catch (err) {
				console.warn('Message notification check unavailable:', err);
			} finally {
				polling = false;
			}
		}

		void checkMessages();
		const interval = window.setInterval(() => { void checkMessages(); }, 20000);
		const onPreferenceSaved = () => { knownUnread = null; void checkMessages(); };
		window.addEventListener('campusmart:notification-settings', onPreferenceSaved);
		return () => {
			stopped = true;
			window.clearInterval(interval);
			window.removeEventListener('campusmart:notification-settings', onPreferenceSaved);
		};
	});

	// Global navigation progress indicator.
let navigationLoading = $state(false);

beforeNavigate((navigation) => {
    if (navigation.to && navigation.willUnload === false) {
        navigationLoading = true;
    }
});
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
    navigationLoading = false;
    menuOpen = false;
    navigationProgress = 0;
    if (typeof window !== 'undefined') previousScrollY = window.scrollY;
});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>campusmart</title>
</svelte:head>

<svelte:window bind:scrollY onscroll={handleScroll} onkeydown={(event) => { if (event.key === 'Escape') themeMenuOpen = false; }} />

<DesktopSidebar user={data.user} profile={data.profile} isStaff={data.isStaff} staffRole={data.staffRole} pathname={page.url.pathname} unreadMessages={data.unreadMessages ?? 0} pendingVerificationRequests={data.pendingVerificationRequests ?? 0} savedPriceDropAlerts={data.savedPriceDropAlerts ?? 0} />

{#if navigationLoading}
    <div class="navigation-loading" role="progressbar" aria-label="Loading page"></div>
{/if}
<div class="app-shell">
<header class="top" class:scrolled={scrollY > 10} style={`--header-hide: ${menuOpen ? 0 : navigationProgress}`}>
	<button class="menu" type="button" aria-label="Open menu" aria-haspopup="dialog" aria-expanded={menuOpen} aria-controls="site-menu" bind:this={menuBtn} onclick={() => (menuOpen = true)}>
		<Icon name="menu" />
	</button>
	<Logo height={26} />
	<span class="grow"></span>
	<div class="theme-picker">
		<button class="theme-toggle" type="button" aria-label={`Appearance: ${themePreference}. Choose theme`} aria-haspopup="true" aria-expanded={themeMenuOpen} onclick={() => (themeMenuOpen = !themeMenuOpen)}>
			<span aria-hidden="true">{themePreference === 'dark' ? '☾' : themePreference === 'system' ? '◐' : '☀'}</span>
		</button>
		{#if themeMenuOpen}
			<div class="theme-options" role="group" aria-label="Appearance preference">
				{#each themeChoices as choice}
					<button type="button" class:chosen={themePreference === choice} aria-pressed={themePreference === choice} onclick={() => setTheme(choice)}>{choice === 'light' ? '☀ Light' : choice === 'dark' ? '☾ Dark' : '◐ System'}</button>
				{/each}
			</div>
		{/if}
	</div>
	<a class="sell" href="/sell"><Icon name="plus" size={18} /><span class="long">Sell an item</span><span class="short">Sell</span></a>
	{#if data.user}
		<a class="me" href="/account" aria-label="My account"><Avatar path={data.profile?.avatar_path} name={data.profile?.display_name ?? data.user?.email} size={40} /></a>
	{:else}
		<a class="signin" href="/signin">Sign in</a>
	{/if}
</header>

{#if menuOpen}
	<NavDrawer user={data.user} isStaff={data.isStaff} staffRole={data.staffRole} pathname={page.url.pathname} unreadMessages={data.unreadMessages ?? 0} pendingVerificationRequests={data.pendingVerificationRequests ?? 0} savedPriceDropAlerts={data.savedPriceDropAlerts ?? 0} onclose={closeMenu} />
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
	.theme-picker { position: relative; flex: none; }
	.theme-toggle { width: 40px; height: 40px; display: grid; place-items: center; border: 1px solid var(--line); border-radius: 14px; background: rgba(255,255,255,.25); color: var(--ink); cursor: pointer; -webkit-backdrop-filter: blur(14px); backdrop-filter: blur(14px); }
	.theme-toggle:focus-visible, .theme-options button:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }
	.theme-options { position: absolute; top: calc(100% + 8px); right: 0; z-index: 50; min-width: 146px; display: grid; gap: 3px; padding: 7px; border-radius: 16px; border: 1px solid var(--line); background: var(--bg); color: var(--ink); box-shadow: 0 14px 35px rgba(0,0,0,.18); -webkit-backdrop-filter: blur(20px); backdrop-filter: blur(20px); }
	.theme-options button { min-height: 38px; text-align: left; border: 0; background: transparent; color: inherit; padding: 7px 10px; border-radius: 10px; cursor: pointer; font: inherit; font-size: 13px; }
	.theme-options button:hover, .theme-options button.chosen { background: rgba(200,16,46,.12); }
	:global(html[data-theme='dark']) .theme-toggle { background: rgba(255,255,255,.09); border-color: rgba(255,255,255,.24); color: #fff; }
	:global(html[data-theme='dark']) .theme-options { background: rgba(14,14,14,.94); border-color: rgba(255,255,255,.23); color: #fff; }
	:global(html[data-theme='dark']) .theme-options button:hover, :global(html[data-theme='dark']) .theme-options button.chosen { background: rgba(255,255,255,.14); }
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
	.navigation-loading {
    position: fixed;
    top: 0;
    left: 0;
    width: 35%;
    height: 3px;
    z-index: 9999;
    background: #c8102e;
    border-radius: 0 999px 999px 0;
    pointer-events: none;
    animation: navigation-progress 1.2s ease-in-out infinite alternate;
}

@keyframes navigation-progress {
    from {
        transform: translateX(-100%);
    }

    to {
        transform: translateX(285%);
    }
}

@media (prefers-reduced-motion: reduce) {
    .navigation-loading {
        animation: none;
        width: 100%;
    }
}

:global(html[data-theme='dark']) .navigation-loading {
    background: #ff779a;
}
</style>
