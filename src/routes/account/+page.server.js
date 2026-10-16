import { fail, redirect } from '@sveltejs/kit';
import { cleanText, validateDisplayName, normalizePhone } from '#lib/validation.js';
import { readImageFiles, storeAvatar, removePhotos } from '#lib/server/photos.js';
import { readVerificationDocument, storeVerificationDocument } from '#lib/server/verification-documents.js';
import { AVATAR_KEY_RE } from '#lib/avatar.js';

export const load = async ({ locals, url }) => {
	const user = await locals.getUser();
	if (!user) redirect(303, '/signin?next=/account');

	const [profileResult, settingsResult, verificationResult] = await Promise.all([
		locals.supabase
			.from('profiles')
			.select('display_name, verification_status, whatsapp_enabled, avatar_path, campuses(name)')
			.eq('id', user.id)
			.maybeSingle(),
		locals.supabase
			.from('private_settings')
			.select('whatsapp_number, notify_email, notify_push')
			.eq('user_id', user.id)
			.maybeSingle(),
		locals.supabase
			.from('verification_requests')
			.select('id, status, created_at, reject_reason, document_name, document_mime, document_size')
			.eq('user_id', user.id)
			.order('created_at', { ascending: false })
			.limit(1)
			.maybeSingle()
	]);
	if (profileResult.error) console.error('profile load failed:', profileResult.error.code, profileResult.error.message);
	if (settingsResult.error) console.error('settings load failed:', settingsResult.error.code, settingsResult.error.message);
	if (verificationResult.error) console.error('verification request load failed:', verificationResult.error.code, verificationResult.error.message);

	return {
		email: user.email,
		account: profileResult.data ?? null,
		settings: settingsResult.data ?? null,
		verificationRequest: verificationResult.data ?? null,
		passwordChanged: url.searchParams.get('password') === 'changed'
	};
};

/**
 * Deletes an old picture file, but only if it really is one of this user's pictures.
 * @param {string} userId @param {string | null | undefined} path
 */
async function discardAvatarFile(userId, path) {
	if (path && AVATAR_KEY_RE.test(path) && path.startsWith(`avatars/${userId}/`)) await removePhotos([path]);
}

