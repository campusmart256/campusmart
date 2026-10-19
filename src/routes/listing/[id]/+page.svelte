<script>
	import { page } from '$app/state';
	import { formatNumber, formatDate, CONDITION_LABELS } from '#lib/format.js';
	import Avatar from '#lib/components/Avatar.svelte';
	import ListingCard from '#lib/components/ListingCard.svelte';
	import Icon from '#lib/components/Icon.svelte';
	import ShareLinks from '#lib/components/ShareLinks.svelte';
	import { onMount } from 'svelte';
	import { rememberListing } from '#lib/recentlyViewed.js';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();
	const l = $derived(data.listing);
	const isActive = $derived(l.status === 'active');
	const shortDescription = $derived((l.description ?? '').replace(/\s+/g, ' ').slice(0, 140));

	/** @type {Record<string, [string, string]>} */
	const notices = {
		published: ['tip', 'Your listing is live.'],
		held: ['warn', 'Your listing was saved and is waiting for a quick check by a moderator. It will go live once approved.'],
		saved: ['tip', 'Changes saved.'],
		draft: ['tip', 'Saved as a draft. Only you can see it.'],
		limit: ['warn', 'Saved as a draft. You have reached the limit of active listings. Mark an old one as sold or get the green check to list more.'],
		error: ['warn', 'Saved as a draft. We could not publish it just now.']
	};
	/** @type {Record<string, string>} */
	const statusText = { draft: 'Draft (only you can see it)', held: 'Waiting for review', sold: 'Sold', expired: 'Expired', removed: 'Removed by a moderator', deleted: 'Deleted' };

	/** @type {HTMLDivElement | undefined} */
	let galleryEl = $state();
	let activePhoto = $state(0);

	onMount(() => {
		if (isActive && !data.isOwner) {
			rememberListing({ id: l.id, title: l.title, price_ugx: l.price_ugx, image: l.images?.[0] ?? null });
		}
	});

	/** @param {number} index */
	function goToPhoto(index) {
		const count = l.images?.length ?? 0;
		if (!count || !galleryEl) return;
		const next = (index + count) % count;
		activePhoto = next;
		galleryEl.scrollTo({ left: next * galleryEl.clientWidth, behavior: 'smooth' });
	}

	/** @param {number} direction */
	function movePhoto(direction) { goToPhoto(activePhoto + direction); }

	function syncPhoto() {
		if (!galleryEl?.clientWidth) return;
		activePhoto = Math.min((l.images?.length ?? 1) - 1, Math.max(0, Math.round(galleryEl.scrollLeft / galleryEl.clientWidth)));
	}
</script>

