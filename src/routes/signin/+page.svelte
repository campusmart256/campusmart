<script>
	import { enhance } from '$app/forms';
	/** @type {{ form: any }} */
	let { form } = $props();
	let busy = $state(false);
</script>

<svelte:head><title>Sign in | campusmart</title></svelte:head>

<div class="page">
	<h1 style="margin-top:12px">Sign in</h1>

	{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
	{#if form?.needsConfirm && form?.values?.email}
		<p class="muted"><a href={`/check-email?email=${encodeURIComponent(form.values.email)}`}>Send the confirmation email again</a></p>
	{/if}

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
		<label class="field">Email
			<input type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value={form?.values?.email ?? ''} />
		</label>
		<label class="field">Password
			<input type="password" name="password" autocomplete="current-password" placeholder="Your password" />
		</label>
		<p style="text-align:right;margin:8px 0 0"><a href="/forgot-password" style="font-size:13px">Forgot password?</a></p>
		<button class="btn" type="submit" disabled={busy}>{busy ? 'Signing in...' : 'Sign in'}</button>
	</form>

	<a class="btn btn2" href="/signup">Create an account</a>
	<p class="muted" style="text-align:center;margin-top:18px">You can browse listings without an account. Sign in to message sellers and sell items.</p>
</div>
