@echo off
echo Starting Cerebro Services...

echo 1. Starting Docker (Database and Redis)...
call docker compose up -d

echo 2. Starting API Server...
start "Cerebro API" cmd /k "pnpm dev:api"

echo 3. Starting Background Worker...
start "Cerebro Worker" cmd /k "pnpm dev:worker"

echo 4. Starting Ngrok Tunnel...
start "Ngrok Tunnel" cmd /k "ngrok http 3000"

echo All services launched!
echo Note: Ngrok has opened in a new window. Copy the new https://... URL and update it in Vercel if it changed!
pause
