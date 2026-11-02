import { supabase } from './supabaseClient.js';
import { useAppStore } from '../../store/useAppStore.js';

const QUEUE_KEY = 'apf_telemetry_queue';
const RETRY_DELAY_BASE = 1000;
const MAX_RETRY_DELAY = 30000;

const isMockEnv = !import.meta.env.VITE_SUPABASE_URL ||
                  import.meta.env.VITE_SUPABASE_URL.includes('mock.supabase.co') ||
                  import.meta.env.VITE_SUPABASE_URL.includes('localhost');

const TELEMETRY_ENDPOINT = '/api/telemetry';

export const generateChecksum = async (payloadString) => {
  let checksum = '';
  if (typeof crypto !== 'undefined' && crypto.subtle) {
      const encoder = new TextEncoder();
      const data = encoder.encode(payloadString);
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      checksum = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
      let hash = 0;
      for (let i = 0; i < payloadString.length; i++) {
        const char = payloadString.charCodeAt(i);
        hash = ((hash << 5) - hash) + char;
        hash = hash & hash;
      }
      checksum = hash.toString(16);
  }
  return checksum;
};

const queuePayload = async (url, payload) => {
  const payloadString = JSON.stringify(payload);
  const checksum = await generateChecksum(payloadString);

  let queue = [];
  try {
      queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  } catch(e) {
      queue = [];
  }

  if (queue.length >= 50) {
      queue.shift(); // Enforce limit of 50
  }

  queue.push({
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Date.now().toString(36),
    url,
    payload,
    stagedAt: Date.now(),
    integrityHash: checksum,
    retryCount: 0
  });

  try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
          queue.splice(0, Math.floor(queue.length / 2));
          try {
              localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
          } catch(err) {
              console.warn('[ TELEMETRY LOCAL STORAGE FULL - UNABLE TO QUEUE ]');
          }
      }
  }

  if (typeof useAppStore !== 'undefined' && useAppStore.getState) {
    try {
        useAppStore.getState().addToast('[ TELEMETRY STAGED: LOCAL BUFFER BUFFERING TRANSACTION ]', 'warning');
    } catch(e) {
        console.warn('[ TELEMETRY TOAST FAILED ]', e);
    }
  }
};

let flushTimeout = null;

export const flushTelemetryQueue = async () => {
    let queue = [];
    try {
        queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
    } catch(e) {
        queue = [];
    }

    if (queue.length === 0) return;

    // Time-To-Live check (2 hours = 7200000 ms)
    const now = Date.now();
    const validQueue = queue.filter(item => (now - item.stagedAt) < 7200000);

    if (validQueue.length !== queue.length) {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(validQueue));
        queue = validQueue;
        if (queue.length === 0) return;
    }

    const batch = queue.map(item => item.payload);
    const retryCounts = queue.map(item => item.retryCount);
    const maxRetryCount = Math.max(...retryCounts, 0);

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(TELEMETRY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batch),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
            console.info('[ TELEMETRY BATCH FLUSHED SUCCESSFULLY ]');
        } else if (response.status >= 500 || response.status === 429) {
            throw new Error(`Server returned ${response.status}`);
        } else {
            // Bad request or similar, drop the batch to avoid infinite loop
            localStorage.setItem(QUEUE_KEY, JSON.stringify([]));
        }
    } catch (error) {
        console.warn('[ TELEMETRY FLUSH FAILED - WILL RETRY ]', error.message);

        // Update retry counts and schedule next flush
        const updatedQueue = queue.map(item => ({ ...item, retryCount: (item.retryCount || 0) + 1 }));
        localStorage.setItem(QUEUE_KEY, JSON.stringify(updatedQueue));

        const nextDelay = Math.min(MAX_RETRY_DELAY, RETRY_DELAY_BASE * Math.pow(2, maxRetryCount));

        if (flushTimeout) clearTimeout(flushTimeout);
        flushTimeout = setTimeout(flushTelemetryQueue, nextDelay);
    }
};

// Listen for network reconnect
if (typeof window !== 'undefined') {
    window.addEventListener('online', flushTelemetryQueue);
}

let batchTimeout = null;
let telemetryBatch = [];

