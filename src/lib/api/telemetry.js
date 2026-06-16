import { useAppStore } from '../../store/useAppStore';

const QUEUE_KEY = 'apf_telemetry_queue';

const queuePayload = (url, payload) => {
  const queue = JSON.parse(localStorage.getItem(QUEUE_KEY) || '[]');
  queue.push({ id: crypto.randomUUID(), url, payload });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  useAppStore.getState().addToast('[ TELEMETRY STAGED: OFFLINE BUFFER ENFORCED ]', 'warning');
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
    const payload = {
      meta: {
        source: 'APF-Phase32',
        event_type: 'identity.sovereign.ingress',
        entry_timestamp: new Date().toISOString(),
        network: "Arbitrum One"
      },
      telemetry: {
        wallet_address: walletAddress,
        alias: alias,
        signature: signature,
        chain_id: 42161,
        session_status: 'active'
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


export const logRequisition = async (walletAddress, itemID, cost) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Phase33',
        event_type: 'logistics.requisition.authorized',
        entry_timestamp: new Date().toISOString(),
        network: "Arbitrum One"
      },
      telemetry: {
        wallet_address: walletAddress,
        item_id: itemID,
        cost_pts: cost,
        chain_id: 42161,
        session_status: 'active'
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

export const logEventSignal = async (walletAddress, eventTitle, signature) => {
  try {
    const payload = {
      meta: {
        source: 'APF-Phase34',
        event_type: 'event.muster.signal',
        entry_timestamp: new Date().toISOString(),
        network: "Arbitrum One"
      },
      telemetry: {
        wallet_address: walletAddress,
        event_title: eventTitle,
        signature: signature,
        chain_id: 42161,
        session_status: 'active'
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
