// Read-only source audit. Run from the CampusMart project root:
// node scripts/phase60-audit.mjs
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { execFileSync } from 'node:child_process';
const root = process.cwd();
const get = (p) => { try { return readFileSync(join(root,p),'utf8'); } catch { return ''; } };
const rows = [];
const record = (status, name, detail) => rows.push({status,name,detail});
const required = ['src/hooks.server.js','src/lib/validation.js','src/routes/+page.svelte','src/routes/signin/+page.server.js','src/routes/signup/+page.svelte','src/routes/messages/[id]/+page.server.js','src/routes/admin/verification/document/[id]/+server.js','src/routes/saved/+page.server.js','src/routes/terms/+page.svelte','src/routes/copyright-policy/+page.svelte'];
for (const p of required) record(existsSync(join(root,p))?'PASS':'FAIL',`File: ${p}`,existsSync(join(root,p))?'Present':'Missing');
const hooks = get('src/hooks.server.js');
record(hooks.includes('auth.getClaims(')?'PASS':'WARN','Authentication identity','Server hook should validate Supabase claims; review any changes manually');
const staff = get('src/routes/admin/verification/document/[id]/+server.js');
record(staff.includes('requireStaff(locals)')&&staff.includes(".from('staff')")?'PASS':'WARN','Student document access','Staff authorization check present in route (database RLS must also be verified)');
const photos = get('src/routes/photos/[...key]/+server.js');
record(photos.includes('PHOTO_KEY_RE.test(key)')?'PASS':'WARN','Photo path validation','Random image-key pattern check');
const signup = get('src/routes/signup/+page.svelte');
const privacy = existsSync(join(root,'src/routes/privacy/+page.svelte')) || existsSync(join(root,'src/routes/privacy-policy/+page.svelte'));
const signupLegalLinks = /href=[\"']\/terms[\"']/.test(signup) && /href=[\"']\/(?:privacy|privacy-policy)[\"']/.test(signup);
const homeFooter = get('src/routes/+page.svelte');
const footerPrivacyLink = /href=[\"']\/(?:privacy|privacy-policy)[\"']/.test(homeFooter);
record(privacy?'PASS':'ACTION','Privacy Policy page',privacy?'Found':'Sign-up references a Privacy Policy but no dedicated page was found. Draft and review before launch.');
record(signupLegalLinks && privacy && existsSync(join(root,'src/routes/terms/+page.svelte'))?'PASS':'ACTION','Sign-up legal consent',signupLegalLinks && privacy?'Both signup links point to existing local policy pages.':'Confirm consent links point to existing terms and privacy pages.');
record(footerPrivacyLink?'PASS':'ACTION','Homepage Privacy Policy link',footerPrivacyLink?'Footer links to the Privacy Policy.':'Add a Privacy Policy link to the homepage footer.');
const migrations = join(root,'database');
const sql = existsSync(migrations)?readdirSync(migrations).filter(x=>x.endsWith('.sql')):[];
record(sql.length?'PASS':'WARN','SQL migrations',`${sql.length} migration file(s) found. This does NOT verify your live Supabase policies.`);
const servers=[];
function walk(dir){if(!existsSync(dir))return;for(const e of readdirSync(dir,{withFileTypes:true})){const p=join(dir,e.name);if(e.isDirectory())walk(p);else if(e.name.endsWith('.js')&&!p.includes('node_modules'))servers.push(p)}}
walk(join(root,'src'));
let syntaxFailures=0;
for(const p of servers){try{execFileSync(process.execPath,['--check',p],{stdio:'pipe'});}catch{syntaxFailures++;console.error('Syntax failed:',p.replace(root,''));}}
record(syntaxFailures?'FAIL':'PASS','JavaScript syntax',`${servers.length} files checked; ${syntaxFailures} failures`);
console.log('\nCampusMart Phase 60 — Source Audit (read-only)\n');
for(const r of rows) console.log(`[${r.status}] ${r.name} — ${r.detail}`);
const counts=Object.fromEntries(['PASS','ACTION','WARN','FAIL'].map(s=>[s,rows.filter(r=>r.status===s).length]));
console.log('\nSummary:',JSON.stringify(counts));
console.log('NOTE: This is not a penetration test, live database audit, or production deployment check.');
if(counts.FAIL)process.exitCode=1;