const processBatch = async () => {
    if (telemetryBatch.length === 0) return;
    const batchToProcess = [...telemetryBatch];
    telemetryBatch = [];

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 8000);

        const response = await fetch(TELEMETRY_ENDPOINT, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(batchToProcess),
            signal: controller.signal
        });
        clearTimeout(timeoutId);

        if (response.status >= 500 || response.status === 429) {
            throw new Error(`Server returned ${response.status}`);
        } else if (!response.ok) {
            console.warn(`[ TELEMETRY DROPPED: ${response.status} ]`);
        }
    } catch (error) {
        console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT - QUEUEING ]', error.message);
        for (const payload of batchToProcess) {
            queuePayload(TELEMETRY_ENDPOINT, payload);
        }
    }
};

export const sendOrQueueTelemetry = async (url, payload) => {
    if (isMockEnv) return;

    // Convert to strict schema for new edge function
    const strictPayload = {
      event: payload.meta?.event_type || 'unknown_event',
      timestamp: Date.now(),
      metadata: payload.telemetry || payload
    };

    telemetryBatch.push(strictPayload);

    if (telemetryBatch.length >= 10) {
        if (batchTimeout) clearTimeout(batchTimeout);
        processBatch();
    } else {
        if (batchTimeout) clearTimeout(batchTimeout);
        batchTimeout = setTimeout(processBatch, 5000);
    }
};

// Send beacon on unload
if (typeof window !== 'undefined') {
    window.addEventListener('unload', () => {
        if (telemetryBatch.length > 0) {
            const blob = new Blob([JSON.stringify(telemetryBatch)], { type: 'application/json' });
            navigator.sendBeacon(TELEMETRY_ENDPOINT, blob);
        }
    });
}

/*
 * Member-owned writes.
 *
 * Each of these used to insert a wallet-shaped payload into a table whose actual columns
 * are `member_id UUID REFERENCES members(id)`:
 *
 *   logSovereignEntry -> table `muster_roll`, which does not exist in any migration
 *   logRequisition    -> `requisitions.wallet_address` / `.cost_pts` (real: member_id, item_id)
 *   logEventSignal    -> `event_signals.wallet_address` / `.event_title` (real: event_id, member_id)
 *
 * Every call failed with PGRST204/42P01, was swallowed, and the row was then forwarded to
 * the edge log. Three write paths were therefore dead while the UI reported success.
 *
 * A row can only be written when there is an authenticated Passport session, because
 * `members.id` is a foreign key to `auth.users`. These flows are wallet-only, so there is
 * no session to attribute the row to. Rather than perform a write guaranteed to fail, the
 * helpers record the action locally and return an explicit result. Persisting these
 * server-side is tracked in docs/audit-2026-11-02.md — it needs a Passport session in the
 * wallet flows, not another column name.
 */
const recordLocalOnly = (label) => {
  try {
    useAppStore.getState().addTelemetryLog(label);
  } catch (error) {
    /* store unavailable (SSR/static preview) — nothing to record */
  }
  return { stored: false, reason: 'no-passport-session' };
};

export const logSovereignEntry = async () => {
  // The signed muster draft stays in local state (zustand persist).
  return recordLocalOnly('[ NET_OPS: MUSTER DRAFT SEALED LOCALLY ]');
};

export const logRequisition = async () => {
  // Requisitions are settled in local reputation points; no card or crypto movement.
  return recordLocalOnly('[ NET_OPS: REQUISITION RECORDED LOCALLY ]');
};

export const logEventSignal = async () => {
  return recordLocalOnly('[ NET_OPS: EVENT SIGNAL RECORDED LOCALLY ]');
};

export const logNetworkTransition = async (targetChainId, successStatus) => {
  try {
    const statusStr = successStatus ? 'SUCCESS' : 'OPERATOR REJECTED NETWORK SWITCH';
    const msg = successStatus
      ? `[ NET_OPS: ${targetChainId === 42161 ? 'ARBITRUM_ONE' : targetChainId} TRANSITION SUCCESS ]`
      : `[ NET_OPS: ${statusStr} ]`;

    useAppStore.getState().addTelemetryLog(msg);
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
};

export const logSignatureRejection = async (contextPath) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Phase46',
        event_type: 'signature.rejected',
        timestamp: new Date().toISOString()
      },
      telemetry: {
        context_path: contextPath,
        chain_id: 42161,
        session_status: 'active'
      }
    };

    sendOrQueueTelemetry(TELEMETRY_ENDPOINT, payload);
    useAppStore.getState().addTelemetryLog('[ NET_OPS: OPERATOR DENIED CRYPTOGRAPHIC SIGNATURE ]');
  } catch (error) { /* empty */ }
};

