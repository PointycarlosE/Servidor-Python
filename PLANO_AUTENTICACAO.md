# 🔐 Plano de Implementação: Sistema de Autenticação Avançado

**Data:** 2026-08-19  
**Projeto:** Cloud Storage App  
**Objetivo:** Implementar sistema robusto de autenticação com recuperação de senha, notificações e 2FA

---

## 📋 Contexto e Motivação

### Problema Atual
- Em produção, o domínio é temporário e muda a cada restart do servidor
- Senhas salvas no navegador (Google Password Manager) ficam vinculadas ao domínio antigo
- Usuário precisa lembrar manualmente de usuário e senha a cada troca de domínio
- Falta de mecanismos de recuperação de senha
- Segurança limitada (apenas usuário + senha)

### Solução Proposta
Sistema completo de autenticação com:
1. **Campo de email** no cadastro
2. **Recuperação de senha** via email
3. **Notificações de login** para detectar acessos suspeitos
4. **Autenticação de dois fatores (2FA)** com Google Authenticator
5. **Códigos de backup** para emergências

---

## 🎯 Tarefas

### Task #10: Atualizar requirements.txt com novas dependências
**Status:** Pendente  
**Descrição:** Adicionar bibliotecas necessárias

**Dependências a adicionar:**
```txt
Flask-Mail==0.9.1
pyotp==2.9.0
qrcode[pil]==7.4.2
Pillow==10.2.0
```

**Funcionalidades:**
- `Flask-Mail`: Envio de emails (recuperação de senha, notificações)
- `pyotp`: Geração de códigos TOTP para 2FA
- `qrcode`: Geração de QR codes para vincular Google Authenticator
- `Pillow`: Dependência do qrcode para manipulação de imagens

---

### Task #9: Configurar Flask-Mail e templates de email
**Status:** Pendente  
**Descrição:** Configurar sistema de envio de emails

**Arquivos a criar:**

#### 1. `app/email.py`
```python
from flask_mail import Mail, Message
from flask import current_app, render_template
from threading import Thread

mail = Mail()

def send_async_email(app, msg):
    """Envia email em background para não bloquear requisição"""
    with app.app_context():
        mail.send(msg)

def send_email(subject, recipients, text_body, html_body):
    """Envia email com versão texto e HTML"""
    msg = Message(subject, recipients=recipients)
    msg.body = text_body
    msg.html = html_body
    Thread(target=send_async_email, args=(current_app._get_current_object(), msg)).start()
```

#### 2. `frontend/templates/email/recuperacao_senha.html`
Template HTML bonito para email de recuperação de senha com:
- Logo do app
- Link de reset com botão destacado
- Aviso de expiração (1 hora)
- Footer com informações de segurança

#### 3. `frontend/templates/email/notificacao_login.html`
Template HTML para notificação de login com:
- Data e hora do acesso
- Endereço IP
- Navegador e dispositivo
- Aviso caso não tenha sido o usuário

#### 4. Configurações no `.env`
Adicionar variáveis:
```env
# Configurações de Email
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-de-app
MAIL_DEFAULT_SENDER=seu-email@gmail.com
```

**Suporte para:**
- Gmail (smtp.gmail.com:587)
- Outlook (smtp-mail.outlook.com:587)
- Servidores SMTP customizados

---

### Task #4: Adicionar campo email ao modelo User e setup
**Status:** Pendente  
**Descrição:** Modificar User model e setup para incluir email

**Arquivos a modificar:**

#### 1. `app/auth/models.py`
```python
class User:
    def __init__(self, username, nome=None, password_hash=None, tema='light', email=None):
        self.username = username
        self.nome = nome if nome else username
        self.password_hash = password_hash
        self.tema = tema
        self.email = email  # NOVO
        # ...
    
    @staticmethod
    def get(username):
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_nome = os.environ.get('ADMIN_NOME', admin_username)
        admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH', '')
        admin_tema = os.environ.get('ADMIN_TEMA', 'light')
        admin_email = os.environ.get('ADMIN_EMAIL', '')  # NOVO
        
        if username == admin_username:
            return User(admin_username, admin_nome, admin_password_hash, admin_tema, admin_email)
        return None
```

