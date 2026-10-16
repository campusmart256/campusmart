<script>
	import { enhance } from '$app/forms';
	import { compressPhoto } from '#lib/client/compress.js';

	/**
	 * The listing form used by Sell and Edit.
	 * existing: file names of photos the listing already has (Edit only).
	 * buttons: the submit buttons, e.g. [{ intent: 'publish', label: 'Publish listing', busyLabel: 'Publishing...', primary: true }]
	 * @type {{ data: any, form: any, existing?: string[], defaults?: any, buttons: { intent: string, label: string, busyLabel: string, primary?: boolean }[] }}
	 */
	let { data, form, existing = [], defaults = {}, buttons } = $props();

	const MAX = 5;
	/** @type {{ key?: string, blob?: Blob, url: string }[]} */
	// svelte-ignore state_referenced_locally
	let items = $state(existing.map((key) => ({ key, url: `/photos/${key}` })));
	let photoError = $state('');
	let preparing = $state(false);
	let busy = $state('');

	const conditions = [['new', 'New'], ['like_new', 'Like new'], ['good', 'Good'], ['fair', 'Fair'], ['used', 'Used']];
	const v = $derived(form?.values ?? defaults);

	/** @param {Event} e */
	async function onPick(e) {
		const input = /** @type {HTMLInputElement} */ (e.currentTarget);
		const files = Array.from(input.files ?? []).slice(0, MAX - items.length);
		photoError = '';
		preparing = true;
		for (const file of files) {
			try {
				const blob = await compressPhoto(file);
				items.push({ blob, url: URL.createObjectURL(blob) });
			} catch {
				photoError = 'One of the files could not be used as a photo. Please choose JPG, PNG or WebP pictures.';
			}
		}
		preparing = false;
		input.value = '';
	}

	/** @param {number} i */
	function removePhoto(i) {
		if (items[i].blob) URL.revokeObjectURL(items[i].url);
		items.splice(i, 1);
	}
</script>

<form
	method="POST"
	enctype="multipart/form-data"
	novalidate
	use:enhance={({ formData, submitter }) => {
		formData.delete('photos');
		formData.delete('order');
		let n = 0;
		for (const item of items) {
			if (item.key) formData.append('order', `k:${item.key}`);
			else if (item.blob) {
				formData.append('photos', item.blob, `photo-${n + 1}.${item.blob.type === 'image/webp' ? 'webp' : 'jpg'}`);
				formData.append('order', `n:${n++}`);
			}
		}
		busy = submitter?.getAttribute('value') ?? buttons[0].intent;
		return async ({ update }) => {
			await update({ reset: false });
			busy = '';
		};
	}}
>
	<div class="field" style="margin-top:18px">
		<span>Photos <span class="muted">(1 to {MAX}; the first is the cover)</span></span>
		<div class="photo-grid">
			{#each items as p, i (p.url)}
				<div>
					<img src={p.url} alt={`Thumbnail ${i + 1}`} />
					{#if i === 0}<span class="cover-tag">Cover</span>{/if}
					<button type="button" class="photo-x" aria-label={`Remove photo ${i + 1}`} onclick={() => removePhoto(i)}>&times;</button>
				</div>
			{/each}
			{#if items.length < MAX}
				<label class="slot">
					<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>
					<span>{preparing ? 'Preparing...' : 'Add photo'}</span>
					<input type="file" name="photos" accept="image/*" multiple onchange={onPick} aria-label="Add photos" />
				</label>
			{/if}
			{#each Array(Math.max(0, MAX - items.length - 1)) as _, k (k)}<div class="slot empty" aria-hidden="true"></div>{/each}
		</div>
		{#if photoError}<div class="err">{photoError}</div>{/if}
		{#if form?.errors?.photos}<div class="err">{form.errors.photos}</div>{/if}
	</div>

	<label class="field">Title
		<input type="text" name="title" maxlength="100" placeholder="e.g. Casio fx-991 calculator" value={v.title ?? ''} />
		{#if form?.errors?.title}<div class="err">{form.errors.title}</div>{/if}
	</label>

	<label class="field">Category
		<select name="category">
			<option value="">Choose a category</option>
			{#each data.categories as c (c.id)}<option value={c.id} selected={v.categoryId === c.id}>{c.name}</option>{/each}
		</select>
		{#if form?.errors?.category}<div class="err">{form.errors.category}</div>{/if}
	</label>

	<div class="field">
		<span id="cond-label">Condition</span>
		<div class="chips" role="radiogroup" aria-labelledby="cond-label">
			{#each conditions as [value, label] (value)}
				<label class="chip"><input type="radio" name="condition" {value} checked={v.condition === value} /><span>{label}</span></label>
			{/each}
		</div>
		{#if form?.errors?.condition}<div class="err">{form.errors.condition}</div>{/if}
	</div>

	<label class="field">Price (UGX)
		<input type="text" name="price" inputmode="numeric" placeholder="45000" value={v.priceText ?? ''} />
		{#if form?.errors?.price}<div class="err">{form.errors.price}</div>{/if}
	</label>
	<label class="field">Units available
		<input type="number" name="quantity" min="1" max="100000" step="1" required value={v.quantity ?? 1} />
		<span class="muted">How many units do you currently have? Each sale will subtract only the number sold.</span>
		{#if form?.errors?.quantity}<div class="err">{form.errors.quantity}</div>{/if}
	</label>
	<label class="check"><input type="checkbox" name="negotiable" checked={v.negotiable ?? false} />Price is negotiable</label>

	<label class="field">Description
		<textarea name="description" maxlength="2000" placeholder="Condition, what is included, why you are selling">{v.description ?? ''}</textarea>
		{#if form?.errors?.description}<div class="err">{form.errors.description}</div>{/if}
	</label>

	{#if data.spots.length}
		<div class="field">
			<span id="spot-label">Where will you meet buyers? <span class="muted">(optional)</span></span>
			<div class="chips" role="radiogroup" aria-labelledby="spot-label">
				{#each data.spots as s (s.id)}
					<label class="chip"><input type="radio" name="meetup" value={s.id} checked={v.meetupSpotId === s.id} /><span>{s.name}</span></label>
				{/each}
			</div>
			{#if form?.errors?.meetup}<div class="err">{form.errors.meetup}</div>{/if}
		</div>
	{/if}

	<div class="notice tip">Some listings are checked by a moderator before going live. This is quick and keeps scams out.</div>

	{#each buttons as b (b.intent)}
		<button
			class="btn"
			class:btn2={!b.primary}
			type="submit"
			name="intent"
			value={b.intent}
			disabled={!!busy || preparing}
			style={b.primary ? '' : 'border-color:var(--line);color:var(--ink)'}
		>{busy === b.intent ? b.busyLabel : b.label}</button>
	{/each}
</form>
