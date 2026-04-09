"""
Finexa AI Pipeline — financial transaction classification & analysis.

Layered architecture:

    api/            FastAPI app, routes, request/response models
    services/       Orchestration — composes domain modules for the API
    domain/         Pure business logic (classifier, analyzer, resilience, forecaster, …)
    infrastructure/ External integrations (Bedrock, cache, prompts)
    core/           Cross-cutting utilities (config, logging)
    adapters/       Platform entry points (AWS Lambda)
    main.py         FastAPI entry point (uvicorn target)
"""
