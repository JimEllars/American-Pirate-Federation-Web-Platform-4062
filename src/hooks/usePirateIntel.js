import { useState, useEffect } from 'react';

/**
 * The Ingestion Engine
 * Fetches data from intel subdomain with isMounted failsafe
 */
export function usePirateIntel(endpoint = 'posts?_embed') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    setError(null);

    const fetchIntel = async () => {
      try {
        const response = await fetch(`https://intel.piratefederation.org/wp-json/wp/v2/${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        
        if (isMounted) {
          setData(result);
          setLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unknown network error');
          setLoading(false);
        }
      }
    };

    fetchIntel();

    return () => {
      isMounted = false; // Prevent memory leaks and state updates on unmounted component
    };
  }, [endpoint]);

  return { data, loading, error };
}