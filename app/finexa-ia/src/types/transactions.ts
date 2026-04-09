export interface ResilienceFactor {
  id: number;
  nombre: string;
  peso: number;
  score_raw: number;
  score_ponderado: number;
  descripcion: string;
  updated_at: string;
}

export interface TransactionAnalysis {
  ant_expense_total?: number;
  ant_expense_percentage?: number;
  risk_level?: string;
  summary?: string;
  updated_at: string;
}

export interface Insight {
  id: number;
  title?: string;
  description?: string;
  priority?: string;
  potential_monthly_saving?: number;
  affected_category?: string;
  updated_at: string;
}

export interface RecurringExpense {
  name: string;
  amount: number;
}

export interface ImpulseAlert {
  date: string;
  message: string;
}

export interface CashFlow {
  recurring_expenses?: RecurringExpense[];
  projected_liquidity?: number;
  impulse_alerts?: ImpulseAlert[];
  forecast_horizon_days?: number;
  updated_at: string;
}

export interface Pulse {
  reference_date?: string;
  presupuesto_libre_diario?: number;
  saldo_actual?: number;
  gasto_fijo_mensual?: number;
  gasto_variable_hoy?: number;
  gasto_promedio_diario?: number;
  dias_restantes_mes?: number;
  porcentaje_consumido_mes?: number;
  alerta?: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  ok: boolean;
  data: T;
}
