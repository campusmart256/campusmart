<script>
  /** @type {import('./$types').PageProps} */
  let { data, form } = $props();

let action = $state('add');
let role = $state('moderator');
let reason = $state('');

$effect(() => {
    action = data.membership ? 'set_role' : 'add';
    role = data.membership?.role === 'moderator'
        ? 'super_admin'
        : 'moderator';
});
  let confirmation = $state('');
  const isSelf = $derived(data.currentUserId === data.account.id);
  const canSubmit = $derived(!isSelf && reason.trim().length >= 3 && reason.length <= 500 && confirmation === 'CONFIRM' && (action !== 'add' || role === 'moderator'));
</script>
<svelte:head><title>{data.account.display_name ?? 'Account'} · Staff Management | CampusMart</title><meta name="description" content="CampusMart staff account details and role management." /></svelte:head>
<main class="detail-shell">
  <a class="back" href="/admin/staff">← Back to Staff Management</a>
  <header class="hero"><p class="eyebrow">CampusMart · Super Admin</p><h1>Staff Account Details</h1><p>Review account information, staff permissions, and activity.</p></header>
  {#if data.updated}<p class="success" role="status">Staff change completed successfully.</p>{/if}
  {#if form?.message}<p class="error" role="alert">{form.message}</p>{/if}
  <section class="panel" aria-labelledby="account-title"><h2 id="account-title">Account information</h2>
    <div class="details-grid">
      <div><span class="label">Display name</span><strong>{data.account.display_name ?? 'Unnamed account'}</strong></div>
      <div><span class="label">Current role</span><strong>{data.membership?.role === 'super_admin' ? 'Super Admin' : data.membership?.role === 'moderator' ? 'Moderator' : 'Student (not staff)'}</strong></div>
      <div><span class="label">Verification</span><strong>{data.account.verification_status ?? 'Not specified'}</strong></div>
      <div><span class="label">Account created</span><strong>{new Date(data.account.created_at).toLocaleDateString()}</strong></div>
      <div class="wide"><span class="label">User ID</span><code>{data.account.id}</code></div>
      {#if data.membership}<div><span class="label">Staff since</span><strong>{new Date(data.membership.created_at).toLocaleDateString()}</strong></div>{/if}
    </div>
    {#if isSelf}<p class="muted">This is your account. Self-demotion and removal are disabled.</p>{/if}
  </section>
  <section class="panel" aria-labelledby="manage-title"><h2 id="manage-title">{data.membership ? 'Manage staff access' : 'Add this student as a moderator'}</h2>
    {#if isSelf}<p class="muted">You cannot modify your own staff role.</p>{:else}
      <form method="POST" action="?/manage" class="change-form">
        <label for="action">Action</label>
        <select id="action" name="action" bind:value={action} onchange={() => { confirmation = ''; if (action === 'add') role = 'moderator'; }}>
          {#if data.membership}<option value="set_role">Change role</option><option value="remove">Remove staff privileges</option>{:else}<option value="add">Add moderator</option>{/if}
        </select>
        {#if action !== 'remove'}
          <label for="role">New role</label>
          <select id="role" name="role" bind:value={role}>
            <option value="moderator">Moderator</option>
            {#if action !== 'add'}<option value="super_admin">Super Admin</option>{/if}
          </select>
        {/if}
        <label for="reason">Reason for change</label>
        <textarea id="reason" name="reason" bind:value={reason} minlength="3" maxlength="500" rows="3" required placeholder="Explain why this change is needed"></textarea>
        <label for="confirmation">Type CONFIRM to continue</label>
        <input id="confirmation" name="confirmation" bind:value={confirmation} autocomplete="off" placeholder="CONFIRM" />
        <p class="muted">Changes take effect immediately. The database protects your own role and the last super admin.</p>
        <button class="submit" type="submit" disabled={!canSubmit}>Apply staff change</button>
      </form>
    {/if}
  </section>
  <section class="panel" aria-labelledby="history-title"><h2 id="history-title">Staff activity history</h2>
    {#if data.historyError}<p class="error" role="status">Activity history is temporarily unavailable.</p>{/if}
    {#if data.history.length === 0}<p class="muted">No staff-management actions recorded for this account.</p>{:else}
      {#each data.history as event (event.id)}
        <div class="history-item"><strong>{event.action.replaceAll('_',' ')}</strong><p>{event.reason ?? 'No reason provided'}</p><span class="muted">Actor: {event.actor_id ?? 'System'}</span><time class="muted" datetime={event.created_at}>{new Date(event.created_at).toLocaleString()}</time></div>
      {/each}
    {/if}
  </section>
</main>
<style>
.detail-shell{width:min(980px,100%);margin:0 auto;padding:clamp(18px,4vw,42px) 16px 70px;color:var(--text-primary,#232638)}
.back{display:inline-block;color:#b63878;font-weight:700;text-decoration:none;margin-bottom:16px}
.hero{background:linear-gradient(125deg,#54254c,#a53773 60%,#c55588);border-radius:26px;padding:clamp(26px,5vw,42px);color:#fff;box-shadow:0 16px 36px rgba(56,12,43,.15)}
.eyebrow{text-transform:uppercase;letter-spacing:.09em;font-size:.75rem;font-weight:750;margin:0}.hero h1{font-size:clamp(1.7rem,4vw,2.6rem);margin:12px 0 6px}.hero p:last-child{margin:0;opacity:.94}
.panel{margin-top:22px;border:1px solid rgba(137,118,145,.22);background:rgba(255,255,255,.79);backdrop-filter:blur(16px);border-radius:20px;padding:clamp(17px,3vw,24px);box-shadow:0 8px 24px rgba(42,30,55,.05)}
h2{font-size:1.15rem;margin:0 0 16px}.details-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:20px}.details-grid>div{display:grid;gap:6px;min-width:0}.details-grid strong,.details-grid code{overflow-wrap:anywhere}.details-grid .wide{grid-column:1/-1}.label,.muted{opacity:.72;font-size:.85rem;overflow-wrap:anywhere}.details-grid code{font-size:.85rem}
.change-form{display:grid;gap:10px;max-width:560px}.change-form label{font-size:.87rem;font-weight:700}input,select,textarea{width:100%;min-width:0;border:1px solid rgba(137,118,145,.4);border-radius:12px;padding:11px 12px;font:inherit;background:var(--cm-form-bg,rgba(255,255,255,.65));color:inherit}.submit{background:#a53773;color:#fff;border:0;border-radius:12px;padding:12px 16px;font:inherit;font-weight:750;cursor:pointer}.submit:hover:not(:disabled){background:#852559}.submit:disabled{opacity:.5;cursor:not-allowed}
.success,.error{padding:13px 16px;border-radius:12px;margin-top:15px}.success{background:rgba(34,138,96,.12);color:#147b52}.error{background:rgba(200,66,80,.12);color:#a92340}.history-item{padding:13px 0;border-top:1px solid rgba(137,118,145,.17);display:grid;gap:5px}.history-item strong{text-transform:capitalize}.history-item p{margin:0;overflow-wrap:anywhere;font-size:.88rem}
:global(html[data-theme='dark']) .detail-shell{color:#f2edf5}:global(html[data-theme='dark']) .panel{background:rgba(35,38,52,.87);border-color:rgba(216,207,237,.15)}:global(html[data-theme='dark']) input,:global(html[data-theme='dark']) select,:global(html[data-theme='dark']) textarea{background:#272b3b;border-color:rgba(216,207,237,.25);color:#f2edf5}:global(html[data-theme='dark']) .back{color:#f1a2cb}:global(html[data-theme='dark']) .success{color:#96eac0}:global(html[data-theme='dark']) .error{color:#ffb2c1}
@media(max-width:640px){.details-grid{grid-template-columns:1fr}.hero{border-radius:20px}}
</style>
