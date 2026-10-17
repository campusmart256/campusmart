<script>
  /** @type {import('./$types').PageProps} */
  let { data } = $props();
</script>

<svelte:head><title>Staff Management | CampusMart</title><meta name="description" content="Manage CampusMart staff." /></svelte:head>
<main class="staff-shell">
  <a class="back" href="/admin">← Admin dashboard</a>
  <header class="hero"><p class="eyebrow">CampusMart · Super Admin</p><h1>Staff Management</h1><p>Select an account to open its dedicated management page.</p></header>
  {#if data.updated}<p class="success" role="status">Staff change completed successfully.</p>{/if}
  {#each data.warnings as warning}<p class="error" role="status">{warning}</p>{/each}
  <section class="panel" aria-labelledby="staff-title">
    <div class="section-heading"><h2 id="staff-title">Team members</h2><span>{data.staff.length} shown</span></div>
    {#if data.staff.length === 0}<p class="muted">No staff members were returned.</p>{:else}
      <div class="member-list">
        {#each data.staff as person (person.user_id)}
          <a class="member" href={`/admin/staff/${person.user_id}`}>
            <div class="member-copy"><strong>{person.display_name}</strong><span class="muted">{person.user_id}</span></div>
            <div class="member-actions"><span class="pill">{person.role === 'super_admin' ? 'Super Admin' : 'Moderator'}</span>{#if person.user_id === data.currentUserId}<span class="muted">You</span>{/if}<span class="arrow" aria-hidden="true">→</span></div>
          </a>
        {/each}
      </div>
    {/if}
  </section>
  <section class="panel" aria-labelledby="lookup-title">
    <h2 id="lookup-title">Find a student to add</h2>
    <form class="lookup" method="GET" action="/admin/staff">
      <label for="search">Student display name or exact user ID</label>
      <div class="search-row"><input id="search" name="q" value={data.query} maxlength="80" placeholder="Search accounts" /><button type="submit">Search</button></div>
    </form>
    {#if data.query}
      {#if data.candidates.length === 0}<p class="muted">No non-staff accounts found for this search.</p>{/if}
      {#each data.candidates as candidate (candidate.id)}
        <a class="member" href={`/admin/staff/${candidate.id}`}><div class="member-copy"><strong>{candidate.display_name ?? 'Unnamed account'}</strong><span class="muted">{candidate.id}</span></div><div class="member-actions"><span class="pill">Student</span><span class="arrow" aria-hidden="true">→</span></div></a>
      {/each}
    {/if}
  </section>
  <section class="panel" aria-labelledby="history-title"><h2 id="history-title">Recent staff activity</h2>
    {#if data.history.length === 0}<p class="muted">No staff-management events to display.</p>{:else}
      {#each data.history as event (event.id)}
        <div class="history-item"><strong>{event.action.replaceAll('_', ' ')}</strong><a class="target" href={`/admin/staff/${event.target_id}`}>View account →</a><p>{event.reason ?? 'No reason provided'}</p><time class="muted" datetime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></div>
      {/each}
    {/if}
  </section>
</main>
<style>
.staff-shell{width:min(1080px,100%);margin:0 auto;padding:clamp(18px,4vw,42px) 16px 70px;color:var(--text-primary,#232638)}
.back,.target{display:inline-block;color:#b63878;font-weight:700;text-decoration:none}.back{margin-bottom:16px}
.hero{background:linear-gradient(125deg,#54254c,#a53773 60%,#c55588);border-radius:26px;padding:clamp(26px,5vw,42px);color:white;box-shadow:0 16px 36px rgba(56,12,43,.15)}
.eyebrow{text-transform:uppercase;letter-spacing:.09em;font-size:.75rem;font-weight:750;margin:0}.hero h1{font-size:clamp(1.7rem,4vw,2.6rem);margin:12px 0 6px}.hero p:last-child{margin:0;opacity:.94}
.panel{margin-top:22px;border:1px solid rgba(137,118,145,.22);background:rgba(255,255,255,.79);backdrop-filter:blur(16px);border-radius:20px;padding:clamp(17px,3vw,24px);box-shadow:0 8px 24px rgba(42,30,55,.05)}
h2{font-size:1.15rem;margin:0 0 15px}.section-heading{display:flex;justify-content:space-between;align-items:center;gap:12px}.section-heading span,.muted{opacity:.72;font-size:.84rem;overflow-wrap:anywhere}
.member{display:flex;justify-content:space-between;align-items:center;gap:14px;padding:15px 10px;border-top:1px solid rgba(137,118,145,.17);color:inherit;text-decoration:none;border-radius:10px}.member:hover,.member:focus-visible{background:rgba(182,56,120,.08);outline-offset:2px}.member-copy{min-width:0;display:flex;flex-direction:column;gap:5px}.member-copy strong{overflow-wrap:anywhere}.member-actions{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
.pill{font-size:.75rem;border:1px solid rgba(182,56,120,.35);border-radius:999px;padding:6px 10px;color:#b63878;font-weight:750;white-space:nowrap}.arrow{font-size:1.25rem;color:#b63878}
.lookup{display:grid;gap:10px}.lookup label{font-size:.87rem;font-weight:700}.search-row{display:flex;gap:8px}.search-row input{min-width:0;flex:1;border:1px solid rgba(137,118,145,.4);border-radius:12px;padding:11px 12px;font:inherit;background:var(--cm-form-bg,rgba(255,255,255,.65));color:inherit}.search-row button{background:#a53773;color:#fff;border:0;border-radius:12px;padding:10px 14px;font-weight:750;cursor:pointer}.search-row button:hover{background:#852559}
.success,.error{padding:13px 16px;border-radius:12px;margin-top:15px}.success{background:rgba(34,138,96,.12);color:#147b52}.error{background:rgba(200,66,80,.12);color:#a92340}
.history-item{padding:13px 0;border-top:1px solid rgba(137,118,145,.17);display:grid;gap:5px}.history-item p{margin:0;overflow-wrap:anywhere;font-size:.88rem}.history-item strong{text-transform:capitalize}
:global(html[data-theme='dark']) .staff-shell{color:#f2edf5}:global(html[data-theme='dark']) .panel{background:rgba(35,38,52,.87);border-color:rgba(216,207,237,.15)}:global(html[data-theme='dark']) .search-row input{background:#272b3b;border-color:rgba(216,207,237,.25);color:#f2edf5}:global(html[data-theme='dark']) .pill,:global(html[data-theme='dark']) .arrow,:global(html[data-theme='dark']) .back,:global(html[data-theme='dark']) .target{color:#f1a2cb}:global(html[data-theme='dark']) .success{color:#96eac0}:global(html[data-theme='dark']) .error{color:#ffb2c1}
@media(max-width:640px){.member{align-items:flex-start;flex-direction:column}.member-actions{width:100%;justify-content:space-between}.search-row{flex-direction:column}.search-row button{width:100%}}
</style>
