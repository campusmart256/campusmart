# campusmart (Phase 6: accounts and profile)

What works so far: create account, confirm email, sign in, sign out,
forgot/reset password, and a "My account" page where you can change your display
name, save your WhatsApp number from any country (and turn WhatsApp contact on or off) and choose
email alerts. Listings, search, chat and student verification come in later steps.

## Applying an update zip (the reliable way)

Update zips contain only the files that changed. In PowerShell, **from your project folder**
(the folder with `package.json`), run (change the file name and the Downloads path if yours differ):

```
Expand-Archive -Path "$HOME\Downloads\campusmart-update-9-similar.zip" -DestinationPath . -Force
```

`-Force` replaces the old files and does not touch your `.env`. Then run `npm install` if the update says so,
and restart the site (Ctrl+C, then `npm run dev`).

## A. Set up Supabase (about 10 minutes)

You already created the Supabase project and ran the database script.

1. **Get your two public values.** In Supabase open *Project Settings > API*
   (menu names can change). Copy the **Project URL** and the **public key**
   (called "anon" or "publishable"). Never use the "service_role" or "secret" key.
2. **Turn on email confirmation.** *Authentication > Sign In / Providers > Email*:
   make sure **Confirm email** is ON. Set the minimum password length to 8 if
   there is such a setting.
3. **Tell Supabase where your site lives.** *Authentication > URL Configuration*:
   - Site URL: `http://localhost:5173`
   - Redirect URLs: add `http://localhost:5173/**`
   (When the site goes online, add the real address here too.)
4. **Set up a custom email sender (SMTP).** Supabase only lets you edit email templates after you
   switch on *Authentication > Emails > SMTP Settings > Enable custom SMTP* (names can change).
   A free option is Brevo (300 emails a day; check its current limits). In Brevo, verify a sender
   email, then open *SMTP & API* and create an SMTP key. Copy the host, port, login and key
   it shows into the Supabase form. Sender name: campusmart. Use the SMTP key, never your Brevo password.
5. **Change the two email templates** (*Authentication > Email Templates*).
   Replace the whole body of each template with the text below.

   **Confirm sign up**
   ```html
   <h2>Confirm your email</h2>
   <p>Welcome to campusmart! Tap the link to confirm your email address:</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=signup">Confirm my email</a></p>
   ```

   **Reset password**
   ```html
   <h2>Reset your password</h2>
   <p>Tap the link to choose a new password:</p>
   <p><a href="{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&type=recovery">Choose a new password</a></p>
   ```

   Do not change anything inside the `{{ ... }}` parts.

## B. Run it on your laptop (Windows)

0. **Check your Node.js version.** In PowerShell run `node -v`. It must show **v22.17 or higher**
   (v24 is fine). If it shows something lower, download the newest **LTS** installer from nodejs.org,
   install it, close and reopen PowerShell, and check again.
1. Unzip this folder, for example to `C:\Users\YourName\campusmart-app`.
2. Open PowerShell and go into the folder:
   ```
   cd $HOME\campusmart-app
   ```
3. Install the pieces the site needs (takes a few minutes the first time):
   ```
   npm install
   ```
4. Create your settings file and open it:
   ```
   Copy-Item .env.example .env
   code .env
   ```
   Replace the two placeholder values with the Project URL and public key from step A1. Save.
5. Start the site:
   ```
   npm run dev
   ```
6. Open `http://localhost:5173` in your browser. Stop the site with Ctrl+C.

## C. Test it (tick each one)

- [ ] Home page shows the logo and "Create an account".
- [ ] Create an account with your real email. You land on "Check your email".
- [ ] The email arrives (check spam). Tap the link, then "Confirm my email". You land on "My account"
      showing your name, email, "International University of East Africa" and "Not verified".
- [ ] Sign out (top right). Sign in again with your email and password.
- [ ] Try a wrong password: you see "Email or password is incorrect."
- [ ] Forgot password: request a link, open it from the email, set a new password, sign in with it.
- [ ] In Supabase *Table Editor > profiles* your new row exists.

### Profile page checks (step 2)

- [ ] On My account change your display name and press **Save name**. The card at the top updates.
- [ ] Try a one-letter name: you see an error and nothing changes.
- [ ] Type a number like `0772 123 456`, turn **WhatsApp contact** on, press **Save contact settings**.
      Reload the page: the number shows as `+256772123456` and the switch stays on.
- [ ] Try a number from another country with its country code, like `+254 712 345 678`. It is saved as `+254712345678`.
      (Before this works, run the `campusmart_migration_v0.1.2_international_whatsapp.sql` file once in the Supabase SQL Editor.)
