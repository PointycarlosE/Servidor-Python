#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

mkdir -p instance

if [ ! -f "instance/.env" ]; then
  echo "Arquivo instance/.env não encontrado. Execute python run.py e conclua o setup primeiro."
  exit 1
fi

if [ -x ".venv/bin/gunicorn" ]; then
  GUNICORN_CMD=".venv/bin/gunicorn"
elif command -v gunicorn >/dev/null 2>&1; then
  GUNICORN_CMD="gunicorn"
else
  echo "Gunicorn não encontrado. Ative o venv e rode: pip install -r requirements.txt"
  exit 1
fi

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared não encontrado. Instale o Cloudflare Tunnel antes de iniciar em produção."
  exit 1
fi

if [ -f "instance/gunicorn.pid" ] && kill -0 "$(cat instance/gunicorn.pid)" 2>/dev/null; then
  echo "Gunicorn já está rodando com PID $(cat instance/gunicorn.pid)."
else
  "$GUNICORN_CMD" -c app/gunicorn_config.py "app:app" \
    --pid instance/gunicorn.pid \
    --daemon
  echo "Gunicorn iniciado."
fi

if [ -f "instance/cloudflared.pid" ] && kill -0 "$(cat instance/cloudflared.pid)" 2>/dev/null; then
  echo "Cloudflare Tunnel já está rodando com PID $(cat instance/cloudflared.pid)."
else
  nohup cloudflared tunnel --url http://localhost:5000 \
    > instance/cloudflared.log 2>&1 &
  echo "$!" > instance/cloudflared.pid
  echo "Cloudflare Tunnel iniciado."
fi

echo "Aguardando URL pública..."
for _ in $(seq 1 30); do
  if grep -Eo "https://[-a-zA-Z0-9.]+trycloudflare.com" instance/cloudflared.log | tail -n 1; then
    exit 0
  fi
  sleep 1
done

echo "Serviços iniciados. Rode bash url.sh para consultar a URL quando ela aparecer."
