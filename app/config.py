# app/config.py
import os
import secrets
from dotenv import load_dotenv

# ===== CAMINHOS =====
ROOT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ENV_PATH = os.path.join(ROOT_DIR, 'instance', '.env')
FIRST_RUN_FILE = os.path.join(ROOT_DIR, 'instance', '.firstrun')

# ===== CARREGAR .env =====
if os.path.exists(ENV_PATH):
    load_dotenv(ENV_PATH, override=True)

# ===== AMBIENTE =====
# Para ativar produção: defina FLASK_ENV=production no .env ou no ambiente
FLASK_ENV = os.environ.get('FLASK_ENV', 'development')
IS_PRODUCTION = FLASK_ENV == 'production'

# DEBUG nunca ativo em produção — independente do que estiver no .env
DEBUG = False if IS_PRODUCTION else os.environ.get('FLASK_DEBUG', 'true').lower() == 'true'

# ===== REDE =====
HOST = '0.0.0.0'
PORT = int(os.environ.get('PORT', 5000))

# ===== SEGURANÇA DE SESSÃO =====
SECRET_KEY = os.environ.get('SECRET_KEY')
if not SECRET_KEY:
    # Se não há SECRET_Key no .env, gera uma temporária e avisa
    SECRET_KEY = secrets.token_hex(32)
    if IS_PRODUCTION:
        # Em produção sem SECRET_KEY definida, isso é um erro grave
        raise RuntimeError(
            "SECRET_KEY não definida no .env! "
            "Execute: python -c \"import secrets; print(secrets.token_hex(32))\" "
            "e adicione ao .env como SECRET_KEY=<valor>"
        )

# Cookies de sessão
# Em produção com Cloudflare: Secure=False porque a conexão Cloudflare->Servidor é HTTP
# O Cloudflare faz a terminação SSL, então o Flask recebe HTTP mesmo quando o usuário acessa via HTTPS
# Mas o ProxyFix garante que request.is_secure seja True quando o cliente usou HTTPS
SESSION_COOKIE_SECURE = False  # Cloudflare já gerencia SSL
SESSION_COOKIE_HTTPONLY = True          # Bloqueia acesso via JavaScript
SESSION_COOKIE_SAMESITE = 'Lax'        # Proteção CSRF básica em nível de cookie

# Forçar HTTPS apenas se estiver em produção (evita erro de login no Wi-Fi local)
PREFERRED_URL_SCHEME = 'https' if IS_PRODUCTION else 'http'

# Tempo de sessão padrão (sem "lembrar-me"): 8 horas
PERMANENT_SESSION_LIFETIME = 8 * 60 * 60  # segundos

# ===== CREDENCIAIS =====
ADMIN_USERNAME = os.environ.get('ADMIN_USERNAME')
ADMIN_NOME = os.environ.get('ADMIN_NOME', ADMIN_USERNAME)
ADMIN_PASSWORD_HASH = os.environ.get('ADMIN_PASSWORD_HASH')
PASTA_BASE = os.environ.get('PASTA_BASE')

# ===== AUTENTICAÇÃO =====
REQUIRE_LOGIN = True  # Nunca desativar em produção

# ===== CONTROLE DE PRIMEIRA EXECUÇÃO =====
CONFIGURADO = (
    os.path.exists(FIRST_RUN_FILE)
    and bool(ADMIN_USERNAME)
    and bool(ADMIN_PASSWORD_HASH)
    and bool(PASTA_BASE)
)
IS_FIRST_RUN = not CONFIGURADO

# ===== LIMITES DE UPLOAD =====
MAX_UPLOAD_SIZE_MB = int(os.environ.get('MAX_UPLOAD_MB', 500))
MAX_CONTENT_LENGTH = MAX_UPLOAD_SIZE_MB * 1024 * 1024
MAX_FILE_SIZE_MB = int(os.environ.get('MAX_FILE_SIZE_MB', 100)) # Limite por arquivo individual

# ===== LIMITES DO ZIP =====
MAX_ZIP_FILES = int(os.environ.get('MAX_ZIP_FILES', 100))       # máx arquivos por ZIP
MAX_ZIP_SIZE_MB = int(os.environ.get('MAX_ZIP_SIZE_MB', 1024))  # máx 1GB por ZIP

# ===== RATE LIMITING =====
# Quantas requisições por minuto por IP em rotas normais
RATELIMIT_DEFAULT = os.environ.get('RATELIMIT_DEFAULT', '60 per minute')
# Limite específico para login (mais restritivo)
RATELIMIT_LOGIN = os.environ.get('RATELIMIT_LOGIN', '10 per minute')
# Limites específicos para operações de arquivos (adicionados para resolver o ImportError)
RATELIMIT_UPLOAD = os.environ.get('RATELIMIT_UPLOAD', '20 per minute')
RATELIMIT_DELETE = os.environ.get('RATELIMIT_DELETE', '30 per minute')
RATELIMIT_ZIP = os.environ.get('RATELIMIT_ZIP', '5 per minute')

# ===== LOG DE AUDITORIA =====
AUDIT_LOG_PATH = os.path.join(ROOT_DIR, 'instance', 'audit.log')
AUDIT_LOG_MAX_MB = int(os.environ.get('AUDIT_LOG_MAX_MB', 10))  # rotação a cada 10MB

# ===== UPLOAD: EXTENSÕES BLOQUEADAS =====
# Apenas extensões que podem ser executadas no SERVIDOR são bloqueadas por padrão
# Scripts client-side (.js, .py para backup) são permitidos
# Usuário pode adicionar mais no .env como: BLOCKED_EXTENSIONS=".exe,.dll,.so"
BLOCKED_EXTENSIONS_DEFAULT = '.php,.php3,.php4,.php5,.phtml,.cgi,.pl,.sh,.bash,.zsh,.fish,.bat,.cmd,.com,.exe,.msi,.scr,.vbs,.jar,.class,.htaccess,.htpasswd'
BLOCKED_EXTENSIONS = os.environ.get('BLOCKED_EXTENSIONS', BLOCKED_EXTENSIONS_DEFAULT)
BLOCKED_EXTENSIONS_SET = set(ext.strip().lower() for ext in BLOCKED_EXTENSIONS.split(',') if ext.strip())

# ===== PAGINAÇÃO =====
# Quantos itens carregar por vez na listagem (evita travamento em pastas grandes)
ITEMS_PER_PAGE = int(os.environ.get('ITEMS_PER_PAGE', 100))

# ===== FEEDBACK NO TERMINAL (apenas informativo, sem dados sensíveis) =====
if IS_FIRST_RUN:
    print("🆕 PRIMEIRA EXECUÇÃO — acesse /setup para configurar")
else:
    env_label = "🔴 PRODUÇÃO" if IS_PRODUCTION else "🟡 DESENVOLVIMENTO"
    print(f"{env_label} | Debug: {DEBUG} | Porta: {PORT}")
    print(f"📁 Pasta base: {PASTA_BASE}")
    print(f"👤 Usuário: {ADMIN_USERNAME}")
    if not IS_PRODUCTION:
        print("⚠️  Para ativar modo produção: defina FLASK_ENV=production no .env")