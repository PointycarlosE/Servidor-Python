# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [Não Lançado]

### Adicionado
- **Painel de Detalhes de Arquivos/Pastas**
  - Painel lateral no desktop (360px) que desliza da direita ao clicar em "Ver informações"
  - Tela full-screen no mobile com animação fluida
  - Exibição de metadados completos:
    - Preview de imagens ou ícone para outros tipos
    - Nome, tipo, tamanho, localização (caminho)
    - Data de modificação e criação
    - Duração de arquivos de áudio (quando disponível)
  - Seção de compartilhamento ativo:
    - Link público ativo
    - Data de expiração
    - Contador de downloads
  - Novo endpoint de API: `/api/files/info/<path:caminho>`
  - Comportamento especial de navegação:
    - Com painel aberto, clique simples atualiza informações
    - Duplo-clique em pastas fecha o painel e navega
  - Animações suaves com cubic-bezier para transições naturais
  - Overlay com fade in/out no mobile
  - Header invertido no mobile (X à esquerda, "Detalhes" à direita)
  - Suporte completo a dark mode
  - Integração com sistema de compartilhamento existente

- **Sistema de Lixeira completo**
  - Página dedicada para visualizar arquivos excluídos
  - Restauração individual e em lote de arquivos
  - Exclusão permanente individual e em lote
  - Função "Esvaziar Lixeira" para limpar todos os arquivos de uma vez
  - Busca em tempo real na lixeira
  - Ordenação por nome, tamanho e data de exclusão
  - Seleção múltipla (Ctrl+A, Ctrl+Clique)
  - Visualização do caminho original do arquivo
  - Interface responsiva e otimizada para mobile
  - Log de auditoria para todas as ações da lixeira
  - Backend: rotas `/lixeira`, `/restaurar/<id>`, `/excluir-permanente/<id>`, `/esvaziar-lixeira`
  - Frontend: `lixeira.html` e `trash.js`

- **Player de Áudio Customizado**
  - Controles totalmente personalizados (sem controles nativos)
  - Botão play/pause grande e estiloso com ícone animado
  - Barra de progresso interativa clicável e arrastável
  - Handle de progresso que aparece ao hover
  - Controle de volume com slider expansível ao hover
  - Botão mute/unmute que lembra o último volume
  - Ícones dinâmicos que mudam por nível de volume (volume-x, volume-1, volume-2)
  - Tempo atual e duração formatados (MM:SS)
  - Design moderno com gradiente roxo no header
  - Layout responsivo para mobile
  - Correção de bugs de ícones duplicados

- **Funcionalidade de Renomear Arquivos e Pastas**
  - Renomeação inline de arquivos e pastas
  - Validação de nomes em tempo real
  - Endpoint `/renomear/<path:caminho>`
  - Integrado nos menus de contexto

### Melhorado
- **Animações Mobile**
  - Bottom sheet com deslizamento suave (0.35s cubic-bezier)
  - Painel de detalhes com transição fluida (0.4s)
  - Overlay com fade suave de opacidade
  - Experiência mais natural e polida