export const logRPCException = async (endpoint, errorCode) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Phase49',
        event_type: 'rpc.exception',
        timestamp: new Date().toISOString()
      },
      telemetry: {
        endpoint: endpoint,
        error_code: errorCode,
        chain_id: 42161,
        session_status: 'active'
      }
    };

    sendOrQueueTelemetry(TELEMETRY_ENDPOINT, payload);
    useAppStore.getState().addTelemetryLog('[ NET_OPS: RPC NODE RATE_LIMITED OR UNREACHABLE ]');
  } catch (error) { /* empty */ }
};

export const logTransactionDispatched = async (txHash, context) => {
  try {
    const shortHash = txHash ? txHash.substring(0, 10) : '0x00000000';
    useAppStore.getState().addTelemetryLog(`[ NET_OPS: TX DISPATCHED // HASH: ${shortHash}... ]`);
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
};

export const logGasException = async () => {
  try {
    const payload = {
      meta: {
        source: 'APF-Phase55',
        event_type: 'gas.exception',
        timestamp: new Date().toISOString()
      },
      telemetry: {
        // A wallet address is a persistent cross-site identifier. "Insufficient gas" is a
        // useful aggregate signal on its own; attaching the address would turn an
        // operational metric into a trackable member record (APF-001, Article VII).
        chain_id: 42161,
        session_status: 'active'
      }
    };

    sendOrQueueTelemetry(TELEMETRY_ENDPOINT, payload);
    useAppStore.getState().addTelemetryLog('[ NET_OPS: INSUFFICIENT GAS DETECTED ]');
  } catch (error) { /* empty */ }
};

export const logOperatorConnected = async (walletAddress) => {
  try {
    const shortAddress = walletAddress ? `${walletAddress.substring(0, 6)}...${walletAddress.substring(walletAddress.length - 4)}` : '0x...';
    useAppStore.getState().addTelemetryLog(`[ NET_OPS: SECURE CONNECTION ESTABLISHED // ${shortAddress} ]`);
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
};

export const logUnhandledRejection = async (reason) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Global-Listener',
        event_type: 'unhandled.rejection',
        timestamp: new Date().toISOString()
      },
      telemetry: {
        reason: reason?.toString() || 'Unknown Promise Rejection',
        chain_id: 42161,
        session_status: 'active'
      }
    };

    sendOrQueueTelemetry(TELEMETRY_ENDPOINT, payload);
  } catch (error) { /* empty */ }
};

export const logCheckoutException = async (reason) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Checkout',
        event_type: 'checkout.exception',
        timestamp: new Date().toISOString()
      },
      reason: reason
    };
    useAppStore.getState().addTelemetryLog('[ NET_OPS: CHECKOUT SEQUENCE TERMINATED OR DECLINED ]');
  } catch (error) { /* empty */ }
};

export const logCommLinkSubscription = async () => {
  try {
    // Deliberately no email in the payload: the address is handed to /api/subscribe and
    // nowhere else. An earlier revision built a payload containing the raw address; it was
    // never transmitted, but leaving it one refactor away from the queue is not a security
    // posture, it is a latent leak.
    useAppStore.getState().addTelemetryLog('[ NET_OPS: COMM LINK SUBSCRIPTION STAGED ]');
  } catch (error) { /* empty */ }
};

export const logOnChainSuccess = async (txHash) => {
  try {
    const shortHash = txHash ? txHash.substring(0, 10) : '0x00000000';
    useAppStore.getState().addTelemetryLog(`[ NET_OPS: TRANSACTION CONFIRMED ON-CHAIN ]`);
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
};

export const logOnChainRevert = async (error) => {
  try {
    useAppStore.getState().addTelemetryLog(`[ CRITICAL: TRANSACTION REVERTED BY EVM ]`);
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
};

export const trackError = async (error, context = {}) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Global-Listener',
        event_type: 'system.error',
        timestamp: new Date().toISOString()
      },
      telemetry: {
        reason: error?.toString() || 'Unknown System Error',
        stack: error?.stack || '',
        context: context,
        chain_id: 42161,
        session_status: 'active'
      }
    };

    sendOrQueueTelemetry(TELEMETRY_ENDPOINT, payload);
  } catch (err) { /* empty */ }
};