export const actions = {
	/** Replace the profile picture. */
	avatar: async ({ request, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, '/signin?next=/account');

		const read = await readImageFiles((await request.formData()).getAll('avatar'), 1_000_000);
		if ('error' in read) return fail(400, { section: 'avatar', message: read.error });
		if (read.photos.length !== 1) return fail(400, { section: 'avatar', message: 'Choose one picture first.' });

		const { data: current } = await locals.supabase.from('profiles').select('avatar_path').eq('id', user.id).maybeSingle();

		/** @type {string} */
		let key;
		try {
			key = await storeAvatar(user.id, read.photos[0]);
		} catch (e) {
			console.error('avatar storage failed:', e instanceof Error ? e.message : e);
			return fail(500, { section: 'avatar', message: 'We could not store your picture. Please try again.' });
		}
		const { data, error } = await locals.supabase.from('profiles').update({ avatar_path: key }).eq('id', user.id).select('id');
		if (error || !data || data.length !== 1) {
			console.error('avatar update failed:', error?.code, error?.message, 'rows:', data?.length);
			await removePhotos([key]);
			return fail(500, { section: 'avatar', message: 'We could not save your picture. Please try again.' });
		}
		await discardAvatarFile(user.id, current?.avatar_path);
		return { section: 'avatar', saved: true };
	},

	/** Go back to the initials. */
	removeAvatar: async ({ locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, '/signin?next=/account');
		const { data: current } = await locals.supabase.from('profiles').select('avatar_path').eq('id', user.id).maybeSingle();
		const { data, error } = await locals.supabase.from('profiles').update({ avatar_path: null }).eq('id', user.id).select('id');
		if (error || !data || data.length !== 1) {
			console.error('avatar removal failed:', error?.code, error?.message);
			return fail(500, { section: 'avatar', message: 'We could not remove your picture. Please try again.' });
		}
		await discardAvatarFile(user.id, current?.avatar_path);
		return { section: 'avatar', removed: true };
	},

	/** Save the display name. */
	profile: async ({ request, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, '/signin?next=/account');

		const displayName = cleanText((await request.formData()).get('displayName'));
		const problem = validateDisplayName(displayName);
		if (problem) return fail(400, { section: 'profile', values: { displayName }, errors: { displayName: problem } });

		const { data, error } = await locals.supabase
			.from('profiles')
			.update({ display_name: displayName })
			.eq('id', user.id)
			.select('id');
		if (error || !data || data.length !== 1) {
			console.error('name update failed:', error?.code, error?.message, 'rows:', data?.length);
			return fail(500, { section: 'profile', values: { displayName }, errors: {}, message: 'We could not save your name. Please try again.' });
		}
		return { section: 'profile', saved: true };
	},


	/** Request student verification. */
	verification: async ({ request, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, '/signin?next=/account');

		const form = await request.formData();
		const fullName = cleanText(form.get('fullName'));
		const course = cleanText(form.get('course'));
		const yearRaw = String(form.get('yearOfStudy') ?? '').trim();
		const registrationNumber = String(form.get('registrationNumber') ?? '').trim().toUpperCase().replace(/\s+/g, '');
		const values = { fullName, course, yearOfStudy: yearRaw, registrationNumber };
		/** @type {Record<string, string>} */
		const errors = {};

		if (fullName.length < 2 || fullName.length > 100) errors.fullName = 'Enter your full name as it appears in your student records.';
		if (course.length < 2 || course.length > 100) errors.course = 'Enter your course or programme name.';
		const yearOfStudy = Number.parseInt(yearRaw, 10);
		if (!Number.isInteger(yearOfStudy) || yearOfStudy < 1 || yearOfStudy > 7) errors.yearOfStudy = 'Enter a year from 1 to 7.';
		if (registrationNumber.length < 3 || registrationNumber.length > 30) errors.registrationNumber = 'Enter your student registration number.';

		const documentRead = await readVerificationDocument(form.get('studentProof'));
		if ('error' in documentRead) errors.studentProof = documentRead.error;

		if (Object.keys(errors).length) return fail(400, { section: 'verification', values, errors });
if (!('document' in documentRead)) {
    return fail(400, {
        section: 'verification',
        values,
        errors: { studentProof: 'Please upload a valid verification document.' }
    });
}
		const { data: profile } = await locals.supabase
			.from('profiles')
			.select('verification_status')
			.eq('id', user.id)
			.maybeSingle();
		if (profile?.verification_status === 'verified') return fail(400, { section: 'verification', values, errors: {}, message: 'Your account already has the green check.' });
		if (profile?.verification_status === 'pending') return fail(400, { section: 'verification', values, errors: {}, message: 'Your verification request is already pending.' });

		let documentPath = '';
		try {
			documentPath = await storeVerificationDocument(user.id, documentRead.document);
		} catch (e) {
			console.error('verification document storage failed:', e instanceof Error ? e.message : e);
			return fail(500, { section: 'verification', values, errors: {}, message: 'We could not upload your document. Please try again.' });
		}

		const { error } = await locals.supabase.from('verification_requests').insert({
			user_id: user.id,
			full_name: fullName,
			course,
			year_of_study: yearOfStudy,
			registration_number: registrationNumber,
			document_path: documentPath,
			document_kind: documentRead.document.ext,
			document_name: documentRead.document.name,
			document_mime: documentRead.document.type,
			document_size: documentRead.document.size
		});

		if (error) {
			// Do not delete the R2 object here: a network failure may leave
			// the database insert committed even when the client sees an error.
			// Retain the object for a separate, reviewed orphan-reconciliation process.
			console.error('verification request failed; document retained for reconciliation:', error.code, error.message);
			let message = 'We could not send your verification request. Please try again.';
			if (error.code === '23505') message = 'You already have a pending request, or this registration number has already been used.';
			else if (error.message?.toLowerCase().includes('too many')) message = 'Too many verification requests this week. Try again later.';
			return fail(400, { section: 'verification', values, errors: {}, message });
		}

		return { section: 'verification', requested: true };
	},

	/** Save the WhatsApp number, the WhatsApp switch and email alerts. */
	contact: async ({ request, locals }) => {
		const user = await locals.getUser();
		if (!user) redirect(303, '/signin?next=/account');

		const form = await request.formData();
		const phone = normalizePhone(form.get('whatsappNumber'));
		const whatsappEnabled = form.get('whatsappEnabled') === 'on';
		const notifyEmail = form.get('notifyEmail') === 'on';
		const values = { whatsappNumber: String(form.get('whatsappNumber') ?? '').trim(), whatsappEnabled, notifyEmail };

		if (phone.error) return fail(400, { section: 'contact', values, errors: { whatsappNumber: phone.error } });
		if (whatsappEnabled && !phone.value) {
			return fail(400, { section: 'contact', values, errors: { whatsappNumber: 'Add your WhatsApp number to turn this on.' } });
		}

		// Save the number and alert choice first, then the public on/off switch.
		const settings = await locals.supabase
			.from('private_settings')
			.update({ whatsapp_number: phone.value, notify_email: notifyEmail })
			.eq('user_id', user.id)
			.select('user_id');
		if (settings.error || !settings.data || settings.data.length !== 1) {
			console.error('settings update failed:', settings.error?.code, settings.error?.message, 'rows:', settings.data?.length);
			return fail(500, { section: 'contact', values, errors: {}, message: 'We could not save your settings. Please try again.' });
		}

		const profile = await locals.supabase
			.from('profiles')
			.update({ whatsapp_enabled: whatsappEnabled })
			.eq('id', user.id)
			.select('id');
		if (profile.error || !profile.data || profile.data.length !== 1) {
			console.error('whatsapp switch failed:', profile.error?.code, profile.error?.message, 'rows:', profile.data?.length);
			return fail(500, { section: 'contact', values, errors: {}, message: 'We could not save your settings. Please try again.' });
		}

		return { section: 'contact', saved: true };
	}
};
