cat << 'INNER_EOF' > src/hooks/useAXiMHydration.js
import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/api/supabaseClient';
import { generateChecksum } from '../lib/api/telemetry';
import { useAppStore } from '../store/useAppStore';

/**
 * useAXiMHydration
 *
 * Scaffolds the inbound data hydration bridge from the AXiM Core.
 */

const QUEUE_KEY = 'apf_telemetry_queue';

// Singleton Orchestrator for the Queue
let isQueueProcessing = false;
let isListenerAttached = false;

const processQueue = async () => {
  if (isQueueProcessing || typeof navigator === 'undefined' || !navigator.onLine) return;
  isQueueProcessing = true;

  try {
    const queueStr = localStorage.getItem(QUEUE_KEY);
    if (!queueStr) return;

    let queue = [];
    try {
      queue = JSON.parse(queueStr);
    } catch (e) {
      localStorage.removeItem(QUEUE_KEY);
      return;
    }

    if (queue.length === 0) return;

    let allFlushed = true;
    let remainingQueue = [];

    for (const item of queue) {
      // 1. Verify Payload Integrity
      if (item.integrityHash) {
         const payloadString = JSON.stringify(item.payload);
         const expectedChecksum = await generateChecksum(payloadString);
         if (item.integrityHash !== expectedChecksum) {
             console.error('[ SECURITY EXCEPTION: CORRUPTED OFFLINE PAYLOAD DROP ENFORCED ]');
             continue; // Drop the corrupted payload
         }
      }

      // 2. Enforce 2-hour TTL
      if (item.stagedAt) {
         const age = Date.now() - item.stagedAt;
         if (age > 7200000) { // 2 hours in ms
             useAppStore.getState().addToast('[ TRANSACTION EXPIRED: SIGNATURE AGE EXCEEDED 2-HOUR MAX BOUNDS ]', 'error');
             continue; // Drop the expired payload
         }
      }

      try {
        const res = await fetch(item.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
          },
          body: JSON.stringify(item.payload)
        });

        if (!res.ok) {
          allFlushed = false;
          remainingQueue.push(item);
        }
      } catch (e) {
        allFlushed = false;
        remainingQueue.push(item);
      }
    }

    if (allFlushed) {
      localStorage.removeItem(QUEUE_KEY);
      if (queue.length > 0) {
        useAppStore.getState().addToast('[ SYSTEM STATUS: STAGED TELEMETRY SIGNALS FLUSHED TO CORE ]', 'success');
      }
    } else {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
    }
  } finally {
    isQueueProcessing = false;
  }
};

export const useAXiMHydration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!isListenerAttached) {
      processQueue();
      if (typeof window !== 'undefined') {
        window.addEventListener('online', processQueue);
      }
      isListenerAttached = true;
    }

    // We don't remove listener here since it's global
  }, []);

  const fetchLiveLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('ledger').select('*');
      if (error) throw error;
      return data.map(item => ({
        txId: item.tx_id,
        date: item.date,
        amount: item.amount,
        target: item.target,
        alignment: item.alignment,
        status: item.status
      }));
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('proposals').select('*');
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPolicyConsensus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('policy_consensus').select('*');
      if (error) throw error;
      return data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
    } catch (err) {
      setError(err);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArmoryInventory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('armory_inventory').select('*');
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSecureTransmissions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('transmissions').select('*');
      if (error) throw error;
      return data;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    fetchLiveLedger,
    fetchActiveProposals,
    fetchPolicyConsensus,
    fetchArmoryInventory,
    fetchSecureTransmissions,
    loading,
    error,
  };
};

export default useAXiMHydration;
INNER_EOF
