<script>
	import { avatarUrl, initialsOf } from '#lib/avatar.js';
	/** @type {{ path?: string | null, name?: string | null, size?: number, label?: string }} */
	let { path = null, name = '', size = 40, label = '' } = $props();
	const url = $derived(avatarUrl(path));
</script>

{#if url}
	<img class="av" src={url} alt={label} width={size} height={size} style="width:{size}px;height:{size}px" />
{:else}
	<span class="av ini" style="width:{size}px;height:{size}px;font-size:{Math.round(size * 0.36)}px" aria-hidden={label ? undefined : 'true'} role={label ? 'img' : undefined} aria-label={label || undefined}>{initialsOf(name)}</span>
{/if}

<style>
	.av { border-radius: 50%; flex: none; display: inline-flex; align-items: center; justify-content: center; object-fit: cover; background: #fdecef; }
	.ini { color: var(--red); font-weight: 800; }
</style>
