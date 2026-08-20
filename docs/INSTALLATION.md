# Guia de Instalação

Este guia fornece instruções detalhadas de instalação para todas as plataformas suportadas.

## Antes de Começar

### O que você vai precisar saber

Se você nunca usou **terminal** ou **linha de comando** antes, não se preocupe! Vamos explicar cada passo.

**Termos básicos que vamos usar:**
- **Terminal/Prompt/Console:** Janela onde você digita comandos de texto
- **Comando:** Instrução de texto que você digita e pressiona Enter
- **Ambiente virtual (venv):** Instalação isolada do Python só para este projeto (não afeta outros programas)
- **Git:** Ferramenta para baixar código de repositórios online
- **pip:** Gerenciador de pacotes do Python (instala bibliotecas necessárias)

**Como abrir o terminal:**
- **Windows:** Pressione Win+R, digite `cmd` e pressione Enter
- **macOS:** Pressione Cmd+Espaço, digite "Terminal" e pressione Enter
- **Linux:** Pressione Ctrl+Alt+T (na maioria das distribuições)

### Verificando pré-requisitos

Antes de começar, verifique se você tem Python e Git instalados:

```bash
# Verificar Python
python --version
# Ou tente: python3 --version (Linux/macOS) ou py --version (Windows)

# Verificar Git
git --version
```

**✓ O que você deve ver:**
- Python: `Python 3.10.x` ou superior (qualquer versão 3.10+)
- Git: `git version 2.x.x` ou similar

