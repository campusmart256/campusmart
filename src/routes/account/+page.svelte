<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { compressAvatar } from '#lib/client/compress.js';
	import Avatar from '#lib/components/Avatar.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import { avatarUrl } from '#lib/avatar.js';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();

	/** @type {Record<string, string>} */
	const labels = { unverified: 'No check yet', pending: 'Request pending', verified: 'Trusted student', rejected: 'Request rejected' };

	let busy = $state('');
	/** @type {{ blob: Blob, url: string } | null} */
	let picked = $state(null);
	let pickError = $state('');
	let preparing = $state(false);

	/** @param {Event} e */
	async function onPickAvatar(e) {
		const input = /** @type {HTMLInputElement} */ (e.currentTarget);
		const file = input.files?.[0];
		pickError = '';
		if (!file) return;
		preparing = true;
		try {
			if (picked) URL.revokeObjectURL(picked.url);
			const blob = await compressAvatar(file);
			picked = { blob, url: URL.createObjectURL(blob) };
		} catch {
			picked = null;
			pickError = 'That file could not be used as a picture. Please choose a JPG, PNG or WebP picture.';
		}
		preparing = false;
		input.value = '';
	}
	const nameValue = $derived(form?.section === 'profile' && form?.values ? form.values.displayName : data.account?.display_name ?? '');
	const numberValue = $derived(form?.section === 'contact' && form?.values ? form.values.whatsappNumber : data.settings?.whatsapp_number ?? '');
	const waOn = $derived(form?.section === 'contact' && form?.values ? form.values.whatsappEnabled : !!data.account?.whatsapp_enabled);
	const emailOn = $derived(form?.section === 'contact' && form?.values ? form.values.notifyEmail : data.settings?.notify_email ?? true);
	const verificationStatus = $derived(data.account?.verification_status ?? 'unverified');
	const verificationLocked = $derived(verificationStatus === 'verified' || verificationStatus === 'pending');
	const verificationFullName = $derived(form?.section === 'verification' && form?.values ? form.values.fullName : '');
	const verificationCourse = $derived(form?.section === 'verification' && form?.values ? form.values.course : '');
	const verificationYear = $derived(form?.section === 'verification' && form?.values ? form.values.yearOfStudy : '');
	const verificationReg = $derived(form?.section === 'verification' && form?.values ? form.values.registrationNumber : '');
	const verificationDocName = $derived(data.verificationRequest?.document_name ?? '');

	/**
	 * @param {string} name
	 * @returns {import('$app/forms').SubmitFunction}
	 */
	function submitter(name) {
		return () => {
			busy = name;
			return async ({ update }) => {
				await update({ reset: false });
				await invalidateAll();
				busy = '';
			};
		};
	}
</script>

<svelte:head><title>My account | campusmart</title></svelte:head>

