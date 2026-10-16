<script>
	import { onMount, tick } from 'svelte';
	import Logo from './Logo.svelte';
	import Icon from './Icon.svelte';

	/** @type {{ user: any, isStaff: boolean, pathname: string, unreadMessages?: number, pendingVerificationRequests?: number, pendingReports?: number, onclose: () => void }} */
	let { user, isStaff, pathname, unreadMessages = 0, pendingVerificationRequests = 0, pendingReports = 0, onclose } = $props();

	const marketplace = $derived([
		{ label: 'Browse marketplace', href: '/', icon: 'home' },
		{ label: 'Saved items', href: '/saved', icon: 'heart' },
		{ label: 'Recently viewed', href: '/recently-viewed', icon: 'search' },
		{ label: 'Messages', href: '/messages', icon: 'chat', count: unreadMessages },
		{ label: 'My listings', href: '/my-listings', icon: 'tag' }
	]);

	/** @type {HTMLElement | undefined} */
	let panel = $state();
	/** @type {HTMLButtonElement | undefined} */
	let closeBtn = $state();

	onMount(() => {
		tick().then(() => closeBtn?.focus());
		const previous = document.body.style.overflow;
		document.body.style.overflow = 'hidden';
		return () => { document.body.style.overflow = previous; };
	});

	/** @param {KeyboardEvent} e */
	function onKeydown(e) {
		if (e.key === 'Escape') { onclose(); return; }
		if (e.key !== 'Tab' || !panel) return;
		const items = /** @type {HTMLElement[]} */ (Array.from(panel.querySelectorAll('a[href], button:not([disabled])')));
		if (!items.length) return;
		const first = items[0], last = items[items.length - 1];
		if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
		else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
	}
</script>

<svelte:window onkeydown={onKeydown} />

<div class="overlay" role="presentation" onclick={onclose}></div>
<div class="panel" id="site-menu" role="dialog" aria-modal="true" aria-label="Menu" bind:this={panel}>
	<div class="head">
		<Logo height={26} />
		<button class="x" type="button" aria-label="Close menu" bind:this={closeBtn} onclick={onclose}><Icon name="close" /></button>
	</div>

	<div class="campus">
		<Icon name="pin" size={18} />
		<div>
			<div class="small">Your campus</div>
			<div class="strong">International University of East Africa</div>
		</div>
	</div>

	<nav aria-label="Marketplace">
		<div class="group">Marketplace</div>
		{#each marketplace as item (item.href)}
			<a class="item" href={item.href} aria-current={pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href + '/')) ? 'page' : undefined}>
<Icon name={item.icon} size={20} />
<span class="label">{item.label}</span>

{#if (item.count ?? 0) > 0}
    <span class="badge" aria-label={`${item.count} unread messages`}>
        {(item.count ?? 0) > 99 ? '99+' : item.count}
    </span>
{/if}
			</a>
		{/each}
	</nav>

	<nav aria-label="Your account">
		<div class="group">Your account</div>
		{#if user}
			<a class="item" href="/account" aria-current={pathname === '/account' ? 'page' : undefined}><Icon name="user" size={20} /><span class="label">Profile &amp; verification</span></a>
			{#if isStaff}
				<a class="item" href="/admin/reports" aria-current={pathname.startsWith('/admin/reports') ? 'page' : undefined}>
					<Icon name="shield" size={20} />
					<span class="label">Reports</span>
					{#if pendingReports > 0}<span class="badge" aria-label={`${pendingReports} open reports`}>{pendingReports > 99 ? '99+' : pendingReports}</span>{/if}
				</a>
				<a class="item" href="/admin/verification" aria-current={pathname === '/admin/verification' ? 'page' : undefined}>
					<Icon name="shield" size={20} />
					<span class="label">Verification requests</span>
					{#if pendingVerificationRequests > 0}<span class="badge" aria-label={`${pendingVerificationRequests} pending verification requests`}>{pendingVerificationRequests > 99 ? '99+' : pendingVerificationRequests}</span>{/if}
				</a>
			{/if}
			<form method="POST" action="/signout"><button class="item btnrow" type="submit"><Icon name="logout" size={20} /><span class="label">Sign out</span></button></form>
		{:else}
			<a class="item" href="/signin" aria-current={pathname === '/signin' || pathname === '/signup' ? 'page' : undefined}><Icon name="login" size={20} /><span class="label">Sign in / Sign up</span></a>
		{/if}
	</nav>

	<div class="foot">
		<div class="strong">Your campus. Your community.</div>
		<p>Meet in public. Check the item. Pay only when you are happy.</p>
		<div class="small">&copy; 2026 campusmart</div>
	</div>
</div>

<style>
	.overlay { position: fixed; inset: 0; background: rgba(26, 26, 26, 0.55); z-index: 40; }
	.panel { position: fixed; top: 0; bottom: 0; left: 0; width: min(320px, 86vw); background: #fff; z-index: 50; overflow-y: auto; display: flex; flex-direction: column; padding: 12px 12px 20px; box-shadow: 4px 0 24px rgba(0, 0, 0, 0.18); animation: slide 0.18s ease-out; }
	@keyframes slide { from { transform: translateX(-100%); } to { transform: none; } }
	@media (prefers-reduced-motion: reduce) { .panel { animation: none; } }
	.head { display: flex; align-items: center; justify-content: space-between; min-height: 48px; padding: 0 4px; }
	.x { width: 44px; height: 44px; border: 0; background: none; border-radius: 50%; color: var(--ink); display: flex; align-items: center; justify-content: center; cursor: pointer; }
	.x:hover { background: #f4eeec; }
	.campus { display: flex; gap: 10px; align-items: flex-start; margin: 8px 4px 4px; padding: 12px; border-radius: 12px; background: var(--bg); border: 1px solid var(--line); color: var(--red); }
	.campus .small, .foot .small { color: var(--mute); font-size: 12px; }
	.strong { color: var(--ink); font-weight: 700; font-size: 14px; }
	.group { margin: 18px 8px 6px; font-size: 12px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; color: var(--mute); }
	.item { display: flex; align-items: center; gap: 12px; min-height: 48px; padding: 0 12px; border-radius: 12px; color: var(--ink); font-weight: 600; text-decoration: none; width: 100%; text-align: left; font-family: inherit; font-size: 15px; }
	.item:hover { background: #f8f2f0; text-decoration: none; }
	.item[aria-current='page'] { background: #fdecef; color: var(--red); }
	.item .label { flex: 1; }

	.badge { min-width: 22px; height: 22px; padding: 0 7px; border-radius: 999px; display: inline-flex; align-items: center; justify-content: center; background: var(--red); color: #fff; font-size: 12px; font-weight: 800; }
	.btnrow { background: none; border: 0; cursor: pointer; }
	form { margin: 0; }
	.foot { margin-top: auto; padding: 18px 12px 0; border-top: 1px solid var(--line); }
	.foot p { margin: 4px 0 10px; color: var(--body); font-size: 13px; }
</style>
