/**
 * Maps API insight rows (no steps) into the cancelling-process shape with hackathon mock steps.
 */

export type CancellationInsightPayload = {
  id: number;
  title?: string | null;
  description?: string | null;
  priority?: string | null;
  potential_monthly_saving?: number | null;
  affected_category?: string | null;
  updated_at?: string | null;
};

export type CancellationStepDTO = {
  id: string;
  title: string;
  description: string;
  action_label: string;
  action_url?: string;
};

export type CancellationFindingDTO = {
  id: string;
  title: string;
  icon: string;
  service_name: string;
  amount: number;
  steps: CancellationStepDTO[];
  screenTitle?: string;
  savingsMetaLine?: string;
  serviceIconBg?: string;
};

type StepSeed = { title: string; description: string; action_label: string; action_url?: string };

function stepsFromSeeds(seeds: StepSeed[]): CancellationStepDTO[] {
  return seeds.map((s, i) => ({
    id: `s${i + 1}`,
    ...s,
  }));
}

const GROCERY_STEPS: StepSeed[] = [
  {
    title: 'Lista semanal',
    description: 'Antes del súper, anota solo lo necesario y evita ir con hambre.',
    action_label: 'Anotar en calendario',
  },
  {
    title: 'Espera 72 h',
    description: 'Para compras no esenciales, espera tres días; muchas veces ya no las querrás.',
    action_label: 'Activar recordatorio',
  },
  {
    title: 'Cocinar en casa 4×/semana',
    description: 'Reserva noches fijas; reutiliza ingredientes del mismo mandado.',
    action_label: 'Ver recetas',
  },
  {
    title: 'Regla del carrito',
    description: 'Si no estaba en la lista, déjalo 24 h en el carrito online antes de pagar.',
    action_label: 'Aplicar regla',
  },
];

const DINING_STEPS: StepSeed[] = [
  {
    title: 'Máx. 1 salida por semana',
    description: 'Elige un día fijo para salir; el resto, comida en casa.',
    action_label: 'Definir día',
  },
  {
    title: 'Cenar con lo del súper',
    description: 'Planea cenas que usen lo que ya compraste; reduce pedidos espontáneos.',
    action_label: 'Plan semanal',
  },
  {
    title: 'Lunch la noche anterior',
    description: 'Preparar de noche evita comprar comida en la oficina al rush.',
    action_label: 'Preparar lunch',
  },
  {
    title: 'Desayuno en casa 5 días',
    description: 'Levantarte 10 min antes puede cubrir café y pan en casa toda la semana.',
    action_label: 'Probar una semana',
  },
];

const SUBSCRIPTION_STEPS: StepSeed[] = [
  {
    title: 'Revisar cargos',
    description: 'Abre la app o web del proveedor y confirma el monto y la fecha de renovación.',
    action_label: 'Ir a suscripciones',
  },
  {
    title: 'Pausar o bajar plan',
    description: 'Muchos servicios permiten pausa temporal o plan más barato antes de cancelar.',
    action_label: 'Ver opciones',
  },
  {
    title: 'Confirmar baja',
    description: 'Cancela desde configuración y guarda el comprobante por correo.',
    action_label: 'Confirmar',
  },
];

const DEFAULT_STEPS: StepSeed[] = [
  {
    title: 'Entender el patrón',
    description: 'Revisa en qué días o situaciones sube este gasto para atacar la causa.',
    action_label: 'Revisar movimientos',
  },
  {
    title: 'Una meta pequeña',
    description: 'Baja un 10–15 % el próximo mes; es más sostenible que un corte drástico.',
    action_label: 'Fijar meta',
  },
  {
    title: 'Automatizar o bloquear',
    description: 'Alertas de presupuesto o tope en tarjeta te avisan antes de pasarte.',
    action_label: 'Configurar alerta',
  },
  {
    title: 'Revisión en 30 días',
    description: 'Vuelve a medir; ajusta el plan según lo que funcionó.',
    action_label: 'Agendar revisión',
  },
];

function templateKey(insight: CancellationInsightPayload): 'groceries' | 'dining' | 'subscription' | 'default' {
  const cat = (insight.affected_category || '').toLowerCase();
  const title = (insight.title || '').toLowerCase();
  const desc = (insight.description || '').toLowerCase();
  const blob = `${cat} ${title} ${desc}`;

  if (
    /grocer|grocery|hormiga|compras|súper|super|food|aliment|mandado|abarrotes/.test(blob)
  ) {
    return 'groceries';
  }
  if (/dining|restaurant|restaur|cena|fuera|eats|delivery|domicilio|uber\s*eats/.test(blob)) {
    return 'dining';
  }
  if (/subscrip|suscrip|netflix|spotify|hbo|prime|premium/.test(blob) || cat.includes('suscripcion')) {
    return 'subscription';
  }
  return 'default';
}

function iconFor(template: ReturnType<typeof templateKey>): string {
  switch (template) {
    case 'groceries':
      return '🛒';
    case 'dining':
      return '🍽️';
    case 'subscription':
      return '📱';
    default:
      return '💡';
  }
}

export function mapInsightToCancellationFinding(insight: CancellationInsightPayload): CancellationFindingDTO {
  const template = templateKey(insight);
  const seeds =
    template === 'groceries'
      ? GROCERY_STEPS
      : template === 'dining'
        ? DINING_STEPS
        : template === 'subscription'
          ? SUBSCRIPTION_STEPS
          : DEFAULT_STEPS;

  const amount = Math.max(0, Math.round(insight.potential_monthly_saving ?? 0)) || 500;
  const headline = (insight.title || 'Hábito de gasto').trim();
  const serviceName = headline.slice(0, 80);
  const desc = (insight.description || '').trim();
  const steps = stepsFromSeeds(seeds);
  if (desc && steps[0]) {
    steps[0] = {
      ...steps[0],
      description: desc.length > 20 ? desc : `${steps[0].description} ${desc}`.trim(),
    };
  }

  const priorityLabel = insight.priority ? `Prioridad: ${insight.priority}` : 'Plan sugerido';

  return {
    id: String(insight.id),
    title: `Plan: ${headline}`,
    icon: iconFor(template),
    service_name: serviceName,
    amount,
    steps,
    screenTitle: 'Tu plan de acción',
    savingsMetaLine: `Ahorro mensual estimado: $${amount.toLocaleString('es-MX')} · ${priorityLabel}`,
    serviceIconBg: '#4F46E5',
  };
}