#### 2. `app/auth/routes.py` (rota setup)
Adicionar validação de email:
```python
import re

def validar_email(email: str) -> bool:
    """Valida formato de email"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

# Na rota /setup POST:
email = request.form.get('email', '').strip()

if not email or not validar_email(email):
    flash('Digite um email válido', 'error')
    return render_template('setup.html')

set_key(env_path, 'ADMIN_EMAIL', email)
```

#### 3. `frontend/templates/setup.html`
Adicionar campo de email no formulário:
```html
<div class="form-group">
    <label for="email" class="form-label">
        <i data-lucide="mail"></i> Email
    </label>
    <input type="email" name="email" id="email" class="form-input"
        placeholder="seu-email@exemplo.com" required>
</div>
```

---

### Task #8: Criar templates para esqueceu senha e resetar senha
**Status:** Pendente  
**Descrição:** Criar interfaces para recuperação de senha

**Arquivos a criar:**

#### 1. `frontend/templates/esqueceu_senha.html`
- Campo para digitar email
- Botão "Enviar link de recuperação"
- Link "Voltar ao login"
- Design seguindo padrão do login atual
- Mensagem de sucesso após envio

#### 2. `frontend/templates/resetar_senha.html`
- Campos para nova senha e confirmação
- Validação de senha forte
- Indicador visual de força da senha
- Botão "Redefinir senha"
- Tratamento de token expirado/inválido

---

### Task #5: Implementar sistema de recuperação de senha via email
**Status:** Pendente  
**Descrição:** Lógica completa de recuperação de senha

**Arquivos a criar/modificar:**

#### 1. `app/utils/tokens.py` (NOVO)
```python
import secrets
import time
from typing import Optional, Dict

# Armazenamento em memória (simples, suficiente para single-user)
_reset_tokens: Dict[str, Dict] = {}

def gerar_token_reset(email: str) -> str:
    """Gera token único de recuperação de senha"""
    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        'email': email,
        'timestamp': time.time(),
        'usado': False
    }
    return token

def validar_token_reset(token: str) -> Optional[str]:
    """Valida token e retorna email se válido (1h de expiração)"""
    if token not in _reset_tokens:
        return None
    
    dados = _reset_tokens[token]
    if dados['usado']:
        return None
    
    # Verifica expiração (3600 segundos = 1 hora)
    if time.time() - dados['timestamp'] > 3600:
        del _reset_tokens[token]
        return None
    
    return dados['email']

def marcar_token_usado(token: str):
    """Marca token como usado para evitar reutilização"""
    if token in _reset_tokens:
        _reset_tokens[token]['usado'] = True
```

#### 2. `app/auth/routes.py`
Adicionar rotas:

```python
from app.utils.tokens import gerar_token_reset, validar_token_reset, marcar_token_usado
from app.email import send_email

@auth_bp.route('/esqueceu-senha', methods=['GET', 'POST'])
@limiter.limit("5 per hour")  # Limite de tentativas
def esqueceu_senha():
    if request.method == 'POST':
        email = request.form.get('email', '').strip()
        
        # Busca usuário pelo email
        admin_email = os.environ.get('ADMIN_EMAIL', '')
        
        if email == admin_email:
            # Gera token
            token = gerar_token_reset(email)
            
            # Cria link de reset
            reset_url = url_for('auth.resetar_senha', token=token, _external=True)
            
            # Envia email
            send_email(
                subject='Recuperação de Senha - Meu Drive Pessoal',
                recipients=[email],
                text_body=f'Clique no link para redefinir sua senha: {reset_url}',
                html_body=render_template('email/recuperacao_senha.html', reset_url=reset_url)
            )
        
        # SEMPRE mostra mensagem de sucesso (segurança: não revelar se email existe)
        flash('Se o email estiver cadastrado, você receberá um link de recuperação.', 'info')
        return redirect(url_for('auth.esqueceu_senha'))
    
    return render_template('esqueceu_senha.html')

@auth_bp.route('/resetar-senha/<token>', methods=['GET', 'POST'])
def resetar_senha(token):
    email = validar_token_reset(token)
    
    if not email:
        flash('Link de recuperação inválido ou expirado.', 'error')
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
        
        flash('✅ Senha redefinida com sucesso! Faça login com a nova senha.', 'success')
        return redirect(url_for('auth.login'))
    
    return render_template('resetar_senha.html', token=token)
```

#### 3. `frontend/templates/login.html`
Adicionar link "Esqueceu a senha?" abaixo do campo de senha

---

