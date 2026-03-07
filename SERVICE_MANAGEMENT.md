# Service Management Scripts

## Quick Start

### Start All Services
```bash
./start-all-services.sh
```

### Stop All Services
```bash
./stop-all-services.sh
```

## Service URLs

| Service | URL | Port |
|---------|-----|------|
| Business Compass (Main Dashboard) | http://localhost:3000 | 3000 |
| Weekly Sales Client | http://localhost:3001 | 3001 |
| Unified Landing Frontend | http://localhost:3002 | 3002 |
| Weekly Sales Server API | http://localhost:5000 | 5000 |
| FastAPI Backend | http://localhost:8000 | 8000 |
| FastAPI Docs (Swagger) | http://localhost:8000/docs | 8000 |
| Unified Landing Backend | http://localhost:8080 | 8080 |

## Logs

All service logs are stored in the `logs/` directory:
- `business-compass.log` - Business Compass (Next.js)
- `weekly-sales-client.log` - Weekly Sales React Client
- `weekly-sales-server.log` - Weekly Sales Express Server
- `fastapi.log` - FastAPI Backend
- `unified-frontend.log` - Unified Landing Frontend
- `unified-backend.log` - Unified Landing Backend

### View Logs

```bash
# View all logs in real-time
tail -f logs/*.log

# View specific service log
tail -f logs/business-compass.log
```

## Manual Service Management

### Start Individual Services

```bash
# Business Compass (Next.js)
cd Business-Compass-main && npm run dev

# Weekly Sales Server
cd Weekly-Sales-MERN-main/server && npm run dev

# Weekly Sales Client (on port 3001)
cd Weekly-Sales-MERN-main/client && PORT=3001 npm start

# FastAPI Backend
cd fastapi-backend && source venv/bin/activate && uvicorn main:app --reload

# Unified Landing Backend
cd Unified-Landing-Page/backend && npm run dev

# Unified Landing Frontend (on port 3002)
cd Unified-Landing-Page/frontend && PORT=3002 npm start
```

### Stop Individual Services

```bash
# Kill service on specific port
lsof -ti:3000 | xargs kill -9  # Business Compass
lsof -ti:3001 | xargs kill -9  # Weekly Sales Client
lsof -ti:3002 | xargs kill -9  # Unified Landing Frontend
lsof -ti:5000 | xargs kill -9  # Weekly Sales Server
lsof -ti:8000 | xargs kill -9  # FastAPI Backend
lsof -ti:8080 | xargs kill -9  # Unified Landing Backend
```

## Troubleshooting

### Port Already in Use

If a port is already in use, the start script will automatically kill the existing process. You can also manually check:

```bash
# Check what's running on a port
lsof -i :3000

# Kill process on port
lsof -ti:3000 | xargs kill -9
```

### Service Not Starting

1. Check the logs in `logs/` directory
2. Make sure dependencies are installed (script does this automatically)
3. Verify no port conflicts
4. Check if you have required runtime environments:
   - Node.js (v14+)
   - Python 3 (for FastAPI)

### Clear All Caches

```bash
# Clear npm cache
npm cache clean --force

# Clear Python cache
find . -type d -name "__pycache__" -exec rm -r {} +

# Clear Next.js cache
rm -rf Business-Compass-main/.next
```

## Development Tips

### Watch Mode
All services are started in development/watch mode and will automatically reload on file changes.

### Environment Variables
- Services use default ports unless overridden
- Check individual service directories for `.env` files
- The start script sets custom ports for React apps to avoid conflicts

### Health Checks
```bash
# Quick health check for all services
curl http://localhost:3000  # Business Compass
curl http://localhost:3001  # Weekly Sales Client
curl http://localhost:3002  # Unified Landing Frontend
curl http://localhost:8080/health  # Unified Backend
```

## Notes

- **Port Conflicts**: Business Compass and Weekly Sales Client both default to port 3000, so Weekly Sales Client is configured to run on 3001
- **Unified Frontend**: Runs on port 3002 to avoid conflicts
- **Background Processes**: Services run in background with logs piped to files
- **Ctrl+C**: Pressing Ctrl+C in the start script terminal will stop all services
