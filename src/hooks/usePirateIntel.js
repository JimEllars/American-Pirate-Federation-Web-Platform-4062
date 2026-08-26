import { useState, useEffect } from 'react';

/**
 * The Ingestion Engine
 * Fetches data from intel subdomain with isMounted failsafe and SWR caching
 */
export function usePirateIntel(endpoint = 'posts?_embed') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    const CACHE_KEY = `apf_wp_${endpoint}`;

    // Check cache
    const cached = localStorage.getItem(CACHE_KEY);
    if (cached) {
      try {
        const parsed = JSON.parse(cached);
        // 10 minutes cache TTL
        if (Date.now() - parsed.timestamp < 600000) {
          setData(parsed.data);
          setLoading(false);
        }
      } catch (e) {
        // Cache parse error, ignore
      }
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const fetchIntel = async () => {
      try {
        const rawWpUrl = import.meta.env.VITE_WP_API_URL || 'https://piratefederation.org/wp-json';
        const cleanBaseUrl = rawWpUrl.replace(/\/+$/, '');
        const requestUrl = `${cleanBaseUrl}/wp/v2/${endpoint}`;

        const response = await fetch(requestUrl, { signal: controller.signal });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (isMounted) {
          setData(result);
          localStorage.setItem(CACHE_KEY, JSON.stringify({ timestamp: Date.now(), data: result }));
          setLoading(false);
          setError(null);
        }
      } catch (err) {
        if (isMounted) {
          // If we have cache, suppress error
          if (!localStorage.getItem(CACHE_KEY)) {
            setData([]); // gracefully degrade to empty array instead of null
            setError(err.message || 'Unknown network error');
          }
          setLoading(false);
        }
      } finally {
        clearTimeout(timeoutId);
      }
    };

    fetchIntel();

    return () => {
      isMounted = false; // Prevent memory leaks and state updates on unmounted component
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, [endpoint]);

  return { data, loading, error };
}