### Task #6: Implementar notificação de login por email
**Status:** Pendente  
**Descrição:** Enviar email a cada login bem-sucedido

**Modificação em `app/auth/routes.py`:**

```python
@auth_bp.route('/login', methods=['GET', 'POST'])
@limiter.limit(RATELIMIT_LOGIN)
def login():
    # ... código existente ...
    
    if user and user.check_password(password):
        log_login_ok(username)
        duration = timedelta(days=7) if remember else None
        login_user(user, remember=remember, duration=duration)
        
        # NOVO: Envia notificação de login
        if user.email:
            from datetime import datetime
            import pytz
            
            # Informações do acesso
            ip = request.remote_addr
            user_agent = request.user_agent.string
            data_hora = datetime.now(pytz.timezone('America/Sao_Paulo')).strftime('%d/%m/%Y às %H:%M:%S')
            
            send_email(
                subject='Novo acesso detectado - Meu Drive Pessoal',
                recipients=[user.email],
                text_body=f'Um novo acesso foi detectado em {data_hora} do IP {ip}.',
                html_body=render_template('email/notificacao_login.html',
                    data_hora=data_hora,
                    ip=ip,
                    user_agent=user_agent
                )
            )
        
        next_page = request.args.get('next', '')
        if not is_safe_redirect(next_page):
            next_page = url_for('file.explorar')
        
        return redirect(next_page)
```

---

### Task #7: Implementar autenticação de dois fatores (2FA) com TOTP
**Status:** Pendente  
**Descrição:** Sistema completo de 2FA compatível com Google Authenticator

**Arquivos a criar/modificar:**

#### 1. `app/utils/totp.py` (NOVO)
```python
import pyotp
import qrcode
import io
import base64
import secrets

def gerar_secret_2fa() -> str:
    """Gera secret aleatório para TOTP"""
    return pyotp.random_base32()

def gerar_qrcode_2fa(username: str, secret: str) -> str:
    """Gera QR code como base64 para exibir no HTML"""
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=username,
        issuer_name='Meu Drive Pessoal'
    )
    
    # Gera QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(uri)
    qr.make(fit=True)
    
    img = qr.make_image(fill_color="black", back_color="white")
    
    # Converte para base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()
    
    return f"data:image/png;base64,{img_base64}"

def verificar_codigo_2fa(secret: str, codigo: str) -> bool:
    """Verifica se código TOTP está correto"""
    totp = pyotp.TOTP(secret)
    return totp.verify(codigo, valid_window=1)  # Aceita 1 código anterior/posterior

def gerar_codigos_backup() -> list:
    """Gera 10 códigos de backup de 8 dígitos"""
    return [secrets.token_hex(4).upper() for _ in range(10)]
```

#### 2. `app/auth/models.py`
Adicionar campos 2FA:
```python
class User:
    def __init__(self, username, nome=None, password_hash=None, tema='light', 
                 email=None, totp_secret=None, backup_codes=None):
        self.username = username
        self.nome = nome if nome else username
        self.password_hash = password_hash
        self.tema = tema
        self.email = email
        self.totp_secret = totp_secret  # Secret do 2FA
        self.backup_codes = backup_codes  # Códigos de backup (lista JSON)
        # ...
    
    @property
    def tem_2fa_ativo(self) -> bool:
        """Verifica se 2FA está ativo"""
        return bool(self.totp_secret)
    
    @staticmethod
    def get(username):
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_nome = os.environ.get('ADMIN_NOME', admin_username)
        admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH', '')
        admin_tema = os.environ.get('ADMIN_TEMA', 'light')
        admin_email = os.environ.get('ADMIN_EMAIL', '')
        admin_totp_secret = os.environ.get('ADMIN_TOTP_SECRET', '')  # NOVO
        admin_backup_codes = os.environ.get('ADMIN_BACKUP_CODES', '')  # NOVO
        
        if username == admin_username:
            # Parse backup codes (JSON)
            import json
            backup_codes = json.loads(admin_backup_codes) if admin_backup_codes else []
            
            return User(admin_username, admin_nome, admin_password_hash, 
                       admin_tema, admin_email, admin_totp_secret, backup_codes)
        return None
```

#### 3. `app/auth/routes.py`
Modificar rota de login para exigir 2FA:

