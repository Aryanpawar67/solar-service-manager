#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PIDS_FILE="$ROOT/.solar.pids"

if [[ ! -f "$PIDS_FILE" ]]; then
  echo "No running services found (no .solar.pids file)."
  exit 0
fi

echo ""
echo "Stopping Solar Service Manager"
echo "──────────────────────────────"

# Kill a process and all its children
kill_tree() {
  local pid="$1"
  # Kill direct children first
  pkill -TERM -P "$pid" 2>/dev/null || true
  # Kill the process itself
  kill -TERM "$pid" 2>/dev/null || true
  # Give it 3 s, then force-kill any survivors
  sleep 3
  pkill -KILL -P "$pid" 2>/dev/null || true
  kill -KILL "$pid" 2>/dev/null || true
}

while IFS=: read -r name pid; do
  if kill -0 "$pid" 2>/dev/null; then
    echo "  Stopping $name (PID $pid)..."
    kill_tree "$pid"
    echo "    Stopped."
  else
    echo "  $name (PID $pid) was already stopped."
  fi
done < "$PIDS_FILE"

rm -f "$PIDS_FILE"

echo ""
echo "All services stopped."
echo ""
