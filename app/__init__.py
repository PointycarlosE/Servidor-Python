# app/__init__.py
from flask import Flask, jsonify, render_template, request
from flask_login import LoginManager
from flask_wtf.csrf import CSRFProtect, CSRFError
from werkzeug.middleware.proxy_fix import ProxyFix
import os

from app.config import (
    PASTA_BASE, DEBUG, SECRET_KEY,
    REQUIRE_LOGIN, CONFIGURADO, IS_FIRST_RUN, ROOT_DIR,
    SESSION_COOKIE_SECURE, SESSION_COOKIE_HTTPONLY, SESSION_COOKIE_SAMESITE,
    PERMANENT_SESSION_LIFETIME, MAX_CONTENT_LENGTH, IS_PRODUCTION,
)
from app.extensions import limiter
from app.email import mail
from app.auth.models import User
from app.auth.routes import auth_bp
from app.routes.main import main_bp
from app.routes.files import file_bp
from app.share.routes import share_bp

csrf = CSRFProtect()
login_manager = LoginManager()

def create_app():
    app = Flask(
        __name__,
        template_folder='../frontend/templates',
        static_folder='../frontend/static'
    )

    # Configurar ProxyFix para funcionar com Cloudflare/proxy reverso
    # Isso faz o Flask confiar nos headers X-Forwarded-* enviados pelo Cloudflare
    if IS_PRODUCTION:
        app.wsgi_app = ProxyFix(
            app.wsgi_app,
            x_for=1,      # Confia em 1 proxy para X-Forwarded-For (IP do cliente)
            x_proto=1,    # Confia em 1 proxy para X-Forwarded-Proto (http/https)
            x_host=1,     # Confia em 1 proxy para X-Forwarded-Host (domínio)
            x_prefix=1    # Confia em 1 proxy para X-Forwarded-Prefix (path)
        )

    # Configurações vindas do config.py
    app.config.from_mapping(
        SECRET_KEY=SECRET_KEY,
        MAX_CONTENT_LENGTH=MAX_CONTENT_LENGTH,
        SESSION_COOKIE_SECURE=SESSION_COOKIE_SECURE,
        SESSION_COOKIE_HTTPONLY=SESSION_COOKIE_HTTPONLY,
        SESSION_COOKIE_SAMESITE=SESSION_COOKIE_SAMESITE,
        PERMANENT_SESSION_LIFETIME=PERMANENT_SESSION_LIFETIME,
        WTF_CSRF_ENABLED=True,
        WTF_CSRF_TIME_LIMIT=3600,
        WTF_CSRF_CHECK_DEFAULT=False,  # Não verificar CSRF por padrão, apenas onde explicitamente habilitado
        # Configurações de email
        MAIL_SERVER=os.environ.get('MAIL_SERVER', 'smtp.gmail.com'),
        MAIL_PORT=int(os.environ.get('MAIL_PORT', 587)),
        MAIL_USE_TLS=os.environ.get('MAIL_USE_TLS', 'True').lower() == 'true',
        MAIL_USE_SSL=os.environ.get('MAIL_USE_SSL', 'False').lower() == 'true',
        MAIL_USERNAME=os.environ.get('MAIL_USERNAME'),
        MAIL_PASSWORD=os.environ.get('MAIL_PASSWORD'),
        MAIL_DEFAULT_SENDER=os.environ.get('MAIL_DEFAULT_SENDER', os.environ.get('MAIL_USERNAME'))
    )

    # Inicialização de extensões
    csrf.init_app(app)
    limiter.init_app(app)
    mail.init_app(app)
    login_manager.init_app(app)

    login_manager.login_view = 'auth.login'
    login_manager.login_message = 'Por favor, faça login para acessar esta página'
    login_manager.login_message_category = 'info'

    @login_manager.user_loader
    def load_user(user_id):
        return User.get(user_id)

    app.register_blueprint(main_bp)
    app.register_blueprint(file_bp)
    app.register_blueprint(auth_bp)
    app.register_blueprint(share_bp)

    registrar_handlers_seguranca(app)
    registrar_handlers_erro(app)

    @app.context_processor
    def inject_globals():
        return {
            'PASTA_BASE': PASTA_BASE,
            'IS_FIRST_RUN': IS_FIRST_RUN,
            'CONFIGURADO': CONFIGURADO,
            'IS_PRODUCTION': IS_PRODUCTION,
        }

    return app

# ===== HEADERS DE SEGURANÇA HTTP =====
def registrar_handlers_seguranca(app):
    @app.after_request
    def aplicar_headers_seguranca(response):
        """
        Adiciona headers de segurança em todas as respostas.
        """
        response.headers['X-Frame-Options'] = 'DENY'
        response.headers['X-Content-Type-Options'] = 'nosniff'
        response.headers['X-XSS-Protection'] = '1; mode=block'

        # HSTS só quando o request atual já é HTTPS (Cloudflare já fez a terminação SSL)
        if IS_PRODUCTION and request.is_secure:
            response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'

        response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'

        csp = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline'; "
            "img-src 'self' data: blob:; "
            "media-src 'self'; "
            "font-src 'self'; "
            "connect-src 'self'; "
            "frame-ancestors 'none';"
        )
        # Não forçar upgrade de requests - o Cloudflare já cuida disso
        # Se forçarmos aqui, causamos loop de redirect ou erro 502

        response.headers['Content-Security-Policy'] = csp
        response.headers.pop('Server', None)
        response.headers.pop('X-Powered-By', None)

        return response

# ===== TRATAMENTO DE ERROS =====
def registrar_handlers_erro(app):
    @app.errorhandler(400)
    def bad_request(e):
        if request.is_json or request.path.startswith('/deletar_multiplos'):
            return jsonify(erro="Requisição inválida"), 400
        return render_template('erro.html', mensagem="Requisição inválida."), 400

    @app.errorhandler(403)
    def forbidden(e):
        if request.is_json:
            return jsonify(erro="Acesso negado"), 403
        return render_template('erro.html', mensagem="Acesso negado."), 403

    @app.errorhandler(404)
    def not_found(e):
        if request.is_json:
            return jsonify(erro="Não encontrado"), 404
        return render_template('erro.html', mensagem="Página não encontrada."), 404

    @app.errorhandler(413)
    def request_too_large(e):
        from app.config import MAX_UPLOAD_SIZE_MB
        if request.is_json:
            return jsonify(erro=f"Arquivo muito grande. Limite: {MAX_UPLOAD_SIZE_MB}MB"), 413
        return render_template(
            'erro.html',
            mensagem=f"Arquivo muito grande. O limite é {MAX_UPLOAD_SIZE_MB}MB."
        ), 413

    @app.errorhandler(429)
    def too_many_requests(e):
        if request.is_json:
            return jsonify(erro="Muitas requisições. Aguarde um momento."), 429
        return render_template('erro.html', mensagem="Muitas requisições. Aguarde um momento."), 429

    @app.errorhandler(CSRFError)
    def csrf_error(e):
        if request.is_json:
            return jsonify(erro="Token de segurança inválido. Recarregue a página."), 400
        return render_template(
            'erro.html',
            mensagem="Token de segurança inválido. Por favor, recarregue a página e tente novamente."
        ), 400

    @app.errorhandler(500)
    def internal_error(e):
        if IS_PRODUCTION:
            msg = "Erro interno do servidor."
        else:
            msg = f"Erro interno: {str(e)}"
        if request.is_json:
            return jsonify(erro=msg), 500
        return render_template('erro.html', mensagem=msg), 500