<svelte:head>
	<title>{l.title} - UGX {formatNumber(l.price_ugx)} | campusmart</title>
	{#if isActive}
		<meta property="og:type" content="website" />
		<meta property="og:site_name" content="campusmart" />
		<meta property="og:title" content="{l.title} - UGX {formatNumber(l.price_ugx)}" />
		<meta property="og:description" content="{CONDITION_LABELS[l.condition] ?? l.condition} condition. {shortDescription}" />
		{#if l.images[0]}<meta property="og:image" content="{page.url.origin}/photos/{l.images[0]}" />{/if}
		<meta property="og:url" content="{page.url.origin}/listing/{l.id}" />
		<meta name="twitter:card" content="summary_large_image" />
	{:else}
		<meta name="robots" content="noindex" />
	{/if}
</svelte:head>

<div class="wrap">
	{#if data.isOwner && data.notice && notices[data.notice]}
		<div class="page notice-row" style="padding-bottom:6px"><div class="notice {notices[data.notice][0]}" role="status">{notices[data.notice][1]}</div></div>
	{/if}
	{#if data.isOwner && !isActive}
		<div class="page notice-row" style="padding-bottom:10px"><div class="notice warn" style="margin-top:0">Status: {statusText[l.status] ?? l.status}</div></div>
	{/if}

	<div class="listing-hero">
		<div class="hero-copy"><span class="hero-kicker">CAMPUSMART / MARKETPLACE</span><p>Great finds. Right on campus.</p><span class="hero-sub">See the photos, check the details and connect with the seller.</span></div>
		<div class="hero-mark" aria-hidden="true"><Icon name="box" size={28} /></div>
	</div>

	<nav class="crumbs" aria-label="Breadcrumb">
		<a href="/">Marketplace</a><span aria-hidden="true">/</span>
		{#if l.categories?.name}<span>{l.categories.name}</span><span aria-hidden="true">/</span>{/if}
		<span class="crumb-current" aria-current="page">{l.title}</span>
	</nav>

	<div class="listing-layout">
		<main class="main-column">
			<div class="gallery-block">
				{#if l.images.length}
					<div class="gallery-frame">
						<div class="gallery" role="group" aria-label="Listing photos" bind:this={galleryEl} onscroll={syncPhoto}>
							{#each l.images as key, i (key)}
								<img src="/photos/{key}" alt="{l.title}, photo {i + 1} of {l.images.length}" loading={i === 0 ? 'eager' : 'lazy'} />
							{/each}
						</div>
						<span class="gallery-count" aria-live="polite">{activePhoto + 1} / {l.images.length}</span>
						{#if l.images.length > 1}
							<button class="photo-arrow photo-arrow-left" type="button" aria-label="Previous photo" onclick={() => movePhoto(-1)}>‹</button>
							<button class="photo-arrow photo-arrow-right" type="button" aria-label="Next photo" onclick={() => movePhoto(1)}>›</button>
						{/if}
					</div>
					{#if l.images.length > 1}
						<div class="thumbnail-strip" aria-label="Choose a listing photo">
							{#each l.images as key, i (key)}
								<button class:current={activePhoto === i} class="thumb" type="button" aria-label="Show photo {i + 1}" aria-pressed={activePhoto === i} onclick={() => goToPhoto(i)}>
									<img src="/photos/{key}" alt="" loading="lazy" />
								</button>
							{/each}
						</div>
					{/if}
				{:else}
					<div class="gallery-empty"><Icon name="box" size={42} /><span>No photos added yet</span></div>
				{/if}
			</div>

			<section class="item-summary card" aria-labelledby="listing-title">
				<div class="eyebrow">Item details</div>
				<h1 id="listing-title">{l.title}</h1>
				<div class="tags-row">
					<span class="tag condition-tag">{CONDITION_LABELS[l.condition] ?? l.condition}</span>
					{#if l.categories?.name}<span class="tag">{l.categories.name}</span>{/if}
					{#if l.published_at}<span class="tag">Posted {formatDate(l.published_at)}</span>{/if}
				</div>
				<div class="item-facts">
					<div><Icon name="box" size={18} /><span>{l.quantity_available ?? 1} unit{l.quantity_available === 1 ? '' : 's'} available</span></div>
					{#if l.meetup_spots?.name}<div><Icon name="pin" size={18} /><span>Meetup: {l.meetup_spots.name}</span></div>{/if}
				</div>
			</section>

			<!-- Mobile-first price and contact panel; desktop keeps its existing sidebar. -->
			<section class="mobile-purchase glass-panel" aria-label="Listing price and actions">
				<div class="mobile-location">
					<Icon name="pin" size={16} />
					<span>{l.profiles?.campuses?.name ?? 'CampusMart university'}</span>
					{#if l.published_at}<span aria-hidden="true">·</span><span>{formatDate(l.published_at)}</span>{/if}
				</div>
				<h2 class="mobile-title">{l.title}</h2>
				<div class="mobile-price-row">
					<strong class="mobile-price">UGX {formatNumber(l.price_ugx)}</strong>
					<span class="mobile-price-tag">{l.is_negotiable ? 'Negotiable' : 'Fixed price'}</span>
				</div>
				<p class="mobile-stock"><span class="stock-dot"></span>{isActive ? `${l.quantity_available ?? 1} unit${l.quantity_available === 1 ? '' : 's'} available` : (statusText[l.status] ?? l.status)}</p>
				{#if isActive && !data.isOwner}
					<form method="POST" action="?/message" class="mobile-message-form">
						<button type="submit" class="mobile-message"><Icon name="chat" size={20} /> Message seller</button>
					</form>
					{#if form?.messageError}<div class="notice warn" role="alert">{form.messageError}</div>{/if}
				{/if}
				<div class="mobile-utilities">
					{#if isActive}
						<div class="mobile-share"><ShareLinks title={l.title} text={`${l.title} — UGX ${formatNumber(l.price_ugx)} on CampusMart`} url={`${page.url.origin}/listing/${l.id}`} /></div>
					{/if}
					{#if isActive && !data.isOwner}
						{#if data.signedIn}
							<form method="POST" action="/saved?/toggle" class="mobile-save-form">
								<input type="hidden" name="listing_id" value={l.id} />
								<input type="hidden" name="return_to" value={page.url.pathname + page.url.search} />
								<input type="hidden" name="save" value={data.isSaved ? '0' : '1'} />
								<button type="submit" class="mobile-utility"><Icon name="heart" size={18} /> {data.isSaved ? 'Saved' : 'Save'}</button>
							</form>
						{:else}
							<a class="mobile-utility" href="/signin?next={encodeURIComponent(page.url.pathname)}"><Icon name="heart" size={18} /> Save</a>
						{/if}
					{/if}
					{#if data.isOwner && ['draft', 'active', 'expired'].includes(l.status)}<a class="mobile-utility" href="/my-listings/{l.id}/edit">Edit listing</a>{/if}
				</div>
				<div class="mobile-safety"><Icon name="shield" size={17} /><span>Meet in a public place and inspect the item before paying. <a href="/safety">Safety tips →</a></span></div>
			</section>

			<section class="mobile-details glass-panel" aria-label="Quick item details">
				<h2>Details</h2>
				<div class="mobile-detail-grid">
					<div><span>Condition</span><strong>{CONDITION_LABELS[l.condition] ?? l.condition}</strong></div>
					<div><span>Category</span><strong>{l.categories?.name ?? 'Other'}</strong></div>
					<div><span>Available</span><strong>{l.quantity_available ?? 1} unit{l.quantity_available === 1 ? '' : 's'}</strong></div>
					{#if l.meetup_spots?.name}<div><span>Meetup</span><strong>{l.meetup_spots.name}</strong></div>{/if}
				</div>
			</section>

			<section class="description-section card" aria-labelledby="description-h">
				<h2 id="description-h">About this item</h2>
				<p class="description">{l.description || 'The seller has not added a description yet.'}</p>
			</section>

			{#if data.similar.length}
				<section class="similar" aria-labelledby="similar-h">
					<div class="similar-heading"><div><h2 id="similar-h">You might also like</h2><p class="muted">More items available on campus</p></div><a href="/">Explore all →</a></div>
					<div class="grid2">
						{#each data.similar as s (s.id)}<ListingCard l={s} signedIn={data.signedIn} returnTo={page.url.pathname + page.url.search} />{/each}
					</div>
				</section>
			{/if}
			<p class="back-home"><a href="/">← Back to marketplace</a> <span aria-hidden="true">·</span> <a href="/recently-viewed">Recently viewed</a></p>
		</main>

		<aside class="side-column" aria-label="Listing actions">
			<section class="action-card card" aria-label="Price and contact">
				<div class="action-eyebrow">Price & availability</div>
				<div class="price-head">
					<div class="price">UGX {formatNumber(l.price_ugx)}</div>
					{#if l.is_negotiable}<span class="tag teal">Negotiable</span>{:else}<span class="tag">Fixed price</span>{/if}
				</div>
				<p class="availability"><span class="stock-dot"></span>{isActive ? `${l.quantity_available ?? 1} unit${l.quantity_available === 1 ? '' : 's'} available` : (statusText[l.status] ?? l.status)}</p>
				<div class="notice warn compact-warning"><Icon name="shield" size={18} /><span>Meet in a public place and inspect the item before paying. <a href="/safety">Safety tips →</a></span></div>
                {#if isActive}
                    <ShareLinks title={l.title} text={`${l.title} — UGX ${formatNumber(l.price_ugx)} on CampusMart`} url={`${page.url.origin}/listing/${l.id}`} />
                {/if}
                {#if isActive && !data.isOwner}
                    {#if data.signedIn}
                        <form method="POST" action="/saved?/toggle" class="save-listing-form">
                            <input type="hidden" name="listing_id" value={l.id} />
                            <input type="hidden" name="return_to" value={page.url.pathname + page.url.search} />
                            <input type="hidden" name="save" value={data.isSaved ? '0' : '1'} />
                            <button class="btn btn2 save-listing-button" type="submit" aria-label={data.isSaved ? 'Remove from saved items' : 'Save this item'}>
                                <Icon name="heart" size={20} /> {data.isSaved ? 'Saved — remove' : 'Save this item'}
                            </button>
                        </form>
                    {:else}
                        <a class="btn btn2 save-listing-button" href="/signin?next={encodeURIComponent(page.url.pathname)}"><Icon name="heart" size={20} /> Sign in to save</a>
                    {/if}
                {/if}

				{#if isActive && !data.isOwner}
					<form method="POST" action="?/message" class="contact-form"><button class="btn message-button" type="submit"><Icon name="chat" size={19} /> Message seller</button></form>
					{#if form?.messageError}<div class="notice warn" role="alert">{form.messageError}</div>{/if}
				{/if}
				{#if data.isOwner && ['draft', 'active', 'expired'].includes(l.status)}
					<a class="btn btn2" href="/my-listings/{l.id}/edit">Edit this listing</a>
				{/if}
				{#if data.isOwner}<p class="owner-link"><a href="/my-listings">Go to My listings</a></p>{/if}
			</section>

			<section class="seller-card card" aria-label="Seller information">
				<div class="seller-card-label">Seller information</div>
				<div class="seller-inner">
				<Avatar path={l.profiles?.avatar_path} name={l.profiles?.display_name} size={54} />
				<div style="flex:1">
					<div style="font-weight:800"><a class="seller-profile-link" href="/seller/{l.seller_id}" aria-label="View {l.profiles?.display_name ?? 'seller'}'s public profile">{l.profiles?.display_name ?? 'Seller'} →</a></div>
					<div class="muted">International University of East Africa</div>
					{#if l.meetup_spots?.name}<div class="meetup">Meet at {l.meetup_spots.name}</div>{/if}
				</div>
				{#if l.profiles?.verification_status === 'verified'}
					<span class="verified-dot" title="Verified student" aria-label="Verified student"><Icon name="verified" size={18} /></span>
				{/if}
				</div>
				<a class="seller-visit" href="/seller/{l.seller_id}">View seller profile <span aria-hidden="true">→</span></a>
			</section>

			<section class="feedback-card card" aria-label="Feedback and reviews">
				<h2>Reviews & feedback</h2>
				<div class="feedback-row">
					<strong>{data.sellerFeedbackCount ?? 0}</strong>
					<span class="muted">seller feedback</span>
				</div>
				{#if data.sellerRatingAverage}
					<p class="review-stars" aria-label="Average rating">{'★'.repeat(Math.round(data.sellerRatingAverage))}{'☆'.repeat(5 - Math.round(data.sellerRatingAverage))} <span>{data.sellerRatingAverage.toFixed(1)} / 5</span></p>
				{/if}
				{#if data.sellerReviews?.length}
					<p class="muted seller-review-intro">Reviews from students who bought this seller's previous items:</p>
					<div class="seller-review-list">
						{#each data.sellerReviews as review, index (index)}
							<article class="seller-review-entry">
								<div class="seller-review-heading">
									<strong class="seller-review-title">Reviewed by {review.reviewer_name || 'CampusMart buyer'}</strong>
									<time class="muted" datetime={review.created_at}>{formatDate(review.created_at)}</time>
								</div>
								<p class="muted seller-review-item">Item purchased: {review.item_title}</p>
								<p class="review-stars" aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</p>
								{#if review.comment}<p class="seller-review-comment">{review.comment}</p>{:else}<p class="muted">Rating only — no written feedback.</p>{/if}
							</article>
						{/each}
					</div>
				{:else if data.sellerReviewsUnavailable}
					<p class="muted">Reviews are temporarily unavailable.</p>
				{:else}
					<p class="muted">No reviews from completed purchases yet.</p>
				{/if}
			</section>

			{#if data.canReview || data.buyerReview || form?.reviewSuccess || form?.reviewMessage}
				<section class="review-card card" aria-label="Review your purchase">
					<h2>Review your purchase</h2>
					{#if form?.reviewSuccess}<div class="notice tip" role="status">{form.reviewSuccess}</div>{/if}
					{#if form?.reviewMessage}<div class="notice warn" role="alert">{form.reviewMessage}</div>{/if}
					{#if data.buyerReview}
						<p class="review-stars">{'★'.repeat(data.buyerReview.rating)}{'☆'.repeat(5 - data.buyerReview.rating)}</p>
						{#if data.buyerReview.comment}<p class="muted">{data.buyerReview.comment}</p>{/if}
						<p class="muted">You already reviewed this item.</p>
					{:else if data.canReview}
						<p class="muted">Help other students know whether this seller was safe and honest.</p>
						<form class="review-form" method="POST" action="?/reviewItem">
							<label>
								Rating
								<select name="rating" required>
									<option value="">Choose rating</option>
									<option value="5">5 stars — Excellent</option>
									<option value="4">4 stars — Good</option>
									<option value="3">3 stars — Okay</option>
									<option value="2">2 stars — Poor</option>
									<option value="1">1 star — Bad</option>
								</select>
							</label>
							<label>
								Comment (optional)
								<textarea name="comment" rows="3" maxlength="500" placeholder="How was the item and seller?"></textarea>
							</label>
							<button class="btn" type="submit">Send review</button>
						</form>
					{/if}
				</section>
			{/if}

			<section class="report-card card" aria-label="Report this item">
				<details>
					<summary>Report this item</summary>
					<form class="report-form" method="POST" action="?/reportItem">
						<label>
							Reason
							<select name="reason" required>
								<option value="">Choose a reason</option>
								<option value="scam_or_fake">Scam or fake listing</option>
								<option value="prohibited_item">Prohibited item</option>
								<option value="harassment">Harassment or unsafe seller</option>
								<option value="other">Other</option>
							</select>
						</label>
						<label>
							Extra details (optional)
							<textarea name="note" rows="3" maxlength="500" placeholder="Explain what looks wrong."></textarea>
						</label>
						<button class="btn btn2" type="submit">Send report</button>
					</form>
				</details>
				{#if form?.reportSuccess}<div class="notice tip">{form.reportSuccess}</div>{/if}
				{#if form?.reportMessage}<div class="notice warn" role="alert">{form.reportMessage}</div>{/if}
			</section>
		</aside>
	</div>
</div>
<style>
	.wrap { padding: 14px 14px 48px; overflow-x: clip; }
	.notice-row { max-width: 1200px; margin: 0 auto; }
	.crumbs { max-width: 1200px; margin: 0 auto 18px; display: flex; align-items: center; gap: 9px; font-size: 12px; color: var(--mute); min-width: 0; }
	.crumbs a { color: var(--mute); font-weight: 650; }
	.crumbs a:hover { color: var(--red); }
	.crumb-current { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: var(--ink); font-weight: 700; }
	.listing-layout { max-width: 1200px; margin: 0 auto; display: grid; gap: 20px; min-width: 0; }
	.main-column, .side-column { min-width: 0; width: 100%; }
	.main-column { display: grid; align-content: start; gap: 18px; }
	.gallery-block { min-width: 0; }
	.gallery-frame { position: relative; width: 100%; border-radius: 22px; overflow: hidden; background: #f5f1ef; border: 1px solid #eae2de; }
	.gallery { display: flex; overflow-x: auto; scroll-snap-type: x mandatory; scrollbar-width: none; overscroll-behavior-x: contain; }
	.gallery::-webkit-scrollbar { display: none; }
	.gallery img { flex: 0 0 100%; display: block; width: 100%; height: clamp(300px, 52vw, 520px); object-fit: contain; scroll-snap-align: start; background: #f5f1ef; }
	.gallery-count { position: absolute; bottom: 14px; right: 14px; padding: 7px 12px; border-radius: 999px; background: rgba(25,24,24,.78); color: white; font-size: 12px; font-weight: 800; pointer-events: none; }
	.photo-arrow { position: absolute; top: 50%; transform: translateY(-50%); width: 44px; height: 50px; border: 1px solid rgba(255,255,255,.75); border-radius: 15px; background: rgba(255,255,255,.92); color: var(--ink); font-size: 31px; line-height: 1; display: flex; align-items: center; justify-content: center; cursor: pointer; box-shadow: 0 4px 16px rgba(26,26,26,.09); }
	.photo-arrow:hover { background: white; color: var(--red); }
	.photo-arrow-left { left: 12px; }
	.photo-arrow-right { right: 12px; }
	.thumbnail-strip { display: flex; gap: 10px; overflow-x: auto; padding: 12px 2px 2px; scrollbar-width: thin; }
	.thumb { flex: 0 0 74px; width: 74px; height: 68px; padding: 3px; background: white; border: 2px solid var(--line); border-radius: 12px; cursor: pointer; overflow: hidden; }
	.thumb.current { border-color: var(--red); box-shadow: 0 0 0 1px var(--red); }
	.thumb img { width: 100%; height: 100%; object-fit: cover; border-radius: 7px; display: block; }
	.gallery-empty { min-height: 280px; border: 1px solid var(--line); background: #f4efed; border-radius: 20px; display: grid; place-content: center; justify-items: center; gap: 12px; color: var(--mute); font-weight: 700; }
	.item-summary, .description-section { border-radius: 20px; padding: 22px; }
	.eyebrow, .action-eyebrow, .seller-card-label { text-transform: uppercase; letter-spacing: .11em; color: var(--mute); font-size: 11px; font-weight: 800; }
	h1 { font-size: clamp(23px, 3vw, 32px); line-height: 1.2; letter-spacing: -.035em; margin: 9px 0 16px; overflow-wrap: anywhere; }
	h2 { font-size: 19px; letter-spacing: -.02em; margin: 0 0 14px; }
	.tags-row { display: flex; gap: 8px; flex-wrap: wrap; }
	.condition-tag { background: #f8f2f1; border-color: #ebdfdb; }
	.item-facts { display: flex; gap: 12px 24px; flex-wrap: wrap; border-top: 1px solid var(--line); padding-top: 17px; margin-top: 19px; color: var(--body); font-size: 13px; font-weight: 650; }
	.item-facts > div { display: flex; align-items: center; gap: 8px; min-width: 0; }
	.item-facts :global(svg) { color: var(--red); flex: none; }
	.description { white-space: pre-wrap; overflow-wrap: anywhere; color: var(--body); margin: 0; line-height: 1.8; }
	.side-column { display: grid; align-content: start; gap: 15px; }
	.action-card, .feedback-card, .review-card, .report-card { display: grid; gap: 13px; border-radius: 20px; padding: 22px; }
	.price-head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px; }
	.price { color: var(--ink); font-size: clamp(26px, 3vw, 32px); font-weight: 900; letter-spacing: -.035em; line-height: 1.12; }
	.availability { display: flex; align-items: center; gap: 8px; margin: 0; font-size: 13px; color: var(--teal); font-weight: 800; }
	.stock-dot { width: 8px; height: 8px; border-radius: 50%; background: var(--teal); flex: none; }
	.compact-warning { margin: 2px 0 0; display: flex; align-items: flex-start; gap: 9px; font-weight: 550; line-height: 1.55; }
	.compact-warning :global(svg) { flex: none; margin-top: 2px; }
	.compact-warning a { color: inherit; text-decoration: underline; }
	.contact-form, .save-listing-form { margin: 0; }
	.contact-form .btn, .save-listing-form .btn { width: 100%; margin: 0; }
	.message-button { display: flex; align-items: center; gap: 9px; }
	.save-listing-button { display: flex; align-items: center; gap: 9px; }
	.owner-link { text-align: center; margin: 0; }
	.seller-card { display: grid; gap: 13px; border-radius: 20px; padding: 20px 22px; }
	.seller-inner { display: flex; align-items: center; gap: 12px; min-width: 0; }
	.seller-inner > div { min-width: 0; }
	.seller-profile-link { color: var(--ink); font-weight: 800; text-decoration: none; overflow-wrap: anywhere; }
	.seller-profile-link:hover { color: var(--red); }
	.seller-visit { display: flex; justify-content: space-between; align-items: center; padding-top: 12px; border-top: 1px solid var(--line); font-size: 13px; }
	.verified-dot { width: 32px; height: 32px; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; background: #dff7ea; color: #10a857; border: 1px solid #b9edcd; flex: none; }
	.meetup { color: var(--red); font-weight: 700; margin-top: 4px; }
	.feedback-row { display: flex; align-items: baseline; gap: 8px; }
	.feedback-row strong { font-size: 28px; }
	.seller-review-intro { margin: 2px 0 0; font-size: 13px; }
	.seller-review-list { display: grid; gap: 0; min-width: 0; }
	.seller-review-entry { min-width: 0; padding: 13px 0; border-top: 1px solid var(--line); }
	.seller-review-heading { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: baseline; gap: 4px 10px; }
	.seller-review-title { overflow-wrap: anywhere; }
	.seller-review-item { margin: 3px 0 5px; font-size: 13px; overflow-wrap: anywhere; }
	.seller-review-heading time { font-size: 12px; }
	.seller-review-comment { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.5; margin: 5px 0 0; }
	.review-stars { margin: 0; color: #f59e0b; font-weight: 900; letter-spacing: 1px; }
	.review-stars span { color: var(--mute); font-weight: 700; letter-spacing: 0; }
	.review-form, .report-form { display: grid; gap: 10px; margin-top: 12px; }
	.review-form label, .report-form label { display: grid; gap: 6px; font-weight: 700; }
	.review-form select, .review-form textarea, .report-form select, .report-form textarea { width: 100%; border: 1px solid var(--line); border-radius: 12px; padding: 11px 12px; font: inherit; background: white; }
	.report-card summary { cursor: pointer; font-weight: 800; }
	.similar { border-top: 1px solid var(--line); padding-top: 24px; }
	.similar-heading { display: flex; justify-content: space-between; align-items: baseline; gap: 12px; margin-bottom: 16px; }
	.similar-heading h2 { margin: 0 0 4px; }
	.similar-heading p { margin: 0; }
	.similar-heading a { font-size: 12px; white-space: nowrap; }
	.back-home { margin: 0; text-align: center; font-size: 13px; }
	.back-home span { color: var(--mute); padding: 0 5px; }
	:global(button:focus-visible), .thumb:focus-visible, .photo-arrow:focus-visible { outline: 3px solid #f2a3b0; outline-offset: 3px; }
	@media (min-width: 900px) {
		.wrap { padding: 22px 20px 60px; }
		.listing-layout { grid-template-columns: minmax(0, 1fr) minmax(300px, 355px); align-items: start; gap: 24px; }
		.side-column { position: sticky; top: 86px; max-height: calc(100vh - 98px); overflow-y: auto; scrollbar-width: thin; }
		.gallery img { height: min(56vh, 520px); min-height: 370px; }
		.similar .grid2 { grid-template-columns: repeat(2, minmax(0, 1fr)); }
	}
	@media (max-width: 560px) {
		.wrap { padding: 10px 10px 40px; }
		.crumbs { margin-bottom: 12px; }
		.listing-layout { gap: 14px; }
		.main-column { gap: 14px; }
		.gallery-frame { border-radius: 16px; }
		.gallery img { height: 330px; }
		.photo-arrow { width: 37px; height: 46px; border-radius: 12px; }
		.photo-arrow-left { left: 8px; }
		.photo-arrow-right { right: 8px; }
		.thumb { flex-basis: 62px; width: 62px; height: 58px; }
		.item-summary, .description-section, .action-card, .feedback-card, .review-card, .report-card, .seller-card { padding: 17px; border-radius: 16px; }
		.item-facts { display: grid; gap: 10px; }
	}
	@media (prefers-reduced-motion: reduce) { .gallery { scroll-behavior: auto; } }

	/* Phase 59.3: editorial listing layout aligned with the new CampusMart homepage. */
	:global(html:has(.listing-hero)) { scrollbar-width: thin; scrollbar-color: #b7bdc7 #f8f6f5; }
	.wrap { padding: 22px clamp(12px, 2.6vw, 36px) 76px; background: #f8f6f5; }
	.listing-hero { max-width: 1320px; margin: 0 auto 18px; padding: clamp(21px, 3vw, 34px); border-radius: 24px; background: linear-gradient(115deg, #101d30 0%, #192c46 74%, #273d59 100%); color: #fff; display: flex; align-items: center; justify-content: space-between; gap: 20px; box-shadow: 0 14px 35px rgba(15, 29, 47, .12); }
	.hero-kicker { color: #ff9bad; font-size: 11px; letter-spacing: .16em; font-weight: 900; }
	.hero-copy p { font-size: clamp(22px, 3vw, 34px); letter-spacing: -.045em; line-height: 1.15; font-weight: 900; margin: 9px 0 8px; }
	.hero-sub { color: #d1dbe6; font-size: 13px; line-height: 1.5; }
	.hero-mark { width: 68px; height: 68px; border: 1px solid rgba(255,255,255,.19); border-radius: 21px; display: grid; place-items: center; background: rgba(255,255,255,.08); color: #fff; flex: none; }
	.crumbs { max-width: 1320px; padding: 0 3px; margin-bottom: 18px; }
	.listing-layout { max-width: 1320px; gap: 24px; }
	.main-column { gap: 20px; }
	.gallery-frame { background: #fff; border: 1px solid #e8e7e8; border-radius: 24px; box-shadow: 0 6px 24px rgba(16,29,48,.045); }
	.gallery img { background: #fff; }
	.gallery-count { background: rgba(16,29,48,.83); }
	.photo-arrow { width: 46px; height: 46px; border-radius: 50%; color: #142238; box-shadow: 0 8px 20px rgba(16,29,48,.12); transition: background .18s ease, transform .18s ease, box-shadow .18s ease; }
	.photo-arrow:hover { transform: translateY(-50%) scale(1.06); box-shadow: 0 12px 28px rgba(16,29,48,.17); }
	.thumb { border-color: #e5e4e5; transition: border-color .2s ease, transform .2s ease, box-shadow .2s ease; }
	.thumb:hover { transform: translateY(-2px); }
	.thumb.current { border-color: #c8102e; box-shadow: 0 0 0 2px rgba(200,16,46,.12); }
	.item-summary, .description-section, .action-card, .seller-card, .feedback-card, .review-card, .report-card { border: 1px solid #e8e6e5; border-radius: 22px; background: #fff; box-shadow: 0 6px 24px rgba(16,29,48,.035); }
	.item-summary { padding: clamp(22px, 3vw, 30px); border-top: 4px solid #c8102e; }
	.item-summary h1 { color: #142238; font-size: clamp(28px, 3.1vw, 40px); margin: 10px 0 19px; }
	.eyebrow, .action-eyebrow, .seller-card-label { color: #8b6570; }
	.description-section { padding: clamp(22px, 3vw, 30px); }
	.description-section h2, .feedback-card h2, .review-card h2 { color: #142238; font-weight: 850; }
	.item-facts { color: #26364a; }
	.side-column { gap: 18px; }
	.action-card { padding: clamp(20px, 2.3vw, 28px); gap: 16px; border-top: 4px solid #c8102e; }
	.price { color: #142238; font-size: clamp(29px, 3.2vw, 39px); }
	.availability { background: #eaf7f3; padding: 9px 12px; border-radius: 12px; width: fit-content; }
	.compact-warning { border-radius: 14px; }
	.message-button { min-height: 54px; border-radius: 14px; font-weight: 850; box-shadow: 0 7px 18px rgba(200,16,46,.13); }
	.save-listing-button { border-radius: 14px; }
	.seller-card { padding: 23px; }
	.seller-inner { align-items: center; }
	.seller-visit { color: #c8102e; }
	.similar { padding-top: 28px; }
	.similar-heading h2 { color: #142238; }
	/* Important: use the page's natural scroll instead of a second, thick right-hand scrollbar. */
	@media (min-width: 900px) {
		.wrap { padding-top: 26px; }
		.listing-layout { grid-template-columns: minmax(0, 1fr) minmax(320px, 380px); }
		.side-column { position: static; max-height: none; overflow: visible; scrollbar-width: auto; }
		.gallery img { height: min(57vh, 540px); min-height: 340px; }
	}
	@media (max-width: 899px) {
		.wrap { padding: 16px 12px 42px; }
		.listing-hero { border-radius: 19px; margin-bottom: 15px; }
		.hero-mark { width: 50px; height: 50px; border-radius: 16px; }
	}
	@media (max-width: 560px) {
		.listing-hero { padding: 20px; }
		.hero-mark { display: none; }
		.hero-copy p { font-size: 25px; }
		.hero-sub { font-size: 12px; }
		.item-summary, .description-section, .action-card, .feedback-card, .review-card, .report-card, .seller-card { padding: 19px; border-radius: 18px; }
		.item-summary h1 { font-size: 28px; }
		.gallery img { height: 310px; }
		.photo-arrow { width: 40px; height: 40px; }
	}
	@media (prefers-reduced-motion: reduce) { .photo-arrow, .thumb { transition: none; } }

	/* Listing detail wrapper was independently hardcoded to a light canvas. */
	:global(html[data-theme='dark']) .wrap { background:#101116; color:#f5f7fb; }
	:global(html[data-theme='dark']) .gallery-frame { background:#1c2230; border-color:rgba(255,255,255,.14); }
	:global(html[data-theme='dark']) .item-summary, :global(html[data-theme='dark']) .description-section, :global(html[data-theme='dark']) .action-card, :global(html[data-theme='dark']) .seller-card, :global(html[data-theme='dark']) .feedback-card, :global(html[data-theme='dark']) .review-card, :global(html[data-theme='dark']) .report-card { background:#1e2430; border-color:rgba(255,255,255,.15); }
	:global(html[data-theme='dark']) .item-summary h1, :global(html[data-theme='dark']) .description-section h2, :global(html[data-theme='dark']) .feedback-card h2, :global(html[data-theme='dark']) .review-card h2, :global(html[data-theme='dark']) .price, :global(html[data-theme='dark']) .similar-heading h2 { color:#f5f7fb; }
	:global(html[data-theme='dark']) .item-facts, :global(html[data-theme='dark']) .description { color:#c3ccdc; }

	/* Mobile listing details: existing desktop actions and forms remain untouched. */
	.mobile-purchase, .mobile-details { display:none; }
	@media (max-width: 899px) {
		.wrap { background: radial-gradient(ellipse at 90% 12%, rgba(247,199,214,.4), transparent 55%), radial-gradient(ellipse at 4% 40%, rgba(189,207,243,.24), transparent 60%), #f8f6f8; padding: 8px 12px 44px; }
		.listing-hero, .crumbs, .item-summary { display:none; }
		.main-column { gap:12px; }
		.listing-layout { gap:14px; }
		.gallery-frame { border-radius:28px; border:1px solid rgba(255,255,255,.75); box-shadow:0 12px 34px rgba(50,35,70,.09); }
		.gallery img { height:clamp(270px, 72vw, 440px); }
		.gallery-count { left:14px; right:auto; bottom:14px; background:rgba(20,25,38,.65); backdrop-filter:blur(16px); -webkit-backdrop-filter:blur(16px); }
		.thumbnail-strip { padding-top:8px; }
		.mobile-purchase, .mobile-details { display:block; }
		.glass-panel { min-width:0; padding:22px; border-radius:28px; background:rgba(255,255,255,.65); border:1px solid rgba(255,255,255,.8); box-shadow:0 10px 30px rgba(52,36,72,.07), inset 0 1px 0 rgba(255,255,255,.8); backdrop-filter:blur(22px) saturate(140%); -webkit-backdrop-filter:blur(22px) saturate(140%); }
		.mobile-location { color:#667084; display:flex; align-items:center; gap:7px; flex-wrap:wrap; font-size:12px; margin-bottom:12px; }
		.mobile-title { color:#142238; font-size:clamp(23px, 5.3vw, 31px); line-height:1.18; letter-spacing:-.035em; margin:0 0 14px; overflow-wrap:anywhere; }
		.mobile-price-row { display:flex; gap:10px; align-items:center; flex-wrap:wrap; }
		.mobile-price { color:#d30d38; font-size:clamp(26px, 6vw, 35px); line-height:1.15; font-weight:900; letter-spacing:-.035em; }
		.mobile-price-tag { background:rgba(244,90,127,.1); color:#ae294b; border:1px solid rgba(244,90,127,.12); border-radius:999px; padding:7px 11px; font-size:12px; font-weight:750; }
		.mobile-stock { display:flex; align-items:center; gap:7px; margin:10px 0 14px; font-size:12px; font-weight:750; color:#087b6e; }
		.mobile-message-form, .mobile-save-form { margin:0; min-width:0; }
		.mobile-message { width:100%; display:flex; align-items:center; justify-content:center; gap:10px; min-height:52px; border:1px solid rgba(255,255,255,.35); border-radius:17px; color:#fff; background:linear-gradient(115deg,#f51c51,#c8102e); box-shadow:0 9px 20px rgba(200,16,46,.2); font:inherit; font-weight:850; font-size:15px; cursor:pointer; }
		.mobile-utilities { display:flex; align-items:stretch; flex-wrap:wrap; gap:8px; margin-top:11px; }
		.mobile-save-form {
    display: flex;
    align-items: center;
    align-self: stretch;
}

.mobile-save-form > .mobile-utility {
    margin: 0;
    align-self: center;
}
		.mobile-utility { box-sizing:border-box; display:inline-flex; justify-content:center; align-items:center; gap:7px; padding:9px 14px; height:40px; min-height:40px; border-radius:999px; background:rgba(255,255,255,.36); border:1px solid rgba(255,255,255,.84); box-shadow:0 4px 12px rgba(30,37,56,.06), inset 0 1px 0 rgba(255,255,255,.7); backdrop-filter:blur(14px) saturate(150%); -webkit-backdrop-filter:blur(14px) saturate(150%); color:#182339; font:inherit; font-size:13px; font-weight:750; line-height:1; text-decoration:none; white-space:nowrap; cursor:pointer; -webkit-appearance:none; appearance:none; }
		.mobile-share { min-width:0; flex:0 1 auto; }
		.mobile-share :global(button), .mobile-share :global(a) { box-sizing:border-box !important; display:inline-flex !important; align-items:center !important; justify-content:center !important; gap:7px !important; width:auto !important; height:40px !important; min-height:40px !important; padding:9px 14px !important; border-radius:999px !important; font-size:13px !important; font-weight:750 !important; line-height:1 !important; white-space:nowrap !important; background:rgba(255,255,255,.36) !important; border:1px solid rgba(255,255,255,.84) !important; box-shadow:0 4px 12px rgba(30,37,56,.06), inset 0 1px 0 rgba(255,255,255,.7) !important; backdrop-filter:blur(14px) saturate(150%); -webkit-backdrop-filter:blur(14px) saturate(150%); color:#182339 !important; text-decoration:none !important; -webkit-appearance:none; appearance:none; }
		.mobile-share :global(.share-links) { display:flex; flex-wrap:wrap; gap:8px; }
		.mobile-safety { display:flex; align-items:flex-start; gap:8px; margin-top:15px; font-size:12px; color:#675a4d; line-height:1.5; }
		.mobile-safety :global(svg) { flex:none; color:#b96d21; }
		.mobile-safety a { color:#c8102e; text-decoration:underline; }
		.mobile-details h2 { color:#142238; font-size:19px; margin:0 0 13px; }
		.mobile-detail-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:16px; }
		.mobile-detail-grid > div { display:grid; gap:4px; min-width:0; }
		.mobile-detail-grid span { color:#687488; font-size:12px; }
		.mobile-detail-grid strong { color:#142238; font-size:14px; overflow-wrap:anywhere; }
		.side-column > .action-card { display:none; }
		.seller-card, .description-section { background:rgba(255,255,255,.7); border:1px solid rgba(255,255,255,.8); border-radius:25px; box-shadow:0 10px 30px rgba(52,36,72,.06); backdrop-filter:blur(18px); -webkit-backdrop-filter:blur(18px); }
	}
	@media (max-width: 560px) {
		.wrap { padding:8px 10px 44px; }
		.glass-panel { padding:17px; border-radius:23px; }
		.gallery img { height:clamp(265px, 77vw, 360px); }
		.mobile-title { font-size:24px; }
		.mobile-price { font-size:29px; }
	}
	:global(html[data-theme='dark']) .mobile-purchase, :global(html[data-theme='dark']) .mobile-details { background:rgba(31,38,53,.8); border-color:rgba(255,255,255,.13); }
	:global(html[data-theme='dark']) .mobile-title, :global(html[data-theme='dark']) .mobile-details h2, :global(html[data-theme='dark']) .mobile-detail-grid strong { color:#f5f7fb; }
	:global(html[data-theme='dark']) .mobile-location, :global(html[data-theme='dark']) .mobile-detail-grid span { color:#b7c1d1; }
	:global(html[data-theme='dark']) .mobile-utility { color:#f5f7fb; background:rgba(255,255,255,.08); border-color:rgba(255,255,255,.17); }
	:global(html[data-theme='dark']) .mobile-share :global(button), :global(html[data-theme='dark']) .mobile-share :global(a) { color:#f5f7fb !important; background:rgba(255,255,255,.08) !important; border-color:rgba(255,255,255,.17) !important; box-shadow:0 4px 12px rgba(0,0,0,.12), inset 0 1px 0 rgba(255,255,255,.08) !important; }
	:global(html[data-theme='dark']) .mobile-safety { color:#e4caab; }

</style>