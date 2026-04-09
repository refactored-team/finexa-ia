import apiClient from './apiClient';
import type {
  ApiResponse,
  CashFlow,
  Insight,
  Pulse,
  ResilienceFactor,
  TransactionAnalysis,
} from '@/src/types/transactions';

function unwrapApiResponse<T>(response: ApiResponse<T>, errorMessage: string): T {
  if (!response.ok || response.data == null) {
    throw new Error(errorMessage);
  }
  return response.data;
}

export const getResilienceFactors = async (userId: number): Promise<ResilienceFactor[]> => {
  const response = await apiClient.get<ApiResponse<ResilienceFactor[]>>(`ms-transactions/v1/users/${userId}/transactions/resilience-factors`);
  return unwrapApiResponse(response.data, 'Error al obtener los factores de resiliencia');
};

export const getLatestAnalysis = async (userId: number): Promise<TransactionAnalysis> => {
  const response = await apiClient.get<ApiResponse<TransactionAnalysis>>(`ms-transactions/v1/users/${userId}/transactions/analysis/latest`);
  return unwrapApiResponse(response.data, 'Error al obtener el análisis');
};

export const getInsights = async (userId: number): Promise<Insight[]> => {
  const response = await apiClient.get<ApiResponse<Insight[]>>(`ms-transactions/v1/users/${userId}/transactions/insights`);
  return unwrapApiResponse(response.data, 'Error al obtener los insights');
};

export const getLatestCashFlow = async (userId: number): Promise<CashFlow> => {
  const response = await apiClient.get<ApiResponse<CashFlow>>(`ms-transactions/v1/users/${userId}/transactions/cash-flow/latest`);
  return unwrapApiResponse(response.data, 'Error al obtener el cash flow');
};

export const getLatestPulse = async (userId: number): Promise<Pulse> => {
  const response = await apiClient.get<ApiResponse<Pulse>>(`ms-transactions/v1/users/${userId}/transactions/pulse/latest`);
  return unwrapApiResponse(response.data, 'Error al obtener el pulse');
};

