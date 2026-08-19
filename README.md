# ☁️ Cloud Storage App (Self-Hosted Drive)

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Python](https://img.shields.io/badge/Python-3.10+-blue.svg)](https://python.org) [![Flask](https://img.shields.io/badge/Flask-2.3+-red.svg)](https://flask.palletsprojects.com/) [![Status](https://img.shields.io/badge/Status-Active-green.svg)](https://github.com/PointycarlosE/cloud-storage-app) [![Mobile](https://img.shields.io/badge/Mobile-Optimized-brightgreen.svg)](https://github.com/PointycarlosE/cloud-storage-app)

> 🚀 Sistema de armazenamento em nuvem self-hosted inspirado no **Google Drive**, com interface moderna, **otimizada para mobile** e foco em **segurança, simplicidade e controle total dos dados**.

### ✨ Novidade: Interface Mobile Redesenhada (Agosto 2026)

A interface foi completamente otimizada para dispositivos móveis, com **~40% mais espaço para arquivos** e design inspirado no Google Drive. [Ver detalhes](#-interface-mobile-otimizada)

---

## 📌 Sobre o Projeto

O **Cloud Storage App** é uma aplicação web desenvolvida com **Python (Flask)** que transforma seu computador ou celular em um servidor de arquivos pessoal acessível via navegador. Com uma experiência próxima de serviços como Google Drive, oferece recursos modernos enquanto mantém o objetivo principal:

> 🔒 Garantir ao usuário **controle total sobre seus dados**, sem dependência de serviços terceiros e sem assinaturas.

**Destaques:**
- ✨ **Interface Mobile Otimizada** - Redesenhada em agosto/2026 com ~40% mais espaço para conteúdo
- 📱 Interface responsiva e moderna (Desktop, Tablet e Mobile)
- 🎨 Design System inspirado no Google Drive
- 🖱️ Upload com drag & drop e progresso em tempo real
- 👁️ Visualizadores integrados (imagens, áudio, PDF)
- 🔒 Sistema de segurança robusto com rate limiting e auditoria
- 🌐 Fácil deploy em produção com Cloudflare Tunnel

---

## ✨ Funcionalidades

### 🔐 Segurança & Autenticação

- **Sistema de Login Protegido:** Rate limiting agressivo contra força bruta
- **Senhas Seguras:** Hash pbkdf2:sha256 com 600.000 iterações
- **Validação de Senha Forte:** Requisitos obrigatórios com indicador visual em tempo real
- **Toggle Mostrar/Ocultar Senha:** Em todos os campos do sistema
- **Sessões Blindadas:** Cookies `HttpOnly`, `SameSite=Lax` e `Secure` em produção
- **Headers de Segurança:** CSP, HSTS, X-Frame-Options e X-Content-Type-Options
- **Proteção de Rotas:** Validação contra path traversal e CSRF
- **Log de Auditoria:** Registro automático de ações (logins, uploads, downloads, exclusões) com rotação automática
- **Extensões Bloqueadas:** Configuração flexível para bloquear uploads de tipos perigosos

### 📂 Gerenciamento de Arquivos

- **Navegação Completa:** Sistema de diretórios com breadcrumb interativo
- **Upload Avançado:** 
  - Múltiplos arquivos via botão ou **Drag & Drop global**
  - Painel de progresso em tempo real com ícone por tipo
  - Detecção automática de conflitos de nome
- **Downloads:** Individual ou em lote compactado em **ZIP**
- **Pastas:** Criação e exclusão de diretórios
- **Seleção Múltipla:** Via checkbox, `Ctrl+Clique` ou `Ctrl+A`
- **Exclusão em Lote:** Com confirmação e atualização dinâmica (AJAX)
- **Paginação Inteligente:** Lazy loading para grandes quantidades de arquivos

### 👁️ Visualização de Arquivos

- **Lightbox de Imagens:** Popup com navegação, download e exclusão integrados
- **Player de Áudio:** Modal com controles nativos e exibição de duração
- **Visualizador de PDF:** Abertura direta no navegador
- **Ícones Profissionais:** Biblioteca Lucide Icons (SVG) por tipo de arquivo
- **Thumbnails:** Preview automático para imagens

### ⚡ Experiência do Usuário (UX)

- **Interface AJAX:** Atualizações sem recarregar a página
- **Tema Claro/Escuro:** Alternância persistente aplicada antes do carregamento
- **Menu de Contexto:** Três pontinhos por arquivo (estilo Google Drive)
- **Ordenação Inteligente:** Por tipo, nome, tamanho ou data (pastas sempre no topo)
- **Pesquisa em Tempo Real:** Filtro instantâneo com contador de resultados
- **Responsividade Avançada:**
  - Desktop: Grid adaptável com múltiplas colunas
  - Tablet: Layout otimizado para telas médias
  - Mobile: Interface otimizada com FAB expansível e controles compactos
  - Landscape: Grid adaptativo aproveitando largura disponível
- **FAB Expansível (Mobile):** Botão flutuante que expande para Upload e Nova Pasta
- **Topbar Compacta:** 56px de altura (padrão Material Design/Google Drive)
- **Controles Minimalistas:** Barra de ferramentas flat sem bordas pesadas
- **Feedback Visual:** Toast notifications e modais de confirmação personalizados
- **Botão Voltar (Mobile):** Fecha modais/lightbox sem sair da página
- **Atalhos de Teclado:** `Alt+←` e `Alt+→` para voltar/avançar, `Esc` para fechar modais

---

## 📱 Interface Mobile Otimizada

### 🎯 Redesign Completo (Agosto 2026)

A interface mobile foi **completamente redesenhada** seguindo os padrões do Google Drive, resultando em uma experiência significativamente melhor:

#### ✨ Principais Melhorias

**1. Topbar Compacta (Redução de ~38%)**
- Altura fixa de **56px** (antes: ~90px)
- Botão de perfil removido (mantido apenas na sidebar)
- Search input com estilo Google Drive (sem bordas pesadas)
- Ícones otimizados e transições suaves

**2. Barra de Controles Minimalista (Redução de ~47%)**
- Design flat sem cards pesados
- Upload/Nova pasta escondidos no mobile (substituídos pelo FAB)
- View toggle tipo "pill" compacto
- Sort buttons discretos sem bordas
- Altura de apenas **~40px** (antes: ~75px)

**3. Navegação Otimizada**
- Breadcrumb compacto com fontes menores
- Botão Voltar flat e moderno (sem bordas pesadas)
- Espaçamento otimizado entre elementos

**4. Cards de Arquivos Inteligentes**
- Grid responsivo: 2 colunas em portrait, 3-4 em landscape
- Ícones e thumbnails otimizados por resolução
- Padding e gaps ajustados para melhor densidade
- Meta-informações condensadas

**5. Modo Landscape Dedicado**
- Topbar ainda mais compacta (48px)
- Grid com mais colunas aproveitando largura
- Cards menores para exibir mais conteúdo
- Controles ultra compactos

#### 📊 Resultados

| Elemento | Antes | Depois | Economia |
|----------|-------|--------|----------|
| **Topbar** | ~90px | **56px** | **38%** ⬇️ |
| **Barra de Controles** | ~75px | **40px** | **47%** ⬇️ |
| **Breadcrumb** | ~36px | **24px** | **33%** ⬇️ |
| **Total antes dos arquivos** | **~249px** | **~150px** | **40%** ⬇️ |

**🎯 Em um iPhone SE (667px altura):**
- Antes: ~37% da tela eram controles
- Depois: ~22% da tela são controles
- **Ganho: +99px (~15%) mais espaço para arquivos!** 📁

**🎯 Em Landscape (500px altura):**
- Antes: ~50% da tela eram controles
- Depois: ~25% da tela são controles
- **Ganho: +125px (~25%) mais espaço!** 🚀

### 👤 Perfil do Usuário

- **Nome de Exibição:** Altere o nome mostrado na interface sem afetar o login
- **Troca de Senha:** Com validação da senha atual e indicador de força

---

## 🚀 Instalação e Configuração

### 1️⃣ Requisitos

- **Python 3.10+**
- Git
- (Opcional) Cloudflared para acesso via internet

### 2️⃣ Instalação Rápida

```bash
# Clone o repositório
git clone https://github.com/PointycarlosE/cloud-storage-app.git
cd cloud-storage-app

# Crie o ambiente virtual
python -m venv venv

# Ative o ambiente virtual
# Linux/Mac/Termux:
source venv/bin/activate
# Windows:
venv\Scripts\activate

# Instale as dependências
pip install -r requirements.txt
```

### 3️⃣ Instalar Ícones Lucide

Baixe o arquivo de ícones e salve em `frontend/static/js/lucide.min.js`:

```
https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js
```

Ou use curl/wget:

```bash
curl -o frontend/static/js/lucide.min.js https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js
```

### 4️⃣ Primeira Execução e Setup

```bash
python run.py
```

Acesse `http://localhost:5000/setup` no navegador e crie sua conta de administrador. Após o setup, pare o servidor com `Ctrl+C`.

---

## ⚙️ Modos de Execução

### 🏠 Modo Local (Desenvolvimento)

Ideal para uso em casa via Wi-Fi ou testes.

```bash
# O arquivo instance/.env já vem com FLASK_ENV=development
python run.py
```

Acesse:
- `http://localhost:5000` (mesmo dispositivo)
- `http://SEU_IP_LOCAL:5000` (outros dispositivos na rede)

### 🌐 Modo Produção (Internet)

Para acessar de qualquer lugar com HTTPS, você precisa:
- **Gunicorn:** Servidor Python robusto para produção
- **Cloudflare Tunnel:** Expõe o servidor com HTTPS automático (sem abrir portas no roteador)

#### Passo 1 — Configurar Modo Produção

Edite `instance/.env`:

```env
FLASK_ENV=production
```

#### Passo 2 — Instalar Cloudflare Tunnel

```bash
# Debian/Ubuntu/Mint:
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Termux (Android):
pkg install cloudflared
```

#### Passo 3 — Usar Scripts de Produção

```bash
# Iniciar Gunicorn + Cloudflare Tunnel
bash start.sh

# Ver URL pública gerada
bash url.sh

# Parar todos os serviços
bash stop.sh
```

Após `start.sh`, uma URL HTTPS pública será exibida: `https://algo-aleatório.trycloudflare.com`

> ⚠️ **Avisos Importantes:**
> - **URL Temporária:** A URL muda a cada reinício. Para uma URL fixa, configure um domínio próprio no Cloudflare Dashboard.
> - **Rate Limiter:** Usa armazenamento em memória. Para múltiplos workers Gunicorn, considere configurar Redis no `.env`.

#### Passo 4 — Instalar como Comandos Globais (Opcional)

```bash
# Linux:
sudo cp start.sh /usr/local/bin/drive-start
sudo cp stop.sh /usr/local/bin/drive-stop
sudo cp url.sh /usr/local/bin/drive-url
sudo chmod +x /usr/local/bin/drive-{start,stop,url}

# Termux:
cp start.sh $PREFIX/bin/drive-start
cp stop.sh $PREFIX/bin/drive-stop
cp url.sh $PREFIX/bin/drive-url
chmod +x $PREFIX/bin/drive-{start,stop,url}
```

Depois:

```bash
drive-start   # Iniciar tudo
drive-url     # Mostrar URL pública
drive-stop    # Parar tudo
```

---

## 📱 Rodando no Celular (Termux)

Este projeto funciona perfeitamente em dispositivos Android!

```bash
# Instalar dependências básicas
pkg update && pkg upgrade -y
pkg install python git cloudflared -y

# Clonar e configurar
git clone https://github.com/PointycarlosE/cloud-storage-app.git
cd cloud-storage-app
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Baixar ícones
curl -o frontend/static/js/lucide.min.js https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js

# Primeira execução
python run.py
```

Acesse `http://localhost:5000/setup` para configurar, depois use `bash start.sh` para produção.

---

## 🛠️ Estrutura do Projeto

```
cloud-storage-app/
├── app/                        # Backend (Flask)
│   ├── __init__.py             # Factory do app Flask
│   ├── extensions.py           # Extensões Flask (Login, Limiter)
│   ├── config.py               # Configurações e variáveis de ambiente
│   ├── auth/                   # Autenticação e perfil
│   │   ├── models.py           # Modelo de usuário
│   │   └── routes.py           # Rotas de login, setup, perfil
│   ├── routes/                 # Rotas principais
│   │   ├── files.py            # Upload, download, exclusão, navegação
│   │   └── main.py             # Página inicial
│   ├── utils/                  # Utilitários
│   │   ├── security.py         # Validações de segurança
│   │   └── audit_log.py        # Sistema de auditoria
│   └── gunicorn_config.py      # Configuração do Gunicorn
├── frontend/                   # Interface (HTML, CSS, JS)
│   ├── static/
│   │   ├── css/style.css       # Estilos completos com tema claro/escuro
│   │   ├── js/
│   │   │   ├── main.js         # Lógica global (tema, toasts, upload)
│   │   │   ├── explorar.js     # Lógica do explorador de arquivos
│   │   │   └── lucide.min.js   # Biblioteca de ícones SVG
│   │   └── img/                # Favicon e imagens
│   └── templates/              # Templates Jinja2
│       ├── explorar.html       # Página principal do drive
│       ├── login.html          # Tela de login
│       ├── perfil.html         # Perfil do usuário
│       └── partials/           # Componentes reutilizáveis
├── instance/                   # Dados locais (gitignored)
│   ├── .env                    # Variáveis de ambiente
│   ├── users.db                # Banco de dados SQLite
│   └── audit.log               # Log de auditoria
├── tests/                      # Testes automatizados
├── start.sh                    # Script para iniciar em produção
├── stop.sh                     # Script para parar serviços
├── url.sh                      # Script para ver URL pública
├── run.py                      # Entrada para modo desenvolvimento
└── requirements.txt            # Dependências Python
```

---

## 🔧 Configuração Avançada

### Variáveis de Ambiente (instance/.env)

```env
# Modo de execução
FLASK_ENV=development  # ou production

# Secret key (gerada automaticamente no setup)
SECRET_KEY=sua-chave-secreta-aqui

# Extensões de arquivo bloqueadas (separadas por vírgula)
BLOCKED_EXTENSIONS=.php,.exe,.sh,.bat,.cmd,.com,.msi,.scr,.vbs

# Limite de itens por página (paginação)
ITEMS_PER_PAGE=100

# Tamanho máximo de upload (em MB)
MAX_CONTENT_LENGTH=100

# Limite de tamanho para download em lote (ZIP)
MAX_ZIP_SIZE_MB=500
```

### Rate Limiting com Redis (Produção com Múltiplos Workers)

Edite `app/__init__.py` e altere:

```python
limiter.init_app(app, storage_uri='redis://localhost:6379')
```

E instale o Redis:

```bash
pip install redis
sudo apt install redis-server  # Linux
```

---

## 🧪 Testes

```bash
# Executar testes
pytest

# Com cobertura
pytest --cov=app tests/
```

---

## 🌍 Roadmap

### ✅ Implementado

- [x] Sistema de login com proteção contra força bruta
- [x] Senhas com hash forte (pbkdf2:sha256:600000)
- [x] Toggle mostrar/ocultar senha
- [x] Upload múltiplo com drag & drop
- [x] Painel de progresso em tempo real
- [x] Download individual e em lote (ZIP)
- [x] Exclusão individual e em lote (AJAX)
- [x] Lightbox para imagens com navegação
- [x] Player de áudio em modal
- [x] Visualizador de PDF
- [x] Ícones profissionais (Lucide Icons SVG)
- [x] Menu de contexto por arquivo
- [x] Pesquisa em tempo real
- [x] Ordenação inteligente (tipo, nome, tamanho, data)
- [x] Tema claro/escuro persistente
- [x] Responsividade completa (Desktop, Tablet, Mobile)
- [x] FAB expansível no mobile (estilo Google Drive)
- [x] Grid responsivo de 2 colunas no mobile
- [x] Seleção múltipla (Ctrl+Clique, Ctrl+A)
- [x] Perfil do usuário (nome de exibição e troca de senha)
- [x] Log de auditoria com rotação automática
- [x] Paginação com lazy loading
- [x] Sistema de extensões bloqueadas configurável
- [x] Modo produção com Gunicorn + Cloudflare Tunnel
- [x] Scripts de gestão (start, stop, url)
- [x] Suporte completo para Termux (Android)
- [x] **Interface Mobile Otimizada** (Agosto 2026)
  - [x] Topbar compacta (56px, padrão Material Design)
  - [x] Barra de controles minimalista estilo Google Drive
  - [x] Cards otimizados com melhor densidade
  - [x] Modo landscape dedicado com grid adaptativo
  - [x] Redução de ~40% no espaço ocupado por controles
  - [x] Navegação otimizada (breadcrumb e botão voltar compactos)

### 🚀 Próximos Passos

- [ ] **Compartilhamento por Link:** Gerar links temporários para terceiros acessarem arquivos sem login
- [ ] **Interface de Logs de Auditoria:** Painel visual para o administrador visualizar ações
- [ ] **Player de Vídeo:** Visualizador integrado em modal
- [ ] **Lixeira:** Recuperação de arquivos excluídos
- [ ] **Favoritos:** Marcar arquivos/pastas importantes
- [ ] **2FA:** Autenticação de dois fatores (TOTP)
- [ ] **Multi-usuários:** Sistema de permissões e quotas
- [ ] **Busca Avançada:** Filtros por tipo, data, tamanho
- [ ] **Preview de Documentos:** Visualização de .docx, .xlsx, .pptx
- [ ] **Edição de Texto:** Editor online para arquivos .txt, .md

---

## 🤝 Contribuição

Contribuições são bem-vindas! Siga os passos:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona minha feature'`)
4. Push para a branch (`git push origin feature/minha-feature`)
5. Abra um Pull Request

### Guidelines de Contribuição

- Mantenha o código limpo e bem documentado
- Adicione testes para novas funcionalidades
- Siga as convenções de código Python (PEP 8)
- Use commits semânticos (feat, fix, docs, style, refactor, test, chore)

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Carlos** — [GitHub](https://github.com/PointycarlosE)

---

## ⭐ Agradecimentos

Se este projeto te ajudou, considere deixar uma estrela ⭐ no repositório!

**Tecnologias utilizadas:**
- [Flask](https://flask.palletsprojects.com/) - Framework web Python
- [Lucide Icons](https://lucide.dev/) - Biblioteca de ícones SVG profissionais
- [Cloudflare Tunnel](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/) - Túnel HTTPS gratuito
- [Gunicorn](https://gunicorn.org/) - Servidor WSGI para produção
- [Material Design](https://material.io/) - Inspiração para o design system

**Design inspirado em:**
- [Google Drive](https://drive.google.com/) - Interface e experiência do usuário
- [Material Design 3](https://m3.material.io/) - Guidelines de design mobile

---

## 🐛 Problemas Conhecidos

Nenhum problema crítico conhecido no momento.

Se encontrar algum bug, por favor [abra uma issue](https://github.com/PointycarlosE/cloud-storage-app/issues).

---

## 📞 Suporte

- **Issues:** [GitHub Issues](https://github.com/PointycarlosE/cloud-storage-app/issues)
- **Discussões:** [GitHub Discussions](https://github.com/PointycarlosE/cloud-storage-app/discussions)

---

**Feito por Carlos ⭐**
