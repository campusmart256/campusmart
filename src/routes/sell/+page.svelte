<script>
	import ListingForm from '#lib/components/ListingForm.svelte';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();
</script>

<svelte:head><title>Sell an item | campusmart</title></svelte:head>

<div class="page wide">
	<h1>Sell an item</h1>
	<p class="muted">Free to list. Add clear photos and an honest description.</p>

	{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}

	<ListingForm
		{data}
		{form}
		buttons={[
			{ intent: 'publish', label: 'Publish listing', busyLabel: 'Publishing...', primary: true },
			{ intent: 'draft', label: 'Save as draft', busyLabel: 'Saving...' }
		]}
	/>
</div>
