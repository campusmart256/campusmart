<script>
	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();

	const tabs = [
		{ label: 'Pending', href: '/admin/verification?status=pending', status: 'pending' },
		{ label: 'Approved', href: '/admin/verification?status=approved', status: 'approved' },
		{ label: 'Rejected', href: '/admin/verification?status=rejected', status: 'rejected' }
	];

	/** @param {string | null | undefined} value */
function dateText(value) {
		if (!value) return 'Unknown date';
		return new Date(value).toLocaleString();
	}

	/** @param {number | null | undefined} bytes */
	function fileSize(bytes) {
		if (!bytes) return 'Unknown size';
		if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
		return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
	}
</script>

<svelte:head><title>Verification requests · campusmart</title></svelte:head>

<section class="wrap">
	<div class="hero">
		<p class="eyebrow">Admin</p>
		<h1>Student verification requests</h1>
		<p>Review student details, approve real campus accounts, or reject requests that need correction.</p>
	</div>

	{#if data.decided}
		<div class="success">Verification request updated.</div>
	{/if}
	{#if form?.message}
		<div class="error">{form.message}</div>
	{/if}
	{#if data.message}
		<div class="error">{data.message}</div>
	{/if}

	<nav class="tabs" aria-label="Verification request status">
		{#each tabs as tab}
			<a href={tab.href} aria-current={data.status === tab.status ? 'page' : undefined}>{tab.label}</a>
		{/each}
	</nav>

	{#if data.requests.length === 0}
		<div class="empty">
			<h2>No {data.status} requests</h2>
			<p>When students request verification, they will appear here.</p>
		</div>
	{:else}
		<div class="list">
			{#each data.requests as request (request.id)}
				<article class="card">
					<div class="topline">
						<div>
							<h2>{request.full_name ?? 'Hidden after decision'}</h2>
							<p>{request.profile?.display_name ?? 'CampusMart user'} · {request.profile?.campuses?.name ?? 'Campus not shown'}</p>
						</div>
						<span class:pending={request.status === 'pending'} class:approved={request.status === 'approved'} class:rejected={request.status === 'rejected'}>{request.status}</span>
					</div>

					<div class="grid">
						<div><span>Full name</span><strong>{request.full_name ?? 'Hidden'}</strong></div>
						<div><span>Course / programme</span><strong>{request.course ?? 'Hidden'}</strong></div>
						<div><span>Year of study</span><strong>{request.year_of_study ?? 'Hidden'}</strong></div>
						<div><span>Registration number</span><strong>{request.registration_number ?? 'Hidden'}</strong></div>
						<div><span>Profile status</span><strong>{request.profile?.verification_status ?? 'Unknown'}</strong></div>
						<div><span>Submitted</span><strong>{dateText(request.created_at)}</strong></div>
					</div>

					<div class="document-box">
						<div>
							<span>Student proof document</span>
							<strong>{request.document_name ?? 'No document shown'}</strong>
							<p>{request.document_mime ?? 'Unknown type'} · {fileSize(request.document_size)}</p>
						</div>
						{#if request.document_name}
							<a class="doc-link" href={`/admin/verification/document/${request.id}`} target="_blank" rel="noreferrer">Open document</a>
						{/if}
					</div>

					{#if request.reject_reason}
						<div class="note"><strong>Reject reason:</strong> {request.reject_reason}</div>
					{/if}

					{#if request.status === 'pending'}
						<div class="actions">
							<form method="POST" action="?/approve">
								<input type="hidden" name="requestId" value={request.id} />
								<button class="approve" type="submit">Approve verification</button>
							</form>
							<form class="reject-form" method="POST" action="?/reject">
								<input type="hidden" name="requestId" value={request.id} />
								<input name="reason" placeholder="Reason if rejecting" required />
								<button class="reject" type="submit">Reject</button>
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
	.hero p:not(.eyebrow) { margin: 8px 0 0; color: var(--body); max-width: 680px; }
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
	.topline span { border-radius: 999px; padding: 5px 10px; font-weight: 900; font-size: 12px; text-transform: uppercase; }
	.pending { background: #fff7ed; color: #c2410c; }
	.approved { background: #ecfdf3; color: #027a48; }
	.rejected { background: #fff0f3; color: #b00020; }
	.grid { display: grid; gap: 10px; margin-top: 16px; }
	.grid div { background: var(--bg); border: 1px solid var(--line); border-radius: 14px; padding: 12px; min-width: 0; }
	.grid span { display: block; color: var(--mute); font-size: 12px; font-weight: 800; margin-bottom: 4px; }
	.grid strong { overflow-wrap: anywhere; }
	.note { margin-top: 14px; background: #fff7ed; border: 1px solid #fed7aa; border-radius: 14px; padding: 12px; color: #9a3412; }
	.document-box { margin-top: 14px; display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #f8fafc; border: 1px solid var(--line); border-radius: 16px; padding: 12px; }
	.document-box span { display: block; color: var(--mute); font-size: 12px; font-weight: 900; margin-bottom: 3px; }
	.document-box strong { display: block; overflow-wrap: anywhere; }
	.document-box p { margin: 4px 0 0; font-size: 13px; color: var(--body); }
	.doc-link { flex: none; border-radius: 999px; padding: 9px 12px; background: var(--red); color: #fff; font-weight: 900; font-size: 13px; }
	.doc-link:hover { background: var(--red-dark); color: #fff; text-decoration: none; }
	.actions { display: grid; gap: 10px; margin-top: 16px; }
	.actions form { margin: 0; }
	button, input { font: inherit; }
	.approve, .reject { border: 0; border-radius: 14px; min-height: 46px; padding: 0 16px; font-weight: 900; cursor: pointer; }
	.approve { width: 100%; background: var(--red); color: #fff; }
	.reject { background: #fff0f3; color: #b00020; border: 1px solid #ffd6de; }
	.reject-form { display: grid; gap: 8px; }
	.reject-form input { min-height: 46px; border: 1px solid var(--line); border-radius: 14px; padding: 0 14px; }
	@media (min-width: 720px) {
		.wrap { padding-top: 32px; }
		.grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
		.actions { grid-template-columns: 220px 1fr; align-items: center; }
		.reject-form { grid-template-columns: 1fr auto; }
	}

	/* Verification card and empty state use dark surfaces in dark mode. */
	:global(html[data-theme='dark']) .hero { background:linear-gradient(135deg,#222936,#30232d); border-color:rgba(255,255,255,.16); }
	:global(html[data-theme='dark']) .hero h1, :global(html[data-theme='dark']) .empty h2 { color:#f6f7fb; }
	:global(html[data-theme='dark']) .hero p:not(.eyebrow), :global(html[data-theme='dark']) .empty { color:#c0cada; }
	:global(html[data-theme='dark']) .tabs a:not([aria-current='page']) { background:#252b38; color:#eef2f8; border-color:rgba(255,255,255,.18); }
	:global(html[data-theme='dark']) .empty, :global(html[data-theme='dark']) .card { background:#1e2430; border-color:rgba(255,255,255,.16); color:#eef2f8; }
	:global(html[data-theme='dark']) .card p { color:#c0cada; }
	:global(html[data-theme='dark']) .grid div, :global(html[data-theme='dark']) .document-box { background:#252d3b; border-color:rgba(255,255,255,.14); color:#eef2f8; }
</style>
