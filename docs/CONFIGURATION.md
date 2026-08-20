# Guia de Configuração

Este guia cobre todas as configurações disponíveis no Cloud Storage App e como personalizá-las.

## Índice

- [Arquivo de Configuração](#arquivo-de-configuração)
- [Variáveis de Ambiente](#variáveis-de-ambiente)
- [Configurações de Segurança](#configurações-de-segurança)
- [Configurações de Email](#configurações-de-email)
- [Limites e Restrições](#limites-e-restrições)
- [Rate Limiting](#rate-limiting)
- [Personalização da Interface](#personalização-da-interface)
- [Configurações Avançadas](#configurações-avançadas)

---

## Arquivo de Configuração

Todas as configurações personalizáveis ficam no arquivo `instance/.env`. Este arquivo é criado automaticamente durante o setup inicial.

**Localização do arquivo:**

- **Linux/macOS:** `/caminho/completo/para/cloud-storage-app/instance/.env`
  - Exemplo: `/home/carlos/cloud-storage-app/instance/.env`
- **Windows:** `C:\caminho\completo\para\cloud-storage-app\instance\.env`
  - Exemplo: `C:\Users\Carlos\cloud-storage-app\instance\.env`
- **Termux:** `/data/data/com.termux/files/home/cloud-storage-app/instance/.env`

**Para encontrar o caminho exato:**
```bash
# Linux/macOS/Termux - execute dentro da pasta do projeto:
pwd
# Adicione /instance/.env ao final

# Windows (CMD):
cd
# Adicione \instance\.env ao final
```

**Importante:** 
- Nunca compartilhe este arquivo (contém informações sensíveis)
- Faça backup regularmente
- Reinicie o servidor após alterar configurações

> **⚠️ AVISO CRÍTICO:** Algumas configurações neste arquivo nunca devem ser alteradas manualmente:
> - `SECRET_KEY` - Alterar deslogará todos os usuários e pode causar perda de sessões
> - `ADMIN_PASSWORD_HASH` - Nunca edite diretamente, use a interface de perfil para mudar senha
> - `ADMIN_TOTP_SECRET` e `ADMIN_BACKUP_CODES` - Gerados automaticamente pelo sistema 2FA
>
> Edite apenas as configurações documentadas abaixo, e sempre faça backup antes de qualquer alteração.

---

## Variáveis de Ambiente

### Configurações Básicas

#### FLASK_ENV
Define o modo de execução do aplicativo.

```env
FLASK_ENV=development  # ou production
```

**Valores:**
- `development` - Modo de desenvolvimento (debug habilitado, sem HTTPS obrigatório)
- `production` - Modo de produção (segurança máxima, HTTPS obrigatório)

**Recomendação:** Use `development` para testes locais e `production` para acesso via internet.

#### PORT
Porta em que o servidor vai escutar.

```env
PORT=5000
```

**Padrão:** 5000  
**Intervalo:** 1024-65535

#### SECRET_KEY
Chave secreta para criptografia de sessões (gerada automaticamente no setup).

```env
SECRET_KEY=sua-chave-secreta-de-64-caracteres
```

> **🚨 NUNCA ALTERE ESTA CHAVE!**
> 
> **O que acontece se você alterar:**
> - Todos os usuários serão deslogados imediatamente
> - Todas as sessões ativas se tornarão inválidas
> - Links de recuperação de senha param de funcionar
> - Você terá que fazer login novamente
>
> **Quando alterar:** Somente se houver comprometimento de segurança (vazamento da chave). Se alterar, todos precisarão fazer login novamente.

### Configurações de Usuário

#### ADMIN_USERNAME
Nome de usuário para login.

```env
ADMIN_USERNAME=admin
```

#### ADMIN_PASSWORD_HASH
Hash da senha do administrador (não altere manualmente).

```env
ADMIN_PASSWORD_HASH=pbkdf2:sha256:600000$...
```

Para mudar a senha, use a interface de perfil do usuário.

#### ADMIN_NOME
Nome de exibição do usuário na interface.

```env
ADMIN_NOME=Carlos
```

#### ADMIN_EMAIL
Email do administrador para recuperação de senha.

```env
ADMIN_EMAIL=seu-email@gmail.com
```

#### ADMIN_TEMA
Tema padrão da interface.

```env
ADMIN_TEMA=dark  # ou light
```

### Configurações de Armazenamento

#### PASTA_BASE
Diretório onde os arquivos serão armazenados.

```env
# Linux/macOS
PASTA_BASE=/home/usuario/Documentos

# Windows
PASTA_BASE=C:\Users\Usuario\Documents

# Termux
PASTA_BASE=/data/data/com.termux/files/home/storage/shared/Documents
```

**Importante:** O caminho deve existir e ter permissões de leitura/escrita.

---

## Configurações de Segurança

### Autenticação de Dois Fatores

Configurações de 2FA são gerenciadas pela interface (não no .env).

**Para habilitar:**
1. Faça login
2. Vá em Perfil
3. Ative "Autenticação de Dois Fatores"
4. Escaneie o QR code com Google Authenticator

**Variáveis relacionadas (geradas automaticamente):**
```env
ADMIN_TOTP_SECRET=sua-chave-totp
ADMIN_BACKUP_CODES=["codigo1", "codigo2", ...]
```

### Extensões de Arquivo Bloqueadas

Lista de extensões que não podem ser enviadas.

```env
BLOCKED_EXTENSIONS=.php,.exe,.sh,.bat,.cmd,.com,.msi,.scr,.vbs
```

**Padrão:** Bloqueia arquivos executáveis perigosos  
**Formato:** Extensões separadas por vírgula, com ponto

**Exemplo - Adicionar extensões:**
```env
BLOCKED_EXTENSIONS=.php,.exe,.sh,.bat,.cmd,.com,.msi,.scr,.vbs,.jar,.apk
```

**Aviso:** Remova extensões apenas se você entende os riscos de segurança.

### Log de Auditoria

#### AUDIT_LOG_PATH
Localização do arquivo de log de auditoria.

```env
# Padrão (não precisa definir)
# AUDIT_LOG_PATH=instance/audit.log
```

#### AUDIT_LOG_MAX_MB
Tamanho máximo do arquivo de log antes da rotação automática.

```env
AUDIT_LOG_MAX_MB=10  # Em megabytes
```

**Padrão:** 10 MB

---

## Configurações de Email

Configure o email para habilitar:
- Recuperação de senha
- Notificações de login
- Códigos de 2FA por email (futuro)

### Gmail

```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-de-app-de-16-caracteres
MAIL_DEFAULT_SENDER=seu-email@gmail.com
```

**Obter senha de app:**
1. Acesse [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecione "E-mail" e seu dispositivo
3. Gere a senha
4. Use a senha gerada (16 caracteres sem espaços)

### Outlook/Hotmail

```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@outlook.com
MAIL_PASSWORD=sua-senha
MAIL_DEFAULT_SENDER=seu-email@outlook.com
```

### SMTP Customizado

```env
MAIL_SERVER=smtp.seudominio.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USE_SSL=False
MAIL_USERNAME=seu-email@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_DEFAULT_SENDER=seu-email@seudominio.com
```

**Portas comuns:**
- 587 - STARTTLS (recomendado)
- 465 - SSL/TLS
- 25 - Não criptografado (não recomendado)

---

## Limites e Restrições

### Limites de Upload

#### MAX_UPLOAD_MB
Tamanho máximo total de upload por requisição.

```env
MAX_UPLOAD_MB=500  # Em megabytes
```

**Padrão:** 500 MB  
**Recomendação:** 
- Dispositivos móveis: 100-500 MB
- Computadores: 500-2000 MB
- Servidores: 2000+ MB

#### MAX_FILE_SIZE_MB
Tamanho máximo por arquivo individual (não implementado ainda, planejado para futuro).

```env
MAX_FILE_SIZE_MB=100
```

### Limites de Download

#### MAX_ZIP_FILES
Número máximo de arquivos em um download ZIP.

```env
MAX_ZIP_FILES=100
```

**Padrão:** 100 arquivos  
**Motivo:** Evitar sobrecarga do servidor

#### MAX_ZIP_SIZE_MB
Tamanho máximo total de um arquivo ZIP.

```env
MAX_ZIP_SIZE_MB=1024  # 1 GB
```

**Padrão:** 1024 MB (1 GB)

### Paginação

#### ITEMS_PER_PAGE
Quantidade de arquivos carregados por página.

```env
ITEMS_PER_PAGE=100
```

**Padrão:** 100  
**Recomendação:**
- Pastas com poucos arquivos: 100-200
- Pastas com muitos arquivos: 50-100
- Dispositivos lentos: 25-50

---

## Rate Limiting

Proteção contra abuso e ataques de força bruta.

### RATELIMIT_DEFAULT
Limite padrão para rotas normais.

```env
RATELIMIT_DEFAULT=60 per minute
```

**Formato:** `<número> per <unidade>`  
**Unidades:** second, minute, hour, day

### RATELIMIT_LOGIN
Limite para tentativas de login.

```env
RATELIMIT_LOGIN=10 per minute
```

**Padrão:** 10 tentativas por minuto  
**Motivo:** Protege contra ataques de força bruta

### RATELIMIT_UPLOAD
Limite para uploads de arquivo.

```env
RATELIMIT_UPLOAD=20 per minute
```

**Padrão:** 20 uploads por minuto

### RATELIMIT_DELETE
Limite para exclusão de arquivos.

```env
RATELIMIT_DELETE=30 per minute
```

**Padrão:** 30 exclusões por minuto

### RATELIMIT_ZIP
Limite para downloads em ZIP.

```env
RATELIMIT_ZIP=5 per minute
```

**Padrão:** 5 downloads ZIP por minuto  
**Motivo:** Downloads ZIP consomem mais recursos

### Rate Limiting com Redis (Produção)

Para múltiplos workers Gunicorn, use Redis:

**1. Instalar Redis:**
```bash
pip install redis
sudo apt install redis-server  # Linux
brew install redis  # macOS
```

**2. Configurar no código:**

> **⚠️ ATENÇÃO: Você vai editar código Python**
>
> **Antes de continuar:**
> - Faça backup do arquivo `app/__init__.py`
> - Tenha certeza do que está fazendo
> - Um erro aqui pode impedir o servidor de iniciar
>
> **Consequências de erros:**
> - Servidor não inicia (erro de sintaxe)
> - Rate limiting para de funcionar
> - Possível perda de proteção contra ataques
>
> **Alternativa segura:** Se não se sentir confortável editando código, mantenha apenas 1 worker do Gunicorn (configuração padrão) e pule esta seção.

Edite `app/__init__.py`:
```python
# Encontre esta linha (por volta da linha 120):
limiter.init_app(app)

# Substitua por:
limiter.init_app(app, storage_uri='redis://localhost:6379')
```

**3. Iniciar Redis:**
```bash
sudo systemctl start redis  # Linux
brew services start redis   # macOS
```

**4. Verificar se funcionou:**
```bash
# Inicie o servidor normalmente
python run.py

# Se aparecer erro sobre Redis, reverta a mudança:
# Volte para: limiter.init_app(app)
```

---

## Personalização da Interface

### Tema Padrão

O tema é definido por usuário e salvo em `ADMIN_TEMA`.

**Alterar via interface:**
1. Login → Perfil
2. Selecione o tema desejado
3. Salvar

**Alterar manualmente:**
```env
ADMIN_TEMA=dark  # ou light
```

### Favicon

Substitua o arquivo:
```
frontend/static/img/favicon.png
frontend/static/img/favicon.ico
```

**Recomendação:** 
- PNG: 192x192 pixels
- ICO: 32x32 pixels

---

## Configurações Avançadas

### Modo Debug

**Nunca use em produção!**

```env
FLASK_ENV=development
FLASK_DEBUG=true
```

Habilita:
- Mensagens de erro detalhadas
- Recarregamento automático de código
- Ferramentas de debug

### Timeout de Sessão

Configurado em `app/config.py`:

```python
PERMANENT_SESSION_LIFETIME = 8 * 60 * 60  # 8 horas em segundos
```

Para alterar, edite o arquivo e reinicie o servidor.

### Configuração do Gunicorn

Arquivo: `app/gunicorn_config.py`

**Workers:**
```python
workers = 1  # Número de processos worker
```

**Timeout:**
```python
timeout = 300  # Segundos
```

**Bind:**
```python
bind = "0.0.0.0:5000"
```

Veja [DEPLOYMENT.md](DEPLOYMENT.md#configuração-do-gunicorn) para mais detalhes.

### Headers de Segurança

Configurados automaticamente em modo produção:
- `Strict-Transport-Security` (HSTS)
- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Content-Security-Policy`
- `Referrer-Policy`

Para customizar, edite `app/__init__.py` na função `registrar_headers_seguranca()`.

---

## Exemplo de Configuração Completa

```env
# ===== AMBIENTE =====
FLASK_ENV=production

# ===== CREDENCIAIS (geradas no setup) =====
SECRET_KEY=chave-secreta-gerada-automaticamente
ADMIN_USERNAME=admin
ADMIN_NOME=Carlos
ADMIN_EMAIL=carlos@example.com
ADMIN_PASSWORD_HASH=pbkdf2:sha256:600000$...
ADMIN_TEMA=dark

# ===== ARMAZENAMENTO =====
PASTA_BASE=/home/carlos/Documentos

# ===== LIMITES =====
MAX_UPLOAD_MB=500
MAX_ZIP_FILES=100
MAX_ZIP_SIZE_MB=1024
ITEMS_PER_PAGE=100
PORT=5000

# ===== SEGURANÇA =====
BLOCKED_EXTENSIONS=.php,.exe,.sh,.bat,.cmd,.com,.msi,.scr,.vbs
AUDIT_LOG_MAX_MB=10

# ===== RATE LIMITING =====
RATELIMIT_DEFAULT=60 per minute
RATELIMIT_LOGIN=10 per minute
RATELIMIT_UPLOAD=20 per minute
RATELIMIT_DELETE=30 per minute
RATELIMIT_ZIP=5 per minute

# ===== EMAIL =====
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=carlos@gmail.com
MAIL_PASSWORD=sua-senha-de-app
MAIL_DEFAULT_SENDER=carlos@gmail.com

# ===== 2FA (gerado automaticamente quando habilitado) =====
ADMIN_TOTP_SECRET=chave-totp-gerada
ADMIN_BACKUP_CODES=["codigo1", "codigo2", ...]
```

---

## Aplicando Mudanças

Após alterar qualquer configuração em `instance/.env`:

```bash
# Modo desenvolvimento
# Pressione Ctrl+C e execute novamente:
python run.py

# Modo produção
bash stop.sh
bash start.sh
```

---

## Solução de Problemas

### Configuração não aplicada

- Verifique se o arquivo está em `instance/.env` (não na raiz)
- Verifique sintaxe: `CHAVE=valor` (sem espaços ao redor do `=`)
- Reinicie o servidor após alterar

### Email não funciona

- Verifique credenciais SMTP
- Gmail: use senha de app, não senha normal
- Teste conexão SMTP manualmente (veja [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problemas-de-email))

### Rate limit muito restritivo

Aumente os limites em `instance/.env`:
```env
RATELIMIT_DEFAULT=120 per minute
RATELIMIT_LOGIN=20 per minute
```

---

## Próximos Passos

- [Fazer deploy em produção](DEPLOYMENT.md)
- [Aprender sobre recursos](FEATURES.md)
- [Solucionar problemas](TROUBLESHOOTING.md)