- **Redesign Completo da Interface de Autenticação**
  - **Página de Login:**
    - Card centralizado com gradiente azul (#3b82f6 → #2563eb)
    - Animação de entrada suave
    - Toggle de senha funcional sem duplicação de ícones
    - Design responsivo para mobile
    - Suporte a dark mode
  
  - **Página de Setup:**
    - Card com gradiente rosa (#ec4899 → #f472b6)
    - 6 campos de formulário (nome, username, senha, confirmação, email, repo)
    - Indicador de força de senha em tempo real com 4 barras coloridas
    - Lista de requisitos que ficam verdes ao serem atendidos
    - Toggle de visualização para ambos os campos de senha
    - Layout responsivo otimizado
  
  - **Página de Reset de Senha:**
    - Card com gradiente verde/esmeralda (#10b981 → #059669)
    - Indicador de força de senha completo
    - Toggle de senha em ambos os campos
    - Validação em tempo real
    - Design moderno e acessível

- **Modal de Imagens (Lightbox)**
  - Removido scroll horizontal em desktop e mobile
  - Botões de navegação reposicionados dentro do modal
  - Modal mais compacto no mobile (85vh em vez de 95vh)
  - Melhor responsividade para telas pequenas
  - Controles de footer sempre acessíveis
  - Transições e animações mais suaves

- **Modal de Áudio**
  - Correção do bug que impedia reabrir após fechar
  - Implementação de classes CSS em vez de manipulação inline
  - Recarga automática da página ao fechar (garante reset completo)
  - Fechamento com ESC funcional

- **Página Principal (explorar.html)**
  - Modernização da topbar com efeito blur
  - Melhoria do breadcrumb com design mais clean
  - Search bar redesenhada com ícones
  - Controles e botões mais estilosos
  - Melhor organização visual

### Corrigido
- Bottom sheet mobile não duplica mais o botão "Excluir"
- Filtro correto de elementos do dropdown no mobile
- Toggle de senha agora troca o ícone corretamente sem duplicar elementos
- Ícones do player de áudio (play/pause e volume) agora atualizam sem criar duplicatas
- Modal de áudio abre corretamente após ser fechado (não requer mais reload manual)
- Modal de imagens não causa mais scroll horizontal
- Modal de imagens é totalmente acessível no mobile
- Listener de ESC funciona corretamente no modal de áudio
- Botões de navegação do lightbox posicionados corretamente

### Técnico
- Novo módulo JavaScript `DetailsPanel` para gerenciar painel de informações
- Endpoint RESTful `/api/files/info/<path>` com suporte a metadados completos
- Integração com biblioteca `mutagen` (opcional) para duração de áudio
- Uso de `os.stat()` para metadados de sistema (st_ctime, st_mtime)
- Detecção de MIME type com `mimetypes.guess_type()`
- Handler especial para "Ver informações" no bottom sheet mobile
- Implementação de sistema de troca de ícones Lucide sem duplicação
- Uso de classes CSS (`.active`) em vez de manipulação inline de `style.display`
- Melhor organização do CSS com variáveis customizadas
- JavaScript modularizado para controles do player de áudio
- Event listeners otimizados para evitar conflitos
- Box-sizing e overflow controlados para prevenir scroll indesejado
- Animações otimizadas com cubic-bezier curves para sensação mais natural

---

## Versões Anteriores

### [1.0.0] - 2026-08-20

#### Adicionado
- Sistema de autenticação com 2FA
- Sistema de compartilhamento de arquivos
- Interface otimizada para mobile
- Upload com drag & drop
- Operações em lote
- Temas claro/escuro
- Log de auditoria
- Scripts de deploy em produção

#### Recursos Principais
- Gerenciamento completo de arquivos e pastas
- Autenticação de dois fatores (TOTP)
- Recuperação de senha por email
- Notificações de login
- Compartilhamento com links públicos
- Proteção por senha em links
- Expiração configurável de links
- Visualizador de imagens (lightbox)
- Player de áudio básico
- Visualizador de PDF
- Busca em tempo real
- Ordenação inteligente
- Seleção múltipla
- Download em ZIP
- Rate limiting
- Proteção CSRF
- Headers de segurança

---

## Notas de Desenvolvimento

### 2026-08-22
**Sessão de Desenvolvimento: Lixeira e Redesign**

**Implementações:**
1. Sistema completo de lixeira com restauração
2. Redesign de todas as páginas de autenticação
3. Player de áudio customizado com controles modernos
4. Correções de responsividade nos modais
5. Melhorias gerais de UX/UI

**Arquivos Criados:**
- `app/trash/` - Módulo completo da lixeira
- `frontend/templates/lixeira.html` - Interface da lixeira
- `frontend/static/js/trash.js` - Lógica JavaScript da lixeira
- `CHANGELOG.md` - Este arquivo

**Arquivos Modificados:**
- `frontend/templates/login.html` - Redesign completo
- `frontend/templates/setup.html` - Redesign completo
- `frontend/templates/resetar_senha.html` - Redesign completo
- `frontend/templates/explorar.html` - Melhorias de modal e responsividade
- `frontend/static/js/explorar.js` - Player de áudio customizado e correções
- `README.md` - Atualização de recursos
- `docs/FEATURES.md` - Documentação completa das novas funcionalidades

**Bugs Corrigidos:**
- Toggle de senha duplicando ícones
- Modal de áudio não reabrindo
- Scroll horizontal nos modais
- Ícones do player não atualizando

**Duração:** ~6 horas de desenvolvimento contínuo
**Commits:** Pendente

---

**Legenda:**
- `Adicionado` - Novas funcionalidades
- `Melhorado` - Melhorias em funcionalidades existentes
- `Corrigido` - Correções de bugs
- `Removido` - Funcionalidades removidas
- `Técnico` - Mudanças técnicas e de arquitetura
- `Segurança` - Correções de vulnerabilidades
