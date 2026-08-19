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
from app.utils.tokens import gerar_token_reset, validar_token_reset, marcar_token_usado

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


# ===== VALIDAÇÃO DE EMAIL =====
def validar_email(email: str) -> bool:
    """Valida formato de email"""
    if not email:
        return False
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))


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
            # Se 2FA estiver ativo, redireciona para página de verificação
            if user.tem_2fa_ativo:
                session['2fa_username'] = username
                session['2fa_remember'] = remember
                return redirect(url_for('auth.verificar_2fa'))

            # Login normal (sem 2FA)
            log_login_ok(username)
            duration = timedelta(days=7) if remember else None
            login_user(user, remember=remember, duration=duration)

            # Envia notificação de login por email
            if user.email:
                try:
                    from datetime import datetime
                    import pytz
                    from app.email import send_email

                    # Informações do acesso
                    ip = request.remote_addr or 'IP desconhecido'
                    user_agent = request.user_agent.string or 'Navegador desconhecido'

                    # Data/hora em fuso horário do Brasil
                    tz_brasil = pytz.timezone('America/Sao_Paulo')
                    data_hora = datetime.now(tz_brasil).strftime('%d/%m/%Y às %H:%M:%S')

                    send_email(
                        subject='Novo acesso detectado - Meu Drive Pessoal',
                        recipients=[user.email],
                        text_body=f'Um novo acesso foi detectado em {data_hora} do IP {ip}.\n\nDispositivo: {user_agent}',
                        html_body=render_template('email/notificacao_login.html',
                            data_hora=data_hora,
                            ip=ip,
                            user_agent=user_agent
                        )
                    )
                except Exception as e:
                    # Não bloqueia o login se falhar o envio de email
                    current_app.logger.error(f"Erro ao enviar notificação de login: {e}")

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
        email = request.form.get('email', '').strip()
        repo_path = request.form.get('repo_path', '').strip()

        if not username or len(username) < 3:
            flash('O nome de usuário deve ter pelo menos 3 caracteres', 'error')
            return render_template('setup.html')

        if not re.match(r'^[a-zA-Z0-9_.-]+$', username):
            flash('O nome de usuário só pode conter letras, números, _ . -', 'error')
            return render_template('setup.html')

        if not email or not validar_email(email):
            flash('Digite um email válido', 'error')
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
            set_key(env_path, 'ADMIN_EMAIL', email)
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


# ===== ESQUECEU A SENHA =====
@auth_bp.route('/esqueceu-senha', methods=['GET', 'POST'])
@limiter.limit("5 per hour")  # Limite de tentativas por hora
def esqueceu_senha():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()

        # Busca usuário pelo email
        admin_email = os.environ.get('ADMIN_EMAIL', '')

        if email and admin_email and email.lower() == admin_email.lower():
            try:
                # Gera token
                token = gerar_token_reset(email)

                # Cria link de reset
                reset_url = url_for('auth.resetar_senha', token=token, _external=True)

                # Envia email
                from app.email import send_email
                send_email(
                    subject='Recuperação de Senha - Meu Drive Pessoal',
                    recipients=[email],
                    text_body=f'Clique no link para redefinir sua senha: {reset_url}\n\nEste link é válido por 1 hora.',
                    html_body=render_template('email/recuperacao_senha.html', reset_url=reset_url)
                )
            except Exception as e:
                current_app.logger.error(f"Erro ao enviar email de recuperação: {e}")

        # SEMPRE mostra mensagem de sucesso (segurança: não revelar se email existe)
        flash('Se o email estiver cadastrado, você receberá um link de recuperação em instantes.', 'info')
        return redirect(url_for('auth.esqueceu_senha'))

    return render_template('esqueceu_senha.html')


# ===== RESETAR SENHA =====
@auth_bp.route('/resetar-senha/<token>', methods=['GET', 'POST'])
def resetar_senha(token):
    email = validar_token_reset(token)

    if not email:
        flash('Link de recuperação inválido ou expirado. Solicite um novo link.', 'error')
        return redirect(url_for('auth.esqueceu_senha'))

    if request.method == 'POST':
        nova_senha = request.form.get('nova_senha', '')
        confirmar = request.form.get('confirmar_senha', '')

        # Valida senha
        senha_ok, motivo = validar_senha(nova_senha)
        if not senha_ok:
            flash(motivo, 'error')
            return render_template('resetar_senha.html', token=token)

        if nova_senha != confirmar:
            flash('As senhas não coincidem.', 'error')
            return render_template('resetar_senha.html', token=token)

        # Atualiza senha
        novo_hash = generate_password_hash(nova_senha, method='pbkdf2:sha256:600000')
        atualizar_env('ADMIN_PASSWORD_HASH', novo_hash)

        # Marca token como usado
        marcar_token_usado(token)

        # Log da alteração
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        current_app.logger.info(f"Senha redefinida via recuperação para usuário {admin_username}")

        flash('✅ Senha redefinida com sucesso! Faça login com a nova senha.', 'success')
        return redirect(url_for('auth.login'))

    return render_template('resetar_senha.html', token=token)


