
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';

const source = readFileSync(
  new URL('./worker.js', import.meta.url),
  'utf8'
);

const start = source.indexOf(
  'async function processCleanupJob(env)'
);

assert.ok(start >= 0, 'Coordinator function missing');

const opening = source.indexOf('{', start);
let depth = 0;
let end = -1;

for (let i = opening; i < source.length; i++) {
  if (source[i] === '{') depth++;
  if (source[i] === '}') {
    depth--;
    if (depth === 0) {
      end = i + 1;
      break;
    }
  }
}

assert.ok(end > start, 'Incomplete coordinator function');

const coordinatorSource = source.slice(start, end);

const events = [];
let failureMode = 'none';

const fakeJob = {
  job_id: '33333333-3333-4333-8333-333333333333',
  claim_token: '44444444-4444-4444-8444-444444444444',
  document_path:
    'verification/33333333-3333-4333-8333-333333333333/44444444-4444-4444-8444-444444444444.pdf',
  attempts: 1,
  lease_expires_at:
    new Date(Date.now() + 120_000).toISOString()
};

const context = vm.createContext({
  console: {
    log() {},
    error() {}
  },

  claimCleanupJob: async () => {
    events.push('claim');
    return fakeJob;
  },

  validateClaimedJob: (job) => {
    events.push('validate');
    return job;
  },

  deleteVerificationDocument: async () => {
    events.push('delete');

    if (failureMode === 'delete') {
      throw new Error('Simulated deletion failure');
    }
  },


verifyCleanupClaim: async () => {
  events.push('verify');

  if (failureMode === 'verify') {
    throw new Error('Simulated claim verification failure');
  }

  return true;
},

  completeCleanupJob: async () => {
    events.push('complete');

    if (failureMode === 'complete') {
      throw new Error('Simulated completion failure');
    }
  },

  failCleanupJob: async () => {
    events.push('report_failure');

    if (failureMode === 'report') {
      throw new Error('Simulated reporting failure');
    }
  }
});

vm.runInContext(
  coordinatorSource +
  '\nglobalThis.testCoordinator = processCleanupJob;',
  context
);

const env = {
  ENABLE_DOCUMENT_DELETION: 'true',
  ENABLE_LIVE_CLEANUP: 'true',
  PHOTOS: {},
  SUPABASE_URL: 'https://example.invalid',
  SUPABASE_SECRET_KEY: 'fake-test-key'
};

async function runTest(mode) {
  events.length = 0;
  failureMode = mode;
  await context.testCoordinator(env);
  return events.join(',');
}

// Test 1: Both safety switches disabled.
events.length = 0;

await context.testCoordinator({
  ...env,
  ENABLE_DOCUMENT_DELETION: 'false'
});

assert.deepEqual(events, []);
console.log('PASS: Disabled cleanup does not claim jobs');

// Test 2: Successful cleanup.
assert.equal(
  await runTest('claim,validate,delete,validate,verify,complete'),
  'claim,validate,delete,validate,verify,complete'
);

console.log('PASS: Successful cleanup follows correct order');

// Test 3: Deletion fails.
assert.equal(
  await runTest('delete'),
  'claim,validate,delete,report_failure'
);

console.log('PASS: Failed deletion skips completion');

// Test 4: Completion fails.
assert.equal(
  await runTest('complete'),
  'claim,validate,delete,validate,verify,complete,report_failure'
);

console.log('PASS: Completion failure is reported');

// Test 5: Failure reporting also fails.
events.length = 0;
failureMode = 'report';

context.deleteVerificationDocument = async () => {
  events.push('delete');
  throw new Error('Simulated deletion failure');
};

await context.testCoordinator(env);

assert.equal(
  events.join(','),
  'claim,validate,delete,report_failure'
);

console.log('PASS: Double failure handled without completion');

context.deleteVerificationDocument = async () => {
  events.push('delete');
};

// Test 6: Supabase rejects the claim before completion.
assert.equal(
  await runTest('verify'),
  'claim,validate,delete,validate,verify,report_failure'
);

console.log('PASS: Invalid claim blocks database completion');

console.log('PASS: No real database or R2 operations performed');