**❌ Se aparecer "comando não encontrado" ou erro:**
- Python não instalado → [Baixe aqui](https://www.python.org/downloads/)
- Git não instalado → [Baixe aqui](https://git-scm.com/downloads)

---

## Índice

- [Linux](#linux)
- [Windows](#windows)
- [macOS](#macos)
- [Android (Termux)](#android-termux)
- [Configuração Pós-Instalação](#configuração-pós-instalação)
- [Verificando a Instalação](#verificando-a-instalação)

---

## Linux

### Pré-requisitos

- Python 3.10 ou superior
- Git
- curl ou wget (para baixar dependências)

### Ubuntu/Debian/Mint

```bash
# Atualize a lista de pacotes
# (Vai pedir sua senha de administrador - é normal e seguro)
sudo apt update

# Instale Python e Git
sudo apt install python3 python3-pip python3-venv git curl -y

# Clone o repositório
git clone https://github.com/PointycarlosE/cloud-storage-app.git
cd cloud-storage-app

# ✓ Você deve ver: uma pasta "cloud-storage-app" foi criada

# Crie o ambiente virtual
python3 -m venv venv

# ✓ Você deve ver: uma pasta "venv" foi criada dentro de cloud-storage-app

# Ative o ambiente virtual
source venv/bin/activate

# ✓ Você deve ver: (venv) aparece antes do cursor no terminal

# Instale as dependências
pip install -r requirements.txt

# ✓ Você deve ver: várias linhas de "Successfully installed..."

# Baixe a biblioteca de ícones
curl -o frontend/static/js/lucide.min.js https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js

# ✓ Verifique se baixou:
ls -lh frontend/static/js/lucide.min.js
# Deve mostrar um arquivo de ~60KB
```

> **💡 Dica:** Se `python3` não funcionar, alguns sistemas usam apenas `python`. Tente ambos.

### Fedora/RHEL/CentOS

```bash
# Instale Python e Git
sudo dnf install python3 python3-pip git curl -y

# Siga os mesmos passos do Ubuntu a partir de "Clone o repositório"
```

### Arch Linux

```bash
# Instale Python e Git
sudo pacman -S python python-pip git curl

# Siga os mesmos passos do Ubuntu a partir de "Clone o repositório"
```

---

## Windows

### Pré-requisitos

- Python 3.10 ou superior ([Download](https://www.python.org/downloads/))
- Git ([Download](https://git-scm.com/download/win))

> **⚠️ IMPORTANTE ao instalar Python no Windows:** Durante a instalação, **marque a opção "Add Python to PATH"**. Sem isso, os comandos não funcionarão.

### Passos de Instalação

1. **Instalar Python**
   - Baixe o Python de [python.org](https://www.python.org/downloads/)
   - Execute o instalador
   - ✅ **MARQUE "Add Python to PATH"** (opção na primeira tela)
   - Clique em "Install Now"
   - Verifique: Abra um novo Prompt de Comando e digite `python --version` ou `py --version`

2. **Instalar Git**
   - Baixe o Git de [git-scm.com](https://git-scm.com/download/win)
   - Use as opções padrão de instalação
   - Verifique: `git --version`

3. **Clonar e Configurar**

   **Opção A: Usando Prompt de Comando (CMD) - Recomendado para iniciantes**

   ```cmd
   REM Clone o repositório
   git clone https://github.com/PointycarlosE/cloud-storage-app.git
   cd cloud-storage-app

   REM ✓ Você deve ver: o prompt agora mostra o caminho para cloud-storage-app

   REM Crie o ambiente virtual
   python -m venv venv
   REM Se não funcionar, tente: py -m venv venv

   REM ✓ Você deve ver: uma pasta "venv" foi criada (use o comando: dir)

   REM Ative o ambiente virtual
   venv\Scripts\activate.bat

   REM ✓ Você deve ver: (venv) aparece antes do prompt

   REM Instale as dependências
   pip install -r requirements.txt

   REM ✓ Você deve ver: muitas linhas de instalação terminando com "Successfully installed"

   REM Baixe a biblioteca de ícones
   REM Copie e cole esta linha inteira (é um comando só):
   powershell -Command "Invoke-WebRequest -Uri 'https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js' -OutFile 'frontend/static/js/lucide.min.js'"

   REM ✓ Verifique se baixou:
   dir frontend\static\js\lucide.min.js
   ```

   **Opção B: Usando PowerShell**

   ```powershell
   # Clone o repositório
   git clone https://github.com/PointycarlosE/cloud-storage-app.git
   cd cloud-storage-app

   # Crie o ambiente virtual
   python -m venv venv

   # Ative o ambiente virtual
   .\venv\Scripts\Activate.ps1

   # Se aparecer erro de "execução de scripts desabilitada":
   # Execute: Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   # Depois tente ativar novamente

   # ✓ Você deve ver: (venv) aparece antes do prompt

   # Instale as dependências
   pip install -r requirements.txt

   # Baixe a biblioteca de ícones
   Invoke-WebRequest -Uri 'https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js' -OutFile 'frontend/static/js/lucide.min.js'

   # ✓ Verifique:
   Get-Item frontend\static\js\lucide.min.js
   ```

> **💡 Qual usar?** Se é sua primeira vez, use o **Prompt de Comando (CMD)**. É mais simples e tem menos problemas de permissão.

---

## macOS

### Pré-requisitos

- Python 3.10 ou superior
- Git
- Homebrew (recomendado para gerenciamento de pacotes)

### Passos de Instalação

1. **Instalar Homebrew** (se ainda não estiver instalado)

   ```bash
   /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
   ```

2. **Instalar Python e Git**

   ```bash
   # Instale Python 3.10+
   brew install python@3.10

   # Instale Git (geralmente já vem pré-instalado no macOS)
   brew install git
   ```

3. **Clonar e Configurar**

   ```bash
   # Clone o repositório
   git clone https://github.com/PointycarlosE/cloud-storage-app.git
   cd cloud-storage-app

   # Crie o ambiente virtual
   python3 -m venv venv

   # Ative o ambiente virtual
   source venv/bin/activate

   # Instale as dependências
   pip install -r requirements.txt

   # Baixe a biblioteca de ícones
   curl -o frontend/static/js/lucide.min.js https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js
   ```

### Alternativa: Sem Homebrew

Se preferir não usar Homebrew, baixe o Python diretamente de [python.org](https://www.python.org/downloads/macos/) e siga os mesmos passos acima.

---

## Android (Termux)

O Cloud Storage App funciona perfeitamente em dispositivos Android usando o Termux!

### Pré-requisitos

- Dispositivo Android com Termux instalado ([F-Droid](https://f-droid.org/packages/com.termux/) ou [Google Play](https://play.google.com/store/apps/details?id=com.termux))
- Pelo menos 500MB de armazenamento livre

### Passos de Instalação

1. **Atualizar pacotes do Termux**

   ```bash
   pkg update && pkg upgrade -y
   ```

2. **Instalar dependências**

   ```bash
   pkg install python git curl -y
   ```

3. **Clonar e configurar**

   ```bash
   # Clone o repositório
   git clone https://github.com/PointycarlosE/cloud-storage-app.git
   cd cloud-storage-app

   # Crie o ambiente virtual
   python -m venv venv

   # Ative o ambiente virtual
   source venv/bin/activate

   # Instale as dependências
   pip install -r requirements.txt

   # Baixe a biblioteca de ícones
   curl -o frontend/static/js/lucide.min.js https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js
   ```

### Notas Específicas do Termux

- **Acesso ao Armazenamento**: Conceda permissões de armazenamento ao Termux para acessar os arquivos do seu dispositivo:
  ```bash
  termux-setup-storage
  ```

- **Otimização de Bateria**: Desabilite a otimização de bateria para o Termux nas configurações do Android para evitar que o servidor seja encerrado

- **Execução em Background**: Use `termux-wake-lock` para manter o Termux rodando em segundo plano:
  ```bash
  termux-wake-lock
  ```

- **Inicialização Automática**: Para iniciar o servidor automaticamente quando o Termux abrir, adicione isto ao `~/.bashrc`:
  ```bash
  echo "cd ~/cloud-storage-app && source venv/bin/activate" >> ~/.bashrc
  ```

---

## Configuração Pós-Instalação

Após instalar em qualquer plataforma, siga estes passos:

### 1. Primeira Execução

```bash
# Certifique-se de que o ambiente virtual está ativado
# Você deve ver (venv) antes do cursor no terminal
# Se não estiver ativado, veja a seção de instalação da sua plataforma acima

# Então inicie o servidor
python run.py
```

**✓ O que você deve ver:**
```
🆕 Primeira execução detectada!
   Acesse http://localhost:5000/setup para configurar

 * Serving Flask app 'app'
 * Debug mode: on
 * Running on http://0.0.0.0:5000
```

> **💡 Dica:** O servidor está rodando quando você vê "Running on http://0.0.0.0:5000". **Não feche esta janela** enquanto usar o aplicativo.

### 2. Configuração Inicial

Abra seu navegador web e navegue até `http://localhost:5000/setup`

Configure o seguinte:
- **Nome de Usuário**: Seu nome de usuário de login (escolha um que você lembre facilmente)
- **Senha**: Uma senha forte (mínimo 8 caracteres, com letras e números)
- **Nome de Exibição**: Nome mostrado na interface (pode ser seu nome real ou apelido)
- **Email**: Seu endereço de email (necessário para recuperação de senha)
- **Pasta de Armazenamento**: Caminho completo onde os arquivos serão armazenados

**Exemplos de pastas de armazenamento:**
- Linux: `/home/seu-usuario/Documentos` ou `/home/seu-usuario/MeusArquivos`
- macOS: `/Users/seu-usuario/Documents` ou `/Users/seu-usuario/MyFiles`
- Windows: `C:\Users\SeuNome\Documents` ou `C:\Users\SeuNome\MeusArquivos`
- Termux: `/data/data/com.termux/files/home/storage/shared/Documents`

> **⚠️ Importante:** 
> - A pasta DEVE existir antes (crie ela primeiro se não existir)
> - Use o caminho completo (não use `~` ou caminhos relativos)
> - No Windows, use barras invertidas `\` ou barras normais `/` (ambos funcionam)
> - Anote seu usuário e senha - não há como recuperar sem email configurado

### 3. Configuração de Email (Opcional mas Recomendado)

Para recuperação de senha e notificações de login, configure o email em `instance/.env`:

**Exemplo Gmail:**
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=sua-senha-de-app
MAIL_DEFAULT_SENDER=seu-email@gmail.com
```

**Importante**: Gmail requer uma Senha de App. Gere uma em [myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)

**Exemplo Outlook:**
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@outlook.com
MAIL_PASSWORD=sua-senha
MAIL_DEFAULT_SENDER=seu-email@outlook.com
```

Após configurar o email, reinicie o servidor:
```bash
# Pressione Ctrl+C para parar, então execute novamente
python run.py
```

---

## Verificando a Instalação

### Verificar Versão do Python

```bash
python --version
# Deve mostrar: Python 3.10.x ou superior
```

### Verificar Dependências

```bash
# Ative o ambiente virtual primeiro
pip list
```

Você deve ver pacotes como:
- Flask
- Werkzeug
- gunicorn
- Flask-Login
- Flask-Mail
- Flask-Limiter
- pyotp
- qrcode

### Testar o Servidor

1. Inicie o servidor: `python run.py`
2. Abra o navegador: `http://localhost:5000`
3. Você deve ver:
   - Página de setup (primeira execução)
   - Página de login (após setup)

### Teste de Acesso à Rede

Para testar acesso de outro dispositivo na sua rede local:

1. Encontre seu endereço IP local:
   - **Linux/macOS**: `ip addr` ou `ifconfig`
   - **Windows**: `ipconfig`
   - **Termux**: `ip addr`

2. Procure seu IP local (geralmente começa com `192.168.` ou `10.`)

3. De outro dispositivo na mesma rede, visite: `http://SEU_IP_LOCAL:5000`

---

## Solução de Problemas de Instalação

### Problemas Comuns

**1. "Python not found"**
- Certifique-se de que o Python está instalado e adicionado ao PATH
- Tente usar `python3` ao invés de `python`

**2. "pip not found"**
- Instale o pip: `python -m ensurepip --upgrade`

**3. Erros de "Permission denied" no Linux/macOS**
- Não use `sudo` com pip em um ambiente virtual
- Certifique-se de ter ativado o ambiente virtual

**4. Falha na ativação do ambiente virtual**
- **Windows**: Use `venv\Scripts\activate.bat` para CMD ou `venv\Scripts\Activate.ps1` para PowerShell
- **Linux/macOS**: Use `source venv/bin/activate`

**5. Falha no download da biblioteca de ícones**
- Baixe manualmente de [https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js](https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js)
- Salve em `frontend/static/js/lucide.min.js`

**6. Porta 5000 já está em uso**
- Outra aplicação está usando a porta 5000
- Altere a porta em `instance/.env`: `PORT=5001`

Para mais ajuda com solução de problemas, veja [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Próximos Passos

- [Configurar configurações avançadas](CONFIGURATION.md)
- [Fazer deploy em produção](DEPLOYMENT.md)
- [Aprender sobre os recursos](FEATURES.md)
- [Ler guia de solução de problemas](TROUBLESHOOTING.md)
