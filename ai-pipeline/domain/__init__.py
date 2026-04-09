"""Pipeline domain layer — modelos Pydantic + lógica de negocio pura.

Los módulos de esta capa no deben importar FastAPI, boto3, ni ninguna dependencia
de infraestructura directamente. Reciben clientes/adapters como parámetros cuando
necesitan llegar a un servicio externo.
"""
