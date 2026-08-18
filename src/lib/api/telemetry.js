import { supabase } from './supabaseClient';
import { useAppStore } from '../../store/useAppStore';

const insertQueue = [];
let telemetryInterval;

if (typeof window !== 'undefined') {
  telemetryInterval = setInterval(flushInsertQueue, 3000);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (telemetryInterval) clearInterval(telemetryInterval);
  });
}

async function flushInsertQueue() {
  if (insertQueue.length === 0) return;
  const batch = insertQueue.splice(0, insertQueue.length);

  try {
    const { error } = await supabase.from('telemetry_events').insert(batch);
    if (error) {
      console.warn('[ TELEMETRY BATCH INSERT FAILURE ]', error);
      // Re-queue
      insertQueue.push(...batch);
    }
  } catch (error) {
    console.warn('[ TELEMETRY BATCH INSERT EXCEPTION ]', error);
    // Re-queue
    insertQueue.push(...batch);
  }
}

const queueInsert = (table, payload, successMessage) => {
  insertQueue.push({ table, payload, created_at: new Date().toISOString() });
  if (successMessage) {
    useAppStore.getState().addTelemetryLog(successMessage);
  }
};


const QUEUE_KEY = 'apf_telemetry_queue';

let edgeTelemetryBuffer = [];
let edgeTelemetryInterval;

if (typeof window !== 'undefined') {
  edgeTelemetryInterval = setInterval(flushEdgeTelemetryBuffer, 5000);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (edgeTelemetryInterval) clearInterval(edgeTelemetryInterval);
  });
}

const sendOrQueueTelemetry = (endpoint, payload) => {
    edgeTelemetryBuffer.push(payload);
    if (edgeTelemetryBuffer.length >= 10) {
        flushEdgeTelemetryBuffer();
    }
};

let telemetryBackoffTimer = null;
let telemetryBackoffDelay = 1000;

async function flushEdgeTelemetryBuffer() {
  if (telemetryBackoffTimer) return; // Wait until backoff clears

  if (edgeTelemetryBuffer.length === 0) {
      if (typeof localStorage !== 'undefined') {
          try {
              const localQueue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
              if (localQueue.length > 0) {
                  edgeTelemetryBuffer = localQueue.map(item => item.payload);
                  localStorage.removeItem(QUEUE_KEY);
              } else {
                  return;
              }
          } catch(e) {
              localStorage.removeItem(QUEUE_KEY);
              return;
          }
      } else {
          return;
      }
  }

  const batch = edgeTelemetryBuffer.splice(0, edgeTelemetryBuffer.length);
  const EP = typeof TELEMETRY_ENDPOINT !== 'undefined' ? TELEMETRY_ENDPOINT : '/api/telemetry';

  try {
    const headers = { 'Content-Type': 'application/json' };

    // If routing directly to Supabase, add required auth headers
    if (EP.includes('supabase.co')) {
      const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
      headers['apikey'] = anonKey;
      headers['Authorization'] = `Bearer ${anonKey}`;
    }

    const res = await fetch(EP, {
      method: 'POST',
      headers,
      body: JSON.stringify(batch)
    });

    if (!res.ok) {
        if (res.status === 401 || res.status === 403 || res.status >= 500) {
            // Apply exponential backoff on auth/server errors
            telemetryBackoffDelay = Math.min(telemetryBackoffDelay * 2, 60000);
            telemetryBackoffTimer = setTimeout(() => {
                telemetryBackoffTimer = null;
            }, telemetryBackoffDelay);
        }
        throw new Error(`Network response was not ok: ${res.status}`);
    }

    // Reset backoff on success
    telemetryBackoffDelay = 1000;
    console.info('[ TELEMETRY UPLINK ESTABLISHED ] Batch Size:', batch.length);
  } catch (error) {
    console.warn('[ TELEMETRY BATCH INSERT EXCEPTION ]', error.message);
    batch.forEach(payload => queuePayload(EP, payload));
  }
}

const isMockEnv = !import.meta.env.VITE_SUPABASE_URL ||
                  import.meta.env.VITE_SUPABASE_URL.includes('mock.supabase.co') ||
                  import.meta.env.VITE_SUPABASE_URL.includes('localhost');

