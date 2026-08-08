import { useState, useEffect } from 'react';

/**
 * Headless WordPress API client
 */
export function useWPContent(endpoint = 'posts?_embed&per_page=3') {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    setIsLoading(true);
    setError(null);

    const fetchIntel = async () => {
      try {
        const response = await fetch(`https://intel.piratefederation.org/wp-json/wp/v2/${endpoint}`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (isMounted) {
          setData(result);
          setIsLoading(false);
        }
      } catch (err) {
        if (isMounted) {
          setError(err.message || 'Unknown network error');
          setIsLoading(false);
        }
      }
    };

    fetchIntel();

    return () => {
      isMounted = false;
    };
  }, [endpoint]);

  return { data, isLoading, error };
}
