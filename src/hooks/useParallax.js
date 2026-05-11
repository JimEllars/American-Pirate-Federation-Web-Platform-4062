import { useEffect, useState } from 'react';

/**
 * Throttle requestAnimationFrame wrapper for performant parallax
 */
export function useParallax() {
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    let ticking = false;
    let lastKnownScrollPosition = 0;

    const updatePosition = () => {
      setOffset(lastKnownScrollPosition * 0.5); // Adjust multiplier for effect depth
      ticking = false;
    };

    const handleScroll = () => {
      lastKnownScrollPosition = window.scrollY;
      if (!ticking) {
        window.requestAnimationFrame(updatePosition);
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return offset;
}