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
        const rawWpUrl = import.meta.env.VITE_WP_API_URL || 'https://piratefederation.org/wp-json';
        const cleanBaseUrl = rawWpUrl.replace(/\/+$/, '');
        const requestUrl = `${cleanBaseUrl}/wp/v2/${endpoint}`;
        const response = await fetch(requestUrl);
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