- [ ] Turn WhatsApp on with an empty number: you see "Add your WhatsApp number to turn this on."
- [ ] In Supabase *Table Editor*: `profiles.whatsapp_enabled` and `private_settings.whatsapp_number` match.
- [ ] Turn **Email alerts** off, save, reload: it stays off.

## Common errors

- **"PUBLIC_SUPABASE_URL is missing"** when starting: the `.env` file is missing or the
  names/values were not filled in. Check step B4.
- **"Too many attempts" or no email arrives:** check your spam folder first. Then check the SMTP
  settings in step A4 (a wrong login or key stops all emails). Free email plans also have daily limits.
- **"We could not load your profile" on My account:** the database script did not run fully, or
  the sign-up trigger is missing. Tell the developer and send a screenshot of Table Editor > profiles.
- **Link in the email says it did not work:** links work once and expire. Request a new one.
  Also check that the Site URL in step A3 is exactly `http://localhost:5173`.
- **"Unsupported engine" or "EBADENGINE" during `npm install`:** your Node.js is too old. See step B0.
- **`npm` is not recognized:** close and reopen PowerShell, or restart the laptop.

## Safety notes

- Never put the Supabase service_role / secret key in this project.
- The `.env` file stays on your laptop. It is excluded from git on purpose.
- Passwords are handled only by Supabase. This site never stores them.

## D. Put the site online (Cloudflare, free)

1. **Check your `.env` first.** `PUBLIC_SUPABASE_KEY` must be the **anon / publishable** key. Putting the
   site online copies this key into the website's public code, so a secret or service_role key would be exposed.
2. Install the new tool once (it was added to `package.json`):
   ```
   npm install
   ```
3. Log in to Cloudflare from the laptop (a browser window opens; click **Allow**):
   ```
   npx wrangler login
   ```
   If the login page shows a "CSRF" error, close all Cloudflare tabs, open a private window,
   log in at dash.cloudflare.com first, then run the command again.
4. Build and publish:
   ```
   npm run deploy
   ```
   If it asks you to choose a `workers.dev` name for your account, type a short lowercase name and press Enter.
   When it finishes it prints your address, like `https://campusmart.YOURNAME.workers.dev`. Copy it.
5. **Tell Supabase the new address** (*Authentication > URL Configuration*):
   - Site URL: your new address (no slash at the end)
   - Redirect URLs: add `https://campusmart.YOURNAME.workers.dev/**` (keep the localhost line too)
6. Open the address on your phone. Create an account with a different email and confirm it from the phone.

To publish changes later, run `npm run deploy` again from the project folder.

Notes:
- Anyone with the address can create an account, so do not share it widely yet.
- Email links use the Site URL from step 5, so once it is set, links in emails open the online site, even if you signed up from your laptop.
- `npm run preview:cf` runs the site locally inside Cloudflare's own runtime (useful for testing before you publish).

## E. Selling items with photos (Phase 7.1)

New in this step: the **Sell** page (photos, title, category, condition, price, description),
the **listing page**, and a **feed of the newest listings** on the home page.

No new database script is needed. Photos are stored in your Cloudflare R2 bucket.

1. **Check the bucket name.** Open `wrangler.jsonc`. The line `"bucket_name": "campusmart-photos"`
   must match the name of the bucket you created in Cloudflare. If you named it differently, change it there.
2. **On your laptop** (`npm run dev`) photos go to a *practice bucket kept on your laptop* (a hidden
   `.wrangler` folder). They do not appear on the online site, and online photos do not appear on your laptop.
   This is on purpose, so testing never fills your real bucket.
3. **Online** (`npm run deploy`) photos go to the real R2 bucket.

### Checks (step 7.1)

- [ ] Sell > add 1 to 5 photos from your phone or laptop. Each shows as a small preview. The first says "Cover".
- [ ] Fill in the form and press **Publish listing**. You land on the listing page with "Your listing is live".
- [ ] The home page shows your listing with its photo. Open it in a private window (not signed in): it still shows.
- [ ] **Save as draft** keeps a listing only you can see (others get "not found").
- [ ] A description containing "send deposit" is held: "waiting for a quick check".
- [ ] Your 6th active listing is saved as a draft with a message about the limit.
- [ ] A text file renamed to `.jpg` is refused. A very large phone photo still works (it is shrunk first).
- [ ] Share a published listing link in WhatsApp (online version only): it shows the photo, title and price.

### Limits to know

- Messaging, editing and "mark as sold" are not built yet.
- A listing's photo files have long random names. Drafts are hidden, but anyone who somehow had a photo link
  could open that photo.
- Photos are shrunk in the browser before upload. A person who bypasses the site can still upload up to 2.5 MB
  per photo; the server checks that each file really is a JPG, PNG or WebP picture.

## F. Menus (Phase 7.1b)

