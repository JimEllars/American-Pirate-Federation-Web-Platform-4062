import { useState, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/api/supabaseClient';

const CACHE_TTL = 60000; // 60 seconds
const fetchCache = {
  ledger: { data: null, timestamp: 0 },
  events: { data: null, timestamp: 0 },
  proposals: { data: null, timestamp: 0 },
  policyConsensus: { data: null, timestamp: 0 },
  armoryInventory: { data: null, timestamp: 0 },
  secureTransmissions: { data: null, timestamp: 0 },
  intelligenceFeeds: { data: null, timestamp: 0 }
};

/**
 * useAXiMHydration
 *
 * Scaffolds the inbound data hydration bridge from the AXiM Core.
 */

export const useAXiMHydration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const safeFetch = async (cacheKey, apiCall, mapData = (d) => d, fallbackData = []) => {
    const now = Date.now();
    if (fetchCache[cacheKey].data && (now - fetchCache[cacheKey].timestamp < CACHE_TTL)) {
       return fetchCache[cacheKey].data;
    }

    setLoading(true);
    setError(null);
    try {
      if (!isSupabaseConfigured) {
         // Return mock fallback immediately in offline/mock mode
         fetchCache[cacheKey] = { data: fallbackData, timestamp: now };
         return fallbackData;
      }

      const { data, error } = await apiCall();
      if (error) throw error;

      const mappedData = mapData(data || []);
      fetchCache[cacheKey] = { data: mappedData, timestamp: now };
      return mappedData;
    } catch (err) {
      console.warn(`[ HYDRATION FALLBACK ]: ${cacheKey} failed, using cache/mock.`, err.message);
      // Seamlessly fallback to cache if available, or empty mock
      const fallback = fetchCache[cacheKey].data || fallbackData;
      return fallback;
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveLedger = useCallback(async () => {
    return safeFetch('ledger', () => supabase.from('ledger').select('*'), (data) => data.map(item => ({
        txId: item.tx_id,
        date: item.date,
        amount: item.amount,
        target: item.target,
        alignment: item.alignment,
        status: item.status
      })), []);
  }, []);

  const fetchActiveEvents = useCallback(async () => {
    return safeFetch('events', () => supabase.from('events').select('*'), undefined, []);
  }, []);

  const fetchActiveProposals = useCallback(async () => {
    return safeFetch('proposals', () => supabase.from('proposals').select('*'), undefined, []);
  }, []);

  const fetchPolicyConsensus = useCallback(async () => {
    return safeFetch('policyConsensus', () => supabase.from('policy_consensus').select('*'), (data) => {
        return data.reduce((acc, item) => {
            acc[item.key] = item.value;
            return acc;
        }, {});
    }, {});
  }, []);

  const fetchArmoryInventory = useCallback(async () => {
    return safeFetch('armoryInventory', () => supabase.from('armory_inventory').select('*'), undefined, []);
  }, []);

  const fetchSecureTransmissions = useCallback(async () => {
    return safeFetch('secureTransmissions', () => supabase.from('transmissions').select('*'), undefined, []);
  }, []);

  const fetchIntelligenceFeeds = useCallback(async () => {
    return safeFetch('intelligenceFeeds', () => Promise.resolve({ data: [], error: null }), undefined, []);
  }, []);

  return {
    fetchActiveEvents,
    fetchLiveLedger,
    fetchActiveProposals,
    fetchPolicyConsensus,
    fetchArmoryInventory,
    fetchSecureTransmissions,
    fetchIntelligenceFeeds,
    loading,
    error,
  };
};

export default useAXiMHydration;
