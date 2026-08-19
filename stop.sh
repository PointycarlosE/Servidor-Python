#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

stop_pid_file() {
  local name="$1"
  local pid_file="$2"

  if [ ! -f "$pid_file" ]; then
    echo "$name não estava rodando."
    return
  fi

  local pid
  pid="$(cat "$pid_file")"

  if kill -0 "$pid" 2>/dev/null; then
    kill "$pid"
    echo "$name parado."
  else
    echo "$name já estava parado."
  fi

  rm -f "$pid_file"
}

stop_pid_file "Cloudflare Tunnel" "instance/cloudflared.pid"
stop_pid_file "Gunicorn" "instance/gunicorn.pid"
