<script>
	import { formatNumber } from '#lib/format.js';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();

	const tabs = [
		{ label: 'Open', href: '/admin/reports?status=open', status: 'open' },
		{ label: 'Actioned', href: '/admin/reports?status=actioned', status: 'actioned' },
		{ label: 'Dismissed', href: '/admin/reports?status=dismissed', status: 'dismissed' }
	];

	const reasons = {
		scam_or_fake: 'Scam or fake listing',
		prohibited_item: 'Prohibited item',
		harassment: 'Harassment or unsafe seller',
		other: 'Other'
	};

	function dateText(value) {
		if (!value) return 'Unknown date';
		return new Date(value).toLocaleString();
	}

	function typeLabel(type) {
		if (type === 'listing') return 'Item report';
		if (type === 'conversation') return 'Chat report';
		if (type === 'user') return 'User report';
		return 'Report';
	}
</script>

<svelte:head><title>Reports · campusmart</title></svelte:head>

<section class="wrap">
	<div class="hero">
		<p class="eyebrow">Moderator tools</p>
		<h1>Reports</h1>
		<p>Review reported items, chats, and users. Remove unsafe listings or close reports after checking them.</p>
	</div>

	{#if data.decided}
		<div class="success">Report updated.</div>
	{/if}
	{#if form?.message}
		<div class="error">{form.message}</div>
	{/if}
	{#if data.message}
		<div class="error">{data.message}</div>
	{/if}

	<nav class="tabs" aria-label="Report status">
		{#each tabs as tab}
			<a href={tab.href} aria-current={data.status === tab.status ? 'page' : undefined}>{tab.label}</a>
		{/each}
	</nav>

	{#if data.reports.length === 0}
		<div class="empty">
			<h2>No {data.status} reports</h2>
			<p>When students report an item or chat, it will appear here.</p>
		</div>
	{:else}
		<div class="list">
			{#each data.reports as report (report.id)}
				<article class="card">
					<div class="topline">
						<div>
							<p class="eyebrow">{typeLabel(report.type)}</p>
							<h2>{reasons[report.reason] ?? report.reason}</h2>
							<p>Reported {dateText(report.created_at)}</p>
						</div>
						<span class:open={report.status === 'open'} class:actioned={report.status === 'actioned'} class:dismissed={report.status === 'dismissed'}>{report.status}</span>
					</div>

					{#if report.listing}
						<div class="listing-box">
							{#if report.listing.cover}
								<img src="/photos/{report.listing.cover}" alt="{report.listing.title}" />
							{:else}
								<div class="no-photo">No photo</div>
							{/if}
							<div>
								<h3>{report.listing.title}</h3>
								<p>UGX {formatNumber(report.listing.price_ugx)} · {report.listing.status}</p>
								<a href="/listing/{report.listing.id}" target="_blank" rel="noreferrer">Open item</a>
							</div>
						</div>
					{/if}

					<div class="grid">
						<div><span>Reporter</span><strong>{report.reporter?.display_name ?? 'CampusMart user'}</strong></div>
						<div><span>Reported user</span><strong>{report.targetUser?.display_name ?? 'Not shown'}</strong></div>
						<div><span>Type</span><strong>{typeLabel(report.type)}</strong></div>
						<div><span>Report ID</span><strong>{report.id}</strong></div>
					</div>

					{#if report.note}
						<div class="note"><strong>Student note:</strong> {report.note}</div>
					{/if}
					{#if report.resolution_note}
						<div class="resolution"><strong>Moderator note:</strong> {report.resolution_note}</div>
					{/if}

					{#if report.conversation_id}
						<p class="conversation">Conversation ID: <code>{report.conversation_id}</code></p>
					{/if}

					{#if report.status === 'open'}
						<div class="actions">
							{#if report.listingId}
								<form method="POST" action="?/removeListing">
									<input type="hidden" name="reportId" value={report.id} />
									<input type="hidden" name="listingId" value={report.listingId} />
									<input name="note" placeholder="Reason for removing listing" required />
									<button class="danger" type="submit">Remove listing</button>
								</form>
							{/if}
							<form method="POST" action="?/markActioned">
								<input type="hidden" name="reportId" value={report.id} />
								<input name="note" placeholder="Action taken or review note" required />
								<button class="actioned-btn" type="submit">Mark actioned</button>
							</form>
							<form method="POST" action="?/dismiss">
								<input type="hidden" name="reportId" value={report.id} />
								<input name="note" placeholder="Why dismissing?" required />
								<button class="dismiss" type="submit">Dismiss</button>
							</form>
						</div>
					{/if}
				</article>
			{/each}
		</div>
	{/if}
</section>

<style>
	.wrap { width: min(1120px, calc(100% - 28px)); margin: 0 auto; padding: 22px 0 96px; }
	.hero { background: linear-gradient(135deg, #fff, #fdecef); border: 1px solid var(--line); border-radius: 24px; padding: 22px; }
	.eyebrow { margin: 0 0 4px; color: var(--red); text-transform: uppercase; letter-spacing: 0.08em; font-size: 12px; font-weight: 900; }
	h1 { margin: 0; font-size: clamp(28px, 4vw, 44px); line-height: 1.05; }
	.hero p:not(.eyebrow) { margin: 8px 0 0; color: var(--body); max-width: 720px; }
	.success, .error { margin: 14px 0 0; border-radius: 16px; padding: 14px 16px; font-weight: 800; }
	.success { background: #ecfdf3; color: #027a48; }
	.error { background: #fff0f3; color: #b00020; }
	.tabs { display: flex; gap: 8px; overflow-x: auto; padding: 16px 0 4px; }
	.tabs a { border: 1px solid var(--line); border-radius: 999px; padding: 9px 14px; color: var(--ink); font-weight: 800; background: #fff; white-space: nowrap; }
	.tabs a[aria-current='page'] { background: var(--red); color: #fff; border-color: var(--red); }
	.empty, .card { background: #fff; border: 1px solid var(--line); border-radius: 22px; box-shadow: var(--shadow); }
	.empty { padding: 28px; text-align: center; color: var(--body); }
	.empty h2 { margin: 0 0 6px; color: var(--ink); }
	.list { display: grid; gap: 14px; margin-top: 12px; }
	.card { padding: 18px; }
	.topline { display: flex; justify-content: space-between; gap: 16px; align-items: flex-start; }
	.card h2 { margin: 0; font-size: 22px; }
	.card p { margin: 4px 0 0; color: var(--body); }
	.topline > span { border-radius: 999px; padding: 5px 10px; font-weight: 900; font-size: 12px; text-transform: uppercase; }
	.open { background: #fff7ed; color: #c2410c; }
	.actioned { background: #ecfdf3; color: #027a48; }
	.dismissed { background: #f1f5f9; color: #475569; }
	.listing-box { display: grid; grid-template-columns: 92px 1fr; gap: 12px; align-items: center; margin-top: 14px; background: var(--bg); border: 1px solid var(--line); border-radius: 16px; padding: 10px; }
	.listing-box img, .no-photo { width: 92px; height: 76px; border-radius: 12px; object-fit: cover; background: #eee7e4; display: flex; align-items: center; justify-content: center; color: var(--mute); font-size: 12px; }
	.listing-box h3 { margin: 0; font-size: 18px; }
	.grid { display: grid; gap: 10px; margin-top: 14px; }
	.grid div { background: var(--bg); border: 1px solid var(--line); border-radius: 14px; padding: 12px; min-width: 0; }
	.grid span { display: block; color: var(--mute); font-size: 12px; font-weight: 800; margin-bottom: 4px; }
	.grid strong { overflow-wrap: anywhere; }
	.note, .resolution, .conversation { margin-top: 14px; border-radius: 14px; padding: 12px; }
	.note { background: #fff7ed; border: 1px solid #fed7aa; color: #9a3412; }
	.resolution { background: #ecfdf3; border: 1px solid #bbf7d0; color: #027a48; }
	.conversation { background: #f8fafc; border: 1px solid var(--line); overflow-wrap: anywhere; }
	.actions { display: grid; gap: 10px; margin-top: 16px; }
	.actions form { display: grid; gap: 8px; margin: 0; }
	.actions input { width: 100%; border: 1px solid var(--line); border-radius: 14px; padding: 11px 12px; font: inherit; }
	.actions button { border: 0; border-radius: 14px; padding: 12px 14px; font: inherit; font-weight: 900; cursor: pointer; }
	.danger { background: #b00020; color: #fff; }
	.actioned-btn { background: var(--red); color: #fff; }
	.dismiss { background: #f1f5f9; color: #334155; }
	@media (min-width: 720px) {
		.wrap { padding-top: 32px; }
		.grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.actions { grid-template-columns: repeat(3, minmax(0, 1fr)); align-items: start; }
	}
</style>
