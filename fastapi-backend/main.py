from fastapi import FastAPI, File, UploadFile, HTTPException, Form
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn
from typing import Optional, List
import pandas as pd
import io
import json
import os

app = FastAPI(title="Business Compass Backend")

# CORS configuration - use environment variable in production
cors_origins = os.getenv("CORS_ORIGINS", "*")
if cors_origins != "*":
    cors_origins = [origin.strip() for origin in cors_origins.split(",")]
else:
    cors_origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"message": "Business Compass FastAPI Backend", "status": "running"}

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "business-compass-backend",
        "version": "1.0.0"
    }

@app.post("/api/ingest/upload")
async def ingest_upload(
    nsw: Optional[UploadFile] = File(None),
    qld: Optional[UploadFile] = File(None),
    wa: Optional[UploadFile] = File(None),
    combined: Optional[UploadFile] = File(None),
    historical: Optional[UploadFile] = File(None)
):
    """
    Ingest file upload endpoint for Business Compass
    Accepts either separate branch files or a combined file
    """
    try:
        print("=== FastAPI Ingest Upload ===")
        
        result = {
            "success": True,
            "message": "Files processed successfully",
            "data": {}
        }
        
        # Process combined file if provided
        if combined:
            print(f"Processing combined file: {combined.filename}")
            content = await combined.read()
            
            # Determine file type and process
            if combined.filename.endswith('.csv'):
                df = pd.read_csv(io.BytesIO(content))
            elif combined.filename.endswith(('.xlsx', '.xls')):
                df = pd.read_excel(io.BytesIO(content))
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")
            
            result["data"]["combined"] = {
                "filename": combined.filename,
                "rows": len(df),
                "columns": list(df.columns),
                "preview": df.head(5).to_dict('records')
            }
        
        # Process separate branch files
        if nsw or qld or wa:
            print("Processing separate branch files")
            dfs = []
            
            if nsw:
                content = await nsw.read()
                df_nsw = pd.read_csv(io.BytesIO(content))
                df_nsw['Branch'] = 'NSW'
                dfs.append(df_nsw)
                print(f"NSW: {len(df_nsw)} rows")
            
            if qld:
                content = await qld.read()
                df_qld = pd.read_csv(io.BytesIO(content))
                df_qld['Branch'] = 'QLD'
                dfs.append(df_qld)
                print(f"QLD: {len(df_qld)} rows")
            
            if wa:
                content = await wa.read()
                df_wa = pd.read_csv(io.BytesIO(content))
                df_wa['Branch'] = 'WA'
                dfs.append(df_wa)
                print(f"WA: {len(df_wa)} rows")
            
            if dfs:
                combined_df = pd.concat(dfs, ignore_index=True)
                result["data"]["branches"] = {
                    "total_rows": len(combined_df),
                    "columns": list(combined_df.columns),
                    "preview": combined_df.head(5).to_dict('records')
                }
        
        # Process historical file if provided
        if historical:
            print(f"Processing historical file: {historical.filename}")
            content = await historical.read()
            
            if historical.filename.endswith(('.xlsx', '.xls')):
                df_hist = pd.read_excel(io.BytesIO(content))
                result["data"]["historical"] = {
                    "filename": historical.filename,
                    "rows": len(df_hist),
                    "columns": list(df_hist.columns),
                    "preview": df_hist.head(5).to_dict('records')
                }
        
        print("=== Upload Successful ===")
        return JSONResponse(content=result)
    
    except Exception as e:
        print(f"Error processing upload: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/analyse")
async def analyse_data(request_data: dict):
    """
    Analyze data endpoint
    This would contain your business logic for analysis
    """
    try:
        print("=== Analysis Request ===")
        print(f"Received config: {request_data}")
        
        # Mock analysis response
        # In production, implement actual analysis logic
        analysis_result = {
            "success": True,
            "analysis": {
                "summary": "Data analysis completed",
                "metrics": {
                    "total_records": 1000,
                    "branches": ["NSW", "QLD", "WA"],
                    "date_range": "2023-01-01 to 2024-12-31"
                }
            }
        }
        
        return JSONResponse(content=analysis_result)
    
    except Exception as e:
        print(f"Error in analysis: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/forecast")
async def get_forecast():
    """
    Get forecast data
    """
    try:
        # Mock forecast data
        forecast_data = {
            "success": True,
            "forecast": {
                "periods": 12,
                "model": "time-series",
                "predictions": []
            }
        }
        
        return JSONResponse(content=forecast_data)
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
