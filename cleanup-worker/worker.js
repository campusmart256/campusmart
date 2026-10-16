
const VERIFICATION_KEY_PATTERN =
  /^verification\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp|pdf)$/;

export default {
  async fetch() {
    return new Response('Not found', {
      status: 404
    });
  },

  async scheduled(controller, env, ctx) {
    ctx.waitUntil(runCleanupDryRun(env));
  }
};

async function runCleanupDryRun(env) {
  console.log('CampusMart cleanup: dry run started');
  const deletionEnabled =
  env.ENABLE_DOCUMENT_DELETION === 'true';

console.log('Deletion safety switch:', {
  enabled: deletionEnabled
});

if (deletionEnabled) {
  console.error(
    'Deletion is not implemented yet. Refusing to proceed.'
  );
  return;
}
  console.log('R2 binding available:', Boolean(env.PHOTOS));

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    console.error('Missing Supabase configuration');
    return;
  }

  try {
    const endpoint = new URL(
      '/rest/v1/verification_document_cleanup',
      env.SUPABASE_URL
    );

    endpoint.searchParams.set('select', 'document_path');
    endpoint.searchParams.set('completed_at', 'is.null');
    endpoint.searchParams.set('limit', '100');

    const response = await fetch(endpoint, {
      headers: {
        apikey: env.SUPABASE_SECRET_KEY
      }
    });

    if (!response.ok) {
      console.error(
        'Cleanup queue query failed:',
        response.status
      );
      return;
    }

    const jobs = await response.json();

    if (!Array.isArray(jobs)) {
      console.error('Unexpected cleanup queue response');
      return;
    }

    let validPaths = 0;
    let invalidPaths = 0;

    for (const job of jobs) {
      if (
        typeof job.document_path === 'string' &&
        VERIFICATION_KEY_PATTERN.test(job.document_path)
      ) {
        validPaths++;
      } else {
        invalidPaths++;
      }
    }

    console.log('Cleanup path validation:', {
      inspected_jobs: jobs.length,
      valid_paths: validPaths,
      invalid_paths: invalidPaths,
      deletion_enabled: false
    });
    await processCleanupJob(env);
  } catch (error) {
    console.error(
      'Cleanup dry run failed:',
      error?.name ?? 'Unknown'
    );
  }
}


async function claimCleanupJob(env)
 {
  const endpoint = new URL(
    '/rest/v1/rpc/claim_verification_document_cleanup',
    env.SUPABASE_URL
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({})
  });

  if (!response.ok) {
    throw new Error(
      `Cleanup claim failed with HTTP ${response.status}`
    );
  }

  const jobs = await response.json();

  if (!Array.isArray(jobs)) {
    throw new Error('Unexpected cleanup claim response');
  }

  if (jobs.length > 1) {
    throw new Error('Cleanup claim returned multiple jobs');
  }

  return jobs[0] ?? null;
}

function validateClaimedJob(job) {
  if (!job || typeof job !== 'object') {
    throw new Error('Invalid cleanup job');
  }

 const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
  if (
    typeof job.job_id !== 'string' ||
    !uuidPattern.test(job.job_id)
  ) {
    throw new Error('Invalid cleanup job ID');
  }

  if (
    typeof job.claim_token !== 'string' ||
    !uuidPattern.test(job.claim_token)
  ) {
    throw new Error('Invalid cleanup claim token');
  }

  if (
    typeof job.document_path !== 'string' ||
    !VERIFICATION_KEY_PATTERN.test(job.document_path)
  ) {
    throw new Error('Unsafe verification document path');
  }

  if (
    !Number.isInteger(job.attempts) ||
    job.attempts < 1 ||
    job.attempts > 5
  ) {
    throw new Error('Invalid cleanup attempt count');
  }

  if (
    typeof job.lease_expires_at !== 'string' ||
    !Number.isFinite(
      Date.parse(job.lease_expires_at)
    )
  ) {
    throw new Error('Invalid cleanup lease expiry');
  }

  const leaseExpiresAt = Date.parse(
    job.lease_expires_at
  );

  // Leave a safety margin before the lease expires.
  const minimumRemainingMs = 30_000;

  if (
    leaseExpiresAt <= Date.now() + minimumRemainingMs
  ) {
    throw new Error(
      'Cleanup claim lease expired or too close to expiry'
    );
  }


return {
  job_id: job.job_id,
  claim_token: job.claim_token,
  document_path: job.document_path,
  attempts: job.attempts,
  lease_expires_at: job.lease_expires_at
};

}


