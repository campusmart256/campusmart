<script>
	import { enhance } from '$app/forms';
	/** @type {{ form: any }} */
	let { form } = $props();
</script>

<svelte:head><title>New password | campusmart</title></svelte:head>

<div class="page">
	<h1>Choose a new password</h1>
	{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
	<form method="POST" novalidate use:enhance>
		<label class="field">New password (at least 8 characters)
			<input type="password" name="password" autocomplete="new-password" />
			{#if form?.errors?.password}<div class="err">{form.errors.password}</div>{/if}
		</label>
		<label class="field">Type it again
			<input type="password" name="confirm" autocomplete="new-password" />
			{#if form?.errors?.confirm}<div class="err">{form.errors.confirm}</div>{/if}
		</label>
		<button class="btn" type="submit">Save new password</button>
	</form>
</div>
