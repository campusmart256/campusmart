<script>
    /** @type {{title: string, text?: string, url: string}} */
    let { title, text = '', url } = $props();
    let feedback = $state('');
    let showManualLink = $state(false);

    async function shareLink() {
        const absoluteUrl = new URL(url, window.location.origin).href;
        feedback = '';
        showManualLink = false;
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title, text, url: absoluteUrl });
                return;
            } catch (error) {
                // Closing the share dialog is not an error.
                if (error instanceof Error && error.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(absoluteUrl);
            feedback = 'Link copied. Paste it into a message to share.';
        } catch {
            showManualLink = true;
            feedback = 'Copy this link to share it:';
        }
    }

    const whatsAppUrl = $derived(`https://wa.me/?text=${encodeURIComponent([text || title, url].join('\n'))}`);
</script>

<div class="share-links">
    <div class="share-actions">
        <button class="btn btn2 share-button" type="button" onclick={shareLink} aria-label="Share link"><span aria-hidden="true">↗</span> Share link</button>
        <a class="btn btn2 share-button" href={whatsAppUrl} target="_blank" rel="noopener noreferrer" aria-label="Share via WhatsApp">WhatsApp</a>
    </div>
    {#if feedback}<p class="share-feedback" role="status">{feedback}</p>{/if}
    {#if showManualLink}<input class="manual-link" readonly value={url} aria-label="Link to copy" onclick={(event) => { if (event.currentTarget instanceof HTMLInputElement) event.currentTarget.select(); }} />{/if}
</div>

<style>
    .share-links { display: grid; gap: 7px; min-width: 0; }
    .share-actions { display: flex; flex-wrap: wrap; gap: 8px; }
    .share-button { display: inline-flex; align-items: center; justify-content: center; gap: 7px; text-align: center; font-size: .9rem; }
    .share-feedback { margin: 0; font-size: .82rem; color: var(--mute, #555); overflow-wrap: anywhere; }
    .manual-link { width: 100%; min-width: 0; padding: 9px; border: 1px solid var(--line, #ddd); border-radius: 8px; font: inherit; }
</style>
