<script>
	import { enhance } from '$app/forms';
	/** @type {{ form: any }} */
	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Create account | campusmart</title></svelte:head>

<div class="page">
	<h1>Create account</h1>
	<p class="muted">Free for students. You can browse without an account.</p>

	{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}

	<form
		method="POST"
		novalidate
		use:enhance={() => {
			busy = true;
			return async ({ update }) => {
				await update({ reset: false });
				busy = false;
			};
		}}
	>
		<label class="field">Display name (shown to other users)
			<input type="text" name="displayName" autocomplete="nickname" maxlength="50" placeholder="e.g. Aisha N." value={form?.values?.displayName ?? ''} aria-invalid={!!form?.errors?.displayName} />
			{#if form?.errors?.displayName}<div class="err">{form.errors.displayName}</div>{/if}
		</label>

		<label class="field">Email
			<input type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value={form?.values?.email ?? ''} aria-invalid={!!form?.errors?.email} />
			{#if form?.errors?.email}<div class="err">{form.errors.email}</div>{/if}
		</label>

		<label class="field">Password (at least 8 characters)
			<input type="password" name="password" autocomplete="new-password" placeholder="Create a password" aria-invalid={!!form?.errors?.password} />
			{#if form?.errors?.password}<div class="err">{form.errors.password}</div>{/if}
		</label>

		<p class="field" style="margin-bottom:0">Campus</p>
		<div class="card" style="margin-top:6px;padding:12px;font-weight:600">International University of East Africa</div>

		<div class="check">
			<input type="checkbox" id="legal-consent" name="terms" required checked={form?.values?.terms ?? false} aria-invalid={!!form?.errors?.terms} aria-describedby="legal-consent-text" />
			<span id="legal-consent-text"><label for="legal-consent">I agree to the </label><a href="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a> and <a href="/privacy" target="_blank" rel="noopener noreferrer">Privacy Policy</a>.</span>
		</div>
		{#if form?.errors?.terms}<div class="err" style="margin-top:4px;font-size:13px;font-weight:600;color:var(--err-ink)">{form.errors.terms}</div>{/if}

		<div class="notice tip">We will email you a link. Confirm your email before you can sell or message sellers.</div>

		<button class="btn" type="submit" disabled={busy}>{busy ? 'Creating account...' : 'Create account'}</button>
	</form>

	<p class="muted" style="text-align:center;margin-top:14px">Already have an account? <a href="/signin">Sign in</a></p>
</div>
