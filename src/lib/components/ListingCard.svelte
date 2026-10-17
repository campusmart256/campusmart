<script>
    import { formatNumber, CONDITION_LABELS } from '#lib/format.js';
    import Icon from './Icon.svelte';

    /**
     * @typedef {object} Listing
     * @property {string} id
     * @property {string} title
     * @property {number} price
     * @property {string} condition
     * @property {boolean} negotiable
     * @property {string} category
     * @property {string} seller
     * @property {string | null} cover
     * @property {boolean} verified
     * @property {boolean} [saved]
     * @property {boolean} [own]
     */

    /**
     * @typedef {object} Props
     * @property {Listing} l
     * @property {boolean} [signedIn]
     * @property {string} [returnTo]
     */

    /** @type {Props} */
    let { l, signedIn = false, returnTo = '/' } = $props();
</script>

<div class="saved-card-wrap">
	<a class="lcard" href="/listing/{l.id}">
		<div class="pic">
			{#if l.cover}<img src="/photos/{l.cover}" alt={l.title} loading="lazy" decoding="async" width="400" height="300" />{:else}<span class="no-photo"><Icon name="box" size={32} />Photo coming soon</span>{/if}
			<span class="condition-pill">{CONDITION_LABELS[l.condition] ?? l.condition}</span>
		</div>
		<div class="meta">
			<div class="category-name">{l.category || 'Campus find'}</div>
			<div class="ttl">{l.title}</div>
			{#if l.seller}
				<div class="by"><span>by {l.seller}</span>{#if l.verified}<span class="verified-seller" title="Verified student"><Icon name="verified" size={15} /> Verified</span>{/if}</div>
			{:else if l.verified}
				<div class="by"><span class="verified-seller" title="Verified student"><Icon name="verified" size={15} /> Verified seller</span></div>
			{/if}
			<div class="pricerow"><span class="price">UGX {formatNumber(l.price)}</span>{#if l.negotiable}<span class="tag negotiable">Negotiable</span>{/if}</div>
		</div>
	</a>
	{#if signedIn && !l.own}
		<form class="save-control" method="POST" action="/saved?/toggle">
			<input type="hidden" name="listing_id" value={l.id} />
			<input type="hidden" name="return_to" value={returnTo} />
			<input type="hidden" name="save" value={l.saved ? '0' : '1'} />
			<button type="submit" class:saved={l.saved} aria-label={l.saved ? `Remove ${l.title} from saved items` : `Save ${l.title}`} title={l.saved ? 'Remove from saved items' : 'Save item'}><Icon name="heart" size={20} /></button>
		</form>
	{:else if !signedIn}
		<a class="save-control guest" href="/signin?next={encodeURIComponent(`/listing/${l.id}`)}" aria-label={`Sign in to save ${l.title}`} title="Sign in to save item"><Icon name="heart" size={20} /></a>
	{/if}
</div>

<style>
	.saved-card-wrap { position: relative; min-width: 0; }
	.saved-card-wrap > :global(.lcard) { height: 100%; }
	.save-control { position: absolute; top: 10px; right: 10px; z-index: 2; margin: 0; }
	.save-control button, .save-control.guest { display: inline-flex; align-items: center; justify-content: center; width: 40px; height: 40px; border-radius: 50%; border: 1px solid #ece4e1; background: rgba(255,255,255,.97); color: #4b4341; cursor: pointer; box-shadow: 0 2px 12px #1c10101f; }
	.save-control button.saved { background: #fff0f2; color: #c8102e; border-color: #e9acb6; }
	.save-control button.saved :global(svg) { fill: #c8102e; }
	.save-control button:focus-visible, .save-control.guest:focus-visible { outline: 3px solid #f2a3b0; outline-offset: 2px; }
	.save-control.guest:hover { text-decoration: none; color: #c8102e; }
	.pic { position: relative; }
	.no-photo { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 7px; color: #8b7c78; font-size: 11px; }
	.condition-pill { position: absolute; left: 9px; bottom: 9px; display: inline-flex; align-items: center; min-height: 25px; max-width: calc(100% - 65px); padding: 3px 9px; border-radius: 7px; background: rgba(255,255,255,.94); color: #51433f; font-size: 10px; font-weight: 800; box-shadow: 0 1px 8px #1b101019; }
	.category-name { font-size: 10px; color: #a33a4d; text-transform: uppercase; letter-spacing: .065em; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.ttl { margin: 6px 0; font-weight: 750; font-size: 14px; line-height: 1.4; overflow: hidden; display: -webkit-box; -webkit-box-orient: vertical; -webkit-line-clamp: 2; line-clamp: 2; min-height: 39px; }
	.by { font-size: 11px; color: var(--mute); margin: 0 0 10px; display: flex; flex-wrap: wrap; align-items: center; gap: 5px; }
	.by > span:first-child { max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.verified-seller { display: inline-flex; align-items: center; gap: 3px; color: #087a55; font-size: 10px; font-weight: 800; }
	.pricerow { display: flex; align-items: center; gap: 7px; flex-wrap: wrap; margin: 0; }
	.pricerow .price { font-size: 15px; letter-spacing: -.025em; }
	.negotiable { padding: 3px 7px; font-size: 10px; background: #f2f7f4; color: #29714d; border-color: #d4e9da; }
	@media (min-width: 640px) { .ttl { font-size: 15px; min-height: 42px; } .pricerow .price { font-size: 16px; } }
</style>
