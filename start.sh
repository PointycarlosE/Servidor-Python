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
  # Inicia Gunicorn com nohup em vez de --daemon para melhor confiabilidade
  nohup "$GUNICORN_CMD" -c app/gunicorn_config.py "run:app" \
    > instance/gunicorn.stdout.log 2>&1 &
  echo "$!" > instance/gunicorn.pid
  echo "Gunicorn iniciado com PID $!."

  # Verifica se iniciou corretamente
  sleep 2
  if ! kill -0 "$(cat instance/gunicorn.pid)" 2>/dev/null; then
    echo "ERRO: Gunicorn falhou ao iniciar. Verifique instance/gunicorn.stdout.log"
    exit 1
  fi

  # Testa se está aceitando conexões
  if ! curl -s http://localhost:5000/ >/dev/null 2>&1; then
    echo "AVISO: Gunicorn iniciou mas não está respondendo na porta 5000"
  else
    echo "Gunicorn está respondendo corretamente na porta 5000."
  fi
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
