# gunicorn_config.py
import multiprocessing
import os

# ===== REDE =====
# Escuta em todas as interfaces na porta 5000
# No Termux, use 0.0.0.0 para permitir acesso via Wi-Fi local
bind = "0.0.0.0:5000"

# ===== WORKERS =====
# Temporariamente usando 1 worker para evitar dessincronização de links compartilhados
# TODO: Migrar para banco de dados SQLite para suportar múltiplos workers
workers = 1

# Tipo de worker (sync é o mais estável para Android/Termux)
worker_class = 'sync'

# Tempo máximo de execução de uma requisição (segundos)
# Aumentado para suportar uploads grandes e downloads em ZIP
timeout = 300

# ===== SEGURANÇA =====
# Limita o tamanho do corpo da requisição (500MB conforme config.py)
limit_request_line = 4094
limit_request_fields = 100
limit_request_field_size = 8190

# Previne vazamento de informações do servidor
server = "CloudStorageApp/1.0"

# ===== LOGS =====
# Logs de acesso e erro
# Em modo daemon, precisamos escrever em arquivos
import os
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
accesslog = os.path.join(ROOT_DIR, "instance", "gunicorn_access.log")
errorlog = os.path.join(ROOT_DIR, "instance", "gunicorn_error.log")
loglevel = "info"

# ===== PROXY REVERSO =====
# Necessário se usar Cloudflare Tunnel ou Nginx na frente
# Aceita headers X-Forwarded-* de qualquer IP (Cloudflare usa IPs variados)
forwarded_allow_ips = '*'
proxy_allow_ips = '*'

# ===== KEEP-ALIVE =====
# Mantém conexões abertas para melhor performance com o Cloudflare
keepalive = 5

# ===== DAEMON =====
# Modo daemon: desabilitar captura de stdout/stderr quando necessário
capture_output = True  # Captura logs mesmo em daemon mode
daemon = False  # Não daemoniza por padrão - o script start.sh controla isso
