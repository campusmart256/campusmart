<script>
	/** @type {{ status?: string | null, compact?: boolean, label?: string }} */
	let { status = null, compact = false, label = 'Verified student' } = $props();
	const verified = $derived(status === 'verified' || status === true);
</script>

{#if verified}
	<span class:compact class="verified-badge" title="Verified student">
		<span class="check" aria-hidden="true">✓</span>
		<span>{compact ? 'Verified' : label}</span>
	</span>
{:else if !compact}
	<span class="verified-badge muted-badge">Not verified</span>
{/if}

<style>
	.verified-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		width: fit-content;
		border-radius: 999px;
		padding: 5px 10px;
		font-size: 12px;
		font-weight: 800;
		line-height: 1;
		color: #14613f;
		background: #e8f7ef;
		border: 1px solid #bce8cf;
		white-space: nowrap;
	}
	.verified-badge.compact { padding: 4px 8px; font-size: 11px; }
	.check {
		display: inline-grid;
		place-items: center;
		width: 16px;
		height: 16px;
		border-radius: 999px;
		background: #18a765;
		color: #fff;
		font-size: 11px;
		font-weight: 900;
	}
	.compact .check { width: 14px; height: 14px; font-size: 10px; }
	.muted-badge {
		color: var(--mute, #6b6360);
		background: #f6f1ef;
		border-color: var(--line, #e8e3e1);
	}
</style>
