<script>
	import { invalidateAll } from '$app/navigation';
	import { PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY } from '$app/env/public';
	import { onMount, tick } from 'svelte';

	/** @typedef {import('./$types').PageData['messages'][number]} ChatMessage */

let { data, form } = $props();
let body = $state('');

$effect(() => {
    if (form && 'body' in form && typeof form.body === 'string') {
        body = form.body;
    }
});
	let messageList = $state();
	let messageBox = $state();
	let realtimeStatus = $state('starting');
	// Realtime status is kept internally for debugging but is not shown to normal users.
	let realtimeText = $state('Starting live updates...');
	let safetyOpen = $state(false);
/** @type {ChatMessage | null} */
let replyTo = $state(null);
	let contactDialogOpen = $state(false);
	/** @type {{ id: number | null, dx: number, startX: number, startY: number }} */
let swipe = $state({ id: null, dx: 0, startX: 0, startY: 0 });
	/** @type {number | null} */
let deleteMenuFor = $state(null);
/** @type {Map<string, number>} */
const longPressTimers = new Map();
	const otherProfile = $derived(
    data.userId === data.conversation.buyer_id
        ? data.conversation.seller
        : data.conversation.buyer
);

const other = $derived(
    (Array.isArray(otherProfile) ? otherProfile[0] : otherProfile)?.display_name
);

		const listing = $derived(
    Array.isArray(data.conversation.listings)
        ? data.conversation.listings[0]
        : data.conversation.listings
);
	const isBlocked = $derived(data.isBlockedByMe);
	const isBuyer = $derived(data.userId === data.conversation.buyer_id);
	const messageById = $derived(Object.fromEntries((data.messages ?? []).map((m) => [String(m.id), m])));

	/** @param {ChatMessage | null} message */
	function messageSenderName(message) {
		return message?.sender_id === data.userId ? 'You' : other ?? 'Student';
	}

	/** @param {string | null | undefined} text */
	function shortMessage(text, limit = 90) {
		const clean = String(text ?? '').replace(/\s+/g, ' ').trim();
		return clean.length > limit ? `${clean.slice(0, limit - 1)}…` : clean;
	}

	/** @param {ChatMessage} message */
	function quotedMessage(message) {
		if (!message?.reply_to_message_id) return null;
		return messageById[String(message.reply_to_message_id)] ?? null;
	}

	/** @param {ChatMessage} message */
	async function chooseReply(message) {
		replyTo = message;
		await tick();
		messageBox?.focus();
	}

	function clearReply() {
		replyTo = null;
	}

	function closeContactDialog() {
		contactDialogOpen = false;
	}

	function confirmDeleteForMe() {
		return confirm('Delete this message for you only? It will still be kept for safety reports.');
	}

	function confirmUnsend() {
		return confirm('Unsend this message? It will be hidden from this chat, but preserved for safety review.');
	}

	/** @param {ChatMessage} message */
	function canUnsend(message) {
		return data.unsendStatusAvailable && message.sender_id === data.userId && !message.read_at;
	}

	function clearLongPress() {
    const timer = longPressTimers.get('active');

    if (timer !== undefined) {
        clearTimeout(timer);
        longPressTimers.delete('active');
    }
}

	/**
 * @param {PointerEvent} event
 * @param {ChatMessage} message
 */
	function beginMessagePress(event, message) {
		beginSwipe(event, message);
		clearLongPress();
longPressTimers.set('active', setTimeout(() => {
    deleteMenuFor = message.id;
    swipe = { id: null, dx: 0, startX: 0, startY: 0 };
    if (navigator?.vibrate) navigator.vibrate(18);
}, 560));
	}

	/**
 * @param {PointerEvent} event
 * @param {ChatMessage} message
 */
	function moveMessagePress(event, message) {
		moveSwipe(event, message);
		if (swipe.id === message.id && swipe.dx > 10) clearLongPress();
	}

	/** @param {ChatMessage} message */
	function endMessagePress(message) {
		clearLongPress();
		endSwipe(message);
	}

	function cancelDeleteMenu() {
		deleteMenuFor = null;
	}

	/**
 * @param {PointerEvent} event
 * @param {ChatMessage} message
 */
	function beginSwipe(event, message) {
		if (event.pointerType === 'mouse' && event.button !== 0) return;
		swipe = { id: message.id, dx: 0, startX: event.clientX, startY: event.clientY };
	}

	/**
 * @param {PointerEvent} event
 * @param {ChatMessage} message
 */
	function moveSwipe(event, message) {
		if (swipe.id !== message.id) return;
		const dx = event.clientX - swipe.startX;
		const dy = Math.abs(event.clientY - swipe.startY);
		if (dx <= 0 || dy > 56) {
			swipe = { ...swipe, dx: 0 };
			return;
		}
		swipe = { ...swipe, dx: Math.min(dx, 72) };
	}

	/** @param {ChatMessage} message */
	function endSwipe(message) {
		if (swipe.id === message.id && swipe.dx >= 44) chooseReply(message);
		swipe = { id: null, dx: 0, startX: 0, startY: 0 };
	}

	async function scrollToBottom() {
		await tick();
		messageList?.scrollTo({ top: messageList.scrollHeight, behavior: 'smooth' });
	}

	$effect(() => {
		data.messages;
		scrollToBottom();
	});

	$effect(() => {
		if (form?.whatsappLink) contactDialogOpen = true;
	});

	onMount(() => {
		scrollToBottom();

		// Refresh parent layout data once so the Messages unread badge clears after the server marks this chat as read.
		setTimeout(() => invalidateAll(), 250);

		const refreshOnVisible = () => {
			if (document.visibilityState === 'visible') invalidateAll();
		};
		document.addEventListener('visibilitychange', refreshOnVisible);

		// Load the Realtime dependency only in the browser, after initial rendering.
		// The messaging page remains usable even if live updates cannot connect.
		let disposed = false;
		/** @type {import('@supabase/supabase-js').SupabaseClient | null} */
		let supabase = null;
		/** @type {import('@supabase/supabase-js').RealtimeChannel | null} */
		let channel = null;

		async function connectRealtime() {
			try {
				const { createBrowserClient } = await import('@supabase/ssr');
				if (disposed) return;
				supabase = createBrowserClient(PUBLIC_SUPABASE_URL, PUBLIC_SUPABASE_KEY);
				channel = supabase
					.channel(`campusmart-conversation-${data.conversation.id}`)
					.on(
						'postgres_changes',
						{ event: 'INSERT', schema: 'public', table: 'messages', filter: `conversation_id=eq.${data.conversation.id}` },
						async () => {
							if (disposed) return;
							await invalidateAll();
							if (!disposed) await scrollToBottom();
						}
					)
					.subscribe((status) => {
						if (disposed) return;
						if (status === 'SUBSCRIBED') {
							realtimeStatus = 'live';
							realtimeText = 'Live updates are on.';
						} else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
							realtimeStatus = 'fallback';
							realtimeText = 'Live updates are unavailable. New messages still appear after refresh.';
						} else {
							realtimeStatus = 'starting';
							realtimeText = 'Connecting live updates...';
						}
					});
			} catch (error) {
				if (!disposed) {
					realtimeStatus = 'fallback';
					realtimeText = 'Live updates are unavailable. New messages still appear after refresh.';
						console.warn('CampusMart Realtime connection unavailable', error);
				}
			}
		}
		void connectRealtime();

		return () => {
			disposed = true;
			document.removeEventListener('visibilitychange', refreshOnVisible);
			if (supabase && channel) void supabase.removeChannel(channel);
		};
	});
