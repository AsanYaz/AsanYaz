from fastapi import FastAPI, HTTPException, BackgroundTasks
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import uvicorn
from document_generator import DocumentGenerator
import os
import uuid

app = FastAPI(title="AsanYaz Document Service")

class DocumentSection(BaseModel):
    heading: str
    level: int
    content: str

class Reference(BaseModel):
    author: str
    title: str
    year: int
    source: str
    url: Optional[str] = None
    doi: Optional[str] = None
    verified: bool = False

class GeneratedContent(BaseModel):
    title: str
    sections: List[DocumentSection] = []
    references: List[Reference] = []
    abstract: Optional[str] = None
    raw_text: Optional[str] = None

class DocumentGenerationRequest(BaseModel):
    orderId: str
    content: str | GeneratedContent
    template: Dict[str, Any]
    metadata: Dict[str, Any]

@app.post("/generate")
async def generate_document(request: DocumentGenerationRequest, background_tasks: BackgroundTasks):
    try:
        generator = DocumentGenerator(request.metadata, request.template)
        
        # Determine if content is structured or raw text
        if isinstance(request.content, str):
            # Fallback for raw text
            files = generator.generate_from_text(request.orderId, request.content)
        else:
            # Structured generation (not fully implemented in MVP, fallback to text)
            files = generator.generate_from_text(request.orderId, request.content.raw_text or str(request.content))
            
        return {"success": True, "files": files}
    except Exception as e:
        print(f"Error generating document: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
