<script>
	/** @type {{ name: string, size?: number }} */
	let { name, size = 22 } = $props();
	/** @type {Record<string, string>} */
	const paths = {
		menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
		close: '<path d="M6 6l12 12M18 6L6 18"/>',
		home: '<path d="M4 11l8-7 8 7v9H4z"/>',
		heart: '<path d="M12 20s-7-4.6-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.4-7 10-7 10z"/>',
		plus: '<path d="M12 5v14M5 12h14"/>',
		chat: '<path d="M4 5h16v11H9l-5 4z"/>',
		user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-5 15-5 16 0"/>',
		tag: '<path d="M3 12V4h8l10 10-8 8z"/><circle cx="7.5" cy="8.5" r="1.2"/>',
		shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/><path d="M8.5 12l2.5 2.5 4.5-5"/>',
		login: '<path d="M14 4h6v16h-6M10 8l-4 4 4 4M6 12h10"/>',
		logout: '<path d="M10 4H4v16h6M16 8l4 4-4 4M20 12H9"/>',
		pin: '<path d="M12 21s-7-6-7-11a7 7 0 0114 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/>',
		box: '<path d="M12 3l8 4v10l-8 4-8-4V7z"/><path d="M4 7l8 4 8-4M12 11v10"/>',
		phone: '<path d="M8 3h8v18H8z"/><path d="M11 18h2"/>',
		laptop: '<path d="M5 6h14v9H5z"/><path d="M3 19h18"/>',
		cap: '<path d="M2 9l10-5 10 5-10 5z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
		shirt: '<path d="M8 4l-5 4 3 3 2-1v10h8V10l2 1 3-3-5-4a4 4 0 01-8 0z"/>',
		plug: '<path d="M9 3v5M15 3v5M6 8h12v3a6 6 0 01-12 0zM12 17v4"/>',
		game: '<path d="M6 8h12a4 4 0 014 4v2a3 3 0 01-5 2l-1-2H8l-1 2a3 3 0 01-5-2v-2a4 4 0 014-4z"/><path d="M8 11v3M6.5 12.5h3"/>',
		ball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 010 18M12 3a14 14 0 000 18"/>',
		sliders: '<path d="M4 7h10M18 7h2M4 17h2M10 17h10"/><circle cx="16" cy="7" r="2"/><circle cx="8" cy="17" r="2"/>',
		search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
		verified: '<circle cx="12" cy="12" r="9"/><path d="M8 12.5l2.5 2.5 5-5.5"/>'
	};
</script>

<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{@html paths[name] ?? ''}</svg>