</script>

<svelte:head><title>Chat with {other ?? 'student'} | campusmart</title></svelte:head>

<div class="page chat-page">
<a href="/messages" class="back">← Back to inbox</a>

<section class="chat-head">
	<div class="chat-person">
		<span class="chat-overline">CAMPUSMART CONVERSATION</span>
		<h1>{other ?? 'Student'}<span class="chat-accent">.</span></h1>
		<p class="chat-item">Discussing <strong>{listing?.title ?? 'Item'}</strong></p>
	</div>
	<div class="chat-actions">
		<div class="safety-menu">
			<button
				class="icon-btn"
				type="button"
				aria-label="Open chat safety tools"
				aria-expanded={safetyOpen}
				onclick={() => (safetyOpen = !safetyOpen)}
			>
				⋯
			</button>
			{#if safetyOpen}
				<div class="safety-popover card" role="menu" aria-label="Chat safety tools">
					<div class="popover-head">
						<strong>Safety tools</strong>
						<button class="close-btn" type="button" aria-label="Close safety tools" onclick={() => (safetyOpen = false)}>×</button>
					</div>
					<p class="muted small-note">Use these if this chat looks suspicious, abusive, or unsafe.</p>

					{#if isBuyer}
						<div class="whatsapp-box">
							<strong>WhatsApp contact</strong>
							<p class="muted small-note">Reveal the seller's WhatsApp number only if you want to continue outside CampusMart.</p>
							{#if form?.whatsappLink}
								<a class="btn whatsapp-link" href={form.whatsappLink} target="_blank" rel="noreferrer">Open WhatsApp</a>
								<p class="muted small-note">Number: {form.whatsappNumber}</p>
							{:else}
								<form method="POST" action="?/whatsapp">
									<button class="btn whatsapp-btn" type="submit">Reveal WhatsApp</button>
								</form>
							{/if}
						</div>
					{/if}

					{#if isBlocked}
						<form method="POST" action="?/unblock">
							<button class="btn secondary" type="submit">Unblock user</button>
						</form>
					{:else}
						<form method="POST" action="?/block">
							<button class="btn secondary danger" type="submit">Block user</button>
						</form>
					{/if}

					<details class="report-box">
						<summary>Report this conversation</summary>
						<form method="POST" action="?/report" class="report-form">
							<label for="reason">Reason</label>
							<select id="reason" name="reason" required>
								<option value="">Choose a reason</option>
								<option value="scam_or_fake">Scam or fake listing</option>
								<option value="prohibited_item">Prohibited or unsafe item</option>
								<option value="harassment">Harassment or abusive messages</option>
								<option value="other">Other safety concern</option>
							</select>
							<label for="report-note">Extra details (optional)</label>
							<textarea id="report-note" name="note" rows="3" maxlength="500" placeholder="Explain what happened. Do not include passwords or private codes."></textarea>
							<button class="btn" type="submit">Send report</button>
						</form>
					</details>
				</div>
			{/if}
		</div>
	</div>
</section>

<div class="notice warn">Meet in a safe public place. Inspect the item before paying. Never send a deposit.</div>
{#if !data.readStatusAvailable}<div class="notice warn">Unread badges need the v0.1.3 SQL migration. Messages still work, but read status may not clear yet.</div>{/if}
{#if !data.replyStatusAvailable}<div class="notice warn">Reply previews need the v0.1.4 SQL migration. Run the reply migration before testing reply messages.</div>{/if}
{#if !data.deleteStatusAvailable}<div class="notice warn">Delete-for-me needs the v0.1.6 SQL migration. Messages still work, but delete-for-me is disabled.</div>{/if}
{#if !data.unsendStatusAvailable}<div class="notice warn">Unsend needs the v0.1.7 SQL migration. Messages still work, but unread messages cannot be unsent yet.</div>{/if}
{#if form?.safetySuccess}<div class="notice tip">{form.safetySuccess}</div>{/if}
{#if form?.safetyMessage}<div class="notice warn" role="alert">{form.safetyMessage}</div>{/if}
{#if form?.reportSuccess}<div class="notice tip">{form.reportSuccess}</div>{/if}
{#if form?.reportMessage}<div class="notice warn" role="alert">{form.reportMessage}</div>{/if}
{#if form?.whatsappSuccess}<div class="notice tip">{form.whatsappSuccess}</div>{/if}
{#if form?.whatsappMessage}<div class="notice warn" role="alert">{form.whatsappMessage}</div>{/if}
{#if form?.deleteSuccess}<div class="notice tip">{form.deleteSuccess}</div>{/if}
{#if form?.deleteMessage}<div class="notice warn" role="alert">{form.deleteMessage}</div>{/if}
{#if contactDialogOpen && form?.whatsappLink}
<div
    class="modal-backdrop"
    role="presentation"
    onclick={(event) => {
        if (event.target === event.currentTarget) closeContactDialog();
    }}
>
    <div class="contact-dialog card" role="dialog" aria-modal="true" aria-labelledby="contact-dialog-title">
			<div class="dialog-icon">✓</div>
			<h2 id="contact-dialog-title">Contact seller?</h2>
			<p class="muted">The seller's WhatsApp number has been revealed. Choose how you want to contact them.</p>
			<p class="contact-number">{form.whatsappNumber}</p>
			<div class="dialog-actions">
				<a class="btn whatsapp-link" href={form.whatsappLink} target="_blank" rel="noreferrer">Contact on WhatsApp</a>
				<a class="btn call-link" href={`tel:${form.whatsappNumber}`}>Direct call</a>
				<button class="btn secondary" type="button" onclick={closeContactDialog}>Cancel</button>
			</div>
			<p class="muted small-note">Meet in public and inspect the item before paying.</p>
    </div>
</div>
{/if}
{#if isBlocked}<div class="notice warn">You blocked {other ?? 'this user'}. Messaging is paused until you unblock them.</div>{/if}

<div class="messages card" aria-label="Messages" bind:this={messageList}>
	{#if !data.messages.length}<p class="muted">No messages yet. Say hello!</p>{/if}
	{#each data.messages as m (m.id)}
		{@const quoted = quotedMessage(m)}
		<div class:mine={m.sender_id === data.userId} class="bubble-wrap">
			<div class="message-tools">
				<button class="quick-reply" type="button" aria-label="Reply to this message" title="Reply" onclick={() => chooseReply(m)}>↩</button>
				{#if deleteMenuFor === m.id}
					<div class="message-menu">
						{#if canUnsend(m)}
							<form method="POST" action="?/unsend" onsubmit={(event) => { if (!confirmUnsend()) event.preventDefault(); }}>
								<input type="hidden" name="message_id" value={m.id} />
								<button class="menu-action unsend-message" type="submit">Unsend</button>
							</form>
						{/if}
						<form method="POST" action="?/deleteForMe" onsubmit={(event) => { if (!confirmDeleteForMe()) event.preventDefault(); }}>
							<input type="hidden" name="message_id" value={m.id} />
							<button class="menu-action delete-message" type="submit">Delete for me</button>
						</form>
						<button class="menu-action secondary-action" type="button" onclick={cancelDeleteMenu}>Cancel</button>
					</div>
				{/if}
			</div>
			<div
				role="group"
				class:delete-selected={deleteMenuFor === m.id}
				class="bubble"
				style={`transform: translateX(${swipe.id === m.id ? swipe.dx : 0}px);`}
				onpointerdown={(event) => beginMessagePress(event, m)}
				onpointermove={(event) => moveMessagePress(event, m)}
				onpointerup={() => endMessagePress(m)}
				onpointercancel={() => { clearLongPress(); swipe = { id: null, dx: 0, startX: 0, startY: 0 }; }}
			>
				{#if quoted}
    <div class="quoted-message" aria-label="Replied message">
        <strong>{messageSenderName(quoted)}</strong>
        <span>{shortMessage(quoted.body)}</span>
    </div>
{/if}
				<div>{m.body}</div>
				<small class="muted">{new Date(m.created_at).toLocaleString()}</small>
			</div>
		</div>
	{/each}
</div>

{#if form?.message}<div class="notice warn" role="alert">{form.message}</div>{/if}

<form method="POST" action="?/send" class="composer" aria-label="Send a message">
	{#if replyTo}
		<div class="reply-preview">
			<div>
				<strong>Replying to {messageSenderName(replyTo)}</strong>
				<span>{shortMessage(replyTo.body)}</span>
			</div>
			<button type="button" aria-label="Cancel reply" onclick={clearReply}>×</button>
		</div>
	{/if}
	<input type="hidden" name="reply_to_message_id" value={replyTo?.id ?? ''} />
	<div class="composer-row">
		<label for="message-body" class="sr-only">Your message (max 1000 characters)</label>
		<textarea
			id="message-body"
			name="body"
			rows="1"
			maxlength="1000"
			required
			disabled={isBlocked}
			bind:value={body}
			bind:this={messageBox}
			placeholder={replyTo ? 'Reply to message' : 'Type a message'}
		></textarea>
		<button class="send-btn" type="submit" disabled={isBlocked} aria-label="Send message">↑</button>
	</div>
</form>


</div>

<style>
	.back { display: inline-flex; margin-bottom: 12px; }
	.chat-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 12px; margin-bottom: 12px; position: relative; }
	.chat-head h1 { margin-bottom: 4px; }
	.chat-actions { display: flex; align-items: center; gap: 8px; }
	.safety-menu { position: relative; }
	.icon-btn { width: 42px; height: 42px; border-radius: 999px; border: 1px solid var(--line); background: #fff; color: var(--ink); font-size: 26px; line-height: 1; font-weight: 900; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; padding-bottom: 8px; }
	.icon-btn:hover, .icon-btn:focus-visible { border-color: rgba(200, 16, 46, 0.35); color: var(--red); outline: none; }
	.safety-popover { position: absolute; top: calc(100% + 8px); right: 0; width: min(360px, calc(100vw - 24px)); z-index: 20; box-shadow: 0 18px 45px rgba(26, 26, 26, 0.16); display: grid; gap: 12px; }
	.popover-head { display: flex; align-items: center; justify-content: space-between; gap: 10px; }
	.close-btn { border: 0; background: transparent; color: var(--mute); font-size: 24px; line-height: 1; cursor: pointer; }
	.close-btn:hover, .close-btn:focus-visible { color: var(--red); outline: none; }
	.messages { display: grid; gap: 12px; margin: 16px 0; min-height: 220px; scroll-behavior: smooth; overflow-x: hidden; }
	.bubble-wrap { max-width: 85%; justify-self: start; display: flex; align-items: center; gap: 8px; }
	.bubble-wrap.mine { justify-self: end; flex-direction: row-reverse; }
	.message-tools { display: grid; gap: 6px; flex: 0 0 auto; position: relative; }
	.message-menu { position: absolute; top: 34px; left: 0; z-index: 10; display: grid; gap: 6px; width: 138px; padding: 8px; border: 1px solid var(--line); border-radius: 14px; background: #fff; box-shadow: 0 12px 30px rgba(26, 26, 26, 0.16); }
	.bubble-wrap.mine .message-menu { left: auto; right: 0; }
	.bubble { max-width: 100%; padding: 10px 14px; border-radius: 14px; overflow-wrap: anywhere; background: #f3f4f6; touch-action: pan-y; transition: transform 120ms ease; cursor: grab; }
	.bubble-wrap.mine .bubble { background: #fce7ea; }
	.bubble small { display: block; margin-top: 4px; font-size: 11px; }
	.quick-reply { width: 30px; height: 30px; border: 1px solid var(--line); border-radius: 999px; background: #fff; color: var(--mute); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; flex: 0 0 auto; opacity: 0.68; }
	.menu-action { width: 100%; border: 1px solid var(--line); border-radius: 999px; background: #fff; color: var(--ink); cursor: pointer; padding: 8px 10px; font-size: 12px; font-weight: 800; text-align: center; }
	.delete-message { color: var(--red); border-color: rgba(200, 16, 46, 0.35); }
	.unsend-message { color: #0f766e; border-color: rgba(15, 118, 110, 0.28); }
	.secondary-action { color: var(--mute); }
	.quick-reply:hover, .quick-reply:focus-visible, .menu-action:hover, .menu-action:focus-visible { opacity: 1; color: var(--red); border-color: rgba(200, 16, 46, 0.35); outline: none; }
	.bubble.delete-selected { outline: 2px solid rgba(200, 16, 46, 0.28); box-shadow: 0 0 0 4px rgba(200, 16, 46, 0.08); }
	.message-tools form { margin: 0; }
	.quoted-message { border-left: 3px solid var(--red); background: rgba(255, 255, 255, 0.64); padding: 7px 9px; border-radius: 9px; margin-bottom: 8px; display: grid; gap: 2px; font-size: 13px; }
	.quoted-message strong { color: var(--red); }
	.quoted-message span { color: var(--mute); }
	.composer { display: grid; gap: 10px; background: #fff; border-top: 1px solid var(--line); padding: 12px 0 14px; margin-top: 8px; }
	.composer-row { display: grid; grid-template-columns: 1fr auto; gap: 10px; align-items: end; }
	.composer textarea { min-height: 46px; max-height: 130px; resize: vertical; border-radius: 999px; padding: 12px 16px; line-height: 1.25; }
	.reply-preview { display: flex; justify-content: space-between; align-items: center; gap: 10px; border-left: 4px solid var(--red); background: #fff5f6; border-radius: 14px; padding: 10px 12px; }
	.reply-preview div { display: grid; gap: 2px; min-width: 0; }
	.reply-preview strong { color: var(--red); font-size: 13px; }
	.reply-preview span { color: var(--mute); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
	.reply-preview button { width: 32px; height: 32px; border: 0; border-radius: 999px; background: #fff; color: var(--mute); font-size: 22px; line-height: 1; cursor: pointer; }
	.send-btn { width: 46px; height: 46px; border: 0; border-radius: 999px; background: var(--red); color: white; font-size: 24px; font-weight: 900; line-height: 1; display: inline-flex; align-items: center; justify-content: center; cursor: pointer; }
	.send-btn:hover, .send-btn:focus-visible { background: var(--dark-red); outline: none; }
	.composer button:disabled, .composer textarea:disabled { opacity: 0.55; cursor: not-allowed; }
	.sr-only { position: absolute; width: 1px; height: 1px; padding: 0; margin: -1px; overflow: hidden; clip: rect(0, 0, 0, 0); white-space: nowrap; border: 0; }
	.btn.secondary { background: #fff; color: var(--ink); border: 1px solid var(--line); }
	.btn.secondary.danger { color: var(--red); border-color: rgba(200, 16, 46, 0.25); }
	.whatsapp-box { border: 1px solid rgba(15, 118, 110, 0.18); background: #f0fdfa; border-radius: 16px; padding: 12px; display: grid; gap: 8px; }
	.whatsapp-btn, .whatsapp-link { background: #0f766e; color: #fff; text-align: center; text-decoration: none; }
	.whatsapp-btn:hover, .whatsapp-link:hover, .whatsapp-link:focus-visible { background: #0b5f59; color: #fff; outline: none; }
	.modal-backdrop { position: fixed; inset: 0; z-index: 80; background: rgba(26, 26, 26, 0.42); display: flex; align-items: center; justify-content: center; padding: 18px; }
	.contact-dialog { width: min(420px, 100%); display: grid; gap: 12px; text-align: center; box-shadow: 0 24px 70px rgba(26, 26, 26, 0.25); }
	.dialog-icon { width: 46px; height: 46px; margin: 0 auto; border-radius: 999px; background: #0f766e; color: #fff; display: inline-flex; align-items: center; justify-content: center; font-weight: 900; font-size: 24px; }
	.contact-dialog h2 { margin: 0; }
	.contact-number { font-weight: 900; color: var(--ink); background: #f8fafc; border: 1px solid var(--line); border-radius: 999px; padding: 10px 14px; margin: 0; }
	.dialog-actions { display: grid; gap: 10px; }
	.call-link { background: var(--red); color: #fff; text-align: center; text-decoration: none; }
	.call-link:hover, .call-link:focus-visible { background: var(--dark-red); color: #fff; outline: none; }
	.report-box { border-top: 1px solid var(--line); padding-top: 12px; }
	.report-box summary { cursor: pointer; font-weight: 800; }
	.report-form { display: grid; gap: 10px; margin-top: 12px; }
	.small-note { font-size: 13px; }
	@media (hover: none) { .quick-reply { opacity: 0.42; } }
	@media (min-width: 900px) { .chat-page { max-width: 860px; padding-top: 28px; } .messages { padding: 22px; } .bubble-wrap { max-width: 70%; } .composer { border-radius: 22px; border: 1px solid var(--line); padding: 14px; } .chat-head { align-items: center; } }
	@media (max-width: 520px) { .chat-head { gap: 8px; } .chat-actions { align-items: flex-end; flex-direction: column-reverse; } .safety-popover { right: 0; } .bubble-wrap { max-width: 92%; } .quick-reply { width: 28px; height: 28px; } }

	/* Phase 59.4: polished chat experience; original messaging behavior remains unchanged. */
	.chat-page { --chat-navy: #142337; --chat-red: #cb0c32; max-width: 980px; padding-top: 22px; padding-bottom: 42px; }
	.back { color: #bd1239; font-weight: 850; font-size: 13px; text-decoration: none; align-items: center; gap: 6px; margin-bottom: 15px; }
	.back:hover { text-decoration: underline; }
	.chat-head { border-radius: 23px; padding: clamp(20px,3.5vw,30px); background: linear-gradient(115deg,#142337,#243a54); color: white; align-items: center; box-shadow: 0 14px 32px rgba(20,35,55,.12); }
	.chat-overline { color: #ffadbf; font-size: 10px; font-weight: 900; letter-spacing: .14em; }
	.chat-head h1 { color: white; font-size: clamp(25px,3.5vw,38px); letter-spacing: -.04em; margin: 8px 0 7px; line-height: 1.12; overflow-wrap: anywhere; }
	.chat-accent { color: #ff5575; }
	.chat-item { color: #d1dce9; font-size: 13px; margin: 0; line-height: 1.5; }
	.chat-item strong { color: #fff; }
	.chat-head .icon-btn { background: rgba(255,255,255,.12); color: #fff; border-color: rgba(255,255,255,.28); transition: background .18s ease, transform .18s ease; }
	.chat-head .icon-btn:hover, .chat-head .icon-btn:focus-visible { background: rgba(255,255,255,.24); color: white; transform: translateY(-1px); }
	.safety-popover { color: #182334; border-radius: 19px; max-height: min(70vh,650px); overflow-y: auto; overscroll-behavior: contain; }
	.messages { background: #f7f9fc; border: 1px solid #e4e8ef; border-radius: 22px; padding: clamp(14px,2.8vw,24px); gap: 14px; min-height: 260px; max-height: min(66vh, 680px); overflow-y: auto; scrollbar-width: thin; scrollbar-color: #c4cad5 transparent; }
	.messages::-webkit-scrollbar { width: 6px; }
	.messages::-webkit-scrollbar-thumb { background: #c4cad5; border-radius: 20px; }
	.bubble-wrap { max-width: 84%; }
	.bubble { border-radius: 17px 17px 17px 5px; background: white; border: 1px solid #e6eaf0; box-shadow: 0 2px 7px rgba(20,35,55,.04); padding: 11px 15px; line-height: 1.55; font-size: 14px; color: #223148; }
	.bubble-wrap.mine .bubble { background: #cb0c32; border-color: #cb0c32; color: white; border-radius: 17px 17px 5px 17px; }
	.bubble-wrap.mine .bubble small { color: #ffcfda; }
	.bubble:not(.mine) small { color: #7b8492; }
	.bubble-wrap.mine .quoted-message { background: rgba(255,255,255,.15); border-left-color: #fff; }
	.bubble-wrap.mine .quoted-message strong, .bubble-wrap.mine .quoted-message span { color: white; }
	.quick-reply { background: white; border-color: #e2e6ee; color: #687589; }
	.composer { background: #fff; border: 1px solid #e3e7ed; border-radius: 20px; padding: 12px; box-shadow: 0 7px 25px rgba(20,35,55,.05); margin-top: 12px; }
	.composer textarea { border: 1px solid #e3e7ed; border-radius: 15px; padding: 13px 15px; font-size: 16px; background: #f9fafc; min-height: 48px; }
	.composer textarea:focus { outline: 2px solid rgba(203,12,50,.20); border-color: #cb0c32; }
	.send-btn { background: #cb0c32; border-radius: 15px; transition: background .16s ease, transform .16s ease; }
	.send-btn:hover { background: #a70a29; transform: translateY(-1px); }
	.reply-preview { border-radius: 12px; }
	@media (min-width: 900px) { .chat-page { max-width: 980px; } .messages { padding: 24px; } .bubble-wrap { max-width: 68%; } .composer { padding: 14px; } }
	@media (max-width: 520px) { .chat-page { padding-top: 10px; padding-bottom: 95px; } .chat-head { padding: 20px 17px; border-radius: 18px; } .chat-head h1 { font-size: 25px; } .chat-overline { font-size: 9px; } .messages { padding: 12px 9px; border-radius: 16px; max-height: 54vh; } .bubble-wrap { max-width: 95%; gap: 5px; } .bubble { padding: 10px 12px; } .composer { padding: 9px; border-radius: 15px; } .composer-row { gap: 7px; } .send-btn { width: 46px; height: 46px; } }
	@media (prefers-reduced-motion: reduce) { .send-btn, .chat-head .icon-btn { transition: none; } }

	/* Phase 65: dark-mode surfaces for chat controls and safety dialogs.
	   Scoped to the selected theme, preserving the light design and interactions. */
	:global(html[data-theme='dark']) .safety-popover,
	:global(html[data-theme='dark']) .contact-dialog {
		background: #1d2330 !important;
		border-color: rgba(220,232,248,.18) !important;
		color: #f4f6fb;
	}
	:global(html[data-theme='dark']) .safety-popover :is(h2, strong, summary),
	:global(html[data-theme='dark']) .contact-dialog :is(h2, strong) { color: #f4f6fb; }
	:global(html[data-theme='dark']) .safety-popover .muted,
	:global(html[data-theme='dark']) .contact-dialog .muted { color: #bdc7d8; }
	:global(html[data-theme='dark']) .whatsapp-box {
		background: #182f31;
		border-color: rgba(105,221,202,.26);
		color: #e8faf6;
	}
	:global(html[data-theme='dark']) .whatsapp-box strong { color: #d1fff3; }
	:global(html[data-theme='dark']) .whatsapp-box .muted { color: #bcdfd7; }
	:global(html[data-theme='dark']) .contact-number {
		background: #121a28;
		border-color: rgba(220,232,248,.20);
		color: #f4f6fb;
	}
	:global(html[data-theme='dark']) .btn.secondary,
	:global(html[data-theme='dark']) .menu-action,
	:global(html[data-theme='dark']) .message-menu {
		background: #282f3d;
		border-color: rgba(220,232,248,.20);
		color: #f4f6fb;
	}
	:global(html[data-theme='dark']) .btn.secondary.danger { color: #ff93ae; }
	:global(html[data-theme='dark']) .composer {
		background: #1d2330 !important;
		border-color: rgba(220,232,248,.18);
		color: #f4f6fb;
	}
	:global(html[data-theme='dark']) .composer textarea {
		background: #141b29 !important;
		border-color: rgba(220,232,248,.18) !important;
		color: #f4f6fb;
		color-scheme: dark;
	}
	:global(html[data-theme='dark']) .composer textarea::placeholder { color: #aab7cb; }
	:global(html[data-theme='dark']) .reply-preview {
		background: #2c2634;
		border-color: var(--red);
	}
	:global(html[data-theme='dark']) .reply-preview button,
	:global(html[data-theme='dark']) .quick-reply,
	:global(html[data-theme='dark']) .icon-btn {
		background: #30394a;
		border-color: rgba(220,232,248,.18);
		color: #e6ebf4;
	}
	:global(html[data-theme='dark']) .messages {
		background: #171d29;
		border-color: rgba(220,232,248,.16);
	}
	:global(html[data-theme='dark']) .bubble-wrap:not(.mine) .bubble {
		background: #2b3445;
		border-color: rgba(220,232,248,.15);
		color: #edf2fa;
	}
	:global(html[data-theme='dark']) .bubble-wrap:not(.mine) .bubble small { color: #b4c0d1; }
	:global(html[data-theme='dark']) .bubble-wrap:not(.mine) .quoted-message { background: rgba(255,255,255,.07); }
	:global(html[data-theme='dark']) .chat-head .icon-btn { background: rgba(255,255,255,.12); color: #fff; }
	@media (prefers-reduced-transparency: reduce) {
		:global(html[data-theme='dark']) .safety-popover,
		:global(html[data-theme='dark']) .contact-dialog,
		:global(html[data-theme='dark']) .composer { backdrop-filter: none !important; -webkit-backdrop-filter: none !important; }
	}
</style>