- A **menu button** (top left) opens a slide-out menu: your campus, Marketplace (Browse, Saved items, Messages, My listings),
  and Your account (Profile & verification, Sign in / Sign up or Sign out, and Moderation for staff only).
- A **bottom bar** on phones: Browse, Saved, Sell (the red button), Messages, Profile.
- Saved items, Messages, My listings and Moderation are not built yet. They open a "coming in a later step" page.
- The top bar has the **Sell** button and your initials (or "Sign in").
- Staff members (rows in the `staff` table) see the Moderation link.

## G. Filters on the home page (Phase 7.1c)

- A row of **category chips** (All items plus your categories, scrolls sideways on phones).
- **Verified sellers only** switch and a **sort** menu (Newest first, Price low to high, Price high to low).
- The choices live in the web address (for example `/?category=electronics&sort=price_asc&verified=1`),
  so the Back button and shared links work.
- Full search (typing words) and the price/condition filters come in Phase 8.

### Moderators and super admins

There is **no separate sign-in page**. Staff sign in on the normal Sign in page. If their account is listed in the
`staff` table, a **Moderation** link appears in their menu. The Moderation page itself is a placeholder until it is built.

To make an account a staff member, run this in the Supabase SQL Editor (change the email, and use `'moderator'` or `'super_admin'`):

```sql
insert into public.staff (user_id, role)
select id, 'super_admin' from auth.users where email = 'your@email.com';
```

Then sign out and in again (or reload) and open the menu.

## H. Search (Phase 8, first version)

- A **search bar** at the top of the home page. Type a product word, a seller's name, or both, then press Enter or tap **Search**.
- It looks in the **title**, the **description** and the **seller's name**. Every word you type must appear somewhere, in any order
  ("brian calculator" finds Brian's calculator). Part of a word works ("calc" finds "calculator"). Capital letters do not matter.
- It works together with the category chips, the verified-only switch and the sort menu. **Clear search** removes only the search.
- Symbols such as `% _ * " ( ,` are removed before searching, so they cannot change how the database search works.
  At most 5 words are used.
- Not yet: spelling mistakes (typo tolerance), price range and condition filters, and ranking by best match.
  Those come later in Phase 8.

## I. Profile picture (Phase 7.2a)

- On **My account > Profile picture**: choose a picture, check the preview, press **Save picture**.
  The middle square of the picture is cropped and shrunk to 512 pixels in your browser before uploading.
- Your picture replaces the initials in the top bar, on your account page and on your listings.
- **Remove picture** goes back to the initials. Old picture files are deleted from the R2 bucket.
- Only JPG, PNG or WebP pictures up to 1 MB are accepted, and the server checks that each file really is a picture.
- No database change is needed (the `avatar_path` column already exists).

## J. My listings (Phase 7.2b)

- **Menu > My listings** shows your listings in tabs: Active, Drafts (also held and removed), Sold, Expired.
  The note at the top shows how many of your active listings you have used (5 for members, 20 for verified students).
- **Edit** (active, draft or expired): change any detail, add or remove photos (1 to 5). If you edit a live listing to
  include a banned phrase it is put on hold for review.
- **Publish** a draft. **Renew** an expired listing for another 30 days. **Delete** asks you to confirm first and hides the listing.
- **Mark sold** opens **Who bought it?**: pick someone who messaged you about the item (messaging is not built yet, so
  for now only "Sold outside campusmart"), or skip. This uses the `mark_listing_sold` function from the sold-buyer
  database update you already ran.
- Held and removed listings cannot be edited; a moderator has to review them.

### Checks (J)

- [ ] Add a picture on My account; see it in the top bar; remove it.
- [ ] Open My listings; each tab shows the right listings and counts.
- [ ] Edit a listing: change the price, add a photo, remove a photo; save and check the listing page.
- [ ] Mark a listing as sold (outside campusmart); it moves to the Sold tab and leaves the home page.
- [ ] Delete a draft after confirming.

## K. Similar items (Phase 8)

At the bottom of every live listing page (after the price, description, seller, safety note and Message button)
a **Similar items** section shows up to 6 other live listings, best matches first.

How "similar" is decided (a simple points rule, easy to change in `src/lib/similar.js`):

- same category: +3
- close price (within 30%: +2, within 60%: +1)
- same condition: +1
- shared words in the title: +1 each, up to 2
- a different seller: +0.5, so the list is not just one person's items

If a category has few items, the list is filled with the newest items from other categories.
Drafts, held, sold, expired and deleted listings never appear. The section is hidden when nothing else is for sale.

### Checks (K)

- [ ] Open a live listing and scroll to the bottom: "Similar items" appears after the Message button.
- [ ] Tap a similar item: it opens, and its own Similar items list shows the first one.
- [ ] A draft you own shows no Similar items.
