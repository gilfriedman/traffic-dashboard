#!/bin/bash

cleanup() {
  echo ""
  echo "Shutting down..."
  kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
  wait $BACKEND_PID $FRONTEND_PID 2>/dev/null
  echo "Done."
}
trap cleanup EXIT INT TERM

DIR="$(cd "$(dirname "$0")" && pwd)"

echo "Starting Flask backend on :5001..."
cd "$DIR" && .venv/bin/python -m server.app &
BACKEND_PID=$!

echo "Starting Vite frontend on :5173..."
cd "$DIR/client" && npm run dev &
FRONTEND_PID=$!

echo ""
echo "  Backend:  http://localhost:5001"
echo "  Frontend: http://localhost:5173"
echo "  Press Ctrl+C to stop both."
echo ""

wait
