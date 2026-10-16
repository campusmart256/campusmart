<script>
	import { page } from '$app/state';
	/** @type {{ data: any }} */
	let { data } = $props();
	const isRecovery = $derived(data.type === 'recovery');
</script>

<svelte:head><title>Confirm | campusmart</title></svelte:head>

<div class="page" style="text-align:center;padding-top:40px">
	<h1>{isRecovery ? 'Reset your password' : 'Confirm your email'}</h1>
	<p style="color:var(--body)">{isRecovery ? 'Tap the button to choose a new password.' : 'One tap to finish creating your account.'}</p>
	<form method="POST">
		<input type="hidden" name="token_hash" value={page.url.searchParams.get('token_hash') ?? ''} />
		<input type="hidden" name="type" value={data.type} />
		<button class="btn" type="submit">{isRecovery ? 'Continue' : 'Confirm my email'}</button>
	</form>
</div>