```python
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
            
            # Envia notificação...
            # ... resto do código
        else:
            log_login_falhou(username)
            flash('Usuário ou senha inválidos', 'error')
    
    return render_template('login.html')

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
            if codigo in user.backup_codes:
                # Remove código usado
                user.backup_codes.remove(codigo)
                import json
                atualizar_env('ADMIN_BACKUP_CODES', json.dumps(user.backup_codes))
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
            flash('Login realizado com sucesso!', 'success')
            
            next_page = request.args.get('next', '')
            if not is_safe_redirect(next_page):
                next_page = url_for('file.explorar')
            return redirect(next_page)
        else:
            flash('Código inválido. Tente novamente.', 'error')
    
    return render_template('verificar_2fa.html')
```

---

### Task #11: Adicionar página de configuração 2FA no perfil
**Status:** Pendente  
**Descrição:** Interface para gerenciar 2FA

**Arquivos a criar/modificar:**

#### 1. `frontend/templates/verificar_2fa.html` (NOVO)
Página para digitar código 2FA após login:
- Campo para código de 6 dígitos
- Botão "Verificar"
- Link "Usar código de backup"
- Design moderno seguindo padrão do login

#### 2. `frontend/templates/perfil.html`
Adicionar seção de 2FA:

```html
<!-- Seção 2FA -->
<div class="perfil-section">
    <h2 class="section-title">
        <i data-lucide="shield"></i> Autenticação de Dois Fatores
    </h2>
    
    {% if not current_user.tem_2fa_ativo %}
        <p>Adicione uma camada extra de segurança à sua conta.</p>
        <form method="POST" action="{{ url_for('auth.ativar_2fa') }}">
            <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
            <button type="submit" class="btn-primary">
                <i data-lucide="shield-check"></i> Ativar 2FA
            </button>
        </form>
    {% else %}
        <div class="alert alert-success">
            <i data-lucide="shield-check"></i> 2FA está ativo!
        </div>
        
        <!-- Códigos de backup -->
        <details class="backup-codes">
            <summary>Ver códigos de backup</summary>
            <p class="backup-info">Use estes códigos se perder acesso ao autenticador:</p>
            <ul class="codes-list">
                {% for code in current_user.backup_codes %}
                <li><code>{{ code }}</code></li>
                {% endfor %}
            </ul>
            <form method="POST" action="{{ url_for('auth.regenerar_backup_codes') }}">
                <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
                <button type="submit" class="btn-secondary">Regenerar códigos</button>
            </form>
        </details>
        
        <form method="POST" action="{{ url_for('auth.desativar_2fa') }}" 
              onsubmit="return confirm('Tem certeza que deseja desativar o 2FA?')">
            <input type="hidden" name="csrf_token" value="{{ csrf_token() }}">
            <button type="submit" class="btn-danger">
                <i data-lucide="shield-off"></i> Desativar 2FA
            </button>
        </form>
    {% endif %}
</div>
```

#### 3. `frontend/templates/ativar_2fa.html` (NOVO)
Página para configurar 2FA:
- QR code para escanear com Google Authenticator
- Instruções passo a passo
- Campo para digitar código de verificação
- Exibir códigos de backup gerados
- Aviso para guardar códigos em local seguro

#### 4. `app/auth/routes.py`
Adicionar rotas de gerenciamento 2FA:

```python
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
        return render_template('ativar_2fa.html',
            qrcode_data=gerar_qrcode_2fa(current_user.username, secret),
            secret=secret,
            backup_codes=backup_codes
        )

@auth_bp.route('/desativar-2fa', methods=['POST'])
@login_required
def desativar_2fa():
    atualizar_env('ADMIN_TOTP_SECRET', '')
    atualizar_env('ADMIN_BACKUP_CODES', '')
    flash('2FA desativado.', 'info')
    return redirect(url_for('auth.perfil'))

@auth_bp.route('/regenerar-backup-codes', methods=['POST'])
@login_required
def regenerar_backup_codes():
    from app.utils.totp import gerar_codigos_backup
    import json
    
    novos_codigos = gerar_codigos_backup()
    atualizar_env('ADMIN_BACKUP_CODES', json.dumps(novos_codigos))
    
    flash('✅ Novos códigos de backup gerados!', 'success')
    return redirect(url_for('auth.perfil'))
```

---

## 📦 Estrutura de Arquivos

