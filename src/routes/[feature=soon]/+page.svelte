<script>
	/** @type {{ data: { title: string, text: string } }} */
	let { data } = $props();
</script>

<svelte:head><title>{data.title} | campusmart</title></svelte:head>

<div class="page" style="text-align:center;padding-top:48px">
	<h1>{data.title}</h1>
	<p style="color:var(--body)">{data.text}</p>
	<div class="notice warn">This part arrives in a later build step.</div>
	<a class="btn" href="/">Back to the marketplace</a>
</div>