# ===== VERIFICAR 2FA =====
@auth_bp.route('/verificar-2fa', methods=['GET', 'POST'])
@limiter.limit("10 per minute")
def verificar_2fa():
    username = session.get('2fa_username')
    if not username:
        return redirect(url_for('auth.login'))

    user = User.get(username)
    if not user or not user.tem_2fa_ativo:
        return redirect(url_for('auth.login'))

    if request.method == 'POST':
        codigo = request.form.get('codigo', '').strip()
        usar_backup = request.form.get('usar_backup') == 'true'

        valido = False

        if usar_backup:
            # Verifica código de backup
            if codigo.upper() in [c.upper() for c in user.backup_codes]:
                # Remove código usado
                import json
                new_backup_codes = [c for c in user.backup_codes if c.upper() != codigo.upper()]
                atualizar_env('ADMIN_BACKUP_CODES', json.dumps(new_backup_codes))
                valido = True
        else:
            # Verifica código TOTP
            from app.utils.totp import verificar_codigo_2fa
            valido = verificar_codigo_2fa(user.totp_secret, codigo)

        if valido:
            remember = session.get('2fa_remember', False)
            duration = timedelta(days=7) if remember else None
            login_user(user, remember=remember, duration=duration)

            # Limpa sessão temporária
            session.pop('2fa_username', None)
            session.pop('2fa_remember', None)

            log_login_ok(username)

            # Envia notificação de login
            if user.email:
                try:
                    from datetime import datetime
                    import pytz
                    from app.email import send_email

                    ip = request.remote_addr or 'IP desconhecido'
                    user_agent = request.user_agent.string or 'Navegador desconhecido'
                    tz_brasil = pytz.timezone('America/Sao_Paulo')
                    data_hora = datetime.now(tz_brasil).strftime('%d/%m/%Y às %H:%M:%S')

                    send_email(
                        subject='Novo acesso detectado - Meu Drive Pessoal',
                        recipients=[user.email],
                        text_body=f'Um novo acesso foi detectado em {data_hora} do IP {ip}.\n\nDispositivo: {user_agent}',
                        html_body=render_template('email/notificacao_login.html',
                            data_hora=data_hora,
                            ip=ip,
                            user_agent=user_agent
                        )
                    )
                except Exception as e:
                    current_app.logger.error(f"Erro ao enviar notificação de login: {e}")

            next_page = request.args.get('next', '')
            if not is_safe_redirect(next_page):
                next_page = url_for('file.explorar')

            return redirect(next_page)
        else:
            flash('Código inválido. Tente novamente.', 'error')

    return render_template('verificar_2fa.html')


# ===== ATIVAR 2FA =====
@auth_bp.route('/ativar-2fa', methods=['GET', 'POST'])
@login_required
def ativar_2fa():
    if current_user.tem_2fa_ativo:
        flash('2FA já está ativo.', 'info')
        return redirect(url_for('auth.perfil'))

    if request.method == 'GET':
        # Gera novo secret e QR code
        from app.utils.totp import gerar_secret_2fa, gerar_qrcode_2fa, gerar_codigos_backup

        secret = gerar_secret_2fa()
        qrcode_data = gerar_qrcode_2fa(current_user.username, secret)
        backup_codes = gerar_codigos_backup()

        # Armazena temporariamente na sessão
        session['temp_2fa_secret'] = secret
        session['temp_backup_codes'] = backup_codes

        return render_template('ativar_2fa.html',
            qrcode_data=qrcode_data,
            secret=secret,
            backup_codes=backup_codes
        )

    # POST: Verifica código para confirmar ativação
    codigo = request.form.get('codigo', '').strip()
    secret = session.get('temp_2fa_secret')
    backup_codes = session.get('temp_backup_codes')

    if not secret:
        flash('Sessão expirada. Tente novamente.', 'error')
        return redirect(url_for('auth.ativar_2fa'))

    from app.utils.totp import verificar_codigo_2fa
    if verificar_codigo_2fa(secret, codigo):
        # Salva no .env
        import json
        atualizar_env('ADMIN_TOTP_SECRET', secret)
        atualizar_env('ADMIN_BACKUP_CODES', json.dumps(backup_codes))

        # Limpa sessão
        session.pop('temp_2fa_secret', None)
        session.pop('temp_backup_codes', None)

        flash('✅ 2FA ativado com sucesso!', 'success')
        return redirect(url_for('auth.perfil'))
    else:
        flash('Código inválido. Tente novamente.', 'error')
        from app.utils.totp import gerar_qrcode_2fa
        return render_template('ativar_2fa.html',
            qrcode_data=gerar_qrcode_2fa(current_user.username, secret),
            secret=secret,
            backup_codes=backup_codes
        )


# ===== DESATIVAR 2FA =====
@auth_bp.route('/desativar-2fa', methods=['POST'])
@login_required
def desativar_2fa():
    atualizar_env('ADMIN_TOTP_SECRET', '')
    atualizar_env('ADMIN_BACKUP_CODES', '')
    flash('2FA desativado.', 'info')
    return redirect(url_for('auth.perfil'))


# ===== REGENERAR CÓDIGOS DE BACKUP =====
@auth_bp.route('/regenerar-backup-codes', methods=['POST'])
@login_required
def regenerar_backup_codes():
    from app.utils.totp import gerar_codigos_backup
    import json

    novos_codigos = gerar_codigos_backup()
    atualizar_env('ADMIN_BACKUP_CODES', json.dumps(novos_codigos))

    flash('✅ Novos códigos de backup gerados! Guarde-os em local seguro.', 'success')
    return redirect(url_for('auth.perfil'))

