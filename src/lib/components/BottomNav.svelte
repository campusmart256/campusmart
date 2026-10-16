<script>
	import Icon from './Icon.svelte';
	/** @type {{ pathname: string, signedIn: boolean, unreadMessages?: number }} */
	let { pathname, signedIn, unreadMessages = 0 } = $props();
	const items = $derived([
		{ label: 'Browse', href: '/', icon: 'home' },
		{ label: 'Saved', href: '/saved', icon: 'heart' },
		{ label: 'Sell', href: '/sell', icon: 'plus', sell: true },
		{ label: 'Messages', href: '/messages', icon: 'chat', count: unreadMessages },
		{ label: 'Profile', href: signedIn ? '/account' : '/signin', icon: 'user' }
	]);
</script>

<nav class="bottom" aria-label="Main">
	{#each items as item (item.label)}
		{#if item.sell}
			<a class="sellfab" href={item.href} aria-label="Sell an item" aria-current={pathname === item.href ? 'page' : undefined}><Icon name="plus" size={26} /></a>
		{:else}
			<a href={item.href} aria-current={pathname === item.href || (item.label === 'Profile' && pathname === '/account') ? 'page' : undefined}>
				<span class="iconwrap"><Icon name={item.icon} size={22} />{#if item.count > 0}<span class="badge" aria-label={`${item.count} unread messages`}>{item.count > 99 ? '99+' : item.count}</span>{/if}</span><span>{item.label}</span>
			</a>
		{/if}
	{/each}
</nav>

<style>
	/* Frosted floating navigation: visible content gently diffuses beneath it. */
	.bottom {
		position: fixed;
		left: 12px;
		right: 12px;
		bottom: max(10px, env(safe-area-inset-bottom, 0px));
		z-index: 30;
		min-height: 68px;
		display: flex;
		align-items: center;
		justify-content: space-around;
		gap: 2px;
		padding: 8px 5px;
		border: 1px solid rgba(255, 255, 255, .82);
		border-radius: 24px;
		background: rgba(255, 255, 255, .76);
		-webkit-backdrop-filter: blur(24px) saturate(180%);
		backdrop-filter: blur(24px) saturate(180%);
		box-shadow: 0 14px 38px rgba(16, 25, 46, .14), 0 2px 9px rgba(16, 25, 46, .06), inset 0 1px 0 rgba(255, 255, 255, .9);
		isolation: isolate;
	}
	a {
		flex: 1 1 0;
		min-width: 0;
		min-height: 52px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: 4px;
		border-radius: 16px;
		font-size: 11px;
		font-weight: 700;
		color: #68656c;
		text-decoration: none;
		transition: background-color .2s ease, color .2s ease, transform .2s ease;
	}
	a:hover { text-decoration: none; background: rgba(200, 16, 46, .055); color: #c8102e; }
	a:active { transform: scale(.96); }
	a[aria-current='page']:not(.sellfab) { color: #c8102e; background: rgba(200, 16, 46, .075); }
	.iconwrap { position: relative; display: inline-flex; }
	.badge {
		position: absolute;
		top: -8px;
		right: -12px;
		min-width: 18px;
		height: 18px;
		padding: 0 5px;
		border-radius: 999px;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		background: #c8102e;
		color: #fff;
		font-size: 10px;
		font-weight: 800;
		border: 2px solid rgba(255, 255, 255, .94);
	}
	.sellfab {
		flex: 0 0 54px;
		width: 54px;
		height: 54px;
		min-height: 54px;
		margin-top: -26px;
		border-radius: 19px;
		background: #c8102e;
		color: #fff;
		border: 1px solid rgba(255, 255, 255, .2);
		box-shadow: 0 9px 22px rgba(200, 16, 46, .29);
	}
	.sellfab:hover, .sellfab[aria-current='page'] { background: #a30d25; color: #fff; }
	@media (max-width: 350px) {
		.bottom { left: 7px; right: 7px; padding-inline: 3px; }
		a { font-size: 10px; }
		.sellfab { flex-basis: 48px; width: 48px; height: 48px; min-height: 48px; }
	}
	@media (min-width: 768px) { .bottom { display: none; } }
	@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {
		.bottom { background: rgba(255, 255, 255, .97); }
	}
	@media (prefers-reduced-transparency: reduce) {
		.bottom { background: #fff; -webkit-backdrop-filter: none; backdrop-filter: none; }
	}
	@media (prefers-reduced-motion: reduce) { a { transition: none; } }
</style>
