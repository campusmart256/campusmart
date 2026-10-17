<script>
	/** @type {import('./$types').PageProps} */
	let { data, form } = $props();
	const user = $derived(data.user);
	const isSuperAdmin = $derived(data.role === 'super_admin');
	/** @param {string | null | undefined} value */
	const prettyStatus = (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : 'Active';
</script>

<svelte:head>
	<title>{data.user.display_name || 'Account details'} | CampusMart Admin</title>
</svelte:head>

<main class="users-shell">
	<a class="back" href="/admin/users">← Back to User Management</a>
	<header class="hero">
		<div class="eyebrow">CampusMart · Account management</div>
		<h1>{user.display_name || 'Unnamed account'}</h1>
		<p>Account details, moderation controls, and recorded history.</p>
		<span class="role-pill">{isSuperAdmin ? 'Super Admin' : 'Moderator'}</span>
	</header>
	{#if data.updated}<p class="success" role="status">Account status updated successfully.</p>{/if}
	{#if data.message}<p class="warning" role="alert">{data.message}</p>{/if}
	{#if form?.message}<p class="warning" role="alert">{form.message}</p>{/if}
		<section class="panel details" aria-labelledby="details-title">
			<h2 id="details-title">Account details</h2>
			<div class="details-grid">
				<div><span class="muted">Name</span><strong>{user.display_name || 'Unnamed account'}</strong></div>
				<div><span class="muted">Account standing</span><strong>{prettyStatus(user.standing?.status)}</strong></div>
				<div><span class="muted">Student verification</span><strong>{user.verification_status || 'Unknown'}</strong></div>
				<div><span class="muted">Staff role</span><strong>{user.staffRole || 'Student'}</strong></div>
			</div>
			{#if user.standing?.reason}<p class="reason"><strong>Current standing reason:</strong> {user.standing.reason}</p>{/if}
			{#if user.standing?.updated_at}<p class="muted">Standing last updated: {new Date(user.standing.updated_at).toLocaleString()}</p>{/if}
		</section>

		<section class="panel" aria-labelledby="moderate-title">
			<h2 id="moderate-title">Change account standing</h2>
			{#if user.staffRole === 'super_admin'}
				<p class="warning">Super-admin accounts cannot be moderated through this tool.</p>
			{:else if user.staffRole === 'moderator' && !isSuperAdmin}
				<p class="warning">Only super admins can moderate other moderators.</p>
			{:else}
				<p class="muted">This action is checked again by the secured PostgreSQL function. Suspending or banning an account removes active listings and restoring the account will not restore those listings automatically.</p>
				<form method="POST" action="?/setStatus" class="moderation-form">
					<input type="hidden" name="userId" value={user.id} />
					<input type="hidden" name="back" value={`/admin/users/${user.id}`} />
					<label for="status">New status</label>
					<select id="status" name="status" required>
						<option value="" disabled selected>Choose a status</option>
						<option value="active">Active (restore access)</option>
						<option value="limited">Limited</option>
						<option value="suspended">Suspended</option>
						{#if isSuperAdmin}<option value="banned">Banned</option>{/if}
					</select>
					<label for="reason">Reason (required)</label>
					<textarea id="reason" name="reason" minlength="3" maxlength="500" rows="3" required placeholder="Describe why this action is appropriate"></textarea>
					<button class="danger-button" type="submit">Apply account status</button>
				</form>
			{/if}
		</section>

		<section class="panel" aria-labelledby="history-title">
			<h2 id="history-title">Recent moderation history</h2>
			{#if data.history.length === 0}<p class="muted">No recorded moderation actions for this account.</p>
			{:else}
				<ul class="history">
					{#each data.history as log (log.id)}
						<li><strong>{log.action}</strong><small>{new Date(log.created_at).toLocaleString()}</small>{#if log.reason}<p>{log.reason}</p>{/if}</li>
					{/each}
				</ul>
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

  .details-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:18px; }
  .details-grid>div { display:flex; flex-direction:column; gap:5px; min-width:0; }
  .reason { overflow-wrap:anywhere; }
  .moderation-form { max-width:560px; }
  .moderation-form label { display:block; font-weight:650; font-size:.88rem; margin:9px 0; }
  select, textarea { box-sizing:border-box; width:100%; border-radius:12px; padding:12px; font:inherit; background:rgba(250,248,251,.93); color:#252331; border:1px solid #cbbdcb; }
  button { display:inline-block; cursor:pointer; border:0; background:#a53773; color:#fff; padding:11px 17px; border-radius:12px; font:inherit; font-weight:700; text-decoration:none; }
  .moderation-form select, .moderation-form textarea { margin-bottom:12px; }
  .danger-button { margin-top:7px; }
  .history { padding:0; list-style:none; margin:0; }
  .history li { padding:13px 0; border-bottom:1px solid rgba(137,118,145,.2); display:flex; flex-direction:column; gap:4px; }
  .history small { opacity:.6; }
  .history p { margin:3px 0 0; overflow-wrap:anywhere; }
  .success { margin-top:14px; border:1px solid rgba(74,135,94,.4); padding:13px 16px; border-radius:12px; }
  :global(html[data-theme='dark']) select, :global(html[data-theme='dark']) textarea { background:#262837; border-color:#606071; color:#f2edf5; }
  @media(max-width:620px) { .details-grid { grid-template-columns:1fr; } }
</style>
