import { useAppStore } from '../../store/useAppStore';
import { supabase } from './supabaseClient';

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
        console.log('[ TELEMETRY UPLINK ESTABLISHED ]');
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
    const { error } = await supabase.from('muster_roll').insert([payload]);
    if (error) throw error;
    useAppStore.getState().addTelemetryLog('[ UPLINK SUCCESS ] Sovereign Entry Logged.');
  } catch (error) {
    console.error('[ AXIM CORE UPLINK FAILED ]', error);
    const payload = { wallet_address: walletAddress, alias: alias, signature: signature, network: "Arbitrum One" };
    queuePayload(`${import.meta.env.VITE_SUPABASE_URL || 'MISSING_KEY'}/rest/v1/muster_roll`, payload);
  }
};


export const logRequisition = async (walletAddress, itemID, cost) => {
  try {
    const payload = { wallet_address: walletAddress, item_id: itemID, cost_pts: cost, network: "Arbitrum One" };
    const { error } = await supabase.from('requisitions').insert([payload]);
    if (error) throw error;
    useAppStore.getState().addTelemetryLog('[ UPLINK SUCCESS ] Requisition Logged.');
  } catch (error) {
    console.error('[ AXIM CORE UPLINK FAILED ]', error);
    const payload = { wallet_address: walletAddress, item_id: itemID, cost_pts: cost, network: "Arbitrum One" };
    queuePayload(`${import.meta.env.VITE_SUPABASE_URL || 'MISSING_KEY'}/rest/v1/requisitions`, payload);
  }
};

export const logEventSignal = async (walletAddress, eventTitle, signature) => {
  try {
    const payload = { wallet_address: walletAddress, event_title: eventTitle, signature: signature, network: "Arbitrum One" };
    const { error } = await supabase.from('event_signals').insert([payload]);
    if (error) throw error;
    useAppStore.getState().addTelemetryLog('[ UPLINK SUCCESS ] Event Signal Logged.');
  } catch (error) {
    console.error('[ AXIM CORE UPLINK FAILED ]', error);
    const payload = { wallet_address: walletAddress, event_title: eventTitle, signature: signature, network: "Arbitrum One" };
    queuePayload(`${import.meta.env.VITE_SUPABASE_URL || 'MISSING_KEY'}/rest/v1/event_signals`, payload);
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
    console.error('[ TELEMETRY FAILED ]', error);
  }
};
