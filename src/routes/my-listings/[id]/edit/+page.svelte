<script>
	import ListingForm from '#lib/components/ListingForm.svelte';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();
	const buttons = $derived(
		data.status === 'draft'
			? [
					{ intent: 'publish', label: 'Publish listing', busyLabel: 'Publishing...', primary: true },
					{ intent: 'save', label: 'Save changes', busyLabel: 'Saving...' }
				]
			: [{ intent: 'save', label: 'Save changes', busyLabel: 'Saving...', primary: true }]
	);
</script>

<svelte:head><title>Edit listing | campusmart</title></svelte:head>

<div class="page wide">
	<p style="margin:0"><a href="/my-listings">&larr; My listings</a></p>
	<h1 style="margin-top:8px">Edit listing</h1>
	{#if data.status === 'expired'}<div class="notice warn">This listing has expired. Save your changes, then renew it from My listings.</div>{/if}
	{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}

	<ListingForm {data} {form} existing={data.photos} defaults={data.defaults} {buttons} />
</div>