<div class="page account-workspace">
	<header class="account-heading">
		<p class="account-eyebrow"><span class="account-eyebrow-dot"></span> CAMPUSMART / PERSONAL SPACE</p>
		<h1>Make it <span>yours.</span></h1>
		<p class="account-intro">Your profile, preferences and student verification — all in one place.</p>
	</header>

	{#if data.passwordChanged}<div class="notice tip" role="status">Your password was changed.</div>{/if}

	{#if data.account}
		<div class="account-identity">
			<div class="identity-cover" aria-hidden="true"><span>YOUR CAMPUS IDENTITY</span><span class="cover-mark">cm.</span></div>
			<div class="account-identity-body">
				<div class="account-identity-row">
					<div class="identity-avatar"><Avatar path={data.account.avatar_path} name={data.account.display_name} size={76} /></div>
					<div class="account-identity-info">
						<div class="account-display-name" data-testid="card-name">{data.account.display_name}</div>
						<div class="muted">{data.email}</div>
						<div class="identity-campus">{data.account.campuses?.name ?? 'Campus not set'}</div>
					</div>
				</div>
				<div class="identity-status">
					{#if data.account.verification_status === 'verified'}
						<span class="identity-verified"><Icon name="verified" size={16} /> Verified student</span>
					{:else}
						<span class="badge">{labels[data.account.verification_status] ?? data.account.verification_status}</span>
					{/if}
					<a href="#student-verification">Verification settings <span aria-hidden="true">↗</span></a>
				</div>
			</div>
		</div>

		<nav class="account-shortcuts" aria-label="Account settings sections">
			<a href="#profile-picture"><span class="shortcut-icon" aria-hidden="true">◉</span><span><strong>Profile picture</strong><small>How you appear</small></span><span class="shortcut-arrow" aria-hidden="true">↗</span></a>
			<a href="#display-name"><span class="shortcut-icon" aria-hidden="true">Aa</span><span><strong>Display name</strong><small>Your public name</small></span><span class="shortcut-arrow" aria-hidden="true">↗</span></a>
			<a href="#contact-alerts"><span class="shortcut-icon" aria-hidden="true">✉</span><span><strong>Contact & alerts</strong><small>Stay connected</small></span><span class="shortcut-arrow" aria-hidden="true">↗</span></a>
			<a href="#student-verification"><span class="shortcut-icon" aria-hidden="true">✓</span><span><strong>Verification</strong><small>Build buyer trust</small></span><span class="shortcut-arrow" aria-hidden="true">↗</span></a>
		</nav>

		<h2 id="profile-picture" class="section-title">Profile picture</h2>
		{#if form?.section === 'avatar' && form?.saved}<div class="notice tip" role="status">Picture saved.</div>{/if}
		{#if form?.section === 'avatar' && form?.removed}<div class="notice tip" role="status">Picture removed.</div>{/if}
		{#if form?.section === 'avatar' && form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
		{#if pickError}<div class="notice error" role="alert">{pickError}</div>{/if}
		<form
			class="account-form"
			method="POST"
			action="?/avatar"
			enctype="multipart/form-data"
			use:enhance={({ formData }) => {
				formData.delete('avatar');
				if (picked) formData.append('avatar', picked.blob, picked.blob.type === 'image/webp' ? 'avatar.webp' : 'avatar.jpg');
				busy = 'avatar';
				return async ({ update }) => {
					await update({ reset: false });
					await invalidateAll();
					if (picked) URL.revokeObjectURL(picked.url);
					picked = null;
					busy = '';
				};
			}}
		>
			<div style="display:flex;align-items:center;gap:16px;margin-top:10px">
				{#if picked}
					<img class="avatar-preview" src={picked.url} alt="Preview of your new profile" width="96" height="96" />
				{:else}
					<Avatar path={data.account.avatar_path} name={data.account.display_name} size={96} />
				{/if}
				<div style="flex:1">
					<label class="btn btn2 small" style="margin-top:0;cursor:pointer;position:relative">
						{preparing ? 'Preparing...' : data.account.avatar_path || picked ? 'Choose another picture' : 'Choose a picture'}
						<input class="file-hidden" type="file" name="avatar" accept="image/*" onchange={onPickAvatar} aria-label="Choose a profile picture" />
					</label>
					<p class="muted" style="margin:6px 0 0">A square picture works best. It is shrunk before uploading.</p>
				</div>
			</div>
			{#if picked}
				<button class="btn small" type="submit" disabled={busy === 'avatar'}>{busy === 'avatar' ? 'Saving...' : 'Save picture'}</button>
			{/if}
		</form>
		{#if avatarUrl(data.account.avatar_path) && !picked}
			<form method="POST" action="?/removeAvatar" use:enhance={() => { busy = 'avatar'; return async ({ update }) => { await update({ reset: false }); await invalidateAll(); busy = ''; }; }}>
				<button class="btn btn2 small" type="submit" disabled={busy === 'avatar'} style="border-color:var(--line);color:var(--ink)">Remove picture</button>
			</form>
		{/if}

		<h2 id="display-name" class="section-title">Your name</h2>
		{#if form?.section === 'profile' && form?.saved}<div class="notice tip" role="status">Name saved.</div>{/if}
		{#if form?.section === 'profile' && form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
		<form class="account-form" method="POST" action="?/profile" novalidate use:enhance={submitter('profile')}>
			<label class="field">Display name (shown to other users)
				<input type="text" name="displayName" autocomplete="nickname" maxlength="50" value={nameValue} aria-invalid={!!(form?.section === 'profile' && form?.errors?.displayName)} />
				{#if form?.section === 'profile' && form?.errors?.displayName}<div class="err">{form.errors.displayName}</div>{/if}
			</label>
			<button class="btn small" type="submit" disabled={busy === 'profile'}>{busy === 'profile' ? 'Saving...' : 'Save name'}</button>
		</form>

		<h2 id="contact-alerts" class="section-title">Contact and alerts</h2>
		{#if form?.section === 'contact' && form?.saved}<div class="notice tip" role="status">Settings saved.</div>{/if}
		{#if form?.section === 'contact' && form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
		<form class="account-form" method="POST" action="?/contact" novalidate use:enhance={submitter('contact')}>
			<label class="switch-row">
				<span><span class="title">WhatsApp contact</span><br /><span class="help">Logged-in buyers can message you on WhatsApp</span></span>
				<input class="switch" type="checkbox" role="switch" name="whatsappEnabled" checked={waOn} />
			</label>
			<label class="field">WhatsApp number
				<input type="tel" name="whatsappNumber" autocomplete="tel" inputmode="tel" placeholder="0772 123 456 or +254 712 345 678" value={numberValue} aria-invalid={!!(form?.section === 'contact' && form?.errors?.whatsappNumber)} />
				{#if form?.section === 'contact' && form?.errors?.whatsappNumber}<div class="err">{form.errors.whatsappNumber}</div>{/if}
			</label>
			<p class="muted" style="margin:6px 0 0">Uganda: you can start with 0. Other countries: start with the country code, like +254. Only buyers who are logged in can see it, a limited number of times a day.</p>

			<label class="switch-row" style="margin-top:8px">
				<span><span class="title">Email alerts</span><br /><span class="help">When someone messages you</span></span>
				<input class="switch" type="checkbox" role="switch" name="notifyEmail" checked={emailOn} />
			</label>
			<div class="switch-row">
				<span><span class="title">Browser notifications</span><br /><span class="help">Coming when chat launches</span></span>
				<input class="switch" type="checkbox" role="switch" disabled aria-label="Browser notifications (coming soon)" />
			</div>
			<button class="btn small" type="submit" disabled={busy === 'contact'}>{busy === 'contact' ? 'Saving...' : 'Save contact settings'}</button>
		</form>

		<h2 id="student-verification" class="section-title">Student verification</h2>
		{#if form?.section === 'verification' && form?.requested}<div class="notice tip" role="status">Verification request sent. Your profile is now pending review.</div>{/if}
		{#if form?.section === 'verification' && form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
		<div class="card verification-card">
			<div class="verification-top">
				<div>
					<div class="verify-title">Verify your student account</div>
					<p class="muted" style="margin:4px 0 0">Students with the green check look safer to buyers and sellers on CampusMart.</p>
				</div>
				{#if verificationStatus === 'verified'}
					<span class="trust-dot" title="Trusted student" aria-label="Trusted student"><Icon name="verified" size={16} /></span>
				{:else}
					<span class="badge">{labels[verificationStatus] ?? verificationStatus}</span>
				{/if}
			</div>

			{#if verificationStatus === 'verified'}
				<div class="notice tip" style="margin-top:12px">Your account already has the green check.</div>
			{:else if verificationStatus === 'pending'}
				<div class="notice warn" style="margin-top:12px">Your verification request is pending. CampusMart admins will review it{verificationDocName ? ` with ${verificationDocName}.` : '.'}</div>
			{:else}
				{#if verificationStatus === 'rejected'}
					<div class="notice warn" style="margin-top:12px">
						Your last verification request was rejected{data.verificationRequest?.reject_reason ? `: ${data.verificationRequest.reject_reason}` : '.'}
					</div>
				{/if}
				<form class="verify-form" method="POST" action="?/verification" enctype="multipart/form-data" novalidate use:enhance={submitter('verification')}>
					<label class="field">Full name
						<input type="text" name="fullName" autocomplete="name" maxlength="100" value={verificationFullName} aria-invalid={!!(form?.section === 'verification' && form?.errors?.fullName)} />
						{#if form?.section === 'verification' && form?.errors?.fullName}<div class="err">{form.errors.fullName}</div>{/if}
					</label>
					<label class="field">Course / programme
						<input type="text" name="course" maxlength="100" placeholder="Example: Bachelor of Software Engineering" value={verificationCourse} aria-invalid={!!(form?.section === 'verification' && form?.errors?.course)} />
						{#if form?.section === 'verification' && form?.errors?.course}<div class="err">{form.errors.course}</div>{/if}
					</label>
					<div class="verify-grid">
						<label class="field">Year of study
							<input type="number" name="yearOfStudy" min="1" max="7" inputmode="numeric" value={verificationYear} aria-invalid={!!(form?.section === 'verification' && form?.errors?.yearOfStudy)} />
							{#if form?.section === 'verification' && form?.errors?.yearOfStudy}<div class="err">{form.errors.yearOfStudy}</div>{/if}
						</label>
						<label class="field">Registration number
							<input type="text" name="registrationNumber" maxlength="30" autocapitalize="characters" value={verificationReg} aria-invalid={!!(form?.section === 'verification' && form?.errors?.registrationNumber)} />
							{#if form?.section === 'verification' && form?.errors?.registrationNumber}<div class="err">{form.errors.registrationNumber}</div>{/if}
						</label>
					</div>
					<label class="field doc-field">Proof that you are a student
						<input type="file" name="studentProof" accept="image/jpeg,image/png,image/webp,application/pdf" aria-invalid={!!(form?.section === 'verification' && form?.errors?.studentProof)} />
						<span class="help">Upload a student ID, admission letter, or recent tuition payment receipt. JPG, PNG, WebP, or PDF only. Max 5 MB.</span>
						{#if form?.section === 'verification' && form?.errors?.studentProof}<div class="err">{form.errors.studentProof}</div>{/if}
					</label>
					<p class="muted" style="margin:6px 0 0">Only CampusMart admins should review these details and documents. Do not upload passwords, bank card details, or private payment PINs.</p>
					<button class="btn small" type="submit" disabled={busy === 'verification' || verificationLocked}>
						{busy === 'verification' ? 'Sending request...' : 'Request verification'}
					</button>
				</form>
			{/if}
		</div>
	{:else}
		<div class="notice error" role="alert">We could not load your profile. Refresh the page. If it keeps happening, tell the developer: the profile row was not created at sign-up.</div>
	{/if}
</div>

<style>
	.account-workspace { max-width:760px; padding-bottom:96px; min-width:0; }
	.account-heading { padding:22px 0 4px; }
	.account-eyebrow { margin:0 0 9px; font-size:11px; letter-spacing:.14em; font-weight:800; color:var(--red); }
	.account-heading h1 { font-size:clamp(1.7rem,3.3vw,2.3rem); line-height:1.16; letter-spacing:-.035em; }
	.account-intro { color:var(--mute); line-height:1.6; max-width:55ch; margin:8px 0 12px; }
	.account-identity { margin-top:14px; padding:22px; border-radius:20px; background:linear-gradient(115deg,#fff 0%,#fff4f6 100%); border-color:#eedcde; }
	.account-identity-row { display:flex; align-items:center; gap:16px; min-width:0; }
	.account-identity-info { min-width:0; overflow-wrap:anywhere; }
	.account-display-name { font-size:clamp(1.1rem,2.3vw,1.35rem); font-weight:800; }
	.account-shortcuts { display:flex; gap:8px; overflow-x:auto; padding:5px 0 12px; margin-top:20px; scrollbar-width:thin; }
	.account-shortcuts a { flex:none; display:inline-flex; align-items:center; min-height:42px; padding:9px 13px; background:white; border:1px solid var(--line); border-radius:12px; color:var(--body); font-size:13px; text-decoration:none; }
	.account-shortcuts a:hover { border-color:var(--red); color:var(--red); }
	.account-shortcuts a:focus-visible { outline:3px solid #f2a3b0; outline-offset:2px; }
	.account-workspace .section-title { font-size:1.1rem; letter-spacing:-.02em; margin:30px 0 10px; scroll-margin-top:96px; }
	.account-form { padding:20px; border:1px solid var(--line); border-radius:18px; background:#fff; }
	.account-form :global(.field:first-child) { margin-top:0; }
	.account-workspace :global(.btn.small) { min-height:44px; width:auto; padding:0 18px; }
	.account-workspace :global(.field input), .account-workspace :global(.field textarea), .account-workspace :global(.field select) { max-width:100%; }
	@media (max-width:540px) {
		.account-heading { padding-top:8px; }
		.account-identity { padding:16px; border-radius:16px; }
		.account-identity-row { gap:12px; }
		.account-form { padding:16px; }
		.account-shortcuts a { font-size:12px; }
		.account-workspace :global(.btn.small) { width:100%; }
	}
	.avatar-preview { border-radius: 50%; object-fit: cover; width: 96px; height: 96px; }
	.file-hidden { position: absolute; inset: 0; opacity: 0; width: 100%; height: 100%; cursor: pointer; }
	.verification-card { margin-top: 10px; }
	.verification-top { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; }
	.verify-title { font-weight: 800; font-size: 16px; }
	.verify-form { margin-top: 12px; }
	.doc-field input[type='file'] { padding: 10px; min-height: auto; background: #fff; }
	.doc-field .help { display: block; margin-top: 6px; color: var(--mute); font-size: 13px; line-height: 1.35; }
	.verify-grid { display: grid; gap: 10px; }
	@media (min-width: 720px) { .verify-grid { grid-template-columns: 1fr 1.4fr; } }

	.trust-dot { width: 30px; height: 30px; border-radius: 999px; display:inline-flex; align-items:center; justify-content:center; background:#dff7ea; color:#10a857; border:1px solid #b9edcd; }
	/* Phase 59.1: account identity and settings redesign */
	.account-workspace { max-width:920px; --account-ink:#17202d; }
	.account-heading { background:#17202d; border-radius:24px; color:white; padding:32px 32px 72px; position:relative; overflow:hidden; }
	.account-heading::after { content:''; position:absolute; width:220px; height:220px; border:45px solid rgba(255,255,255,.045); border-radius:50%; right:-85px; top:-125px; pointer-events:none; }
	.account-eyebrow { color:#ffc0cc; display:flex; align-items:center; gap:10px; }
	.account-eyebrow-dot { width:8px; height:8px; border-radius:50%; background:#39d6a7; }
	.account-heading h1 { font-size:clamp(2.2rem,4vw,3.3rem); line-height:1.08; margin:0; color:white; letter-spacing:-.045em; }
	.account-heading h1 span { color:#ff9eaf; }
	.account-intro { color:#d4dae5; margin:12px 0 0; max-width:42ch; }
	.account-identity { background:white; border:1px solid #e8eaf0; border-radius:22px; padding:0; margin:-45px 16px 0; position:relative; overflow:hidden; box-shadow:0 16px 35px rgba(23,32,45,.11); }
	.identity-cover { min-height:76px; background:linear-gradient(120deg,#ca0d34,#e53d5c); color:#fff; display:flex; align-items:flex-start; justify-content:space-between; padding:18px 24px; font-size:.66rem; letter-spacing:.17em; font-weight:850; }
	.cover-mark { font-size:2rem; letter-spacing:-.07em; opacity:.22; line-height:1; }
	.account-identity-body { padding:0 24px 19px; }
	.account-identity-row { align-items:end; margin-top:-29px; gap:15px; }
	.identity-avatar { flex:none; border:4px solid white; border-radius:50%; background:white; width:84px; height:84px; display:grid; place-items:center; overflow:hidden; box-shadow:0 5px 18px rgba(23,32,45,.1); }
	.account-identity-info { padding-bottom:4px; }
	.account-display-name { font-size:clamp(1.1rem,2.3vw,1.45rem); color:var(--account-ink); line-height:1.25; }
	.account-identity-info .muted { font-size:.82rem; line-height:1.55; }
	.identity-campus { font-size:.78rem; color:#8a6670; margin-top:2px; font-weight:650; }
	.identity-status { margin-top:17px; padding-top:14px; border-top:1px solid #eef0f3; display:flex; align-items:center; justify-content:space-between; gap:10px; flex-wrap:wrap; }
	.identity-status a { font-size:.78rem; font-weight:750; color:#bf1034; }
	.identity-verified { display:inline-flex; align-items:center; gap:6px; padding:7px 10px; border-radius:999px; background:#e6f7ec; color:#17744b; font-size:.78rem; font-weight:750; }
	.account-shortcuts { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; overflow:visible; margin:23px 0 28px; padding:0; }
	.account-shortcuts a { display:flex; align-items:center; min-width:0; gap:12px; min-height:84px; padding:14px 16px; border:1px solid #e8eaf0; border-radius:17px; background:white; box-shadow:0 4px 15px rgba(23,32,45,.03); }
	.account-shortcuts a:hover { background:#fff9fa; border-color:#e9b9c4; }
	.shortcut-icon { flex:none; width:42px; height:42px; display:grid; place-items:center; border-radius:12px; background:#fff0f3; color:#c90c31; font-size:1rem; font-weight:800; }
	.account-shortcuts a > span:nth-child(2) { display:grid; gap:3px; min-width:0; }
	.account-shortcuts strong { color:#253043; font-size:.83rem; line-height:1.25; }
	.account-shortcuts small { color:#7a8594; font-size:.73rem; }
	.shortcut-arrow { margin-left:auto; color:#a2aab5; }
	.account-workspace .section-title { margin:28px 0 12px; color:#202b3a; font-size:1.3rem; border-left:4px solid #c90c31; padding-left:12px; }
	.account-form { border-color:#e7e9ee; border-radius:18px; box-shadow:0 6px 20px rgba(23,32,45,.035); padding:24px; }
	.account-form :global(.btn.small) { border-radius:10px; }
	.account-workspace .verification-card { border-radius:18px; border:1px solid #e7e9ee; padding:23px; }
	@media (max-width:540px) {
		.account-heading { padding:25px 19px 68px; border-radius:19px; }
		.account-heading h1 { font-size:2.35rem; }
		.account-identity { margin:-43px 8px 0; border-radius:18px; }
		.identity-cover { padding:15px 17px; min-height:68px; }
		.account-identity-body { padding:0 15px 15px; }
		.account-identity-row { gap:11px; }
		.identity-avatar { width:73px; height:73px; }
		.account-identity-info .muted { font-size:.74rem; overflow-wrap:anywhere; }
		.account-shortcuts { gap:9px; }
		.account-shortcuts a { padding:11px; gap:8px; min-height:76px; border-radius:13px; }
		.shortcut-icon { width:33px; height:33px; font-size:.85rem; border-radius:9px; }
		.account-shortcuts strong { font-size:.72rem; }.account-shortcuts small { font-size:.65rem; }
		.shortcut-arrow { display:none; }
		.account-form { padding:17px; }
	}
	@media (max-width:345px) { .account-shortcuts { grid-template-columns:1fr; } }

</style>