async function completeCleanupJob(env, job) {
  const endpoint = new URL(
    '/rest/v1/rpc/complete_verification_document_cleanup',
    env.SUPABASE_URL
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_job_id: job.job_id,
      p_claim_token: job.claim_token
    })
  });

  if (!response.ok) {
    throw new Error(
      `Cleanup completion failed with HTTP ${response.status}`
    );
  }

  const completed = await response.json();

  if (completed !== true) {
    throw new Error('Cleanup job was not completed');
  }

  return true;
}


async function failCleanupJob(env, job, errorMessage) {
  const endpoint = new URL(
    '/rest/v1/rpc/fail_verification_document_cleanup',
    env.SUPABASE_URL
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_job_id: job.job_id,
      p_claim_token: job.claim_token,
      p_error: String(errorMessage || 'Cleanup failed')
        .slice(0, 500)
    })
  });

  if (!response.ok) {
    throw new Error(
      `Cleanup failure reporting failed with HTTP ${response.status}`
    );
  }

  const recorded = await response.json();

  if (recorded !== true) {
    throw new Error('Cleanup failure was not recorded');
  }

  return true;
}



async function deleteVerificationDocument(env, job) {
  // Require both independent safety switches.
  if (
    env.ENABLE_DOCUMENT_DELETION !== 'true' ||
    env.ENABLE_LIVE_CLEANUP !== 'true'
  ) {
    throw new Error('Live document deletion is disabled');
  }

  // Validate the claimed job, document path,
  // and remaining lease time.
  const validatedJob = validateClaimedJob(job);
  await verifyCleanupClaim(env, validatedJob);

  // Never attempt deletion without the expected R2 binding.
  if (!env.PHOTOS || typeof env.PHOTOS.delete !== 'function') {
    throw new Error('R2 deletion binding is unavailable');
  }

  // Delete only the strictly validated verification document key.
  // R2 delete is idempotent: deleting an already-missing key
  // is safe for retries.

  // Check the lease again immediately before R2 deletion.
  // Allow at least 30 seconds of remaining lease time.
  validateClaimedJob(validatedJob);

  await env.PHOTOS.delete(validatedJob.document_path);


  console.log('R2 verification document deletion completed');

  return true;
}



async function processCleanupJob(env) {
  // Keep production processing locked until explicitly approved.
  if (env.ENABLE_DOCUMENT_DELETION !== 'true') {
    console.log('Cleanup processing skipped: deletion disabled');
    return;
  }

  // A second independent lock prevents accidental execution.
  if (env.ENABLE_LIVE_CLEANUP !== 'true') {
    console.error('Live cleanup is not authorized');
    return;
  }

  if (!env.PHOTOS) {
    throw new Error('R2 bucket binding is missing');
  }

  if (!env.SUPABASE_URL || !env.SUPABASE_SECRET_KEY) {
    throw new Error('Supabase configuration is missing');
  }

  let job = null;

  try {
    const claimedJob = await claimCleanupJob(env);

    if (!claimedJob) {
      console.log('No eligible cleanup jobs');
      return;
    }

    job = {
      job_id: claimedJob.job_id,
      claim_token: claimedJob.claim_token
    };


const validatedJob = validateClaimedJob(claimedJob);

// Deletion verifies the current claim with Supabase
// and checks the lease before contacting R2.
await deleteVerificationDocument(env, validatedJob);

// Ensure sufficient lease time remains before completion.
validateClaimedJob(validatedJob);

// Confirm the claim still belongs to this worker.
await verifyCleanupClaim(env, validatedJob);

// Mark the document reference as removed only after
// the R2 deletion operation has succeeded.
await completeCleanupJob(env, validatedJob);


    console.log('Cleanup job completed successfully');
  } catch (error) {
    console.error('Cleanup processing failed:', {
      error_type: error?.name ?? 'Error'
    });

    if (job) {
      try {
        await failCleanupJob(
          env,
          job,
          'Cleanup processing failed'
        );

        console.log('Cleanup failure recorded');
      } catch (reportError) {
        console.error('Cleanup failure reporting also failed:', {
          error_type: reportError?.name ?? 'Error'
        });
      }
    }
  }
}


async function verifyCleanupClaim(env, job) {
  const endpoint = new URL(
    '/rest/v1/rpc/verify_verification_document_cleanup_claim',
    env.SUPABASE_URL
  );

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: env.SUPABASE_SECRET_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      p_job_id: job.job_id,
      p_claim_token: job.claim_token
    })
  });

  if (!response.ok) {
    throw new Error(
      `Cleanup claim verification failed: HTTP ${response.status}`
    );
  }

  const verified = await response.json();

  if (verified !== true) {
    throw new Error(
      'Cleanup claim is no longer valid'
    );
  }

  return true;
}
