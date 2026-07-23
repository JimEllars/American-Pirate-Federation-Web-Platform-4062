import { useAppStore } from '../../store/useAppStore';
import { supabase } from './supabaseClient';


// Throttle Queue
const insertQueue = [];
let isQueueProcessing = false;

const processInsertQueue = async () => {
  if (isQueueProcessing || insertQueue.length === 0) return;
  isQueueProcessing = true;

  const batch = [...insertQueue];
  insertQueue.length = 0; // Clear the queue

  try {
    // Group by table
    const grouped = batch.reduce((acc, item) => {
      if (!acc[item.table]) acc[item.table] = [];
      acc[item.table].push(item.payload);
      return acc;
    }, {});

    for (const [table, payloads] of Object.entries(grouped)) {
      const { error } = await supabase.from(table).insert(payloads);
      if (error) throw error;
    }
  } catch (error) {
    console.warn('[ TELEMETRY_BLOCKED_BY_CLIENT ]', error);
    // Put them back in queue or local storage if needed, but for now just log it
    // Actually, following the original logic, we would use queuePayload for each on failure
    for (const item of batch) {
      queuePayload(`${import.meta.env.VITE_SUPABASE_URL || 'MISSING_KEY'}/rest/v1/${item.table}`, item.payload);
    }
  } finally {
    isQueueProcessing = false;
  }
};

let telemetryInterval = null;
if (typeof window !== 'undefined') {
  telemetryInterval = setInterval(processInsertQueue, 3000);
}

if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    if (telemetryInterval) clearInterval(telemetryInterval);
  });
}

const queueInsert = (table, payload, successMessage) => {
  insertQueue.push({ table, payload });
  if (successMessage) {
    useAppStore.getState().addTelemetryLog(successMessage);
  }
};

const QUEUE_KEY = 'apf_telemetry_queue';

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

  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');

  queue.push({
    id: (typeof crypto !== 'undefined' && crypto.randomUUID) ? crypto.randomUUID() : Math.random().toString(36).substring(2, 9),
    url,
    payload,
    stagedAt: Date.now(),
    integrityHash: checksum
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  useAppStore.getState().addToast('[ TELEMETRY STAGED: LOCAL BUFFER BUFFERING TRANSACTION ]', 'warning');
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
    fetch('https://mock.supabase.co/functions/v1/telemetry-ingress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then((res) => {
      if (!res.ok) {
        queuePayload('https://mock.supabase.co/functions/v1/telemetry-ingress', payload);
      } else {
        console.info('[ TELEMETRY UPLINK ESTABLISHED ]');
      }
    }).catch(() => {
      queuePayload('https://mock.supabase.co/functions/v1/telemetry-ingress', payload);
    });

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

    fetch('https://mock.supabase.co/functions/v1/telemetry-ingress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      queuePayload('https://mock.supabase.co/functions/v1/telemetry-ingress', payload);
    });

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

    fetch('https://mock.supabase.co/functions/v1/telemetry-ingress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      queuePayload('https://mock.supabase.co/functions/v1/telemetry-ingress', payload);
    });

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

    fetch('https://mock.supabase.co/functions/v1/telemetry-ingress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      queuePayload('https://mock.supabase.co/functions/v1/telemetry-ingress', payload);
    });

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

    fetch('https://mock.supabase.co/functions/v1/telemetry-ingress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).catch(() => {
      queuePayload('https://mock.supabase.co/functions/v1/telemetry-ingress', payload);
    });

  } catch (error) {
    // Fail silently in production mode
  }
};
