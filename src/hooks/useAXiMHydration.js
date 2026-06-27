import { useState, useCallback } from 'react';
import { supabase } from '../lib/api/supabaseClient';

/**
 * useAXiMHydration
 *
 * Scaffolds the inbound data hydration bridge from the AXiM Core.
 */

export const useAXiMHydration = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

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


  const fetchActiveEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.from('events').select('*');
      if (error) throw error;
      return data;
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
    fetchActiveEvents,
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
