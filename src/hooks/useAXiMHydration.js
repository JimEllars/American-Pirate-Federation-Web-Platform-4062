import { useState, useCallback, useRef } from 'react';
import { supabase } from '../lib/api/supabaseClient';

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

  const fetchLiveLedger = useCallback(async () => {
    const now = Date.now();
    if (fetchCache.ledger.data && (now - fetchCache.ledger.timestamp < CACHE_TTL)) {
       return fetchCache.ledger.data;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('ledger').select('*');
      if (error) throw error;
      const mappedData = data.map(item => ({
        txId: item.tx_id,
        date: item.date,
        amount: item.amount,
        target: item.target,
        alignment: item.alignment,
        status: item.status
      }));
      fetchCache.ledger = { data: mappedData, timestamp: now };
      return mappedData;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);


  const fetchActiveEvents = useCallback(async () => {
    const now = Date.now();
    if (fetchCache.events.data && (now - fetchCache.events.timestamp < CACHE_TTL)) {
       return fetchCache.events.data;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('events').select('*');
      if (error) throw error;
      fetchCache.events = { data, timestamp: now };
      return data;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchActiveProposals = useCallback(async () => {
    const now = Date.now();
    if (fetchCache.proposals.data && (now - fetchCache.proposals.timestamp < CACHE_TTL)) {
       return fetchCache.proposals.data;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('proposals').select('*');
      if (error) throw error;
      fetchCache.proposals = { data, timestamp: now };
      return data;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchPolicyConsensus = useCallback(async () => {
    const now = Date.now();
    if (fetchCache.policyConsensus.data && (now - fetchCache.policyConsensus.timestamp < CACHE_TTL)) {
       return fetchCache.policyConsensus.data;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('policy_consensus').select('*');
      if (error) throw error;
      const reducedData = data.reduce((acc, item) => {
        acc[item.key] = item.value;
        return acc;
      }, {});
      fetchCache.policyConsensus = { data: reducedData, timestamp: now };
      return reducedData;
    } catch (err) {
      setError(err);
      return {};
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchArmoryInventory = useCallback(async () => {
    const now = Date.now();
    if (fetchCache.armoryInventory.data && (now - fetchCache.armoryInventory.timestamp < CACHE_TTL)) {
       return fetchCache.armoryInventory.data;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('armory_inventory').select('*');
      if (error) throw error;
      fetchCache.armoryInventory = { data, timestamp: now };
      return data;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSecureTransmissions = useCallback(async () => {
    const now = Date.now();
    if (fetchCache.secureTransmissions.data && (now - fetchCache.secureTransmissions.timestamp < CACHE_TTL)) {
       return fetchCache.secureTransmissions.data;
    }

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('transmissions').select('*');
      if (error) throw error;
      fetchCache.secureTransmissions = { data, timestamp: now };
      return data;
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchIntelligenceFeeds = useCallback(async () => {
    const now = Date.now();
    if (fetchCache.intelligenceFeeds.data && (now - fetchCache.intelligenceFeeds.timestamp < CACHE_TTL)) {
       return fetchCache.intelligenceFeeds.data;
    }

    setLoading(true);
    setError(null);
    try {
      // Dormant placeholder hook for AXiM intelligence feeds
      fetchCache.intelligenceFeeds = { data: [], timestamp: now };
      return [];
    } catch (err) {
      setError(err);
      return [];
    } finally {
      setLoading(false);
    }
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
