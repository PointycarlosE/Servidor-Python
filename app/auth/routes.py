# app/auth/routes.py
import os
import re
import secrets
from dotenv import set_key
from flask import (
    render_template, redirect, url_for, request,
    flash, Blueprint, session, current_app
)
from flask_login import login_user, logout_user, login_required, current_user
from werkzeug.security import generate_password_hash, check_password_hash
from datetime import timedelta
from urllib.parse import urlparse

from app.auth.models import User
from app.config import (
    ADMIN_USERNAME, IS_FIRST_RUN, CONFIGURADO,
    ROOT_DIR, PASTA_BASE, IS_PRODUCTION, RATELIMIT_LOGIN
)
from app.extensions import limiter
from app.utils.audit import (
    log_login_ok, log_login_falhou, log_login_bloqueado,
    log_logout, log_setup_concluido
)

auth_bp = Blueprint('auth', __name__)


# ===== VALIDAÇÃO DE SENHA FORTE =====
def validar_senha(senha: str) -> tuple[bool, str]:
    if len(senha) < 12:
        return False, 'A senha deve ter pelo menos 12 caracteres'
    if not re.search(r'[A-Z]', senha):
        return False, 'A senha deve conter pelo menos uma letra maiúscula'
    if not re.search(r'[a-z]', senha):
        return False, 'A senha deve conter pelo menos uma letra minúscula'
    if not re.search(r'\d', senha):
        return False, 'A senha deve conter pelo menos um número'
    if not re.search(r'[^A-Za-z0-9]', senha):
        return False, 'A senha deve conter pelo menos um caractere especial (!@#$%...)'
    return True, ''


# ===== VALIDAÇÃO DE REDIRECT SEGURO =====
def is_safe_redirect(url: str) -> bool:
    if not url:
        return False
    parsed = urlparse(url)
    return not parsed.scheme and not parsed.netloc


# ===== HELPER: REESCREVER .env =====
def atualizar_env(chave: str, valor: str):
    """Atualiza ou adiciona uma chave no arquivo .env."""
    env_path = os.path.join(ROOT_DIR, 'instance', '.env')
    os.makedirs(os.path.dirname(env_path), exist_ok=True)
    set_key(env_path, chave, valor)

    # Atualiza o ambiente em memória para a sessão atual
    os.environ[chave] = valor