### Novos arquivos a criar:
```
app/
├── email.py                          # Sistema de envio de emails
├── utils/
│   ├── tokens.py                     # Gerenciamento de tokens de reset
│   └── totp.py                       # Funções 2FA/TOTP

frontend/templates/
├── esqueceu_senha.html               # Página "Esqueceu a senha?"
├── resetar_senha.html                # Página de reset de senha
├── verificar_2fa.html                # Página de verificação 2FA
├── ativar_2fa.html                   # Página de configuração 2FA
└── email/
    ├── recuperacao_senha.html        # Email de recuperação
    └── notificacao_login.html        # Email de notificação de login
```

### Arquivos a modificar:
```
requirements.txt                      # Adicionar dependências
app/auth/models.py                   # Adicionar email, totp_secret, backup_codes
app/auth/routes.py                   # Adicionar rotas e lógica de 2FA
frontend/templates/setup.html        # Adicionar campo email
frontend/templates/login.html        # Adicionar link "Esqueceu a senha?"
frontend/templates/perfil.html       # Adicionar seção 2FA
instance/.env                         # Adicionar variáveis de email e 2FA
```

---

## 🔧 Configuração do Email

### Gmail
1. Ativar verificação em 2 etapas
2. Gerar senha de app em: https://myaccount.google.com/apppasswords
3. Usar senha de app no `.env`

### Outlook
1. Usar senha normal da conta
2. Pode precisar permitir "apps menos seguros"

### Servidor SMTP Customizado
```env
MAIL_SERVER=mail.seudominio.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=noreply@seudominio.com
MAIL_PASSWORD=sua-senha
```

---

## 🎯 Ordem de Implementação Recomendada

1. **Task #10** - Atualizar requirements.txt
2. **Task #9** - Configurar Flask-Mail e templates de email
3. **Task #4** - Adicionar campo email ao User e setup
4. **Task #8** - Criar templates de recuperação de senha
5. **Task #5** - Implementar recuperação de senha
6. **Task #6** - Implementar notificação de login
7. **Task #7** - Implementar 2FA/TOTP
8. **Task #11** - Adicionar interface 2FA no perfil

---

## ✅ Checklist de Segurança

- [ ] Tokens de reset expiram em 1 hora
- [ ] Tokens são únicos e não reutilizáveis
- [ ] Rate limiting em rotas sensíveis (esqueceu senha: 5/hora)
- [ ] Não revelar se email existe ou não (sempre mesma mensagem)
- [ ] Códigos de backup são de uso único
- [ ] Senhas continuam com requisitos fortes (12+ chars, maiúsculas, números, especiais)
- [ ] TOTP com janela de tolerância (aceita código anterior/posterior)
- [ ] Emails enviados em thread separada (não bloqueia requisição)
- [ ] Backup codes armazenados de forma segura no .env
- [ ] Session limpa após logout

---

## 🚀 Como Testar

### Recuperação de Senha
1. Ir para /login
2. Clicar em "Esqueceu a senha?"
3. Digitar email cadastrado
4. Verificar email recebido
5. Clicar no link (válido por 1h)
6. Definir nova senha
7. Fazer login com nova senha

### 2FA
1. Ir para /perfil
2. Clicar em "Ativar 2FA"
3. Escanear QR code com Google Authenticator
4. Digitar código de 6 dígitos
5. Guardar códigos de backup
6. Fazer logout
7. Fazer login (usuário + senha)
8. Digitar código 2FA
9. Testar código de backup

### Notificação de Login
1. Fazer login
2. Verificar email recebido com detalhes do acesso

---

## 📝 Notas Importantes

- Sistema de single-user (1 usuário apenas)
- Tokens armazenados em memória (reiniciar servidor = tokens inválidos)
- Para multi-user, migrar para banco de dados (SQLite/PostgreSQL)
- Backup codes são de uso único e devem ser guardados com segurança
- Email enviado em background (não bloqueia login)
- Compatível com Google Authenticator, Microsoft Authenticator, Authy, etc.

---

## 🎨 Melhorias Futuras (Opcional)

- [ ] Histórico de logins no perfil
- [ ] Sessões ativas (ver/revogar sessões abertas)
- [ ] Alertas de alteração de senha por email
- [ ] Limite de tentativas de login com bloqueio temporário
- [ ] Migrar tokens para banco de dados (persistência)
- [ ] Suporte a múltiplos usuários
- [ ] Logs de auditoria mais detalhados

---

**Última atualização:** 2026-08-19
