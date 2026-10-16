<script>
	import { enhance } from '$app/forms';
	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();
</script>

<svelte:head><title>Check your email | campusmart</title></svelte:head>

<div class="page" style="text-align:center;padding-top:40px">
	<div class="mail" aria-hidden="true">
		<svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18v12H3z" /><path d="M3 7l9 7 9-7" /></svg>
	</div>
	<h1 style="margin-top:20px">Check your email</h1>
	<p style="color:var(--body)">
		{#if data.email}We sent a confirmation link to <b>{data.email}</b>.{:else}We sent you a confirmation link.{/if}
		Open it on this phone to finish creating your account.
	</p>

	{#if form?.sent}<div class="notice tip" role="status">Email sent again. Check your inbox and spam folder.</div>{/if}
	{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}

	<a class="btn" href="mailto:">Open email app</a>

	{#if data.email}
		<form method="POST" action="?/resend" use:enhance>
			<input type="hidden" name="email" value={data.email} />
			<button class="btn btn2" type="submit">Resend email</button>
		</form>
	{/if}

	<div class="notice warn" style="text-align:left">Can't find it? Check your spam folder. You can browse now, but you must confirm your email before you sell or message.</div>
	<p><a href="/signup">Use a different email</a></p>
</div>

<style>
	.mail { width: 84px; height: 84px; margin: 0 auto; border-radius: 50%; background: #fbe9ec; color: var(--red); display: flex; align-items: center; justify-content: center; }
</style>
