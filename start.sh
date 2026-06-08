#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS_FILE="$ROOT/.solar.pids"
LOGS_DIR="$ROOT/.logs"

# ── Guard against double-start ────────────────────────────────────────────────
if [[ -f "$PIDS_FILE" ]]; then
  echo "Services appear to already be running. Run ./stop.sh first."
  exit 1
fi

mkdir -p "$LOGS_DIR"

# ── Helper: start a named service in background ───────────────────────────────
start_service() {
  local name="$1"
  local log="$LOGS_DIR/$name.log"
  shift

  echo "  Starting $name..."
  "$@" > "$log" 2>&1 &
  local pid=$!
  echo "$name:$pid" >> "$PIDS_FILE"
  echo "    PID $pid  →  $log"
}

echo ""
echo "Starting Solar Service Manager (dev)"
echo "────────────────────────────────────"

# API server — builds then starts; allow ~30 s for the build step
start_service "api" \
  pnpm --dir "$ROOT" --filter @workspace/api-server run dev

# Admin dashboard
start_service "admin-dashboard" \
  pnpm --dir "$ROOT" --filter @workspace/admin-dashboard run dev

# Customer website
start_service "customer-website" \
  pnpm --dir "$ROOT" --filter @workspace/customer-website run dev

echo ""
echo "All services started."
echo ""
echo "  API server        →  http://localhost:3000"
echo "  Admin dashboard   →  http://localhost:6789"
echo "  Customer website  →  http://localhost:5174"
echo ""
echo "  Logs:  $LOGS_DIR/"
echo "  Stop:  ./stop.sh"
echo ""
echo "Note: The API server builds before starting (~10–20 s). Watch progress with:"
echo "  tail -f $LOGS_DIR/api.log"
echo ""
