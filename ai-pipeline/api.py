from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import sys
import os
import json

# Asegurar que el modulo local pipeline este disponible (lo esta ya sea localmente o en Docker)
from pipeline.bedrock import get_bedrock_client, _invoke_with_retry, MODEL_SONNET

app = FastAPI(title="Finexa AI Pipeline Test API")

@app.get("/")
def health_check():
    return {"status": "ok", "service": "ai-pipeline"}

@app.post("/test-bedrock")
async def test_bedrock():
    """
    Very simple test point to check if we can reach Bedrock.
    "Hi Claude" -> Response
    """
    try:
        body = {
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 10000,
            "temperature": 0.5,
            "messages": [{"role": "user", "content": "Hi Claude! Please answer with a short greeting message that confirms you are running inside AWS Bedrock."}]
        }
        
        result = await _invoke_with_retry(body, MODEL_SONNET)
        
        text = ""
        for block in result.get("content", []):
            if block.get("type") == "text":
                text += block["text"]
                
        return {"status": "success", "message": text}
    except Exception as e:
        print(f"Error calling Bedrock: {e}")
        raise HTTPException(status_code=500, detail=str(e))
