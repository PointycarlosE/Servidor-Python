# Guia de Deploy

Este guia cobre o deploy do Cloud Storage App em produção com acesso HTTPS pela internet.

## Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Configuração Rápida de Produção](#configuração-rápida-de-produção)
- [Configuração do Cloudflare Tunnel](#configuração-do-cloudflare-tunnel)
- [Configuração do Gunicorn](#configuração-do-gunicorn)
- [Considerações de Segurança](#considerações-de-segurança)
- [Monitoramento e Manutenção](#monitoramento-e-manutenção)
- [Opções Avançadas de Deploy](#opções-avançadas-de-deploy)

---

## Visão Geral

Para deploy em produção, o Cloud Storage App usa:

- **Gunicorn**: Servidor WSGI de nível de produção
- **Cloudflare Tunnel**: Túnel HTTPS gratuito sem redirecionamento de portas
- **Modo produção**: Configurações de segurança aprimoradas

Esta configuração fornece:
- Criptografia HTTPS
- Sem necessidade de configuração do roteador
- Gerenciamento automático de certificado SSL
- Proteção DDoS do Cloudflare

---

## Pré-requisitos

- Cloud Storage App instalado e funcionando no modo de desenvolvimento
- CLI Cloudflared instalado
- Entendimento básico de linha de comando

**Plataformas Suportadas:**
- Linux (todas as distribuições)
- Windows (via WSL ou nativo)
- macOS
- Android (Termux)

---

## Configuração Rápida de Produção

### Passo 1: Configurar Modo Produção

Edite `instance/.env`:

```env
FLASK_ENV=production
```

Isto habilita:
- Cookies seguros (somente HTTPS)
- Headers HSTS
- Configurações otimizadas para produção
- Aplicação de rate limiting

### Passo 2: Instalar Cloudflare Tunnel

**Ubuntu/Debian/Mint:**
```bash
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb
rm cloudflared.deb
```

**Fedora/RHEL/CentOS:**
```bash
sudo rpm -i https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-x86_64.rpm
```

**macOS:**
```bash
brew install cloudflare/cloudflare/cloudflared
```

**Windows:**
Baixe de [Cloudflare Releases](https://github.com/cloudflare/cloudflared/releases) e adicione ao PATH.

**Android (Termux):**
```bash
pkg install cloudflared
```

Verifique a instalação:
```bash
cloudflared --version
```

### Passo 3: Iniciar Servidor de Produção

**Linux/macOS/Termux:**
```bash
# Navegue para o diretório do projeto
cd cloud-storage-app

# Inicie Gunicorn e Cloudflare Tunnel
bash start.sh
```

**Windows:**

O script `start.sh` é específico do Linux/macOS/Termux. No Windows, inicie os serviços manualmente:

```cmd
REM Navegue para o diretório do projeto
cd cloud-storage-app

REM Ative o ambiente virtual
venv\Scripts\activate

REM Inicie o Gunicorn em background
start /B gunicorn -c app/gunicorn_config.py "run:app"

REM Inicie o Cloudflare Tunnel (em outro terminal ou janela)
cloudflared tunnel --url http://localhost:5000
```

**Alternativa Windows (PowerShell):**
```powershell
# Navegue para o diretório do projeto
cd cloud-storage-app

# Ative o ambiente virtual
.\venv\Scripts\Activate.ps1

# Inicie o Gunicorn em background
Start-Process -NoNewWindow gunicorn -ArgumentList "-c", "app/gunicorn_config.py", "run:app"

# Inicie o Cloudflare Tunnel
cloudflared tunnel --url http://localhost:5000
```

O Cloudflare Tunnel mostrará uma URL HTTPS pública como:
```
https://palavras-aleatorias-aqui.trycloudflare.com
```

### Passo 4: Acessar Seu Servidor

Abra a URL fornecida em qualquer navegador. Você agora tem acesso HTTPS seguro de qualquer lugar!

> **⚠️ IMPORTANTE - URL Temporária:**
>
> A URL fornecida pelo túnel gratuito do Cloudflare (`https://palavras-aleatorias.trycloudflare.com`) é **temporária** e **muda toda vez que você reiniciar o servidor**.
>
> **Isso significa:**
> - ✅ Funciona perfeitamente enquanto o servidor está ligado
> - ❌ A URL para de funcionar quando você desliga o servidor
> - ❌ Ao reiniciar, você recebe uma URL diferente
> - ❌ Links compartilhados anteriormente param de funcionar
>
> **Soluções:**
> - **Para uso temporário:** Compartilhe a nova URL cada vez que reiniciar
> - **Para URL fixa permanente:** Configure um [Túnel Nomeado](#configurando-um-túnel-nomeado) (requer conta Cloudflare gratuita e domínio próprio)
> - **Para produção 24/7:** Use um VPS ou servidor dedicado que não desliga

**✓ Como testar se está funcionando:**
1. Copie a URL mostrada no terminal
2. Abra em um navegador (pode ser no mesmo computador ou outro dispositivo)
3. Você deve ver a página de login do Cloud Storage App
4. Se pedir senha, use as credenciais que configurou no setup

---

## Configuração do Cloudflare Tunnel

### Entendendo o Cloudflare Tunnel

O Cloudflare Tunnel cria uma conexão segura entre seu servidor local e a rede do Cloudflare, sem precisar de:
- Redirecionamento de portas no roteador
- Serviços de DNS dinâmico
- Gerenciamento de certificado SSL
- Endereço IP público

**Como funciona:**
1. Seu servidor roda Gunicorn em localhost:5000
2. Cloudflared cria um túnel para o Cloudflare
3. Cloudflare fornece uma URL HTTPS pública
4. Requisições são enviadas através do túnel para seu servidor

### Túneis Temporários vs. Nomeados

**Túneis Temporários (padrão):**
- Rápido de configurar
- URL muda a cada reinício
- Não precisa de conta Cloudflare
- Adequado para testes e compartilhamento temporário

**Túneis Nomeados (recomendado para deploys permanentes):**
- URL customizada fixa (meuapp.seudominio.com)
- Sobrevive a reinícios
- Requer conta Cloudflare
- Melhor para produção

### Configurando um Túnel Nomeado

Para um deploy de produção permanente com domínio customizado:

1. **Criar conta Cloudflare** (gratuito)

2. **Adicionar seu domínio ao Cloudflare**

3. **Criar um túnel:**
```bash
cloudflared tunnel login
cloudflared tunnel create meuapp
```

4. **Configurar o túnel:**

Crie `~/.cloudflared/config.yml`:
```yaml
tunnel: <TUNNEL-ID>
credentials-file: /home/usuario/.cloudflared/<TUNNEL-ID>.json

ingress:
  - hostname: drive.seudominio.com
    service: http://localhost:5000
  - service: http_status:404
```

5. **Criar registro DNS:**
```bash
cloudflared tunnel route dns meuapp drive.seudominio.com
```

6. **Atualizar start.sh** para usar túnel nomeado:

Substitua esta linha:
```bash
nohup cloudflared tunnel --url http://localhost:5000 \
```

Por:
```bash
nohup cloudflared tunnel run meuapp \
```

7. **Iniciar servidor:**
```bash
bash start.sh
```

Seu app estará disponível em `https://drive.seudominio.com`

---

## Configuração do Gunicorn

A configuração padrão em `app/gunicorn_config.py` é otimizada para uso geral:

```python
bind = "0.0.0.0:5000"
workers = 1
worker_class = 'sync'
timeout = 300
keepalive = 5
```

### Ajustando Workers

**Worker único (atual):**
- Melhor para dispositivos com poucos recursos (Termux, Raspberry Pi)
- Simplifica gerenciamento de estado
- Previne problemas de dessincronização

**Múltiplos workers:**
Para servidores mais potentes, você pode aumentar os workers:

```python
workers = 2  # ou mais
```

**Fórmula:** `workers = (2 × núcleos de CPU) + 1`

Exemplo:
- Servidor de 2 núcleos: 5 workers
- Servidor de 4 núcleos: 9 workers

**Nota:** Múltiplos workers requerem Redis para rate limiting:
```bash
pip install redis
sudo apt install redis-server  # Linux
```

Então atualize `app/__init__.py`:
```python
limiter.init_app(app, storage_uri='redis://localhost:6379')
```

### Ajustando Timeout

Para uploads muito grandes:
```python
timeout = 600  # 10 minutos
```

### Opções de Worker Class

**sync (padrão):**
- Simples e confiável
- Bom para a maioria dos casos

**gevent (assíncrono):**
```bash
pip install gevent
```

```python
worker_class = 'gevent'
workers = 10  # Pode lidar com mais conexões simultâneas
```

Melhor para muitos usuários simultâneos.

---

## Considerações de Segurança

### Checklist de Produção

- [ ] `FLASK_ENV=production` em `.env`
- [ ] Senha forte de administrador configurada
- [ ] Email configurado para notificações
- [ ] 2FA habilitado
- [ ] Log de auditoria monitorado regularmente
- [ ] Firewall configurado (se não usar Cloudflare Tunnel)
- [ ] Backups regulares da pasta `instance/`
- [ ] Acesso somente via HTTPS
- [ ] Rate limiting habilitado

### Protegendo Sua Instância

**1. Credenciais Fortes**
- Use um gerenciador de senhas
- Habilite 2FA imediatamente
- Nunca compartilhe credenciais

**2. Notificações por Email**
Configure email para receber alertas de login:
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-de-app
```

**3. Atualizações Regulares**
```bash
cd cloud-storage-app
git pull origin main
bash stop.sh
pip install --upgrade -r requirements.txt
bash start.sh
```

**4. Backup de Dados Importantes**
```bash
# Backup de configuração e banco de dados
tar -czf backup-$(date +%Y%m%d).tar.gz instance/
```

**5. Monitorar Logs de Auditoria**
```bash
tail -f instance/audit.log
```

### Segurança de Rede

**Usando Cloudflare Tunnel:**
- Nenhuma porta exposta no seu roteador
- Proteção DDoS do Cloudflare incluída
- Criptografia SSL/TLS automática

**Sem Cloudflare Tunnel (não recomendado):**
Se você deve expor portas diretamente:
```bash
# Use firewall para restringir acesso
sudo ufw allow 5000/tcp
sudo ufw enable

# Execute atrás de proxy reverso Nginx
# Configure SSL com Let's Encrypt
```

### Segurança de Upload de Arquivos

O app bloqueia tipos de arquivo perigosos por padrão (`.php`, `.exe`, `.sh`, etc.)

Para customizar, edite `instance/.env`:
```env
# Adicione extensões para bloquear (separadas por vírgula)
BLOCKED_EXTENSIONS=.php,.exe,.sh,.bat,.cmd,.com,.msi
```

**Aviso:** Apenas desbloqueie extensões se você entende as implicações de segurança.

---

## Monitoramento e Manutenção

### Verificando Status do Servidor

**Linux/macOS/Termux:**
```bash
# Ver processos em execução
ps aux | grep gunicorn
ps aux | grep cloudflared

# ✓ O que você deve ver:
# Gunicorn: uma ou mais linhas com "gunicorn" e "run:app"
# Cloudflared: uma linha com "cloudflared tunnel"

# Verificar logs (acompanha em tempo real)
tail -f instance/gunicorn_access.log

# ⚠️ Nota: O comando tail -f fica "travado" mostrando atualizações contínuas
# Isso é NORMAL - ele atualiza conforme novos acessos acontecem
# Para sair: pressione Ctrl+C

# Ver apenas as últimas linhas (sem ficar travado):
tail -50 instance/gunicorn_error.log
tail -50 instance/audit.log
```

**Windows (PowerShell):**
```powershell
# Ver processos em execução
Get-Process | Where-Object {$_.ProcessName -like "*gunicorn*"}
Get-Process | Where-Object {$_.ProcessName -like "*cloudflared*"}

# ✓ O que você deve ver:
# Linhas mostrando processos com nome "gunicorn" e "cloudflared"
# Se não aparecer nada, o processo não está rodando

# Verificar logs (últimas 50 linhas)
Get-Content instance\gunicorn_access.log -Tail 50
Get-Content instance\gunicorn_error.log -Tail 50
Get-Content instance\audit.log -Tail 50

# Para monitoramento contínuo (como tail -f):
Get-Content instance\gunicorn_access.log -Wait -Tail 50
# Pressione Ctrl+C para sair
```

**Windows (CMD):**
```cmd
REM Ver processos em execução
tasklist | findstr gunicorn
tasklist | findstr cloudflared

REM Verificar logs
type instance\gunicorn_error.log
```

### Reiniciar Servidor

**Linux/macOS/Termux:**
```bash
# Parar todos os serviços
bash stop.sh

# Iniciar novamente
bash start.sh

# Ver URL pública
bash url.sh
```

**Windows:**
```powershell
# Parar processos
Stop-Process -Name "gunicorn" -Force
Stop-Process -Name "cloudflared" -Force

# Iniciar novamente (veja Passo 3 acima)
```

### Inicialização Automática

**Linux (serviço systemd):**

Crie `/etc/systemd/system/cloud-storage.service`:
```ini
[Unit]
Description=Cloud Storage App
After=network.target

[Service]
Type=forking
User=seu-usuario
WorkingDirectory=/home/seu-usuario/cloud-storage-app
ExecStart=/home/seu-usuario/cloud-storage-app/start.sh
ExecStop=/home/seu-usuario/cloud-storage-app/stop.sh
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Habilite e inicie:
```bash
sudo systemctl daemon-reload
sudo systemctl enable cloud-storage
sudo systemctl start cloud-storage
```

**Windows (Agendador de Tarefas):**

1. Crie um script `start-windows.bat`:
```bat
@echo off
cd C:\caminho\para\cloud-storage-app
call venv\Scripts\activate.bat
start /B gunicorn -c app/gunicorn_config.py "run:app"
start /B cloudflared tunnel --url http://localhost:5000
```

2. Abra o Agendador de Tarefas (Task Scheduler)
3. Criar Tarefa Básica → Nome: "Cloud Storage App"
4. Gatilho: "Quando o computador iniciar"
5. Ação: "Iniciar um programa"
6. Programa: `C:\caminho\para\cloud-storage-app\start-windows.bat`
7. Finalizar

**macOS (LaunchAgent):**

Crie `~/Library/LaunchAgents/com.cloudstorageapp.plist`:
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.cloudstorageapp</string>
    <key>ProgramArguments</key>
    <array>
        <string>/bin/bash</string>
        <string>/Users/seu-usuario/cloud-storage-app/start.sh</string>
    </array>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
</dict>
</plist>
```

Carregue o serviço:
```bash
launchctl load ~/Library/LaunchAgents/com.cloudstorageapp.plist
```

**Termux (script de boot):**

Instale Termux:Boot do F-Droid, então crie:

`~/.termux/boot/start-cloud-storage`:
```bash
#!/data/data/com.termux/files/usr/bin/bash
termux-wake-lock
cd ~/cloud-storage-app
bash start.sh
```

Torne executável:
```bash
chmod +x ~/.termux/boot/start-cloud-storage
```

### Rotação de Logs

Logs são automaticamente rotacionados quando atingem 10MB (configurável em `app/config.py`).

**Rotação manual:**

**Linux/macOS/Termux:**
```bash
# Comprima logs antigos
gzip instance/audit.log

# Crie novo log vazio
touch instance/audit.log

# Reinicie para aplicar
bash stop.sh && bash start.sh
```

**Windows (PowerShell):**
```powershell
# Comprima logs antigos
Compress-Archive -Path instance\audit.log -DestinationPath instance\audit-backup.zip

# Crie novo log vazio
New-Item -Path instance\audit.log -ItemType File -Force

# Reinicie (pare os processos e inicie novamente conforme Passo 3)
```

---

## Opções Avançadas de Deploy

### Executando Atrás do Nginx

Para domínio customizado sem Cloudflare:

1. **Instalar Nginx:**
```bash
sudo apt install nginx
```

2. **Configurar Nginx:**

`/etc/nginx/sites-available/cloud-storage`:
```nginx
server {
    listen 80;
    server_name seudominio.com;

    location / {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

3. **Habilitar e reiniciar:**
```bash
sudo ln -s /etc/nginx/sites-available/cloud-storage /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

4. **Adicionar SSL com Let's Encrypt:**
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seudominio.com
```

### Deploy com Docker

Crie `Dockerfile`:
```dockerfile
FROM python:3.10-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN curl -o frontend/static/js/lucide.min.js \
    https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js

ENV FLASK_ENV=production
EXPOSE 5000

CMD ["gunicorn", "-c", "app/gunicorn_config.py", "run:app"]
```

Construir e executar:
```bash
docker build -t cloud-storage-app .
docker run -d -p 5000:5000 -v $(pwd)/instance:/app/instance cloud-storage-app
```

### Deploy em VPS

Para disponibilidade 24/7, faça deploy em um VPS (DigitalOcean, Linode, AWS, etc.):

1. **Provisionar um VPS** (1GB RAM mínimo)

2. **Instalar dependências:**
```bash
sudo apt update
sudo apt install python3 python3-pip git -y
```

3. **Clonar e configurar:**
```bash
git clone https://github.com/PointycarlosE/cloud-storage-app.git
cd cloud-storage-app
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

4. **Configurar modo produção** (veja acima)

5. **Configurar serviço systemd** (veja seção Monitoramento)

6. **Configurar firewall:**
```bash
sudo ufw allow OpenSSH
sudo ufw allow 5000/tcp
sudo ufw enable
```

7. **Iniciar servidor:**
```bash
bash start.sh
```

---

## Ajuste de Performance

### Para Dispositivos com Poucos Recursos (Termux, Raspberry Pi)

```python
# app/gunicorn_config.py
workers = 1
worker_class = 'sync'
timeout = 300
```

### Para Servidores de Alto Tráfego

```python
# app/gunicorn_config.py
workers = 9  # (2 × 4 núcleos) + 1
worker_class = 'gevent'
worker_connections = 1000
timeout = 120
keepalive = 5
```

Instale gevent:
```bash
pip install gevent
```

### Otimização de Banco de Dados

Para melhor performance com muitos arquivos:
```env
# instance/.env
ITEMS_PER_PAGE=50  # Carregar menos itens por página
```

---

## Solução de Problemas de Deploy

Veja [TROUBLESHOOTING.md](TROUBLESHOOTING.md#problemas-de-deploy-em-produção) para problemas comuns de deploy.

Verificações rápidas:
```bash
# Verificar se Gunicorn está rodando
ps aux | grep gunicorn

# Verificar logs do Gunicorn
tail -50 instance/gunicorn_error.log

# Testar acesso local
curl http://localhost:5000

# Verificar Cloudflare Tunnel
ps aux | grep cloudflared
cat instance/cloudflared.log
```

---

## Checklist de Deploy em Produção

Antes de entrar no ar:

- [ ] Testado em modo desenvolvimento
- [ ] `FLASK_ENV=production` configurado
- [ ] Senha forte configurada
- [ ] 2FA habilitado
- [ ] Email configurado e testado
- [ ] Pasta de armazenamento tem espaço adequado
- [ ] Estratégia de backup implementada
- [ ] Monitoramento configurado (logs, systemd)
- [ ] Cloudflare Tunnel testado
- [ ] Links compartilhados testados
- [ ] Upload/download testados
- [ ] Interface mobile testada
- [ ] Procedimento de recuperação documentado

---

## Próximos Passos

- [Configurar configurações avançadas](CONFIGURATION.md)
- [Aprender sobre todos os recursos](FEATURES.md)
- [Revisar melhores práticas de segurança](#considerações-de-segurança)
- [Configurar monitoramento](#monitoramento-e-manutenção)
