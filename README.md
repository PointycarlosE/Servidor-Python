# ☁️ Cloud Storage App (Self-Hosted Drive)

[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Python](https://img.shields.io/badge/Python-3.8+-blue.svg)](https://python.org) [![Flask](https://img.shields.io/badge/Flask-2.3+-red.svg)](https://flask.palletsprojects.com/) [![Status](https://img.shields.io/badge/Status-Active-green.svg)](https://github.com/PointycarlosE/cloud-storage-app/blob/main)

> 🚀 Um sistema de armazenamento em nuvem self-hosted, inspirado no Google Drive, com interface moderna, uploads avançados e foco em **segurança, simplicidade e controle total dos dados**.

---

## 📌 Sobre o Projeto

O **Cloud Storage App** é uma aplicação web desenvolvida com **Python (Flask)** que transforma seu computador ou celular em um servidor de arquivos acessível via navegador de qualquer lugar do mundo. O projeto oferece uma experiência próxima de serviços como o Google Drive, com recursos modernos como **drag & drop, upload com progresso em tempo real, player de áudio, visualizador de PDF e atualização dinâmica da interface**, mantendo o principal objetivo:

> 🔒 Garantir ao usuário **controle total sobre seus dados**, sem dependência de serviços terceiros e sem assinaturas.

---

## ✨ Funcionalidades Implementadas

### 🔐 Segurança & Autenticação

- **Sistema de Login:** Proteção contra força bruta com rate limiting agressivo.
- **Senhas Seguras:** Armazenamento com hash (pbkdf2:sha256 com 600.000 iterações).
- **Validação de Senha Forte:** Requisitos obrigatórios com indicador visual de força em tempo real.
- **Toggle Mostrar/Ocultar Senha:** Em todos os campos de senha do sistema.
- **Sessões Blindadas:** Cookies `HttpOnly`, `SameSite=Lax` e `Secure` (em produção).
- **Headers de Segurança:** CSP, HSTS, X-Frame-Options e X-Content-Type-Options.
- **Proteção de Rotas:** Validação contra *path traversal* e CSRF em todas as operações de escrita.
- **Log de Auditoria:** Registro automático de logins, uploads, downloads, exclusões e tentativas suspeitas, com rotação automática de arquivo.

### 📂 Gerenciamento de Arquivos

- **Navegação Completa:** Diretórios com breadcrumb interativo.
- **Upload Avançado:** Múltiplos arquivos via botão ou **Drag & Drop global**.
- **Painel de Uploads:** Progresso individual em tempo real com ícone por tipo de arquivo e porcentagem.
- **Downloads:** Individual ou em lote compactado em **ZIP** com limite de tamanho configurável.
- **Pastas:** Criação e exclusão de diretórios.
- **Seleção Múltipla:** Via checkbox, `Ctrl+Clique` ou `Ctrl+A`, com barra de ações flutuante.
- **Exclusão em Lote:** Com modal de confirmação e atualização sem recarregar a página.
- **Extensões Bloqueadas:** Upload de executáveis e scripts é bloqueado por segurança.

### 👁️ Visualização de Arquivos

- **Lightbox de Imagens:** Popup com navegação entre fotos, download e exclusão integrados.
- **Player de Áudio:** Modal dedicado com controles nativos e exibição de duração.
- **Visualizador de PDF:** Abre PDFs diretamente no navegador em nova aba, sem baixar.
- **Ícones Profissionais:** Biblioteca Lucide Icons com ícones SVG por tipo de arquivo — sem emojis.

### ⚡ Experiência do Usuário (UX)

- **Interface AJAX:** Atualização da lista e exclusões sem recarregar a página.
- **Tema Claro/Escuro:** Alternância persistente em todas as páginas, aplicada antes do carregamento para evitar flash.
- **Menu de Contexto:** Três pontinhos por arquivo com opções de download, visualizar e excluir — estilo Google Drive.
- **Ordenação Inteligente:** Por tipo, nome, tamanho ou data — pastas sempre no topo, ordem padrão correta para cada critério.
- **Pesquisa em Tempo Real:** Filtro instantâneo com contador de resultados.
- **Responsividade Completa:** Desktop, Tablet e Mobile.
- **Botão Voltar no Mobile:** Fechar lightbox com o botão voltar do celular em vez de sair da página.
- **Feedback Visual:** Toast notifications com ícones SVG e modais de confirmação personalizados.

### 👤 Perfil do Usuário

- **Nome de Exibição:** Altere o nome mostrado na interface sem afetar o login.
- **Troca de Senha:** Com validação da senha atual, indicador visual de força e confirmação.

---

## 🚀 Como Instalar e Executar

### 1. Clonar o repositório

```bash
git clone https://github.com/PointycarlosE/cloud-storage-app.git
cd cloud-storage-app
```

### 2. Criar o ambiente virtual

```bash
python -m venv venv

# Linux/Mac/Termux:
source venv/bin/activate

# Windows:
venv\Scripts\activate
```

### 3. Instalar as dependências

```bash
pip install -r requirements.txt
```

### 4. Instalar os ícones Lucide (necessário para a interface)

Baixe o arquivo de ícones e salve em `frontend/static/js/lucide.min.js`:

```
https://unpkg.com/lucide@0.383.0/dist/umd/lucide.min.js
```

### 5. Primeira execução e setup

```bash
python run.py
```

Acesse `http://localhost:5000/setup` no navegador e crie sua conta de administrador. Após o setup, pare o servidor com `Ctrl+C`.

---

## ⚙️ Modos de Uso

O sistema utiliza um arquivo `.env` dentro da pasta `instance/`, gerado automaticamente no setup.

### 🏠 Modo Local (Desenvolvimento)

Ideal para uso em casa via Wi-Fi ou para testes.

1. Mantenha `FLASK_ENV=development` no `instance/.env`
2. Execute `python run.py`
3. Acesse `http://localhost:5000` ou `http://SEU_IP_LOCAL:5000`

### 🌐 Modo Internet (Produção)

Para acessar de qualquer lugar com HTTPS, dois serviços precisam rodar juntos: o **Gunicorn** (servidor Python de produção) e o **Cloudflare Tunnel** (que expõe o servidor para a internet com HTTPS automático, sem precisar abrir portas no roteador).

#### Passo 1 — Mudar para modo produção

Edite o arquivo `instance/.env` e altere a linha:

```
FLASK_ENV=production
```

#### Passo 2 — Instalar o Cloudflare Tunnel

```bash
# Debian/Ubuntu/Mint:
curl -L https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb -o cloudflared.deb
sudo dpkg -i cloudflared.deb

# Termux (Android):
pkg install cloudflared
```

#### Passo 3 — Usar os scripts de produção

O projeto inclui scripts prontos para gerenciar os serviços:

```bash
# Iniciar Gunicorn + Cloudflare Tunnel em background
bash start.sh

# Ver a URL pública gerada
bash url.sh

# Parar todos os serviços
bash stop.sh
```

Após executar `start.sh`, uma URL HTTPS pública será exibida no terminal — algo como `https://alguma-coisa.trycloudflare.com`. Essa é a URL para acessar o Drive de qualquer lugar do mundo.

> ⚠️ **Importante:** A URL muda toda vez que o túnel é reiniciado. Para uma URL fixa, é necessário um domínio próprio configurado no Cloudflare Dashboard.

#### Passo 4 — Instalar como comandos globais (opcional)

Para chamar os scripts de qualquer diretório sem o `bash`:

```bash
# Linux:
cp start.sh /usr/local/bin/drive-start
cp stop.sh /usr/local/bin/drive-stop
cp url.sh /usr/local/bin/drive-url
chmod +x /usr/local/bin/drive-{start,stop,url}

# Termux:
cp start.sh /data/data/com.termux/files/usr/bin/drive-start
cp stop.sh /data/data/com.termux/files/usr/bin/drive-stop
cp url.sh /data/data/com.termux/files/usr/bin/drive-url
chmod +x /data/data/com.termux/files/usr/bin/drive-{start,stop,url}
```

Depois disso, de qualquer terminal:

```bash
drive-start   # inicia tudo
drive-url     # mostra a URL pública atual
drive-stop    # para tudo
```

---

## 📱 Rodando no Celular (Termux)

Este projeto é otimizado para rodar em dispositivos Android, inclusive em aparelhos mais antigos!

```bash
pkg update && pkg upgrade -y
pkg install python cloudflared git -y
git clone https://github.com/PointycarlosE/cloud-storage-app.git
cd cloud-storage-app
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

Acesse `http://localhost:5000/setup` para configurar, depois use `drive-start` para colocar em produção.

---

## 🛠️ Estrutura do Projeto

```
cloud-storage-app/
├── app/                        # Backend (Flask)
│   ├── auth/                   # Autenticação, perfil e modelos
│   ├── routes/                 # Rotas de arquivos e navegação
│   ├── utils/                  # Helpers e log de auditoria
│   └── gunicorn_config.py      # Configuração do servidor de produção
├── frontend/                   # Interface (HTML, CSS, JS)
│   ├── static/
│   │   ├── css/style.css
│   │   └── js/
│   │       ├── main.js         # Lógica global (tema, toasts, upload)
│   │       ├── explorar.js     # Lógica do explorador de arquivos
│   │       └── lucide.min.js   # Biblioteca de ícones SVG
│   └── templates/
├── instance/                   # Configurações locais (.env) e logs
├── start.sh                    # Inicia Gunicorn + Cloudflare Tunnel
├── stop.sh                     # Para todos os serviços
├── url.sh                      # Exibe a URL pública atual
├── run.py                      # Inicialização para modo local
└── requirements.txt            # Dependências
```

---

## 🌍 Roadmap

### ✅ Implementado

- [x] Sistema de login com proteção contra força bruta e rate limiting
- [x] Senhas com hash forte e validação visual de força em tempo real
- [x] Toggle mostrar/ocultar senha em todos os campos
- [x] Upload múltiplo com drag & drop e painel de progresso estilo Google Drive
- [x] Download individual e em lote (ZIP)
- [x] Exclusão individual e em lote sem reload (AJAX)
- [x] Lightbox para imagens com navegação entre fotos
- [x] Player de áudio integrado em modal
- [x] Visualizador de PDF direto no navegador
- [x] Ícones profissionais com biblioteca Lucide Icons (SVG)
- [x] Menu de contexto por arquivo com três pontinhos (estilo Google Drive)
- [x] Pesquisa em tempo real e ordenação inteligente (tipo, nome, tamanho, data)
- [x] Tema claro/escuro persistente em todas as páginas
- [x] Responsividade completa (Desktop, Tablet e Mobile)
- [x] Botão voltar do celular fecha popup em vez de sair da página
- [x] Seleção múltipla com Ctrl+Clique sem abrir popup acidentalmente
- [x] Perfil do usuário com troca de nome de exibição e senha
- [x] Log de auditoria com rotação automática
- [x] Modo produção com Gunicorn + Cloudflare Tunnel e scripts de gestão

### 🚀 Próximos Passos

- [ ] **Compartilhamento por link:** Gerar links temporários para terceiros acessarem arquivos sem login.
- [ ] **Logs de Atividade:** Interface visual de auditoria para o administrador.
- [ ] **Player de Vídeo:** Visualizador integrado em modal.
- [ ] **2FA:** Autenticação de dois fatores para segurança máxima.

---

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/minha-feature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona minha feature'`)
4. Abra um Pull Request

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 👨‍💻 Autor

**Carlos** — [GitHub](https://github.com/PointycarlosE)

Se este projeto te ajudou, considere deixar uma estrela ⭐ no repositório!