import { useState, useEffect } from 'react';
import { getResilienceFactors } from '@/src/services/api/transactions';
import { ResilienceFactor } from '@/src/types/transactions';
import { getInternalUserIdFromSession } from '@/src/services/api/users/usersService';

export function useResilienceFactors() {
  const [factors, setFactors] = useState<ResilienceFactor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchFactors() {
      try {
        setLoading(true);
        //const userId = await getInternalUserIdFromSession();
        const userId = 123;
        const data = await getResilienceFactors(userId);
        setFactors(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    }
    fetchFactors();
  }, []);

  return { factors, loading, error };
}
