<script>
	/** @type {import('./$types').PageProps} */
	let { data } = $props();
	const totalPages = $derived(Math.max(1, Math.ceil(data.total / data.pageSize)));
	const isSuperAdmin = $derived(data.role === 'super_admin');
	/** @param {number} page */
	const urlFor = (page) => `/admin/users?${new URLSearchParams({ ...(data.query ? { q: data.query } : {}), page: String(page) })}`;
	/** @param {string | null | undefined} value */
	const prettyStatus = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Active';
</script>

<svelte:head>
	<title>User management | CampusMart</title>
	<meta name="description" content="CampusMart staff account management" />
</svelte:head>

<main class="users-shell">
	<a class="back" href="/admin">← Admin dashboard</a>
	<header class="hero">
		<div class="eyebrow">CampusMart · Administration</div>
		<h1>User management</h1>
		<p>Search student accounts, review their standing, and apply authorized moderation actions.</p>
		<span class="role-pill">{isSuperAdmin ? 'Super Admin' : 'Moderator'}</span>
	</header>

	{#if data.message}<p class="warning" role="alert">{data.message}</p>{/if}

	<section class="panel" aria-labelledby="search-title">
		<h2 id="search-title">Find an account</h2>
		<form method="GET" action="/admin/users" class="search-form">
			<label for="user-search">Display name or exact user ID</label>
			<div class="search-row">
				<input id="user-search" name="q" value={data.query} maxlength="80" placeholder="Search students" />
				<button type="submit">Search</button>
				{#if data.query}<a class="clear" href="/admin/users">Clear</a>{/if}
			</div>
		</form>
		<p class="muted">{data.total} matching account{data.total === 1 ? '' : 's'} · page {data.page} of {totalPages}</p>
	</section>

	<section class="panel" aria-label="Account results">
		{#if data.users.length === 0}
			<p>No matching accounts found.</p>
		{:else}
			<div class="results">
				{#each data.users as user (user.id)}
					<a class="user-row" href={`/admin/users/${user.id}`}>
						<span class="avatar" aria-hidden="true">{(user.display_name || '?').slice(0, 1).toUpperCase()}</span>
						<span class="identity"><strong>{user.display_name || 'Unnamed account'}</strong><small>{user.id}</small></span>
						<span class="pills"><span class="status">{prettyStatus(user.standing?.status)}</span>{#if user.staffRole}<span class="staff-pill">{user.staffRole === 'super_admin' ? 'Super Admin' : 'Moderator'}</span>{/if}</span>
						<span aria-hidden="true">→</span>
					</a>
				{/each}
			</div>
		{/if}
		{#if totalPages > 1}
			<nav class="pager" aria-label="Account result pages">
				{#if data.page > 1}<a href={urlFor(data.page - 1)}>← Previous</a>{/if}
				<span>Page {data.page} / {totalPages}</span>
				{#if data.page < totalPages}<a href={urlFor(data.page + 1)}>Next →</a>{/if}
			</nav>
		{/if}
	</section>


</main>

<style>

  .users-shell { width:min(1100px,100%); margin:0 auto; padding:clamp(18px,4vw,36px) 16px 70px; color:var(--text-primary,#252331); }
  .back { display:inline-block; margin-bottom:16px; color:#bf427d; font-weight:700; text-decoration:none; }
  .hero { border-radius:26px; padding:clamp(26px,4vw,44px); background:linear-gradient(125deg,#54254c,#a53773 60%,#c55588); color:white; }
  .eyebrow { text-transform:uppercase; font-size:.74rem; letter-spacing:.08em; font-weight:750; }
  h1 { margin:12px 0 9px; font-size:clamp(1.7rem,4vw,2.5rem); }
  .hero p { color:rgba(255,255,255,.92); max-width:65ch; line-height:1.55; }
  .role-pill { display:inline-block; background:rgba(255,255,255,.16); border:1px solid rgba(255,255,255,.3); border-radius:999px; padding:7px 13px; font-size:.85rem; }
  .panel { margin-top:18px; border:1px solid rgba(137,118,145,.22); background:rgba(255,255,255,.83); backdrop-filter:blur(16px); border-radius:20px; padding:clamp(18px,3vw,26px); box-shadow:0 8px 24px rgba(42,30,55,.05); min-width:0; }
  h2 { margin:0 0 16px; font-size:1.15rem; }
  .muted { opacity:.73; line-height:1.6; font-size:.88rem; }
  .warning { margin-top:14px; border:1px solid rgba(180,92,102,.3); padding:13px 16px; border-radius:12px; }
  :global(html[data-theme='dark']) .users-shell { color:#f2edf5; }
  :global(html[data-theme='dark']) .panel { background:rgba(35,38,52,.87); border-color:rgba(216,207,237,.16); }
  :global(html[data-theme='dark']) .back { color:#f1a2cb; }
  @media(max-width:620px) { .hero { border-radius:20px; } }
  @media(prefers-reduced-motion:reduce) { * { scroll-behavior:auto; } }

  .search-form label { display:block; font-weight:650; font-size:.88rem; margin:9px 0; }
  .search-row { display:flex; flex-wrap:wrap; align-items:center; gap:10px; }
  input { box-sizing:border-box; width:100%; border-radius:12px; padding:12px; font:inherit; background:rgba(250,248,251,.93); color:#252331; border:1px solid #cbbdcb; }
  .search-row input { flex:1 1 230px; }
  button, .clear, .pager a { display:inline-block; cursor:pointer; border:0; background:#a53773; color:#fff; padding:11px 17px; border-radius:12px; font:inherit; font-weight:700; text-decoration:none; }
  .clear { background:transparent; color:#a53773; border:1px solid currentColor; }
  .results { display:flex; flex-direction:column; gap:9px; }
  .user-row { display:flex; align-items:center; gap:12px; padding:14px; color:inherit; text-decoration:none; border:1px solid rgba(137,118,145,.2); border-radius:14px; min-width:0; }
  .user-row:hover { border-color:#ba4282; background:rgba(186,66,130,.07); }
  .avatar { width:38px; height:38px; border-radius:50%; background:rgba(186,66,130,.15); color:#ad3c78; display:grid; place-items:center; font-weight:750; flex:none; }
  .identity { display:flex; flex-direction:column; gap:4px; min-width:0; flex:1; }
  .identity small { opacity:.64; overflow-wrap:anywhere; font-size:.7rem; }
  .pills { display:flex; gap:6px; flex-wrap:wrap; justify-content:flex-end; }
  .status, .staff-pill { border:1px solid rgba(137,118,145,.25); border-radius:999px; padding:5px 9px; font-size:.74rem; white-space:nowrap; }
  .staff-pill { color:#ad3c78; }
  .pager { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-top:16px; font-size:.83rem; }
  :global(html[data-theme='dark']) input { background:#262837; border-color:#606071; color:#f2edf5; }
  :global(html[data-theme='dark']) .clear, :global(html[data-theme='dark']) .staff-pill { color:#f1a2cb; }
  :global(html[data-theme='dark']) .avatar { color:#f1a2cb; }
  @media(max-width:620px) { .user-row { flex-wrap:wrap; } .pills { width:100%; justify-content:flex-start; margin-left:50px; } }
</style>
