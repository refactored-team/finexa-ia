FROM python:3.11-slim

WORKDIR /app

# Instalar dependencias
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copiar el contexto (asumiendo que el build context es ai-pipeline/)
COPY . /app/pipeline/

# Exponer el puerto
EXPOSE 8000

# Punto de entrada para FastAPI
CMD ["uvicorn", "pipeline.main:app", "--host", "0.0.0.0", "--port", "8000"]
