<svelte:head>
  <title>Safety Center | CampusMart</title>
  <meta name="description" content="Practical safety guidance for buying, selling, meeting and reporting concerns on CampusMart." />
</svelte:head>

<main class="safety-page">
  <a class="back-link" href="/">← Back to marketplace</a>
  <header class="hero">
    <span class="eyebrow">Your safety matters</span>
    <h1>CampusMart Safety Center</h1>
    <p>Simple steps to help you buy, sell, and connect more safely with other students.</p>
    <a class="hero-action" href="#report">How to report a concern <span aria-hidden="true">↗</span></a>
  </header>

  <section class="quick-grid" aria-label="Safety topics">
    <a href="#meet" class="topic"><span class="symbol" aria-hidden="true">⌖</span><strong>Meet safely</strong><span>Choose public locations and inspect items.</span><span class="arrow" aria-hidden="true">→</span></a>
    <a href="#payments" class="topic"><span class="symbol" aria-hidden="true">◇</span><strong>Payments and scams</strong><span>Avoid deposits and pressure tactics.</span><span class="arrow" aria-hidden="true">→</span></a>
    <a href="#messages" class="topic"><span class="symbol" aria-hidden="true">✉</span><strong>Safe messaging</strong><span>Keep conversations clear and cautious.</span><span class="arrow" aria-hidden="true">→</span></a>
    <a href="#account" class="topic"><span class="symbol" aria-hidden="true">✓</span><strong>Protect your account</strong><span>Keep passwords and documents private.</span><span class="arrow" aria-hidden="true">→</span></a>
  </section>

  <div class="content-grid">
    <div class="primary">
      <section class="panel" id="meet">
        <span class="section-kicker">01 / In person</span>
        <h2>Meet safely on campus</h2>
        <ul>
          <li>Choose a busy, public place during daylight hours where possible.</li>
          <li>Tell someone you trust where you are meeting and consider bringing a friend.</li>
          <li>Inspect and test the item before agreeing to pay.</li>
          <li>Leave if you feel pressured or uncomfortable. You do not have to complete a sale.</li>
        </ul>
      </section>

      <section class="panel" id="payments">
        <span class="section-kicker">02 / Transactions</span>
        <h2>Avoid payment scams</h2>
        <ul>
          <li>Do not send advance deposits to strangers to “reserve” an item.</li>
          <li>Be cautious of unusually low prices and urgent payment demands.</li>
          <li>Check item condition, ownership, and agreed price before paying.</li>
          <li>Never share one-time passcodes, PINs, or banking credentials.</li>
        </ul>
        <p class="inline-note">CampusMart connects buyers and sellers; it does not hold payments or guarantee transactions.</p>
      </section>

      <section class="panel" id="messages">
        <span class="section-kicker">03 / Conversations</span>
        <h2>Message with care</h2>
        <ul>
          <li>Keep important details, such as the item and agreed price, in your CampusMart conversation when possible.</li>
          <li>Do not share personal documents, passwords, or verification codes in chat.</li>
          <li>Be cautious when someone asks you to switch apps immediately or follow an unfamiliar link.</li>
          <li>Use the conversation’s safety menu if another user behaves suspiciously.</li>
        </ul>
        <a class="text-link" href="/messages">Go to messages →</a>
      </section>

      <section class="panel" id="account">
        <span class="section-kicker">04 / Privacy</span>
        <h2>Protect your identity</h2>
        <ul>
          <li>Use a strong, unique password and protect your email account.</li>
          <li>Submit student verification documents only through CampusMart’s designated verification process.</li>
          <li>A verified badge indicates a verification status, not a guarantee that a transaction is risk-free.</li>
          <li>Review the <a href="/privacy">Privacy Policy</a> for information about personal data.</li>
        </ul>
      </section>

      <section class="panel report-panel" id="report">
        <span class="section-kicker">05 / Get help</span>
        <h2>Report a concern</h2>
        <p>If a listing or conversation seems suspicious, use the report or safety options where available. Include a clear description and relevant listing or conversation details. Avoid sending passwords or sensitive documents.</p>
        <p>For additional assistance, contact the CampusMart support team. If you feel in immediate danger, leave the situation and contact campus security or local emergency services.</p>
        <div class="actions">
          <a class="primary-action" href="mailto:campusmart256@gmail.com?subject=CampusMart%20Safety%20Concern">Email support</a>
          <a class="secondary-action" href="https://wa.me/256741448912" target="_blank" rel="noopener noreferrer">Contact support on WhatsApp ↗</a>
        </div>
      </section>
    </div>

    <aside class="side" aria-label="Safety reminders">
      <div class="reminder">
        <span class="eyebrow">Before you buy</span>
        <h2>A quick safety check</h2>
        <ul class="checklist">
          <li>Confirm item details</li>
          <li>Agree on a public meetup</li>
          <li>Inspect before payment</li>
          <li>Never share account codes</li>
        </ul>
      </div>
      <div class="side-card">
        <strong>Know your rights and responsibilities</strong>
        <p>Read CampusMart's platform rules and privacy information.</p>
        <a href="/terms">Terms &amp; Conditions →</a>
        <a href="/privacy">Privacy Policy →</a>
      </div>
    </aside>
  </div>
</main>

