
import { cleanupPushOnLogout } from './push.js';

/**
 * Clean up this device's push subscription before submitting
 * the existing CampusMart logout form.
 *
 * @param {SubmitEvent} event
 */
export async function handleLogout(event) {
    event.preventDefault();

    const form = /** @type {HTMLFormElement} */ (event.currentTarget);
    const button = /** @type {HTMLButtonElement | null} */ (
        form.querySelector('button[type="submit"]')
    );

    if (button) button.disabled = true;

    try {
        await cleanupPushOnLogout();
    } catch (error) {
        console.error('Push cleanup failed:', error);
        if (button) button.disabled = false;
        window.alert(
            'Could not safely disable notifications on this device. ' +
            'Please check your connection and try signing out again.'
        );
        return;
    }

    form.submit();
}
