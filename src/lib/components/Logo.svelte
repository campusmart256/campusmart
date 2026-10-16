<script>
	/** @type {{ height?: number }} */
	let { height = 34 } = $props();
</script>

<a class="logo" href="/" aria-label="campusmart home" style="--h:{height}px">
	<img src="/logo-tile.png" alt="" style="height:{height}px" />
	<span>campusmart</span>
</a>

<style>
	.logo { display: inline-flex; align-items: center; gap: calc(var(--h) * 0.16); text-decoration: none; }
	.logo:hover { text-decoration: none; }
	img { width: auto; display: block; mix-blend-mode: multiply; }
	span { font-weight: 800; font-size: calc(var(--h) * 0.54); letter-spacing: -0.02em; color: var(--red); line-height: 1; }
</style>
