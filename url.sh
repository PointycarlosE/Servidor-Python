#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

LOG_FILE="instance/cloudflared.log"

if [ ! -f "$LOG_FILE" ]; then
  echo "Nenhum log do Cloudflare Tunnel encontrado. Rode bash start.sh primeiro."
  exit 1
fi

URL="$(grep -Eo "https://[-a-zA-Z0-9.]+trycloudflare.com" "$LOG_FILE" | tail -n 1 || true)"

if [ -z "$URL" ]; then
  echo "URL pública ainda não encontrada. Aguarde alguns segundos e tente novamente."
  exit 1
fi

echo "$URL"