// Always prefer Cloudflare Pages Functions edge endpoint.
// If direct Supabase is needed, ensure valid formatting.
const TELEMETRY_ENDPOINT = '/api/telemetry';



export
const generateChecksum = async (payloadString) => {
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
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    url,
    payload,
    stagedAt: Date.now(),
    integrityHash: checksum
  });

  try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch (e) {
      if (e.name === 'QuotaExceededError' || e.code === 22) {
          // Fallback: purge half the queue if storage is full
          queue.splice(0, Math.floor(queue.length / 2));
          try {
              localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
          } catch(err) {
              console.warn('[ TELEMETRY LOCAL STORAGE FULL - UNABLE TO QUEUE ]');
          }
      }
  }

  try {
      useAppStore.getState().addToast('[ TELEMETRY STAGED: LOCAL BUFFER BUFFERING TRANSACTION ]', 'warning');
  } catch(e) {
      console.warn('[ TELEMETRY TOAST FAILED ]', e);
  }
};



export const logTreasuryDeployment = async (vaultAddress, deployerAddress) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Phase29',
        event_type: 'contract.write.initiated',
        timestamp: new Date().toISOString()
      },
      telemetry: {
        target_contract: vaultAddress,
        wallet_address: deployerAddress,
        chain_id: 42161,
        session_status: 'active',
        deployment_timestamp: "2026-06-07T10:47:08-05:00",
        deployment_node_location: "Hallsville, Texas, United States",
        network_layer: "Arbitrum One (Chain ID: 42161)"
      }
    };

    // Asynchronous mock uplink
    sendOrQueueTelemetry(TELEMETRY_ENDPOINT, payload);

  } catch (error) {
    // Critical uplink error is handled silently in background
  }
};

export const logSovereignEntry = async (walletAddress, alias, signature) => {
  try {
    const payload = { wallet_address: walletAddress, alias: alias, signature: signature, network: "Arbitrum One" };
    queueInsert('muster_roll', payload, '[ UPLINK SUCCESS ] Sovereign Entry Queued.');
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
};


export const logRequisition = async (walletAddress, itemID, cost) => {
  try {
    const payload = { wallet_address: walletAddress, item_id: itemID, cost_pts: cost, network: "Arbitrum One" };
    queueInsert('requisitions', payload, '[ UPLINK SUCCESS ] Requisition Queued.');
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
};

export const logEventSignal = async (walletAddress, eventTitle, signature) => {
  try {
    const payload = { wallet_address: walletAddress, event_title: eventTitle, signature: signature, network: "Arbitrum One" };
    queueInsert('event_signals', payload, '[ UPLINK SUCCESS ] Event Signal Queued.');
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
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
  } catch (error) {
    // Intentionally empty
  }
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
  } catch (error) {
    // Intentionally empty
  }
};

export const logTransactionDispatched = async (txHash, context) => {
  try {
    const shortHash = txHash ? txHash.substring(0, 10) : '0x00000000';
    useAppStore.getState().addTelemetryLog(`[ NET_OPS: TX DISPATCHED // HASH: ${shortHash}... ]`);
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
  }
};

export const logGasException = async (walletAddress) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Phase55',
        event_type: 'gas.exception',
        timestamp: new Date().toISOString()
      },
      telemetry: {
        wallet_address: walletAddress,
        chain_id: 42161,
        session_status: 'active'
      }
    };

    sendOrQueueTelemetry(TELEMETRY_ENDPOINT, payload);

    useAppStore.getState().addTelemetryLog('[ NET_OPS: INSUFFICIENT GAS DETECTED ]');
  } catch (error) {
    // Intentionally empty
  }
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

  } catch (error) {
    // Fail silently in production mode
  }
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
    // We intentionally don't store financial data in the queue
  } catch (error) {
    // Intentionally empty
  }
};
export const logCommLinkSubscription = async (email) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Comm-Link',
        event_type: 'subscription.initiated',
        timestamp: new Date().toISOString()
      },
      email: email
    };
    useAppStore.getState().addTelemetryLog('[ NET_OPS: COMM LINK SUBSCRIPTION STAGED ]');
  } catch (error) {
    // Intentionally empty
  }
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

  } catch (err) {
    // Fail silently in production mode
  }
};
