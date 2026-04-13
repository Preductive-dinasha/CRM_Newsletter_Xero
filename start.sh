#!/bin/bash
PORT=8000 python backend/run.py &
FLASK_PID=$!
echo "Flask started on port 8000 (PID: $FLASK_PID)"

sleep 2

cd frontend && npm run dev
