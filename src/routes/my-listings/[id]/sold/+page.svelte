<script>
	import Icon from '#lib/components/Icon.svelte';
	import { enhance } from '$app/forms';
	import { formatNumber } from '#lib/format.js';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();
	let busy = $state(false);
	let choice = $state('');
</script>

<svelte:head><title>Record sale | campusmart</title></svelte:head>

<div class="page">
	<p style="margin:0"><a href="/my-listings">&larr; My listings</a></p>
	<h1 style="margin-top:8px">Record a sale</h1>
	<p class="muted" style="margin:0">{data.listing.title} &middot; UGX {formatNumber(data.listing.price_ugx)}. Only you can see this choice.</p>

	{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}

	<div class="notice tip">Units remaining: <strong>{data.listing.quantity_available}</strong>. Record how many were bought. The listing stays live while stock remains.</div>
	<form method="POST" use:enhance={() => { busy = true; return async ({ update }) => { await update({ reset: false }); busy = false; }; }}>
		<label class="field">Units sold
			<input type="number" name="quantity" min="1" max={data.listing.quantity_available} step="1" value="1" required />
		</label>
		<fieldset class="who">
			<legend class="sr-only">Who bought it</legend>
			{#each data.buyers as b (b.id)}
				<label class="opt"><input type="radio" name="buyer" value={b.id} bind:group={choice} /><span class="name">{b.name}</span>{#if b.verified}<span class="trust-dot" title="Trusted student" aria-label="Trusted student"><Icon name="verified" size={14} /></span>{:else}<span class="badge">No check</span>{/if}</label>
			{/each}
			<label class="opt"><input type="radio" name="buyer" value="outside" bind:group={choice} /><span class="name">Sold outside campusmart</span></label>
		</fieldset>
		{#if !data.buyers.length}<p class="muted">Nobody has messaged you about this item yet. People who do will show up here.</p>{/if}
		<div class="notice tip">Choose a CampusMart buyer to make their purchase eligible for a review. Sales outside CampusMart do not create buyer reviews.</div>
		<button class="btn" type="submit" disabled={busy || !choice}>{busy ? 'Saving...' : 'Record sale'}</button>
		<button class="btn btn2" type="submit" name="skip" value="1" disabled={busy} style="border-color:var(--line);color:var(--ink)">Skip buyer and record sale</button>
	</form>
</div>

<style>
	.who { border: 0; padding: 0; margin: 14px 0 0; }
	.opt { display: flex; align-items: center; gap: 12px; min-height: 56px; padding: 0 12px; margin-top: 8px; background: #fff; border: 1.5px solid var(--line); border-radius: 12px; font-weight: 600; cursor: pointer; }
	.opt input { width: 20px; height: 20px; accent-color: var(--red); flex: none; margin: 0; }
	.opt .name { flex: 1; }

	.trust-dot { width: 28px; height: 28px; border-radius: 999px; display:inline-flex; align-items:center; justify-content:center; background:#dff7ea; color:#10a857; border:1px solid #b9edcd; }
</style>