<style>
  .safety-page { --surface: rgba(255,255,255,.88); --soft: #f7f7fb; --heading: #19263e; --body: #506078; --stroke: #e4e8ef; --accent: #c71045; max-width: 1120px; margin: 0 auto; padding: clamp(20px,4vw,48px) 16px 90px; color: var(--heading); }
  .back-link { display:inline-block; margin: 0 0 20px; color: var(--accent); font-size:13px; font-weight:800; text-decoration:none; }
  .hero { padding: clamp(26px,5vw,52px); border-radius: 27px; background: radial-gradient(circle at 93% 5%,rgba(255,102,157,.20),transparent 38%),linear-gradient(120deg,#101a30,#24395a); color: white; box-shadow:0 20px 40px #0c1c391a; }
  .eyebrow,.section-kicker { font-size:11px; font-weight:800; letter-spacing:.13em; text-transform:uppercase; color:#fa89ae; }
  h1 { font-size:clamp(32px,5vw,51px); letter-spacing:-.045em; line-height:1.1; margin:12px 0 15px; }
  .hero p { max-width:650px; color:#dbe4f3; line-height:1.7; font-size:15px; margin:0 0 24px; }
  .hero-action { display:inline-flex; gap:12px; align-items:center; padding:12px 17px; border-radius:12px; color:white; font-weight:800; text-decoration:none; background:#ed376e; }
  .hero-action:hover { background:#d51d53; }
  .quick-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:13px; margin:21px 0; }
  .topic { display:flex; flex-direction:column; gap:9px; min-width:0; padding:18px; position:relative; border:1px solid var(--stroke); border-radius:20px; background:var(--surface); text-decoration:none; color:var(--heading); box-shadow:0 8px 25px #101f3309; }
  .topic:hover { border-color:#ed7c9e; transform:translateY(-2px); }
  .symbol { display:grid; place-items:center; width:36px; height:36px; border-radius:11px; color:var(--accent); background:rgba(239,66,117,.12); font-size:23px; }
  .topic strong { font-size:15px; }
  .topic > span:not(.symbol):not(.arrow) { color:var(--body); font-size:12px; line-height:1.6; }
  .arrow { align-self:flex-end; color:var(--accent); font-weight:800; }
  .content-grid { display:grid; grid-template-columns:minmax(0,1fr) 275px; align-items:start; gap:19px; }
  .primary { display:grid; gap:18px; min-width:0; }
  .panel,.side-card { padding:clamp(20px,3vw,30px); border-radius:22px; border:1px solid var(--stroke); background:var(--surface); box-shadow:0 8px 25px #10203509; }
  .section-kicker { color:var(--accent); }
  h2 { font-size:clamp(20px,2.5vw,25px); letter-spacing:-.025em; margin:10px 0 13px; color:var(--heading); }
  .panel p,.side-card p { color:var(--body); font-size:14px; line-height:1.75; }
  .panel ul { margin:0; padding-left:21px; }
  .panel li { color:var(--body); font-size:14px; line-height:1.7; padding:4px 0; }
  .panel li::marker { color:var(--accent); }
  .panel a:not(.primary-action):not(.secondary-action),.side-card a { color:var(--accent); }
  .inline-note { border-left:3px solid #f4769e; padding:9px 14px; background:var(--soft); border-radius:0 10px 10px 0; }
  .actions { display:flex; gap:11px; flex-wrap:wrap; margin-top:20px; }
  .primary-action,.secondary-action { display:inline-flex; align-items:center; justify-content:center; padding:12px 16px; border-radius:12px; text-decoration:none; font-size:13px; font-weight:800; }
  .primary-action { color:white; background:#db2457; }
  .secondary-action { color:var(--heading); border:1px solid var(--stroke); background:var(--soft); }
  .reminder { padding:25px; border-radius:22px; background:linear-gradient(140deg,#192940,#243956); color:white; }
  .reminder h2 { color:white; }
  .checklist { list-style:none; margin:15px 0 0; padding:0; display:grid; gap:15px; }
  .checklist li { color:#e4ebf6; font-size:13px; line-height:1.5; display:flex; gap:10px; }
  .checklist li::before { content:'✓'; color:#90ebca; font-weight:900; }
  .side { display:grid; gap:17px; }
  .side-card strong { font-size:15px; }
  .side-card a { display:block; font-size:13px; font-weight:700; margin-top:13px; }
  :global(html[data-theme='dark']) .safety-page { --surface:rgba(31,38,52,.93); --soft:#202738; --heading:#f3f5fa; --body:#bfc9d8; --stroke:rgba(255,255,255,.13); --accent:#ff83a9; }
  :global(html[data-theme='dark']) .topic { box-shadow:none; }
  :global(html[data-theme='dark']) .panel,:global(html[data-theme='dark']) .side-card { box-shadow:none; }
  :global(html[data-theme='dark']) .secondary-action { color:#f3f5fa; }
  a:focus-visible { outline:3px solid #fd74a2; outline-offset:3px; }
  @media (max-width:900px) { .quick-grid { grid-template-columns:repeat(2,minmax(0,1fr)); } .content-grid { grid-template-columns:minmax(0,1fr); } .side { grid-template-columns:repeat(2,minmax(0,1fr)); } }
  @media (max-width:550px) { .quick-grid { gap:10px; } .topic { padding:14px; } .side { grid-template-columns:1fr; } .actions a { width:100%; } }
  @media (prefers-reduced-motion:reduce) { .topic:hover { transform:none; } }
</style>
