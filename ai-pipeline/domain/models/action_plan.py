"""Action plan schemas — Step E: insight-specific step-by-step guide."""

from __future__ import annotations

from typing import Literal, Optional

from pydantic import BaseModel, Field


class ActionStep(BaseModel):
    """Un paso concreto del plan de accion."""

    numero: int = Field(..., ge=1, le=4, description="Posicion del paso en la secuencia (1-4).")
    titulo: str = Field(
        ...,
        max_length=100,
        description="Encabezado corto del paso. Empieza con verbo imperativo. Sin markdown.",
    )
    instruccion: str = Field(
        ...,
        max_length=500,
        description=(
            "Instruccion detallada: que hacer exactamente, donde, que boton presionar, "
            "que decir al servicio al cliente, etc. Sin markdown."
        ),
    )
    tipo: Literal["cancelar", "configurar", "habito", "revisar", "contactar", "otro"] = Field(
        ...,
        description=(
            "Naturaleza del paso:\n"
            "- `cancelar`: dar de baja un servicio online.\n"
            "- `configurar`: ajustar un setting, activar ahorro automatico, etc.\n"
            "- `habito`: cambio de comportamiento (llevar cafe, cocinar, etc.).\n"
            "- `revisar`: auditar algo antes de actuar (ver suscripciones, revisar recibos).\n"
            "- `contactar`: llamar, chatear o ir fisicamente a resolver algo.\n"
            "- `otro`: cualquier otro tipo de paso."
        ),
    )
    url: Optional[str] = Field(
        default=None,
        max_length=400,
        description=(
            "URL directa donde se ejecuta este paso (panel de cancelacion, configuracion de cuenta, etc.). "
            "Solo cuando el paso se realiza 100% online. Ejemplo: https://www.netflix.com/youraccount"
        ),
    )
    duracion_minutos: Optional[int] = Field(
        default=None,
        ge=1,
        le=120,
        description="Tiempo estimado para completar este paso en minutos.",
    )


class InsightActionPlan(BaseModel):
    """Plan de accion estructurado con 2-4 pasos para resolver un insight especifico."""

    insight_titulo: str = Field(
        ...,
        max_length=80,
        description="Titulo del insight de origen (reproducido para contexto de la UI).",
    )
    objetivo: str = Field(
        ...,
        max_length=300,
        description=(
            "Una sola frase que describe el resultado concreto al completar el plan. "
            "Ej: 'Cancelar tu suscripcion a Netflix y liberar $179 al mes.'"
        ),
    )
    pasos: list[ActionStep] = Field(
        ...,
        min_length=2,
        max_length=4,
        description="Secuencia ordenada de 2 a 4 pasos. El orden importa: debe seguirse en secuencia.",
    )
    ahorro_mensual_estimado: float = Field(
        default=0.0,
        ge=0.0,
        description="Ahorro mensual esperado en MXN al completar el plan. 0 si no aplica.",
    )
    tiempo_total_minutos: int = Field(
        ...,
        ge=1,
        le=480,
        description="Suma estimada de todos los pasos en minutos.",
    )
    es_accion_inmediata: bool = Field(
        default=False,
        description=(
            "True cuando todos los pasos se pueden completar online ahora mismo. "
            "Permite a la UI mostrar un CTA directo."
        ),
    )
    nota_final: Optional[str] = Field(
        default=None,
        max_length=300,
        description=(
            "Mensaje de cierre opcional: que pasara despues (ej. 'Tu acceso sigue activo "
            "hasta el fin del ciclo de pago'), o un refuerzo positivo concreto."
        ),
    )
