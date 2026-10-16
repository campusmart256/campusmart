<script>
	import { enhance } from '$app/forms';
	/** @type {{ form: any }} */
	let { form } = $props();
</script>

<svelte:head><title>Reset password | campusmart</title></svelte:head>

<div class="page">
	<h1>Forgot your password?</h1>
	<p style="color:var(--body)">Enter your email and we will send you a link to choose a new one.</p>

	{#if form?.sent}
		<div class="notice tip" role="status">If an account exists for that email, a reset link is on its way. Check your inbox and spam folder.</div>
	{:else}
		{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
		<form method="POST" novalidate use:enhance>
			<label class="field">Email
				<input type="email" name="email" autocomplete="email" inputmode="email" placeholder="you@example.com" value={form?.email ?? ''} />
			</label>
			<button class="btn" type="submit">Send reset link</button>
		</form>
	{/if}
	<p style="text-align:center;margin-top:18px"><a href="/signin">Back to sign in</a></p>
</div>
