"""
Finexa AI — Pipeline de clasificación financiera con Amazon Bedrock.

Módulos:
    schemas     — Modelos Pydantic (entrada Plaid, salida Bedrock, UserProfile, ResilienceScore)
    bedrock     — Cliente boto3 bedrock-runtime con retries/timeouts
    cache       — Caché de clasificaciones por merchant
    heuristics  — Reglas heurísticas de fallback
    classifier  — Paso A: Clasificación JSON→JSON vía Bedrock
    analyzer    — Paso B: Análisis holístico de comportamiento
    resilience  — Paso C: Score de Resiliencia Financiera (RF1+RF2 El Escudo)
    logger      — Logging estructurado JSON para CloudWatch
    handler     — Lambda handler / orquestador del pipeline
"""
