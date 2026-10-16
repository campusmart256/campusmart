<script>
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { formatNumber } from '#lib/format.js';

	/** @type {{ data: any, form: any }} */
	let { data, form } = $props();
	/**
 * @typedef {{
 *   id: string,
 *   title: string,
 *   quantityAvailable: number | null
 * }} InventoryItem
 */

/**
 * @typedef {{
 *   id: string,
 *   listingId: string,
 *   itemTitle: string,
 *   buyerName: string,
 *   buyerType: string,
 *   quantity: number,
 *   createdAt: string
 * }} SaleItem
 */

const inventoryItems = $derived(
    /** @type {InventoryItem[]} */ (data.listings)
);

const saleItems = $derived(
    /** @type {SaleItem[]} */ (data.salesHistory)
);

	const tabs = [['dashboard', 'Dashboard'], ['active', 'Active'], ['drafts', 'Drafts'], ['sold', 'Sold'], ['expired', 'Expired'], ['bought', 'Bought items'], ['sales', 'Sales history'], ['inventory', 'Inventory']];
	const verified = $derived(data.profile?.verification_status === 'verified');
	// These match the starting limits in the database settings (5 and 20).
	const limit = $derived(verified ? 20 : 5);
	let confirming = $state('');
	let busy = $state('');

	// Inventory-only search, filters, and sorting. The server remains the source of truth.
	let inventoryQuery = $state('');
	let inventoryFilter = $state('all');
	let inventorySort = $state('low');
	const filteredInventory = $derived.by(() => {
		if (data.tab !== 'inventory') return inventoryItems;
		const query = inventoryQuery.trim().toLocaleLowerCase();
		return inventoryItems
    .filter((item) => {
				const stock = item.quantityAvailable ?? 1;
				return (!query || item.title.toLocaleLowerCase().includes(query)) &&
					(inventoryFilter === 'all' || (inventoryFilter === 'low' ? stock <= 3 : stock > 3));
			})
			.sort((a, b) => {
				const stockA = a.quantityAvailable ?? 1;
				const stockB = b.quantityAvailable ?? 1;
				if (inventorySort === 'high') return stockB - stockA || a.title.localeCompare(b.title);
				if (inventorySort === 'name') return a.title.localeCompare(b.title);
				return stockA - stockB || a.title.localeCompare(b.title);
			});
	});

	// Sales history tools: filtering is local to the transactions already loaded by the server.
	let salesQuery = $state('');
	let salesBuyerFilter = $state('all');
	let salesDateFilter = $state('all');
	let salesSort = $state('newest');
	const filteredSales = $derived.by(() => {
		const query = salesQuery.trim().toLocaleLowerCase();
		const now = Date.now();
		const cutoff = salesDateFilter === '30' ? now - 30 * 86400000 : salesDateFilter === '90' ? now - 90 * 86400000 : null;
		return saleItems.filter((sale) => {
			const matchesQuery = !query || sale.itemTitle.toLocaleLowerCase().includes(query) || sale.buyerName.toLocaleLowerCase().includes(query);
			const matchesBuyer = salesBuyerFilter === 'all' || sale.buyerType === salesBuyerFilter;
			const matchesDate = cutoff === null || new Date(sale.createdAt).getTime() >= cutoff;
			return matchesQuery && matchesBuyer && matchesDate;
		}).sort((a, b) => {
			if (salesSort === 'oldest') return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
			if (salesSort === 'quantity') return b.quantity - a.quantity || new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
			return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
		});
	});

	/** Safely quote spreadsheet cells and prevent CSV formula execution. @param {unknown} raw */
	function csvCell(raw) {
		let value = String(raw ?? '');
		if (/^[\s]*[=+@-]/.test(value)) value = "'" + value;
		return `"${value.replaceAll('"', '""')}"`;
	}

	function exportSalesCsv() {
		if (filteredSales.length === 0) return;
		const rows = [
			['Date', 'Item', 'Buyer', 'Buyer type', 'Units sold', 'Listing ID'],
			...filteredSales.map((sale) => [
				sale.createdAt, sale.itemTitle, sale.buyerName,
				sale.buyerType === 'outside' ? 'Outside CampusMart' : sale.buyerType === 'campusmart' ? 'CampusMart member' : 'Not recorded',
				sale.quantity, sale.listingId
			])
		];
		const csv = '\uFEFF' + rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
		const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }));
		const link = document.createElement('a');
		link.href = url;
		link.download = 'campusmart-sales-history.csv';
		document.body.appendChild(link);
		link.click();
		link.remove();
		// The download has been initiated; release the object URL on the next frame.
		requestAnimationFrame(() => URL.revokeObjectURL(url));
	}

	/** @param {any} l */
	function statusText(l) {
		switch (l.status) {
			case 'active': return l.daysLeft === null ? 'Live' : l.daysLeft === 1 ? 'Expires tomorrow' : `Expires in ${l.daysLeft} days`;
			case 'draft': return 'Draft (only you can see it)';
			case 'held': return 'Waiting for a moderator to check it';
			case 'removed': return 'Removed by a moderator';
			case 'sold': return l.soldOutside ? 'Sold outside campusmart' : l.hasBuyer ? 'Sold to a campusmart member' : 'Sold';
			case 'expired': return 'Expired';
			default: return l.status;
		}
	}
	/** @param {any} l */
	const tone = (l) => (l.status === 'held' || l.status === 'removed' ? 'warn' : l.status === 'expired' ? 'bad' : 'ok');

	/** @param {string} name */
	const submitter = (name) => () => {
		busy = name;
		return async ( /** @type {{ update: (o?: any) => Promise<void> }} */ { update }) => {
			await update({ reset: false });
			await invalidateAll();
			confirming = '';
			busy = '';
		};
	};
