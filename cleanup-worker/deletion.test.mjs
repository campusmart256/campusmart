
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(
  new URL('./worker.js', import.meta.url),
  'utf8'
);

function extractFunction(signature) {
  const start = source.indexOf(signature);
  assert.ok(start !== -1, `Missing function: ${signature}`);

  const opening = source.indexOf('{', start);
  let depth = 0;

  for (let i = opening; i < source.length; i++) {
    if (source[i] === '{') depth++;
    if (source[i] === '}') {
      depth--;
      if (depth === 0) {
        return source.slice(start, i + 1);
      }
    }
  }

  throw new Error(`Incomplete function: ${signature}`);
}

const pattern = source.match(
  /const VERIFICATION_KEY_PATTERN\s*=\s*(\/\^.*?\$\/);/
);

assert.ok(pattern, 'Verification key pattern missing');

let authorizationAllowed = true;
let verificationHttpOk = true;
let verificationCalls = 0;
const deletedKeys = [];

const context = vm.createContext({
  Date,
  Error,
  Number,
  String,
  URL,
  console,
  fetch: async () => {
    verificationCalls++;

    return {
      ok: verificationHttpOk,
      status: verificationHttpOk ? 200 : 503,
      json: async () => authorizationAllowed
    };
  }
});

vm.runInContext(
  `
  const VERIFICATION_KEY_PATTERN = ${pattern[1]};

  ${extractFunction('function validateClaimedJob(job)')}

  ${extractFunction('async function verifyCleanupClaim(env, job)')}

  ${extractFunction('async function deleteVerificationDocument(env, job)')}

  globalThis.testDelete = deleteVerificationDocument;
  `,
  context
);

const validJob = {
  job_id: '33333333-3333-4333-8333-333333333333',
  claim_token: '44444444-4444-4444-8444-444444444444',
  document_path:
    'verification/33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444.pdf',
  attempts: 1,
  lease_expires_at:
    new Date(Date.now() + 120_000).toISOString()
};

const env = {
  ENABLE_DOCUMENT_DELETION: 'true',
  ENABLE_LIVE_CLEANUP: 'true',
  SUPABASE_URL: 'https://example.invalid',
  SUPABASE_SECRET_KEY: 'fake-test-key',
  PHOTOS: {
    async delete(key) {
      deletedKeys.push(key);
    }
  }
};

// Test 1: Deletion disabled.
await assert.rejects(
  context.testDelete({
    ...env,
    ENABLE_DOCUMENT_DELETION: 'false'
  }, validJob),
  /disabled/
);

assert.equal(deletedKeys.length, 0);
console.log('PASS: Deletion safety switch works');

// Test 2: Live cleanup disabled.
await assert.rejects(
  context.testDelete({
    ...env,
    ENABLE_LIVE_CLEANUP: 'false'
  }, validJob),
  /disabled/
);

assert.equal(deletedKeys.length, 0);
console.log('PASS: Live cleanup safety switch works');

// Test 3: Unsafe document path.
await assert.rejects(
  context.testDelete(env, {
    ...validJob,
    document_path: 'listings/example.jpg'
  }),
  /Unsafe verification document path/
);

assert.equal(deletedKeys.length, 0);
console.log('PASS: Unsafe document path blocked');

// Test 4: Expired lease.
await assert.rejects(
  context.testDelete(env, {
    ...validJob,
    lease_expires_at:
      new Date(Date.now() - 60_000).toISOString()
  }),
  /lease expired or too close to expiry/
);

assert.equal(deletedKeys.length, 0);
console.log('PASS: Expired lease blocked');

// Test 5: Supabase rejects claim.
authorizationAllowed = false;

await assert.rejects(
  context.testDelete(env, validJob),
  /Cleanup claim is no longer valid/
);

assert.equal(deletedKeys.length, 0);
console.log('PASS: Rejected Supabase claim blocks deletion');

// Test 6: Supabase verification unavailable.
authorizationAllowed = true;
verificationHttpOk = false;

await assert.rejects(
  context.testDelete(env, validJob),
  /Cleanup claim verification failed/
);

assert.equal(deletedKeys.length, 0);
console.log('PASS: Supabase outage blocks deletion');

// Test 7: Authorized deletion.
verificationHttpOk = true;

await context.testDelete(env, validJob);

assert.deepEqual(deletedKeys, [
  validJob.document_path
]);

assert.equal(verificationCalls, 3);

console.log('PASS: Authorized job calls fake R2 deletion');
console.log('PASS: No real Supabase or R2 operations performed');