# ===== LOGIN =====
@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit(RATELIMIT_LOGIN)
def login():
    if current_user.is_authenticated:
        return redirect(url_for('file.explorar'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        password = request.form.get('password', '')
        remember = request.form.get('remember') == 'on'

        user = User.get(username)

        if user and user.check_password(password):
            log_login_ok(username)
            duration = timedelta(days=7) if remember else None
            login_user(user, remember=remember, duration=duration)

            next_page = request.args.get('next', '')
            if not is_safe_redirect(next_page):
                next_page = url_for('file.explorar')

            return redirect(next_page)
        else:
            log_login_falhou(username)
            flash('Usuário ou senha inválidos', 'error')

    return render_template('login.html')


# ===== LOGOUT =====
@auth_bp.route('/logout')
@login_required
def logout():
    username = current_user.username
    log_logout(username)
    logout_user()
    session.clear()
    response = redirect(url_for('auth.login'))
    response.delete_cookie('session')
    response.delete_cookie('remember_token')
    flash('Você foi desconectado com sucesso', 'success')
    return response


# ===== PERFIL =====
@auth_bp.route('/perfil', methods=['GET', 'POST'])
@login_required
def perfil():
    if request.method == 'POST':
        acao = request.form.get('acao')

        # ===== ALTERAR NOME DE EXIBIÇÃO =====
        if acao == 'nome':
            novo_nome = request.form.get('nome', '').strip()

            if not novo_nome:
                flash('O nome não pode estar vazio.', 'error')
                return redirect(url_for('auth.perfil'))

            if len(novo_nome) > 50:
                flash('O nome deve ter no máximo 50 caracteres.', 'error')
                return redirect(url_for('auth.perfil'))

            atualizar_env('ADMIN_NOME', novo_nome)
            flash('✅ Nome de exibição atualizado com sucesso!', 'success')
            return redirect(url_for('auth.perfil'))

        # ===== ALTERAR SENHA =====
        elif acao == 'senha':
            senha_atual = request.form.get('senha_atual', '')
            nova_senha = request.form.get('nova_senha', '')
            confirmar = request.form.get('confirmar_senha', '')

            # Verifica senha atual
            if not current_user.check_password(senha_atual):
                flash('Senha atual incorreta.', 'error')
                return redirect(url_for('auth.perfil'))

            # Valida nova senha
            senha_ok, motivo = validar_senha(nova_senha)
            if not senha_ok:
                flash(motivo, 'error')
                return redirect(url_for('auth.perfil'))

            if nova_senha != confirmar:
                flash('As senhas não coincidem.', 'error')
                return redirect(url_for('auth.perfil'))

            if nova_senha == senha_atual:
                flash('A nova senha deve ser diferente da atual.', 'error')
                return redirect(url_for('auth.perfil'))

            novo_hash = generate_password_hash(nova_senha, method='pbkdf2:sha256:600000')
            atualizar_env('ADMIN_PASSWORD_HASH', novo_hash)
            flash('✅ Senha alterada com sucesso!', 'success')
            return redirect(url_for('auth.perfil'))

        # ===== ALTERAR TEMA =====
        elif acao == 'tema':
            novo_tema = request.form.get('tema', 'light')

            # Valida o tema
            if novo_tema not in ['light', 'dark']:
                flash('Tema inválido.', 'error')
                return redirect(url_for('auth.perfil'))

            atualizar_env('ADMIN_TEMA', novo_tema)
            flash('✅ Tema atualizado com sucesso!', 'success')
            return redirect(url_for('auth.perfil'))

    return render_template('perfil.html')


# ===== SETUP =====
@auth_bp.route('/setup', methods=['GET', 'POST'])
def setup():
    first_run_file = os.path.join(ROOT_DIR, 'instance', '.firstrun')
    ja_configurado = (
        os.path.exists(first_run_file)
        and bool(os.environ.get('ADMIN_USERNAME'))
        and bool(os.environ.get('ADMIN_PASSWORD_HASH'))
        and bool(os.environ.get('PASTA_BASE'))
    )

    if ja_configurado:
        flash('Sistema já configurado. Faça login.', 'info')
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        username = request.form.get('username', '').strip()
        nome = request.form.get('nome', '').strip() or username
        password = request.form.get('password', '')
        confirm = request.form.get('confirm_password', '')
        repo_path = request.form.get('repo_path', '').strip()

        if not username or len(username) < 3:
            flash('O nome de usuário deve ter pelo menos 3 caracteres', 'error')
            return render_template('setup.html')

        if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
            flash('O nome de usuário só pode conter letras, números, _ . -', 'error')
            return render_template('setup.html')

        senha_ok, motivo = validar_senha(password)
        if not senha_ok:
            flash(motivo, 'error')
            return render_template('setup.html')

        if password != confirm:
            flash('As senhas não coincidem', 'error')
            return render_template('setup.html')

        if not repo_path:
            flash('Digite o caminho da pasta do repositório', 'error')
            return render_template('setup.html')

        repo_path = os.path.normpath(repo_path)
        if not os.path.isabs(repo_path):
            flash('O caminho da pasta deve ser absoluto (ex: /storage/emulated/0/MeuDrive)', 'error')
            return render_template('setup.html')

        try:
            password_hash = generate_password_hash(password, method='pbkdf2:sha256:600000')
            secret_key = secrets.token_hex(32)

            env_path = os.path.join(ROOT_DIR, 'instance', '.env')
            firstrun_path = os.path.join(ROOT_DIR, 'instance', '.firstrun')

            os.makedirs(os.path.dirname(env_path), exist_ok=True)

            with open(env_path, 'w', encoding='utf-8') as f:
                f.write(
                    "# Configuração do Cloud Storage App\n"
                    "# NÃO COMPARTILHE ESTE ARQUIVO!\n"
                    "\n"
                    "# Ambiente: development ou production\n"
                    "\n"
                    "# Chave secreta para sessões (gerada automaticamente)\n"
                    "\n"
                    "# Credenciais do administrador\n"
                    "\n"
                    "# Pasta base do repositório\n"
                    "\n"
                    "# Limites (opcional — valores padrão comentados)\n"
                    "# MAX_UPLOAD_MB=500\n"
                    "# MAX_ZIP_FILES=100\n"
                    "# MAX_ZIP_SIZE_MB=1024\n"
                    "# RATELIMIT_DEFAULT=60 per minute\n"
                    "# RATELIMIT_LOGIN=10 per minute\n"
                    "# RATELIMIT_UPLOAD=20 per minute\n"
                    "# RATELIMIT_DELETE=30 per minute\n"
                    "# RATELIMIT_ZIP=10 per minute\n"
                    "# PORT=5000\n"
                )

            set_key(env_path, 'FLASK_ENV', 'development')
            set_key(env_path, 'SECRET_KEY', secret_key)
            set_key(env_path, 'ADMIN_USERNAME', username)
            set_key(env_path, 'ADMIN_NOME', nome)
            set_key(env_path, 'ADMIN_PASSWORD_HASH', password_hash)
            set_key(env_path, 'PASTA_BASE', repo_path)

            with open(firstrun_path, 'w', encoding='utf-8') as f:
                f.write("configured")

            if not os.path.exists(repo_path):
                os.makedirs(repo_path, exist_ok=True)

            log_setup_concluido(username)
            flash('✅ Conta criada com sucesso! Reinicie o servidor e faça login.', 'success')
            return redirect(url_for('auth.login'))

        except PermissionError:
            flash('Sem permissão para criar a pasta ou o arquivo de configuração', 'error')
        except Exception:
            current_app.logger.exception("Erro ao salvar configuração inicial")
            flash('Erro ao salvar configuração. Verifique o caminho da pasta.', 'error')

    return render_template('setup.html')
