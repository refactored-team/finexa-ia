export interface ResilienceFactor {
  id: number;
  nombre: string;
  peso: number;
  score_raw: number;
  score_ponderado: number;
  descripcion: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}
