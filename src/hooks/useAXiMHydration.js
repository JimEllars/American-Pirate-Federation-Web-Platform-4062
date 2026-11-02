import { useState, useCallback } from 'react';
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
 * Format a numeric ledger amount for display, e.g. 50000 + "USDC" -> "50,000 USDC".
 * Returns null when the value is not a usable number so callers can render an
 * honest placeholder instead of "NaN USDC".
 */
const formatAmount = (amount, asset) => {
  const numeric = Number(amount);
  if (!Number.isFinite(numeric)) return null;
  const formatted = numeric.toLocaleString('en-US', { maximumFractionDigits: 6 });
  return asset ? `${formatted} ${asset}` : formatted;
};

/**
 * Day/month label used by the Events + FleetMuster views, e.g. "02 NOV".
 */
const formatDayMonth = (isoTimestamp) => {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed
    .toLocaleDateString('en-US', { day: '2-digit', month: 'short' })
    .toUpperCase();
};

const formatTime = (isoTimestamp) => {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) return null;
  return parsed.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
    timeZoneName: 'short'
  });
};

/*
 * Column names below MUST match supabase/migrations/20261024000000_apf_core_schema.sql.
 * They previously read tx_id/date/key/value, none of which exist, so every hydrated
 * record arrived as `undefined` and the UI silently fell back to hardcoded fixtures.
 */

const mapLedgerRow = (row) => ({
  id: row.id,
  txId: row.tx_hash,
  date: row.executed_at ? String(row.executed_at).slice(0, 10) : null,
  amount: formatAmount(row.amount, row.asset),
  target: row.target,
  alignment: row.alignment,
  status: row.status
});

const mapEventRow = (row) => ({
  id: row.id,
  title: row.title,
  description: row.description,
  date: formatDayMonth(row.scheduled_at),
  time: row.time_display || formatTime(row.scheduled_at),
  location: row.location,
  capacity: row.capacity,
  scheduledAt: row.scheduled_at
});

const mapProposalRow = (row) => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  content: row.content,
  authorId: row.author_id,
  category: row.category,
  status: row.status,
  createdAt: row.created_at
});

const mapInventoryRow = (row) => ({
  id: row.id,
  sku: row.sku,
  name: row.name,
  category: row.category,
  priceCents: row.price_cents,
  stock: row.stock,
  isActive: row.is_active
});

const mapTransmissionRow = (row) => ({
  id: row.id,
  title: row.title,
  summary: row.summary,
  audioUrl: row.audio_url,
  classification: row.classification,
  publishedAt: row.published_at
});

/**
 * useAXiMHydration
 *
 * Read-only hydration bridge from Supabase into the view models the UI expects.
 *
 * Law 1 (Anti-Theater & Ground Truth): this hook never substitutes invented data.
 * If Supabase is unconfigured, unreachable, or returns zero rows, callers receive an
 * empty collection and are expected to render a polished empty state. `error` is
 * surfaced so pages can distinguish "no data yet" from "sync failed".
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
        // No backend configured: return an empty collection, never fabricated rows.
        return fallbackData;
      }

      const { data, error: queryError } = await apiCall();
      if (queryError) throw queryError;

      const mappedData = mapData(data || []);
      fetchCache[cacheKey] = { data: mappedData, timestamp: now };
      return mappedData;
    } catch (err) {
      setError(err?.message || 'Hydration failed');
      console.warn(`[ HYDRATION ] ${cacheKey} unavailable.`, err?.message);
      // Serve the last good snapshot if we have one; otherwise an empty collection.
      return fetchCache[cacheKey].data || fallbackData;
    } finally {
      setLoading(false);
    }
  };

  const fetchLiveLedger = useCallback(async () => {
    return safeFetch(
      'ledger',
      () => supabase.from('ledger').select('*').order('executed_at', { ascending: false }),
      (data) => data.map(mapLedgerRow),
      []
    );
  }, []);

  const fetchActiveEvents = useCallback(async () => {
    return safeFetch(
      'events',
      () => supabase.from('events').select('*').eq('is_active', true).order('scheduled_at', { ascending: true }),
      (data) => data.map(mapEventRow),
      []
    );
  }, []);

  const fetchActiveProposals = useCallback(async () => {
    return safeFetch(
      'proposals',
      () => supabase.from('proposals').select('*').order('created_at', { ascending: false }),
      (data) => data.map(mapProposalRow),
      []
    );
  }, []);

  const fetchPolicyConsensus = useCallback(async () => {
    return safeFetch(
      'policyConsensus',
      () => supabase.from('policy_consensus').select('*').order('policy_code', { ascending: true }),
      (data) =>
        data.reduce((acc, item) => {
          acc[item.policy_code] = item.consensus_score;
          return acc;
        }, {}),
      {}
    );
  }, []);

  const fetchArmoryInventory = useCallback(async () => {
    return safeFetch(
      'armoryInventory',
      () => supabase.from('armory_inventory').select('*').eq('is_active', true),
      (data) => data.map(mapInventoryRow),
      []
    );
  }, []);

  const fetchSecureTransmissions = useCallback(async () => {
    return safeFetch(
      'secureTransmissions',
      () => supabase.from('transmissions').select('*').order('published_at', { ascending: false }),
      (data) => data.map(mapTransmissionRow),
      []
    );
  }, []);

  const fetchIntelligenceFeeds = useCallback(async () => {
    // Editorial content comes from headless WordPress, not Supabase.
    return [];
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
    error
  };
};

export default useAXiMHydration;
