import apiClient from './apiClient';
import { ApiResponse, ResilienceFactor } from '@/src/types/transactions';

export const getResilienceFactors = async (userId: number): Promise<ResilienceFactor[]> => {
  const response = await apiClient.get<ApiResponse<ResilienceFactor[]>>(`ms-transactions/v1/users/${userId}/transactions/resilience-factors`);
  if (response.data.ok) {
    return response.data.data;
  }
  throw new Error('Error al obtener los factores de resiliencia');
};
