/**
 * StudySync — useDebounce.js
 * CO5: Custom React Hook using useState + useEffect
 * Used by Notes component for auto-save throttling
 */
import { useState, useEffect } from 'react';

export function useDebounce(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
