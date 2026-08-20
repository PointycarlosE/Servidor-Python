# Guia de Solução de Problemas

Este guia ajuda você a diagnosticar e corrigir problemas comuns com o Cloud Storage App.

## Índice

- [Problemas de Instalação](#problemas-de-instalação)
- [Problemas do Servidor](#problemas-do-servidor)
- [Problemas de Autenticação](#problemas-de-autenticação)
- [Problemas de Upload de Arquivos](#problemas-de-upload-de-arquivos)
- [Problemas de Email](#problemas-de-email)
- [Problemas de Deploy em Produção](#problemas-de-deploy-em-produção)
- [Problemas de Performance](#problemas-de-performance)
- [Problemas Mobile/Termux](#problemas-mobiletermux)

---

## Problemas de Instalação

### Versão do Python não suportada

**Problema:** Mensagem de erro sobre versão do Python muito antiga

**Solução:**
```bash
# Verifique sua versão do Python
python --version

# Se for menor que 3.10, instale uma versão mais nova:
# Ubuntu/Debian:
sudo apt install python3.10 python3.10-venv

# Windows: Baixe de python.org
# macOS: brew install python@3.10
```

### pip install falha com "externally-managed-environment"

**Problema:** Não é possível instalar pacotes com pip em algumas distribuições Linux

**Solução:**
Sempre use um ambiente virtual:
```bash
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Falha na ativação do ambiente virtual no Windows

**Problema:** PowerShell diz "a execução de scripts está desabilitada"

**Solução:**
```powershell
# Execute o PowerShell como Administrador e execute:
Set-ExecutionPolicy RemoteSigned

# Então tente ativar novamente:
venv\Scripts\Activate.ps1
```

### Biblioteca de ícones não carrega

**Problema:** Ícones aparecem como quadrados ou não aparecem

**Solução:**
1. Verifique se o arquivo existe: `ls frontend/static/js/lucide.min.js`
2. Se estiver faltando, baixe manualmente:
   ```bash
   curl -o frontend/static/js/lucide.min.js https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js
   ```
3. Verifique o console do navegador (F12) para erros
4. Limpe o cache do navegador (Ctrl+Shift+Delete)

---

## Problemas do Servidor

### Porta 5000 já está em uso

**Problema:** Erro: "Address already in use" ou "Porta 5000 está em uso"

**Solução:**

**Opção 1 - Mudar porta:**
Edite `instance/.env`:
```env
PORT=5001
```

**Opção 2 - Matar processo usando porta 5000:**
```bash
# Linux/macOS:
lsof -ti:5000 | xargs kill -9

# Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F
```

### Servidor inicia mas página não carrega

**Problema:** Servidor roda sem erros mas navegador não consegue conectar

**Checklist:**
1. Verifique se o servidor está ouvindo: Procure por mensagem "Running on http://0.0.0.0:5000"
2. Verifique se o firewall não está bloqueando a porta 5000
3. Tente acessar via endereço IP ao invés de localhost
4. Verifique se está usando http:// e não https:// no modo de desenvolvimento

### Servidor trava com "ModuleNotFoundError"

**Problema:** Pacote Python faltando

**Solução:**
```bash
# Certifique-se de que o ambiente virtual está ativado
source venv/bin/activate  # Linux/macOS
venv\Scripts\activate     # Windows

# Reinstale as dependências
pip install -r requirements.txt
```

### Página carrega mas estilização está quebrada

**Problema:** CSS não está carregando corretamente

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Verifique o console do navegador (F12) para erros 404
3. Verifique se os arquivos estáticos existem:
   ```bash
   ls frontend/static/css/style.css
   ls frontend/static/js/main.js
   ```
4. Tente hard refresh (Ctrl+Shift+R)

---

## Problemas de Autenticação

### Não consigo acessar a página /setup

**Problema:** Redireciona para login ou mostra 404

**Solução:**
- Delete o arquivo `instance/.firstrun` se existir
- Reinicie o servidor: `python run.py`
- Acesse `http://localhost:5000/setup`

### Esqueci a senha e não consigo resetar

**Problema:** Email de recuperação de senha não chega

**Soluções:**

**Se o email está configurado:**
1. Verifique a pasta de spam
2. Verifique as configurações de email em `instance/.env`
3. Verifique os logs do servidor para erros de email
4. Teste a conexão SMTP manualmente

**Se o email NÃO está configurado:**
Reset manual de senha:
```bash
# Pare o servidor
# Delete o banco de dados de usuários
rm instance/users.db
rm instance/.firstrun

# Reinicie o servidor e acesse /setup
python run.py
```

### Bloqueado da autenticação de dois fatores

**Problema:** Perdeu o app autenticador ou códigos de backup

**Solução:**
```bash
# Pare o servidor
# Abra o shell Python no diretório do projeto
python

# No shell Python:
from app.auth.models import User
user = User.load()
user.totp_secret = None
user.backup_codes = []
user.save()
exit()

# Reinicie o servidor - 2FA está desabilitado agora
```

### Login falha com "Rate limit exceeded"

**Problema:** Muitas tentativas de login falhadas

**Solução:**
Aguarde 1 minuto e tente novamente, ou reinicie o servidor para resetar os limites de taxa:
```bash
# Pressione Ctrl+C para parar
# Inicie novamente
python run.py
```

---

## Problemas de Upload de Arquivos

### Upload falha com "413 Request Entity Too Large"

**Problema:** Arquivo excede o limite de tamanho de upload

**Solução:**
Edite `instance/.env`:
```env
MAX_UPLOAD_MB=1000  # Aumente para o tamanho desejado em MB
```

Reinicie o servidor após a mudança.

### Upload falha com "File type not allowed"

**Problema:** Extensão do arquivo está bloqueada

**Solução:**
Edite `instance/.env` e modifique `BLOCKED_EXTENSIONS`:
```env
# Remova extensões que você quer permitir
BLOCKED_EXTENSIONS=.php,.exe,.sh
```

**Aviso:** Apenas permita extensões que você confia. Arquivos executáveis podem ser perigosos.

### Arrastar e soltar não funciona

**Problema:** Não consigo arrastar arquivos para fazer upload

**Checklist:**
1. Certifique-se de estar usando um navegador moderno (Chrome, Firefox, Safari, Edge)
2. Verifique o console do navegador (F12) para erros JavaScript
3. Verifique se `frontend/static/js/main.js` está carregando
4. Tente usar o botão de upload ao invés

### Progresso de upload travado em 99%

**Problema:** Upload parece travar próximo da conclusão

**Explicação:** Isto é normal para arquivos grandes. O servidor está processando o arquivo. Aguarde alguns momentos e deve completar.

Se realmente travou:
1. Verifique os logs do servidor para erros
2. Verifique o espaço disponível em disco
3. Tente fazer upload de um arquivo menor para testar

---

## Problemas de Email

### Emails de recuperação de senha não são enviados

**Problema:** Nenhum email chega após solicitar recuperação de senha

**Diagnóstico:**
1. Verifique o console do servidor para mensagens de erro
2. Verifique a configuração de email em `instance/.env`
3. Teste as credenciais SMTP:

```bash
# Teste a configuração de email
python

# No shell Python:
from flask_mail import Mail, Message
from flask import Flask

app = Flask(__name__)
app.config['MAIL_SERVER'] = 'smtp.gmail.com'
app.config['MAIL_PORT'] = 587
app.config['MAIL_USE_TLS'] = True
app.config['MAIL_USERNAME'] = 'seu-email@gmail.com'
app.config['MAIL_PASSWORD'] = 'sua-senha-de-app'

mail = Mail(app)

with app.app_context():
    msg = Message('Teste', sender='seu-email@gmail.com', recipients=['seu-email@gmail.com'])
    msg.body = 'Mensagem de teste'
    mail.send(msg)
    print("Email enviado com sucesso!")
```

### Erro "Authentication failed" do Gmail

**Problema:** Não é possível enviar emails com Gmail

**Solução:**
Gmail requer uma Senha de App, não sua senha regular:

1. Vá para [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
2. Selecione "E-mail" e seu dispositivo
3. Gere a senha
4. Use a senha gerada em `instance/.env`:
   ```env
   MAIL_PASSWORD=sua-senha-de-16-caracteres-de-app
   ```

### Falha ao enviar emails do Outlook

**Problema:** Erros SMTP com Outlook

**Solução:**
1. Habilite "Acesso de app menos seguro" nas configurações do Outlook
2. Ou use Senha de App como o Gmail
3. Verifique as configurações SMTP:
   ```env
   MAIL_SERVER=smtp-mail.outlook.com
   MAIL_PORT=587
   MAIL_USE_TLS=True
   ```

---

## Problemas de Deploy em Produção

### Conexão do Cloudflare Tunnel falha

**Problema:** "Unable to create tunnel" ou erros de conexão

**Soluções:**

**Verifique a instalação do Cloudflared:**
```bash
cloudflared --version
```

**Verifique se o firewall permite conexões de saída:**
- Cloudflared precisa conectar aos servidores do Cloudflare
- Verifique configurações de firewall corporativo/antivírus

**Tente método alternativo de instalação:**
```bash
# Se a instalação do pacote falhou, tente download do binário
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64 -o cloudflared
chmod +x cloudflared
sudo mv cloudflared /usr/local/bin/
```

### Erro 502 Bad Gateway na URL do Cloudflare

**Problema:** URL do Cloudflare mostra erro "Bad Gateway"

**Possíveis causas:**

1. **Gunicorn não está rodando:**
   ```bash
   # Verifique se o Gunicorn está rodando
   ps aux | grep gunicorn
   
   # Se não, inicie-o:
   bash start.sh
   ```

2. **Gunicorn travou:**
   ```bash
   # Verifique os logs
   tail -50 instance/gunicorn_error.log
   
   # Reinicie os serviços
   bash stop.sh
   bash start.sh
   ```

3. **Incompatibilidade de porta:**
   - Verifique se o Gunicorn está ouvindo na porta 5000
   - Verifique `app/gunicorn_config.py`: `bind = "0.0.0.0:5000"`

### Links compartilhados mostram "Inválido ou expirado" mas são válidos

**Problema:** Erros intermitentes em links compartilhados

**Solução:**
Isto foi corrigido em agosto de 2026. Atualize para a versão mais recente:
```bash
git pull origin main
bash stop.sh
bash start.sh
```

Se ainda tiver problemas:
```bash
# Verifique o número de workers do Gunicorn
grep "workers =" app/gunicorn_config.py

# Deve mostrar: workers = 1
# Se não, edite e mude para 1, então reinicie
```

### Scripts start.sh/stop.sh não funcionam

**Problema:** Permission denied ou comando não encontrado

**Solução:**
```bash
# Torne os scripts executáveis
chmod +x start.sh stop.sh url.sh

# Execute com bash explicitamente
bash start.sh
```

---

## Problemas de Performance

### Carregamento lento da página

**Possíveis causas e soluções:**

**1. Grande número de arquivos na pasta:**
- Reduza `ITEMS_PER_PAGE` em `instance/.env`
- Organize arquivos em subpastas
- Paginação atual carrega 100 itens por padrão

**2. I/O lento do disco:**
- Verifique espaço em disco: `df -h`
- Verifique saúde do disco
- Mova pasta de armazenamento para drive mais rápido (SSD)

**3. Latência de rede (acesso remoto):**
- Use Cloudflare Tunnel para melhor performance pela internet
- Verifique qualidade da rede local

### Alto uso de memória

**Problema:** Servidor usando muita RAM

**Solução:**
Reduza workers do Gunicorn em `app/gunicorn_config.py`:
```python
workers = 1  # Mude de 2 para 1
```

Para dispositivos muito limitados em recursos:
```bash
# Use o servidor de desenvolvimento Flask ao invés
python run.py
```

### Velocidades lentas de upload/download

**Causas:**

1. **Gargalo de rede:** Verifique velocidade da internet/Wi-Fi
2. **Limitação do Cloudflare:** Cloudflare Tunnels gratuitos têm limites de largura de banda
3. **Performance do dispositivo:** Dispositivos mais antigos processam arquivos mais devagar

**Soluções:**
- Use acesso à rede local quando possível
- Comprima arquivos antes de fazer upload
- Atualize o dispositivo se consistentemente lento

---

## Problemas Mobile/Termux

### Servidor do Termux para quando a tela bloqueia

**Problema:** Servidor morre quando a tela do telefone desliga

**Solução:**
1. **Desabilite otimização de bateria:**
   - Configurações Android → Apps → Termux
   - Bateria → Sem restrições

2. **Adquira wake lock:**
   ```bash
   termux-wake-lock
   ```

3. **Execute em background com tmux:**
   ```bash
   pkg install tmux
   tmux new -s server
   cd cloud-storage-app
   source venv/bin/activate
   python run.py
   
   # Desanexar: Ctrl+B depois D
   # Reanexar: tmux attach -t server
   ```

### Não consigo acessar armazenamento no Android

**Problema:** Permission denied ao acessar armazenamento do dispositivo

**Solução:**
```bash
# Conceda permissão de armazenamento
termux-setup-storage

# Aceite a solicitação de permissão no seu dispositivo

# Acesse armazenamento interno em:
cd ~/storage/shared
```

### App Termux continua fechando

**Problema:** Android mata o Termux

**Soluções:**
1. Desabilite otimização de bateria (veja acima)
2. Bloqueie o Termux nos apps recentes
3. Use Termux:Boot para auto-inicialização
4. Considere usar um VPS para disponibilidade 24/7

### Upload falha com "No space left on device"

**Problema:** Sem espaço de armazenamento

**Solução:**
```bash
# Verifique espaço disponível
df -h

# Limpe cache do Termux
apt clean

# Remova arquivos desnecessários
# Mova arquivos para cartão SD externo
```

---

## Modo Debug

Se ainda estiver tendo problemas, habilite o modo debug para mais informações:

Edite `instance/.env`:
```env
FLASK_ENV=development
```

Reinicie o servidor e verifique a saída do console para mensagens de erro detalhadas.

**Aviso:** Nunca use modo debug em produção pois pode expor informações sensíveis.

---

## Obtendo Ajuda

Se nenhuma dessas soluções funcionar:

1. **Verifique os logs do servidor:**
   ```bash
   # Modo desenvolvimento
   # Logs aparecem no console
   
   # Modo produção
   tail -100 instance/gunicorn_error.log
   tail -100 instance/gunicorn_access.log
   ```

2. **Habilite log de auditoria:**
   Verifique `instance/audit.log` para histórico de ações

3. **Crie uma issue:**
   - Vá para [GitHub Issues](https://github.com/PointycarlosE/cloud-storage-app/issues)
   - Inclua:
     - Plataforma (Linux/Windows/macOS/Termux)
     - Versão do Python
     - Mensagens de erro
     - Passos para reproduzir

4. **Verifique a documentação:**
   - [Guia de Instalação](INSTALLATION.md)
   - [Guia de Configuração](CONFIGURATION.md)
   - [Guia de Deploy](DEPLOYMENT.md)

---

## Mensagens de Erro Comuns

### "CSRF token missing"

**Causa:** Sessão expirou ou cookies desabilitados

**Solução:**
1. Habilite cookies no navegador
2. Limpe cache do navegador
3. Atualize a página

### "Rate limit exceeded"

**Causa:** Muitas requisições muito rapidamente

**Solução:** Aguarde 1 minuto e tente novamente

### "File path traversal detected"

**Causa:** Verificação de segurança bloqueou caminho de arquivo suspeito

**Solução:** Use nomes normais de arquivo/pasta sem caracteres especiais como `..` ou `/`

### "Worker failed to boot"

**Causa:** Erro na configuração do Gunicorn ou dependências

**Solução:**
```bash
# Verifique erros do Python
python -c "from app import create_app; create_app()"

# Se aparecerem erros, reinstale as dependências
pip install --force-reinstall -r requirements.txt
```

---

**Ainda precisa de ajuda?** Abra uma issue no GitHub com informações detalhadas sobre seu problema.
