# FastAPI Backend for Business Compass

## Installation

```bash
pip install -r requirements.txt
```

## Running the server

```bash
python main.py
```

Or with uvicorn directly:

```bash
uvicorn main:app --reload --port 8000
```

## Endpoints

- `GET /` - Root endpoint
- `GET /api/health` - Health check
- `POST /api/ingest/upload` - File upload endpoint
- `POST /api/analyse` - Data analysis endpoint
- `GET /api/forecast` - Forecast data endpoint

## Environment

- Port: 8000
- Host: 0.0.0.0 (accessible from all network interfaces)
