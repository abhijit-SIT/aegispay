#!/usr/bin/env bash
# AegisPay Startup Script
cd "$(dirname "$0")" || exit 1

# Automatically free port 8080 if an old instance is running
EXISTING_PID=$(lsof -ti :8080 2>/dev/null)
if [ -n "$EXISTING_PID" ]; then
  echo "Clearing existing process on port 8080 (PID: $EXISTING_PID)..."
  kill -9 $EXISTING_PID 2>/dev/null
  sleep 0.5
fi

echo "=========================================================="
echo "  🛡️  Launching AegisPay: Autonomous Agentic Commerce OS"
echo "  PayPal Sandbox & AI Policy Enclave"
echo "=========================================================="
echo "Serving live at http://localhost:8080"
python3 server.py 8080