</script>

<svelte:head><title>My listings | campusmart</title></svelte:head>

<div class="page wide seller-workspace">
	<header class="workspace-hero">
		<div class="workspace-hero-copy">
			<p class="workspace-eyebrow"><span class="eyebrow-dot"></span> CAMPUSMART / SELLER STUDIO</p>
			<h1>Your store, <span>at a glance.</span></h1>
			<p>Manage your campus listings, keep stock updated and track your sales from one place.</p>
			<div class="hero-pills"><span>{data.dashboardStats.active} live listings</span><span>{data.dashboardStats.unitsAvailable} units in stock</span></div>
		</div>
		<div class="hero-actions">
			<a class="workspace-create" href="/sell"><span aria-hidden="true">＋</span> Create listing</a>
			<a class="hero-secondary" href="/my-listings?tab=inventory">View inventory <span aria-hidden="true">↗</span></a>
		</div>
	</header>

	{#if data.soldNotice}<div class="notice tip" role="status">Sale recorded. Remaining units stay available until stock reaches zero.</div>{/if}
	{#if form?.done === 'deleted'}<div class="notice tip" role="status">Listing deleted.</div>{/if}
	{#if form?.done === 'active' && form?.resultStatus === 'held'}<div class="notice warn" role="status">Saved, and waiting for a quick check by a moderator before it goes live.</div>
	{:else if form?.done === 'active'}<div class="notice tip" role="status">Your listing is live.</div>{/if}
	{#if form?.message}<div class="notice error" role="alert">{form.message}</div>{/if}
	{#if data.loadFailed}<div class="notice error" role="alert">We could not load your items. Please refresh the page.</div>{/if}
	{#if data.reviewsLoadFailed && data.tab === 'bought'}<div class="notice warn" role="alert">Reviews could not be loaded. Please refresh before submitting a review.</div>{/if}
	{#if form?.reviewSuccess}<div class="notice tip" role="status">{form.reviewSuccess}</div>{/if}

	<div class="workspace-nav-wrap">
		<div class="workspace-nav-title"><span>WORKSPACE</span><span>Choose a section <span aria-hidden="true">↘</span></span></div>
		<nav class="tabs" aria-label="Seller workspace sections">
			{#each tabs as [value, label] (value)}
				<a aria-current={data.tab === value ? 'page' : undefined} class="tab" class:on={data.tab === value} href={value === 'active' ? '/my-listings' : `/my-listings?tab=${value}`}>
					<span class="tab-indicator" aria-hidden="true"></span>{label} {#if data.counts[value] !== null}<span class="n">{data.counts[value]}</span>{/if}
				</a>
			{/each}
		</nav>
	</div>

	{#if data.tab !== 'bought' && data.tab !== 'sales' && data.tab !== 'inventory' && data.tab !== 'dashboard'}<div class="notice tip">{data.counts.active} of {limit} active listings used.{#if !verified}{' '}Students with the green check can have 20.{/if}</div>{:else if data.tab === 'bought'}<p class="muted">Items that sellers have marked as sold to your account. You can leave one review per purchase.</p>{:else if data.tab === 'dashboard'}<p class="muted">An overview of your listings, stock, recorded sales and buyer ratings.</p>{:else if data.tab === 'inventory'}<p class="muted">Monitor units available across your active listings. Items with 3 units or fewer are shown first.</p>{:else}<p class="muted">Your recorded sales, including partial sales. These are quantities recorded by you, not verified payments.</p>{/if}

	{#if data.tab === 'dashboard'}
		<section class="studio-overview" aria-label="Seller dashboard overview">
			<div class="dashboard-heading">
				<div><p class="workspace-eyebrow">YOUR STORE PERFORMANCE</p><h2>Dashboard overview</h2><p class="overview-subtitle">A clear picture of your marketplace activity.</p></div>
				<span class="dashboard-live"><span class="live-dot"></span> Live overview</span>
			</div>
			<div class="dashboard-grid" aria-label="Seller overview">
				<a class="dashboard-metric metric-primary" href="/my-listings"><span class="metric-top"><span class="metric-icon" aria-hidden="true">▣</span><span class="metric-arrow" aria-hidden="true">↗</span></span><span class="metric-label">Active listings</span><strong>{data.dashboardStats.active}</strong><small>Currently visible to buyers</small></a>
				<a class="dashboard-metric metric-stock" href="/my-listings?tab=inventory"><span class="metric-top"><span class="metric-icon" aria-hidden="true">▤</span><span class="metric-arrow" aria-hidden="true">↗</span></span><span class="metric-label">Units available</span><strong>{data.dashboardStats.unitsAvailable}</strong><small>Across active listings</small></a>
				<a class="dashboard-metric metric-warning" href="/my-listings?tab=inventory"><span class="metric-top"><span class="metric-icon" aria-hidden="true">!</span><span class="metric-arrow" aria-hidden="true">↗</span></span><span class="metric-label">Low-stock items</span><strong>{data.dashboardStats.lowStock}</strong><small>3 or fewer units remaining</small></a>
				<a class="dashboard-metric metric-sales" href="/my-listings?tab=sales"><span class="metric-top"><span class="metric-icon" aria-hidden="true">↗</span><span class="metric-arrow" aria-hidden="true">↗</span></span><span class="metric-label">Recorded sales</span><strong>{data.dashboardStats.transactions}</strong><small>{data.dashboardStats.unitsSold} units recorded as sold</small></a>
			</div>
			<div class="dashboard-mini-strip">
				<a href="/my-listings?tab=drafts"><span class="mini-dot draft-dot"></span><span>Drafts & pending</span><strong>{data.dashboardStats.drafts}</strong><span aria-hidden="true">→</span></a>
				<a href="/my-listings?tab=sold"><span class="mini-dot sold-dot"></span><span>Sold-out listings</span><strong>{data.dashboardStats.soldOut}</strong><span aria-hidden="true">→</span></a>
			</div>
			{#if data.dashboardStats.lowStock > 0}
				<div class="notice warn" role="status">{data.dashboardStats.lowStock} listing{data.dashboardStats.lowStock === 1 ? '' : 's'} running low on stock. <a href="/my-listings?tab=inventory">Check inventory</a>.</div>
			{/if}
			<div class="dashboard-section-title"><div><p class="workspace-eyebrow">LATEST ACTIVITY</p><h2>What's happening</h2></div><a href="/my-listings?tab=sales">View sales history →</a></div>
			<div class="dashboard-panels">
				<section class="card dashboard-panel" aria-labelledby="dashboard-recent-sales">
					<div class="dashboard-panel-head"><h2 id="dashboard-recent-sales">Recent sales</h2><a href="/my-listings?tab=sales">All sales →</a></div>
					{#if data.salesLoadFailed}<p class="muted">Sales could not be loaded. Refresh to try again.</p>
					{:else if data.salesHistory.length === 0}<p class="muted">No sales recorded yet. Record a sale from an active listing.</p>
					{:else}
						{#each data.salesHistory.slice(0, 5) as sale (sale.id)}
							<div class="dashboard-entry"><a href="/listing/{sale.listingId}">{sale.itemTitle}</a><span>{sale.quantity} unit{sale.quantity === 1 ? '' : 's'}</span><small>{new Date(sale.createdAt).toLocaleDateString('en-UG')}</small></div>
						{/each}
					{/if}
				</section>
				<section class="card dashboard-panel" aria-labelledby="dashboard-ratings">
					<div class="dashboard-panel-head"><h2 id="dashboard-ratings">Buyer ratings</h2><span class="muted">From recorded reviews</span></div>
					{#if data.dashboardReviewsFailed}<p class="muted">Reviews could not be loaded. Refresh to try again.</p>
					{:else if data.reviewStats.count === 0}<p class="muted">No buyer reviews yet. Reviews appear after recorded purchases.</p>
					{:else}
						<div class="dashboard-rating"><strong>★ {data.reviewStats.average} / 5</strong><span>{data.reviewStats.count} review{data.reviewStats.count === 1 ? '' : 's'}</span></div>
						{#each data.reviewStats.recent as review (review.listingId + review.createdAt)}
							<div class="dashboard-entry"><a href="/listing/{review.listingId}">{review.itemTitle}</a><span aria-label={`${review.rating} out of 5 stars`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span><small>{new Date(review.createdAt).toLocaleDateString('en-UG')}</small></div>
						{/each}
					{/if}
				</section>
			</div>
			<p class="muted dashboard-note">Sales and units sold are seller-recorded, not verified payments. Recent sales and ratings are based on up to 200 loaded records each.</p>
		</section>
	{/if}

	{#if data.tab === 'inventory'}
		<div class="card inventory-overview" aria-label="Inventory summary">
			<div><span class="muted">Active items</span><strong>{data.inventoryStats.activeListings}</strong></div>
			<div><span class="muted">Units available</span><strong>{data.inventoryStats.unitsAvailable}</strong></div>
			<div><span class="muted">Low-stock items</span><strong>{data.inventoryStats.lowStock}</strong></div>
		</div>
		{#if data.inventoryStats.lowStock > 0}<div class="notice warn" role="status">{data.inventoryStats.lowStock} active item{data.inventoryStats.lowStock === 1 ? '' : 's'} running low on stock. Update quantity or record a sale below.</div>{/if}
		<div class="card inventory-tools" aria-label="Inventory search and filters">
			<label class="inventory-field inventory-search">Search inventory
				<input type="search" placeholder="Search item names…" bind:value={inventoryQuery} autocomplete="off" />
			</label>
			<label class="inventory-field">Stock status
				<select bind:value={inventoryFilter}>
					<option value="all">All stock levels</option>
					<option value="low">Low stock (1–3)</option>
					<option value="normal">In stock (4+)</option>
				</select>
			</label>
			<label class="inventory-field">Sort by
				<select bind:value={inventorySort}>
					<option value="low">Fewest units first</option>
					<option value="high">Most units first</option>
					<option value="name">Item name A–Z</option>
				</select>
			</label>
			<div class="inventory-tools-footer">
				<span role="status">Showing {filteredInventory.length} of {data.listings.length} active listings</span>
				{#if inventoryQuery || inventoryFilter !== 'all' || inventorySort !== 'low'}
					<button type="button" class="inventory-clear" onclick={() => { inventoryQuery = ''; inventoryFilter = 'all'; inventorySort = 'low'; }}>Clear filters</button>
				{/if}
			</div>
		</div>
	{/if}

	{#if data.tab === 'sales'}
		{#if data.salesLoadFailed}
			<div class="notice error" role="alert">We couldn't load your sales history. Please refresh.</div>
		{:else}
			<div class="card sales-overview">
				<div><span class="muted">Recorded sales</span><strong>{data.salesHistory.length}</strong></div>
				<div><span class="muted">Units sold</span><strong>{saleItems.reduce((sum, sale) => sum + sale.quantity, 0)}</strong></div>
			</div>
			{#if data.salesHistory.length > 0}
				<div class="card sales-tools" aria-label="Sales history search and filters">
					<label class="sales-field sales-search">Search transactions
						<input type="search" placeholder="Search item or buyer…" bind:value={salesQuery} autocomplete="off" />
					</label>
					<label class="sales-field">Buyer type
						<select bind:value={salesBuyerFilter}>
							<option value="all">All buyers</option>
							<option value="campusmart">CampusMart members</option>
							<option value="outside">Outside CampusMart</option>
							<option value="unrecorded">Not recorded</option>
						</select>
					</label>
					<label class="sales-field">When
						<select bind:value={salesDateFilter}>
							<option value="all">All dates</option>
							<option value="30">Last 30 days</option>
							<option value="90">Last 90 days</option>
						</select>
					</label>
					<label class="sales-field">Sort by
						<select bind:value={salesSort}>
							<option value="newest">Newest first</option>
							<option value="oldest">Oldest first</option>
							<option value="quantity">Most units first</option>
						</select>
					</label>
					<div class="sales-tools-footer">
						<span role="status">Showing {filteredSales.length} of {data.salesHistory.length} transactions · {filteredSales.reduce((sum, sale) => sum + sale.quantity, 0)} units in view</span>
						<div class="sales-tools-actions">
							{#if salesQuery || salesBuyerFilter !== 'all' || salesDateFilter !== 'all' || salesSort !== 'newest'}
								<button type="button" class="inventory-clear" onclick={() => { salesQuery = ''; salesBuyerFilter = 'all'; salesDateFilter = 'all'; salesSort = 'newest'; }}>Clear filters</button>
							{/if}
							<button type="button" class="btn small" disabled={filteredSales.length === 0} onclick={exportSalesCsv}>Export shown as CSV</button>
						</div>
					</div>
				</div>
				<p class="muted sales-export-note">Export includes only the transactions shown here (up to the latest 200 records loaded). These are seller-recorded sales, not payment confirmations.</p>
				{#if filteredSales.length === 0}
					<div class="card sales-empty"><strong>No matching transactions.</strong><p class="muted">Try a different search or clear your filters.</p></div>
				{/if}
			{/if}
			{#if data.salesHistory.length === 0}
				<div class="card" style="margin-top:14px;text-align:center"><strong>No sales recorded yet.</strong><p class="muted">Record a sale from the Active tab to see it here.</p><a href="/my-listings">View active listings</a></div>
			{/if}
			{#each filteredSales as sale (sale.id)}
				<article class="card sale-entry">
					<div class="sale-head"><strong>{sale.itemTitle}</strong><span class="sale-qty">{sale.quantity} unit{sale.quantity === 1 ? '' : 's'}</span></div>
					<p class="muted">Buyer: {sale.buyerName}</p>
					<time class="muted" datetime={sale.createdAt}>{new Date(sale.createdAt).toLocaleDateString('en-UG', { year: 'numeric', month: 'short', day: 'numeric' })}</time>
					<a href="/listing/{sale.listingId}">View item</a>
				</article>
			{/each}
		{/if}
	{/if}

	{#if data.tab !== 'sales' && data.tab !== 'dashboard'}
	{#if (data.tab === 'inventory' ? filteredInventory : data.listings).length === 0}
		<div class="card" style="margin-top:14px;text-align:center">
			<p style="margin:0 0 4px;font-weight:700">{data.tab === 'bought' ? 'No bought items yet.' : data.tab === 'inventory' ? (data.listings.length ? 'No inventory items match these filters.' : 'No active inventory yet.') : 'Nothing here yet.'}</p>
			{#if data.tab === 'bought'}<p class="muted">When a seller marks an item as sold to your account, it will appear here.</p>{/if}
			{#if data.tab === 'inventory' && data.listings.length > 0}<button type="button" class="inventory-clear" onclick={() => { inventoryQuery = ''; inventoryFilter = 'all'; inventorySort = 'low'; }}>Clear filters</button>{:else if data.tab === 'active' || data.tab === 'drafts' || data.tab === 'inventory'}<a href="/sell">Sell an item</a>{/if}
		</div>
	{/if}

	{#each (data.tab === 'inventory' ? filteredInventory : data.listings) as l (l.id)}
		<div class="card item">
			<a class="rowlink" href="/listing/{l.id}">
				<div class="thumb">{#if l.cover}<img src="/photos/{l.cover}" alt="" />{/if}</div>
				<div style="flex:1;min-width:0">
					<div class="ttl">{l.title}</div>
					<div class="price">UGX {formatNumber(l.price)}</div>
					<div class="status {tone(l)}">{data.tab === 'bought' ? `Purchased · ${l.purchasedQuantity} unit${l.purchasedQuantity === 1 ? '' : 's'}` : statusText(l)}</div>
					{#if data.tab !== 'bought'}
						<div class="stock-line" class:stock-low={l.status === 'active' && (l.quantityAvailable ?? 1) <= 3}>
							{l.quantityAvailable ?? 1} unit{l.quantityAvailable === 1 ? '' : 's'} left
							{#if l.status === 'active' && (l.quantityAvailable ?? 1) <= 3}<span class="stock-label">Low stock</span>{/if}
						</div>
					{/if}
				</div>
			</a>

			{#if data.tab === 'bought'}
				<div class="purchase-review">
					{#if l.review}
						<div class="review-done"><strong>Your review</strong> <span class="stars" aria-label={`${l.review.rating} out of 5 stars`}>{'★'.repeat(l.review.rating)}{'☆'.repeat(5 - l.review.rating)}</span></div>
						{#if l.review.comment}<p class="muted">{l.review.comment}</p>{/if}
						<p class="muted">Review submitted</p>
					{:else if !data.reviewsLoadFailed}
						<details>
							<summary>Review this item</summary>
							{#if form?.reviewError && form.reviewId === l.id}<div class="notice error" role="alert">{form.reviewError}</div>{/if}
							<form method="POST" action="?/reviewBought" use:enhance={submitter('review-' + l.id)} class="review-form">
								<input type="hidden" name="id" value={l.id} />
								<label>Rating
									<select name="rating" required>
										<option value="">Choose a rating</option>
										<option value="5">★★★★★ — Excellent</option>
										<option value="4">★★★★☆ — Good</option>
										<option value="3">★★★☆☆ — Okay</option>
										<option value="2">★★☆☆☆ — Poor</option>
										<option value="1">★☆☆☆☆ — Bad</option>
									</select>
								</label>
								<label>Feedback (optional)
									<textarea name="comment" rows="3" maxlength="500" placeholder="How was the item and your experience with the seller?"></textarea>
								</label>
								<button class="btn small" type="submit" disabled={!!busy}>{busy === 'review-' + l.id ? 'Sending…' : 'Submit review'}</button>
							</form>
						</details>
					{/if}
				</div>
			{:else if confirming === l.id}
				<div class="notice warn" style="margin-top:10px">Delete this listing? This cannot be undone.</div>
				<div class="actions">
					<form method="POST" action="?/delete" use:enhance={submitter('delete')} style="flex:1">
						<input type="hidden" name="id" value={l.id} />
						<button class="btn small" type="submit" disabled={!!busy}>{busy === 'delete' ? 'Deleting...' : 'Yes, delete'}</button>
					</form>
					<button class="btn btn2 small" type="button" style="flex:1;border-color:var(--line);color:var(--ink)" onclick={() => (confirming = '')}>Cancel</button>
				</div>
			{:else}
				<div class="actions">
					{#if l.status === 'active'}
						<a class="btn btn2 small" href="/my-listings/{l.id}/edit">Edit</a>
						<a class="btn small" href="/my-listings/{l.id}/sold">Record sale</a>
						<button class="btn btn2 small" type="button" style="border-color:var(--line);color:var(--ink)" onclick={() => (confirming = l.id)}>Delete</button>
					{:else if l.status === 'draft'}
						<a class="btn btn2 small" href="/my-listings/{l.id}/edit">Edit</a>
						<form method="POST" action="?/publish" use:enhance={submitter('publish')} style="flex:1;display:flex">
							<input type="hidden" name="id" value={l.id} />
							<button class="btn small" type="submit" disabled={!!busy} style="flex:1">Publish</button>
						</form>
						<button class="btn btn2 small" type="button" style="border-color:var(--line);color:var(--ink)" onclick={() => (confirming = l.id)}>Delete</button>
					{:else if l.status === 'expired'}
						<a class="btn btn2 small" href="/my-listings/{l.id}/edit">Edit</a>
						<form method="POST" action="?/renew" use:enhance={submitter('renew')} style="flex:1;display:flex">
							<input type="hidden" name="id" value={l.id} />
							<button class="btn small" type="submit" disabled={!!busy} style="flex:1">Renew</button>
						</form>
						<button class="btn btn2 small" type="button" style="border-color:var(--line);color:var(--ink)" onclick={() => (confirming = l.id)}>Delete</button>
					{/if}
				</div>
			{/if}
		</div>
	{/each}
	{/if}
</div>

<style>
	.seller-workspace { min-width: 0; padding-bottom: 96px; }
	.workspace-hero { display:flex; align-items:center; justify-content:space-between; gap:20px; padding:24px; border:1px solid #eedcde; border-radius:22px; background:linear-gradient(115deg,#fff 0%,#fff5f6 100%); box-shadow:0 12px 32px rgba(77,29,40,.045); }
	.workspace-hero-copy { min-width:0; }
	.workspace-eyebrow { margin:0 0 8px; font-size:11px; letter-spacing:.13em; font-weight:800; color:var(--red); }
	.workspace-hero h1 { margin:0; font-size:clamp(1.6rem,3vw,2.2rem); line-height:1.15; letter-spacing:-.035em; }
	.workspace-hero-copy > p:last-child { color:var(--mute); margin:10px 0 0; line-height:1.5; max-width:48ch; }
	.workspace-create { display:inline-flex; align-items:center; justify-content:center; flex:none; min-height:44px; padding:10px 17px; border-radius:12px; background:var(--red); color:white; text-decoration:none; font-size:14px; font-weight:800; }
	.workspace-create:hover { background:var(--red-dark); text-decoration:none; }
	.workspace-create:focus-visible { outline:3px solid #f2a3b0; outline-offset:3px; }
	.dashboard-heading { display:flex; align-items:end; justify-content:space-between; gap:12px; flex-wrap:wrap; margin:26px 0 6px; }
	.dashboard-heading h2 { font-size:clamp(1.2rem,2vw,1.5rem); margin:0; letter-spacing:-.025em; }
	.dashboard-live { font-size:12px; font-weight:700; color:var(--teal); background:var(--teal-bg); border:1px solid #cde5df; padding:7px 11px; border-radius:999px; }
	.dashboard-actions { display: flex; gap: 10px; flex-wrap: wrap; margin: 16px 0; }
	.dashboard-actions :global(.btn) { margin: 0; }
	.dashboard-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; }
	.dashboard-metric { display:grid; gap:10px; padding:19px; color:var(--ink); text-decoration:none; min-width:0; border-radius:18px; transition:transform .15s ease, box-shadow .15s ease; }
	.dashboard-metric:hover { text-decoration:none; border-color:#e6b7bf; transform:translateY(-2px); box-shadow:0 10px 26px rgba(36,24,26,.07); }
	.dashboard-metric:focus-visible { outline:3px solid #f2a3b0; outline-offset:3px; }
	.dashboard-metric span { color: var(--mute); font-size: .88rem; }
	.dashboard-metric strong { font-size:clamp(1.65rem,3vw,2.25rem); line-height:1.1; letter-spacing:-.04em; }
	.dashboard-metric small { color: var(--red); font-weight: 700; }
	.dashboard-panels { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; margin-top: 16px; }
	.dashboard-panel { padding:20px; min-width:0; border-radius:18px; }
	.dashboard-panel-head { display: flex; justify-content: space-between; align-items: baseline; flex-wrap: wrap; gap: 8px; margin-bottom: 10px; }
	.dashboard-panel-head h2 { margin: 0; font-size: 1.05rem; }
	.dashboard-panel-head a { font-size: .85rem; }
	.dashboard-entry { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3px 10px; padding: 11px 0; border-top: 1px solid var(--line); font-size: .88rem; }
	.dashboard-entry a { min-width: 0; overflow-wrap: anywhere; font-weight: 700; }
	.dashboard-entry small { grid-column: 1 / -1; color: var(--mute); }
	.dashboard-rating { display: flex; align-items: baseline; gap: 10px; flex-wrap: wrap; margin-bottom: 10px; }
	.dashboard-rating strong { font-size: 1.35rem; color: #a26d00; }
	.dashboard-note { margin-top: 12px; font-size: .82rem; }
	@media (max-width: 780px) { .dashboard-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); } .dashboard-panels { grid-template-columns: 1fr; } }
	@media (max-width: 430px) { .dashboard-grid { grid-template-columns: 1fr 1fr; gap: 8px; } .dashboard-metric { padding: 12px; } }

	.sales-tools { display: grid; grid-template-columns: minmax(180px, 1.5fr) repeat(3, minmax(130px, 1fr)); gap: 12px; padding: 16px; margin-top: 14px; }
	.sales-field { display: grid; gap: 6px; min-width: 0; font-size: .85rem; font-weight: 700; }
	.sales-field input, .sales-field select { width: 100%; min-width: 0; min-height: 42px; border: 1px solid var(--line); border-radius: 10px; padding: 9px 10px; background: white; color: var(--ink); font: inherit; font-weight: 400; }
	.sales-field input:focus-visible, .sales-field select:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }
	.sales-tools-footer { grid-column: 1 / -1; display: flex; gap: 12px; justify-content: space-between; align-items: center; flex-wrap: wrap; color: var(--mute); font-size: .85rem; }
	.sales-tools-actions { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
	.sales-tools-actions .btn { margin: 0; }
	.sales-export-note { margin: 8px 2px 0; font-size: .8rem; }
	.sales-empty { margin-top: 12px; text-align: center; }
	.sales-empty p { margin: 6px 0 0; }
	@media (max-width: 1000px) { .sales-tools { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	@media (max-width: 540px) { .sales-tools { grid-template-columns: 1fr; } }

	.inventory-tools { display: grid; grid-template-columns: minmax(180px, 1.5fr) repeat(2, minmax(150px, 1fr)); gap: 12px; padding: 16px; margin-top: 14px; }
	.inventory-field { display: grid; gap: 6px; min-width: 0; font-size: .85rem; font-weight: 700; }
	.inventory-field input, .inventory-field select { width: 100%; min-width: 0; min-height: 42px; border: 1px solid var(--line); border-radius: 10px; padding: 9px 10px; background: white; color: var(--ink); font: inherit; font-weight: 400; }
	.inventory-field input:focus-visible, .inventory-field select:focus-visible, .inventory-clear:focus-visible { outline: 2px solid var(--red); outline-offset: 2px; }
	.inventory-tools-footer { grid-column: 1 / -1; display: flex; gap: 12px; align-items: center; justify-content: space-between; flex-wrap: wrap; color: var(--mute); font-size: .85rem; }
	.inventory-clear { border: 0; background: transparent; color: var(--red); text-decoration: underline; cursor: pointer; font: inherit; font-weight: 700; padding: 5px; }
	@media (max-width: 700px) { .inventory-tools { grid-template-columns: repeat(2, minmax(0, 1fr)); } .inventory-search { grid-column: 1 / -1; } }
	@media (max-width: 420px) { .inventory-tools { grid-template-columns: 1fr; } .inventory-search { grid-column: auto; } }
	.inventory-overview { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px; margin-top: 14px; padding: 16px; }
	.inventory-overview > div { display: grid; gap: 5px; min-width: 0; }
	.inventory-overview strong { font-size: 1.5rem; }
	.stock-line { font-size: .88rem; margin-top: 4px; color: var(--mute); display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
	.stock-line.stock-low { color: var(--amber-ink); font-weight: 700; }
	.stock-label { border: 1px solid currentColor; border-radius: 999px; padding: 1px 7px; font-size: .73rem; }
	@media (max-width: 540px) { .inventory-overview { grid-template-columns: repeat(2, minmax(0, 1fr)); } }
	.sales-overview { display: flex; gap: 30px; margin-top: 14px; padding: 16px; flex-wrap: wrap; }
	.sales-overview > div { display: grid; gap: 4px; }
	.sales-overview strong { font-size: 1.45rem; }
	.sale-entry { display: grid; gap: 6px; margin-top: 12px; padding: 14px; }
	.sale-entry p { margin: 0; }
	.sale-entry a { font-size: .9rem; width: fit-content; }
	.sale-head { display: flex; justify-content: space-between; gap: 10px; flex-wrap: wrap; }
	.sale-qty { font-weight: 700; color: var(--red); }
	.tabs { display:flex; gap:8px; overflow-x:auto; margin:18px -2px 8px; padding:4px 2px 10px; scrollbar-width:thin; scroll-padding-inline:8px; }
	.tab { flex:none; display:inline-flex; align-items:center; gap:7px; min-height:44px; padding:0 16px; border:1px solid var(--line); border-radius:12px; background:white; color:var(--body); font-weight:700; font-size:13px; white-space:nowrap; }
	.tab:hover { text-decoration: none; }
	.tab.on { background:var(--red); border-color:var(--red); color:white; box-shadow:0 4px 10px rgba(200,16,46,.15); }
	.tab:focus-visible { outline:3px solid #f2a3b0; outline-offset:2px; }
	.n { font-size: 12px; opacity: 0.85; }
	.item { margin-top:12px; padding:16px; border-radius:17px; }
	.rowlink { display: flex; align-items: center; gap: 12px; text-decoration: none; color: inherit; font-weight: 500; }
	.rowlink:hover { text-decoration: none; }
	.actions :global(.btn) { padding: 0 6px; font-size: 13px; white-space: nowrap; }
	.thumb { width: 64px; height: 64px; border-radius: 10px; overflow: hidden; background: #ede7e5; flex: none; }
	.thumb img { width: 100%; height: 100%; object-fit: cover; display: block; }
	.ttl { font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.price { font-weight: 800; }
	.status { font-size: 12px; font-weight: 600; color: var(--mute); }
	.status.warn { color: var(--amber-ink); }
	.status.bad { color: var(--red); }
	.actions { display: flex; gap: 8px; margin-top: 10px; }
	.actions > :global(.btn), .actions > :global(a.btn) { flex: 1; margin-top: 0; }
	.actions :global(form .btn) { margin-top: 0; }
	.purchase-review { margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--line); }
	.purchase-review summary { cursor: pointer; font-weight: 800; color: var(--red); }
	.review-form { display: grid; gap: 10px; margin-top: 12px; }
	.review-form label { display: grid; gap: 5px; font-weight: 700; }
	.review-form select, .review-form textarea { width: 100%; min-width: 0; padding: 10px 12px; border: 1px solid var(--line); border-radius: 10px; font: inherit; background: white; }
	.review-done { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; }
	.stars { color: #d48b00; letter-spacing: 1px; }

	@media (max-width:540px) {
		.workspace-hero { padding:18px; border-radius:18px; align-items:flex-start; flex-direction:column; gap:14px; }
		.workspace-hero-copy > p:last-child { font-size:13px; }
		.workspace-create { width:100%; }
		.dashboard-actions { display:grid; grid-template-columns:1fr 1fr; }
		.dashboard-actions :global(.btn) { min-width:0; font-size:12px; padding:8px; text-align:center; }
		.dashboard-metric { padding:14px 12px; }
		.dashboard-metric span { font-size:.78rem; }
		.dashboard-metric small { font-size:.73rem; }
		.dashboard-panel { padding:15px; }
		.actions { flex-wrap:wrap; }
	}
	@media (prefers-reduced-motion:reduce) { .dashboard-metric { transition:none; } }
	/* Phase 59.1: distinct Seller Studio design */
	.seller-workspace { --studio-ink:#17202d; --studio-border:#e9eaf0; }
	.workspace-hero { position:relative; isolation:isolate; overflow:hidden; padding:clamp(24px,4vw,42px); background:#17202d; color:white; border:0; border-radius:26px; box-shadow:0 18px 35px rgba(17,26,43,.14); align-items:center; }
	.workspace-hero::after { content:''; position:absolute; z-index:-1; width:340px; height:340px; border:65px solid rgba(255,255,255,.045); border-radius:50%; right:-135px; top:-200px; }
	.workspace-hero::before { content:''; position:absolute; z-index:-1; width:190px; height:190px; background:rgba(204,12,47,.35); filter:blur(55px); border-radius:50%; right:8%; bottom:-115px; }
	.workspace-hero .workspace-eyebrow { color:#ffbdc9; display:flex; align-items:center; gap:9px; letter-spacing:.17em; }
	.eyebrow-dot,.live-dot { display:inline-block; width:8px; height:8px; border-radius:50%; background:#37d6a5; box-shadow:0 0 0 4px rgba(55,214,165,.13); }
	.workspace-hero h1 { font-size:clamp(2rem,4vw,3.3rem); max-width:15ch; line-height:1.06; font-weight:850; }
	.workspace-hero h1 span { color:#ff9bad; }
	.workspace-hero-copy > p:last-of-type { color:#d3dbe7; font-size:.95rem; max-width:47ch; }
	.hero-pills { display:flex; flex-wrap:wrap; gap:9px; margin-top:20px; }
	.hero-pills span { font-size:.77rem; font-weight:700; color:#e8edf5; border:1px solid rgba(255,255,255,.18); border-radius:999px; padding:7px 11px; background:rgba(255,255,255,.07); }
	.hero-actions { display:grid; gap:10px; flex:0 0 180px; }
	.workspace-create { background:#cf1238; color:white; box-shadow:0 7px 18px rgba(207,18,56,.25); min-height:49px; gap:7px; border-radius:13px; }
	.workspace-create:hover { background:#e21a44; }
	.workspace-create span { font-size:21px; font-weight:400; }
	.hero-secondary { display:flex; align-items:center; justify-content:center; gap:8px; color:white; text-decoration:none; border:1px solid rgba(255,255,255,.35); border-radius:13px; min-height:45px; font-weight:750; font-size:.84rem; }
	.hero-secondary:hover { text-decoration:none; background:rgba(255,255,255,.12); }
	.workspace-nav-wrap { margin:22px 0 14px; padding:15px 16px 4px; border:1px solid var(--studio-border); background:white; border-radius:18px; }
	.workspace-nav-title { display:flex; align-items:center; justify-content:space-between; gap:12px; font-size:.67rem; font-weight:800; letter-spacing:.12em; color:#758091; }
	.workspace-nav-title span:last-child { font-size:.74rem; letter-spacing:normal; font-weight:600; }
	.workspace-nav-wrap .tabs { margin:9px 0 0; padding:3px 0 12px; gap:6px; }
	.workspace-nav-wrap .tab { border:0; background:#f4f5f8; color:#495466; border-radius:10px; min-height:41px; padding:0 13px; }
	.workspace-nav-wrap .tab.on { background:#c90c31; color:white; box-shadow:none; }
	.tab-indicator { display:none; }
	.workspace-nav-wrap .n { padding:2px 5px; border-radius:6px; background:rgba(0,0,0,.06); font-size:.7rem; }
	.workspace-nav-wrap .tab.on .n { background:rgba(255,255,255,.2); }
	.studio-overview { margin-top:27px; }
	.dashboard-heading { margin:0 0 19px; align-items:center; }
	.dashboard-heading h2 { font-size:clamp(1.5rem,3vw,2rem); color:var(--studio-ink); }
	.overview-subtitle { margin:7px 0 0; color:#697585; font-size:.88rem; }
	.dashboard-live { background:#eaf9f2; color:#187b58; border:0; display:flex; align-items:center; gap:10px; }
	.dashboard-live .live-dot { width:7px; height:7px; background:#18aa72; }
	.dashboard-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:12px; }
	.dashboard-metric { display:flex; flex-direction:column; align-items:stretch; gap:0; padding:20px; border:1px solid #e7e9ee; border-radius:19px; min-height:195px; background:#fff; text-decoration:none; color:var(--studio-ink); box-shadow:0 6px 20px rgba(25,33,48,.035); }
	.dashboard-metric:hover { border-color:#cdd2db; box-shadow:0 14px 28px rgba(25,33,48,.08); }
	.metric-top { display:flex; align-items:center; justify-content:space-between; margin-bottom:20px; }
	.metric-icon { display:grid; place-items:center; width:39px; height:39px; border-radius:12px; background:#fff0f3; color:#c90c31; font-size:1.2rem; font-weight:850; }
	.metric-arrow { color:#8c95a5; font-size:1rem; }
	.dashboard-metric .metric-label { color:#647184; font-size:.77rem; font-weight:750; }
	.dashboard-metric strong { font-size:clamp(2rem,3.3vw,2.7rem); font-weight:850; letter-spacing:-.05em; margin:4px 0; }
	.dashboard-metric small { color:#7b8594; font-size:.72rem; font-weight:550; margin-top:auto; line-height:1.4; }
	.metric-stock .metric-icon { background:#e6f7f3; color:#087d68; }
	.metric-warning .metric-icon { background:#fff5df; color:#a16a05; }
	.metric-sales .metric-icon { background:#edf0ff; color:#5c61b9; }
	.dashboard-mini-strip { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-top:12px; }
	.dashboard-mini-strip a { display:flex; align-items:center; gap:10px; padding:15px 18px; border-radius:14px; border:1px solid #e7e9ee; background:#f8f9fb; text-decoration:none; color:#3e495a; font-size:.82rem; }
	.dashboard-mini-strip a:hover { border-color:#c5cbd6; text-decoration:none; }
	.dashboard-mini-strip strong { margin-left:auto; color:#17202d; font-size:1.1rem; }
	.mini-dot { flex:none; width:9px; height:9px; border-radius:50%; }
	.draft-dot { background:#e7a22c; }.sold-dot { background:#3c95b8; }
	.dashboard-section-title { display:flex; justify-content:space-between; align-items:end; flex-wrap:wrap; gap:12px; margin:29px 0 13px; }
	.dashboard-section-title h2 { margin:0; font-size:1.4rem; color:#17202d; }
	.dashboard-section-title a { color:#bf1034; font-size:.83rem; font-weight:750; }
	.dashboard-panel { border:1px solid #e7e9ee; border-radius:19px; box-shadow:0 6px 18px rgba(25,33,48,.035); }
	.dashboard-panel-head { border-bottom:1px solid #eff0f3; padding-bottom:12px; }
	.dashboard-entry { border-color:#eff0f3; }
	@media (max-width:1050px) { .dashboard-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } }
	@media (max-width:600px) {
		.workspace-hero { padding:24px 20px; border-radius:20px; }
		.workspace-hero h1 { font-size:2.15rem; }
		.workspace-hero-copy > p:last-of-type { font-size:.85rem; }
		.hero-actions { display:grid; grid-template-columns:1fr 1fr; width:100%; gap:8px; flex:auto; }
		.workspace-create,.hero-secondary { min-height:46px; padding:8px; font-size:.75rem; text-align:center; }
		.workspace-nav-wrap { margin-top:15px; padding:13px 12px 2px; }
		.workspace-nav-wrap .tab { padding:0 11px; font-size:.78rem; }
		.dashboard-metric { min-height:165px; padding:14px; border-radius:15px; }
		.metric-top { margin-bottom:14px; }.metric-icon { width:33px; height:33px; border-radius:10px; }
		.dashboard-metric strong { font-size:2.2rem; }
		.dashboard-mini-strip { gap:8px; }.dashboard-mini-strip a { padding:12px; gap:6px; font-size:.72rem; }
		.dashboard-live { font-size:.7rem; }
	}
	@media (max-width:355px) { .hero-actions { grid-template-columns:1fr; } .dashboard-grid { gap:8px; } .dashboard-metric { padding:11px; } .dashboard-mini-strip { grid-template-columns:1fr; } }

</style>
