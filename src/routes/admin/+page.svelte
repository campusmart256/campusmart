<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
	const isSuperAdmin = $derived(data.role === 'super_admin');
</script>

<svelte:head>
	<title>Admin dashboard | CampusMart</title>
	<meta name="description" content="CampusMart staff moderation dashboard." />
</svelte:head>

<main class="admin-shell">
	<header class="hero">
		<div class="eyebrow"><span aria-hidden="true">✦</span> CampusMart · Administration</div>
		<h1>{isSuperAdmin ? 'Super Admin Dashboard' : 'Moderator Dashboard'}</h1>
		<p>Review reports, verify students, and help keep the marketplace trustworthy.</p>
		<div class="role-pill">Signed in as {isSuperAdmin ? 'Super Admin' : 'Moderator'}</div>
	</header>

	<section aria-labelledby="overview-title" class="section">
		<h2 id="overview-title">Needs attention</h2>
		<div class="stats">
			<a class="stat glass" href="/admin/reports?status=open">
				<span class="stat-label">Open reports</span>
				<strong class="stat-number">{data.openReports ?? '—'}</strong>
				<span class="stat-link">Review reports <span aria-hidden="true">→</span></span>
			</a>
			<a class="stat glass" href="/admin/verification?status=pending">
				<span class="stat-label">Verification requests</span>
				<strong class="stat-number">{data.pendingVerifications ?? '—'}</strong>
				<span class="stat-link">Review requests <span aria-hidden="true">→</span></span>
			</a>
		</div>
		{#if data.openReports === null || data.pendingVerifications === null}
			<p class="notice" role="status">Some counts are unavailable right now. You can still open the moderation pages.</p>
		{/if}
	</section>

	<section aria-labelledby="tools-title" class="section">
		<h2 id="tools-title">Moderation tools</h2>
		<div class="tools">
			<a class="tool glass" href="/admin/reports">
				<span class="tool-icon" aria-hidden="true">⚑</span>
				<span class="tool-copy"><strong>Reports</strong><span>Review reported listings, conversations, and accounts.</span></span>
				<span class="arrow" aria-hidden="true">→</span>
			</a>
			<a class="tool glass" href="/admin/users">
				<span class="tool-icon" aria-hidden="true">♙</span>
				<span class="tool-copy"><strong>User management</strong><span>Search accounts, review standing, and apply authorized moderation actions.</span></span>
				<span class="arrow" aria-hidden="true">→</span>
			</a>
			<a class="tool glass" href="/admin/verification">
				<span class="tool-icon" aria-hidden="true">✓</span>
				<span class="tool-copy"><strong>Student verification</strong><span>Approve or reject submitted verification requests.</span></span>
				<span class="arrow" aria-hidden="true">→</span>
			</a>
		</div>
	</section>

	{#if isSuperAdmin}
		<section aria-labelledby="super-title" class="section">
			<h2 id="super-title">Super-admin workspace</h2>
			<div class="tools">
				<a class="tool glass" href="/admin/staff">
					<span class="tool-icon" aria-hidden="true">♜</span>
					<span class="tool-copy"><strong>Staff management</strong><span>Assign moderators and securely manage staff roles.</span></span>
					<span class="arrow" aria-hidden="true">→</span>
				</a>
			</div>
			<div class="glass upcoming" style="margin-top:14px">
				<p class="upcoming-title">Audit-log overview</p>
				<p>A platform-wide audit-log page is planned for a later phase.</p>
			</div>
		</section>
	{/if}

	<p class="back"><a href="/">← Back to marketplace</a></p>
</main>

<style>
	.admin-shell { width: min(1120px, 100%); margin: 0 auto; padding: clamp(18px, 4vw, 42px) 16px 60px; color: var(--text-primary, #232638); }
	.hero { position: relative; overflow: hidden; border-radius: 28px; padding: clamp(28px, 5vw, 48px); color: #fff; background: linear-gradient(125deg, #54254c, #a53773 60%, #c55588); box-shadow: 0 16px 36px rgba(56, 12, 43, .15); }
	.hero::after { content: ''; position: absolute; width: 270px; height: 270px; right: -85px; top: -140px; border-radius: 50%; background: rgba(255,255,255,.09); pointer-events:none; }
	.eyebrow { letter-spacing: .08em; text-transform: uppercase; font-size: .75rem; font-weight: 750; opacity: .93; }
	h1 { margin: 12px 0 8px; font-size: clamp(1.8rem, 4vw, 2.7rem); line-height: 1.18; }
	.hero p { margin: 0; max-width: 60ch; color: rgba(255,255,255,.9); line-height: 1.6; }
	.role-pill { display: inline-flex; margin-top: 22px; background: rgba(255,255,255,.15); border: 1px solid rgba(255,255,255,.33); border-radius: 999px; padding: 8px 14px; font-size: .82rem; font-weight: 700; }
	.section { margin-top: 32px; }
	h2 { font-size: 1.15rem; margin: 0 0 16px; }
	.stats, .tools { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 14px; }
	.glass { border: 1px solid rgba(137,118,145,.22); background: rgba(255,255,255,.79); border-radius: 20px; box-shadow: 0 8px 24px rgba(42, 30, 55, .05); backdrop-filter: blur(16px); }
	.stat { padding: 23px; display: flex; flex-direction: column; gap: 10px; text-decoration: none; color: inherit; transition: transform .15s, border-color .15s; }
	.stat-label { font-size: .89rem; opacity: .8; }
	.stat-number { font-size: 2.3rem; color: #ba4282; font-variant-numeric: tabular-nums; }
	.stat-link { font-weight: 700; font-size: .84rem; color: #b63878; }
	.tool { display: flex; align-items: center; padding: 19px; gap: 15px; text-decoration: none; color: inherit; transition: transform .15s, border-color .15s; }
	.tool-icon { display: grid; place-items: center; width: 45px; height: 45px; flex: none; border-radius: 14px; font-size: 1.35rem; background: rgba(202, 57, 129, .12); color: #b63878; }
	.tool-copy { display: flex; flex-direction: column; gap: 5px; flex: 1; min-width: 0; }
	.tool-copy strong { font-size: .97rem; }
	.tool-copy span { font-size: .81rem; opacity: .76; line-height: 1.5; }
	.arrow { font-size: 1.3rem; color: #ba4282; }
	.stat:hover, .tool:hover { transform: translateY(-2px); border-color: rgba(197,65,132,.5); }
	.stat:focus-visible, .tool:focus-visible, .back a:focus-visible { outline: 3px solid #e579b1; outline-offset: 3px; }
	.upcoming { padding: 22px; }
	.upcoming-title { font-weight: 750; margin: 0 0 8px; }
	.upcoming p:last-child { margin: 0; opacity: .82; font-size: .88rem; line-height: 1.65; }
	.notice { font-size: .85rem; color: #9b5265; }
	.back { margin: 30px 0 0; }
	.back a { text-decoration: none; color: #bc3b7d; font-weight: 700; }
	:global(html[data-theme='dark']) .admin-shell { color: #f2edf5; }
	:global(html[data-theme='dark']) .glass { background: rgba(35, 38, 52, .87); border-color: rgba(216, 207, 237, .15); box-shadow: 0 8px 24px rgba(0, 0, 0, .13); }
	:global(html[data-theme='dark']) .stat-number, :global(html[data-theme='dark']) .stat-link, :global(html[data-theme='dark']) .arrow, :global(html[data-theme='dark']) .back a { color: #f1a2cb; }
	:global(html[data-theme='dark']) .tool-icon { color: #f1a2cb; background: rgba(238, 121, 179, .14); }
	:global(html[data-theme='dark']) .notice { color: #edb3c8; }
	@media (max-width: 650px) { .stats, .tools { grid-template-columns: 1fr; } .hero { border-radius: 22px; } .stat { padding: 19px; } }
	@media (prefers-reduced-motion: reduce) { .stat, .tool { transition: none; } }
</style>
