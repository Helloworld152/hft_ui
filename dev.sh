#!/bin/bash

# 1. 精确杀死后台运行的特定命令
echo "Killing existing services..."
pkill -f "uvicorn app.main:app --host 0.0.0.0 --port 8866" || true
pkill -f "vite preview --host 0.0.0.0 --port 5173" || true
sleep 1

# 2. 启动后端
echo "Starting Backend..."
cd backend
source .venv/bin/activate
nohup uvicorn app.main:app --host 0.0.0.0 --port 8866 > ../backend.log 2>&1 &
cd ..

# 3. 构建并启动前端
echo "Starting Frontend..."
cd frontend
npm run build
nohup npx vite preview --host 0.0.0.0 --port 5173 > ../frontend.log 2>&1 &
cd ..

echo "Done. Services are running in background."