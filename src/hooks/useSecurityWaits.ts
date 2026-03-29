import { useCallback } from 'react';
import { useFlightStore } from '../store/flightStore';
import { fetchSecurityWaits } from '../services/myTSA';

export function useSecurityWaits() {
  const { setup, setSecurityWaits, setLoadingSecurity } = useFlightStore();

  const refresh = useCallback(async () => {
    if (!setup.airport) return;
    setLoadingSecurity(true);
    try {
      const waits = await fetchSecurityWaits(setup.airport);
      setSecurityWaits(waits);
    } catch {
      // silent failure — keep stale data
    } finally {
      setLoadingSecurity(false);
    }
  }, [setup.airport, setSecurityWaits, setLoadingSecurity]);

  return { refresh };
}
