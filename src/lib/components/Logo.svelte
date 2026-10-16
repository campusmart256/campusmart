<script>
	/** @type {{ height?: number }} */
	let { height = 34 } = $props();
</script>

<a class="logo" href="/" aria-label="CampusMart home" style={`--logo-size: ${height}px`}>
	<svg class="cm-cap-icon" viewBox="0 0 64 64" aria-hidden="true" focusable="false">
		<defs>
			<linearGradient id="cm-tile" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#6e274b" />
				<stop offset=".52" stop-color="#351629" />
				<stop offset="1" stop-color="#191b2b" />
			</linearGradient>
			<linearGradient id="cm-edge" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#ffbad1" />
				<stop offset=".45" stop-color="#fb6495" />
				<stop offset="1" stop-color="#be3064" />
			</linearGradient>
			<linearGradient id="cm-cap" x1="0" y1="0" x2="1" y2="1">
				<stop offset="0" stop-color="#ffe0ea" />
				<stop offset=".50" stop-color="#ff9dbd" />
				<stop offset="1" stop-color="#fc4b82" />
			</linearGradient>
		</defs>
		<rect x="1.5" y="1.5" width="61" height="61" rx="17" fill="url(#cm-tile)" stroke="url(#cm-edge)" stroke-width="2" />
		<path d="M10 18Q10 10 20 10H45" fill="none" stroke="#ffffff" stroke-opacity=".24" stroke-width="2" stroke-linecap="round" />
		<path d="M9.5 31.5 32 20l22.5 11.5L32 43Z" fill="url(#cm-cap)" stroke="#ffe1eb" stroke-width="1.15" stroke-linejoin="round" />
		<path d="M20.5 38.3v9c7.1 5.8 15.9 5.8 23 0v-9L32 44.7Z" fill="#fa6395" />
		<path d="M20.5 47.3c7.1 5.8 15.9 5.8 23 0" fill="none" stroke="#ffc1d5" stroke-opacity=".6" stroke-width="1.5" />
		<path d="M32 31.5h17v13" fill="none" stroke="#ffd3e3" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" />
		<circle cx="49" cy="46.5" r="3.5" fill="#ff8cb1" />
	</svg>
	<span class="wordmark">campusmart</span>
</a>

<style>
	.logo {
		display: inline-flex;
		align-items: center;
		gap: calc(var(--logo-size) * .18);
		max-width: 100%;
		text-decoration: none;
		white-space: nowrap;
	}
	.logo:hover { text-decoration: none; }
	.cm-cap-icon {
		width: var(--logo-size);
		height: var(--logo-size);
		flex: none;
		overflow: visible;
		filter: drop-shadow(0 3px 7px rgba(197, 43, 95, .21));
	}
	.wordmark {
		font-size: calc(var(--logo-size) * .54);
		font-weight: 850;
		letter-spacing: -.035em;
		line-height: 1.08;
		background: linear-gradient(105deg, #bb204d 0%, #e14471 60%, #ee6488 100%);
		-webkit-background-clip: text;
		background-clip: text;
		-webkit-text-fill-color: transparent;
		color: #ca315d;
	}
	:global(html[data-theme='dark']) .cm-cap-icon {
		filter: drop-shadow(0 0 8px rgba(250, 89, 142, .42));
	}
	:global(html[data-theme='dark']) .wordmark {
		background-image: linear-gradient(105deg, #ff75a1 0%, #ff9fba 52%, #ff6f9e 100%);
		filter: drop-shadow(0 0 9px rgba(255, 80, 133, .18));
	}
	@media (prefers-reduced-motion: no-preference) {
		.cm-cap-icon { transition: filter .2s ease; }
		.logo:hover .cm-cap-icon { filter: drop-shadow(0 3px 9px rgba(250, 89, 142, .45)); }
	}
</style>
