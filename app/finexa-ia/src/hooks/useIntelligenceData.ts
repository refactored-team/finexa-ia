import { useCallback, useEffect, useState } from 'react';
import {
  getInsights,
  getLatestAnalysis,
  getLatestCashFlow,
  getLatestPulse,
  getResilienceFactors,
} from '@/src/services/api/transactions';
import type {
  CashFlow,
  Insight,
  Pulse,
  ResilienceFactor,
  TransactionAnalysis,
} from '@/src/types/transactions';

type UseIntelligenceDataResult = {
  analysis: TransactionAnalysis | null;
  pulse: Pulse | null;
  cashFlow: CashFlow | null;
  resilienceFactors: ResilienceFactor[];
  insights: Insight[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
};

export function useIntelligenceData(): UseIntelligenceDataResult {
  const [analysis, setAnalysis] = useState<TransactionAnalysis | null>(null);
  const [pulse, setPulse] = useState<Pulse | null>(null);
  const [cashFlow, setCashFlow] = useState<CashFlow | null>(null);
  const [resilienceFactors, setResilienceFactors] = useState<ResilienceFactor[]>([]);
  const [insights, setInsights] = useState<Insight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const userId = 123;
      const [analysisData, pulseData, cashFlowData, resilienceData, insightsData] = await Promise.all([
        getLatestAnalysis(userId),
        getLatestPulse(userId),
        getLatestCashFlow(userId),
        getResilienceFactors(userId),
        getInsights(userId),
      ]);

      setAnalysis(analysisData);
      setPulse(pulseData);
      setCashFlow(cashFlowData);
      setResilienceFactors(resilienceData ?? []);
      setInsights(insightsData ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar datos de intelligence');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return {
    analysis,
    pulse,
    cashFlow,
    resilienceFactors,
    insights,
    loading,
    error,
    refetch,
  };
}
