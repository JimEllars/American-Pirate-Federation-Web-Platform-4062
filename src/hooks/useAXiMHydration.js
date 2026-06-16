import { useState, useCallback } from 'react';

/**
 * useAXiMHydration
 *
 * Scaffolds the inbound data hydration bridge from the AXiM Core.
 */

import { generateChecksum } from '../lib/api/telemetry';
import { useAppStore } from '../store/useAppStore';
import { useEffect } from 'react';

const QUEUE_KEY = 'apf_telemetry_queue';

export const useAXiMHydration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const processQueue = async () => {
      if (!navigator.onLine) return;

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
               console.error('[ SECURITY WARNING: CORRUPTED OFFLINE PAYLOAD PURGED ]');
               continue; // Drop the corrupted payload
           }
        }

        // 2. Enforce 2-hour TTL
        if (item.stagedAt) {
           const age = Date.now() - item.stagedAt;
           if (age > 7200000) { // 2 hours in ms
               useAppStore.getState().addToast('[ TRANSACTION EXPIRED: SIGNATURE AGE EXCEEDED 2-HOUR BOUNDARY ]', 'error');
               continue; // Drop the expired payload
           }
        }

        try {
          const res = await fetch(item.url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
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
        useAppStore.getState().addToast('[ SYSTEM STATUS: STAGED TELEMETRY SIGNALS FLUSHED TO CORE ]', 'success');
      } else {
        localStorage.setItem(QUEUE_KEY, JSON.stringify(remainingQueue));
      }
    };

    processQueue();

    window.addEventListener('online', processQueue);
    return () => {
      window.removeEventListener('online', processQueue);
    };
  }, []);


  const fetchLiveLedger = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Simulate network request delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Simulated data response from AXiM core
      return [
         { txId: '0x8f...3a2b', date: '2024-05-10', amount: '50,000 APF', target: 'Local Community Garden Seed Fund', alignment: 'Article VI Alignment', status: 'Settled' },
         { txId: '0x2c...9e1f', date: '2024-05-08', amount: '12,500 APF', target: 'Open-Source Mesh Router Blueprint', alignment: 'Article V Alignment', status: 'Settled' },
         { txId: '0x4a...7d4c', date: '2024-05-05', amount: '8,000 APF', target: 'Legal Defense Fund (Node Operator 77)', alignment: 'Article IX Alignment', status: 'Pending' },
         { txId: '0x1b...5c8a', date: '2024-05-01', amount: '25,000 APF', target: 'Decentralized Clinic Supply Run', alignment: 'Article III Alignment', status: 'Settled' },
      ];
    } catch (err) {
      setError(err);
      // Removed console.error for production silence
      throw err; // Propagate to caller
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveProposals = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      return []; // Return empty for now as per instructions "verify if empty..."
    } catch (err) {
      setError(err);
      // Propagate error silently to be caught and logged via Toast
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPolicyConsensus = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with real AXiM Core fetch logic
      await new Promise(resolve => setTimeout(resolve, 500));
    } catch (err) {
      setError(err);
    } finally {
      setLoading(false);
    }
    return {};
  }, []);

  return {
    fetchLiveLedger,
    fetchActiveProposals,
    fetchPolicyConsensus,
    loading,
    error,
  };
};

export default useAXiMHydration;
