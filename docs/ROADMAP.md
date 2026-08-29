# Roadmap

Este documento descreve a evolução do Cloud Storage App, incluindo recursos implementados e o plano de desenvolvimento futuro.

## Versão Atual: 1.1

### Recursos Implementados ✅

#### Sistema de Autenticação Avançado
- **Autenticação de Dois Fatores (2FA)** - TOTP com Google Authenticator
- **Recuperação de Senha** - Reset via email com tokens temporários
- **Notificações de Login** - Alertas por email de novos acessos
- **Códigos de Backup** - Recuperação de acesso caso perca o dispositivo 2FA
- **Sessões Seguras** - Gerenciamento de sessão com cookies HTTP-only

#### Sistema de Compartilhamento
- **Links Públicos** - Gere links compartilháveis para qualquer arquivo
- **Proteção por Senha** - Adicione senha opcional aos links
- **Expiração Configurável** - 1h, 24h, 7d, 30d ou sem expiração
- **Estatísticas de Download** - Rastreie quantas vezes o arquivo foi baixado
- **Revogação de Links** - Desative links a qualquer momento
- **Pré-visualização** - Visualize imagens antes de baixar

#### Sistema de Lixeira
- **Recuperação de Arquivos** - Restaure arquivos deletados antes da remoção permanente
- **Restauração Individual e em Lote** - Selecione múltiplos arquivos para restaurar
- **Exclusão Permanente** - Remova arquivos definitivamente da lixeira
- **Esvaziar Lixeira** - Limpe todos os arquivos de uma vez
- **Busca e Ordenação** - Encontre arquivos na lixeira rapidamente
- **Interface Responsiva** - Funciona perfeitamente em mobile e desktop

#### Painel de Detalhes de Arquivos
- **Visualização Completa de Metadados** - Nome, tipo, tamanho, datas, localização
- **Preview de Imagens** - Visualize imagens diretamente no painel
- **Informações de Compartilhamento** - Veja links ativos, expiração e downloads
- **Duração de Áudio** - Exibe duração de arquivos de áudio
- **Painel Lateral Desktop** - Desliza suavemente da direita (360px)
- **Tela Cheia Mobile** - Interface otimizada para dispositivos móveis
- **Navegação Especial** - Clique atualiza info, duplo-clique abre pastas
- **Animações Fluidas** - Transições suaves com cubic-bezier

#### Interface Otimizada para Mobile
- **Redesign Completo** - ~40% mais espaço para conteúdo
- **FAB (Floating Action Button)** - Ações rápidas de upload
- **Gestos Touch** - Navegação otimizada para toque
- **Header Compacto** - Maximiza área de visualização de arquivos
- **Responsividade Total** - Funciona perfeitamente de 320px a 4K
- **Bottom Sheet Fluido** - Animações suaves ao abrir menus

#### Gerenciamento de Arquivos
- **Upload Arrastar e Soltar** - Interface intuitiva de upload
- **Múltiplos Arquivos** - Upload de vários arquivos simultâneos
- **Progresso em Tempo Real** - Barra de progresso para cada arquivo
- **Download ZIP** - Baixe múltiplos arquivos como ZIP
- **Busca Instantânea** - Filtragem ao vivo conforme você digita
- **Ordenação Inteligente** - Por tipo, nome, tamanho ou data
- **Seleção Múltipla** - Ctrl+Clique e Ctrl+A para operações em lote
- **Renomear Arquivos/Pastas** - Renomeação inline com validação

#### Visualizadores de Arquivos
- **Lightbox de Imagens** - Visualizador full-screen com navegação
- **Player de Áudio Customizado** - Controles modernos com barra de progresso interativa
- **Visualizador de PDF** - Renderização inline de PDFs
- **Pré-visualização de Thumbnails** - Miniaturas para tipos suportados

#### Segurança
- **Hash Seguro de Senhas** - pbkdf2:sha256 com 600.000 iterações
- **Rate Limiting** - Proteção contra brute force e abuso
- **Proteção CSRF** - Tokens em todas as requisições de modificação
- **Headers de Segurança** - CSP, HSTS, X-Frame-Options, Referrer-Policy
- **Log de Auditoria** - Registro de todas as ações do usuário
- **Path Traversal Protection** - Prevenção de acesso não autorizado
- **Validação de Tipos de Arquivo** - Bloqueio de extensões perigosas

#### Deploy e Produção
- **Gunicorn** - Servidor WSGI de produção
- **Cloudflare Tunnel** - Acesso HTTPS sem configuração de roteador
- **Modo Produção** - Configurações de segurança aprimoradas
- **Scripts Automatizados** - start.sh, stop.sh, url.sh
- **Log Estruturado** - Logs de acesso e erro separados
- **Múltiplas Plataformas** - Linux, Windows, macOS, Android (Termux)

#### Experiência do Usuário
- **Temas Claro e Escuro** - Alternância instantânea
- **Atalhos de Teclado** - Ctrl+A para selecionar tudo, ESC para fechar modais
- **Notificações Toast** - Feedback visual de ações
- **Breadcrumbs** - Navegação de diretório clara
- **Estados de Loading** - Feedback visual durante operações
- **Animações Suaves** - Transições polidas em todas as interações

---

## Próximas Versões

### Versão 1.2 (Curto Prazo - Q4 2026)

#### Interface de Visualização de Log de Auditoria
**Prioridade:** Alta  
**Descrição:** Interface web para visualizar e filtrar logs de auditoria sem acesso ao terminal.

**Funcionalidades:**
- Tabela paginada de eventos de auditoria
- Filtros por tipo de ação (login, upload, download, delete, share)
- Filtros por data/hora
- Busca por endereço IP
- Exportação para CSV
- Estatísticas visuais (gráficos de atividade)

#### Player de Vídeo
**Prioridade:** Alta  
**Descrição:** Reprodução inline de vídeos no navegador.

**Formatos suportados:**
- MP4, WebM, OGG
- Controles personalizados consistentes com player de áudio
- Suporte a legendas (SRT, VTT)
- Velocidade de reprodução ajustável
- Picture-in-picture
- Atalhos de teclado (espaço para play/pause, setas para avançar/retroceder)

### Versão 1.3 (Médio Prazo - Q1 2027)

#### Sistema de Favoritos
**Prioridade:** Média  
**Descrição:** Marcar arquivos e pastas favoritos para acesso rápido.

**Funcionalidades:**
- Botão de estrela em cada arquivo/pasta
- Seção "Favoritos" na navegação
- Filtro para mostrar apenas favoritos
- Ordenação personalizada de favoritos
- Atalho de teclado (Ctrl+D para favoritar)
- Indicador visual no painel de detalhes

#### Filtros de Busca Avançada
**Prioridade:** Média  
**Descrição:** Busca mais poderosa com múltiplos filtros.

**Funcionalidades:**
- Filtro por tipo de arquivo (imagens, vídeos, documentos, áudio)
- Filtro por tamanho (menor que, maior que, intervalo)
- Filtro por data (hoje, esta semana, este mês, intervalo personalizado)
- Filtro por extensão específica
- Busca com operadores (AND, OR, NOT)
- Salvar pesquisas frequentes
- Exportar resultados da busca

#### Histórico de Atividades no Painel de Detalhes
**Prioridade:** Média  
**Descrição:** Aba "Atividades" no painel de detalhes mostrando histórico do arquivo.

**Funcionalidades:**
- Linha do tempo de ações (upload, modificação, compartilhamento, download)
- Quem acessou o arquivo (para arquivos compartilhados)
- Estatísticas de visualização
- Integração com log de auditoria

### Versão 2.0 (Longo Prazo - 2027)

#### Suporte Multi-usuário (Fase 1)
**Prioridade:** Baixa  
**Descrição:** Múltiplos usuários com pastas separadas.

**Funcionalidades:**
- Criação de novos usuários (somente admin)
- Cada usuário tem sua própria pasta
- Login/logout independente
- Gerenciamento de usuários (admin)
- Limites de armazenamento por usuário
- Sessões isoladas

#### Pré-visualização de Documentos Office
**Prioridade:** Baixa  
**Descrição:** Visualização de documentos Microsoft Office e OpenOffice.

**Formatos:**
- .docx, .doc (Word)
- .xlsx, .xls (Excel)
- .pptx, .ppt (PowerPoint)
- .odt, .ods, .odp (OpenOffice)

**Implementação:**
- LibreOffice para conversão para HTML/PDF
- Ou biblioteca Python (python-docx, openpyxl)
- Renderização no navegador
- Visualização no painel de detalhes

#### Editor de Texto Online
**Prioridade:** Baixa  
**Descrição:** Editar arquivos de texto diretamente no navegador.

**Funcionalidades:**
- Editor para .txt, .md, .json, .yml, .xml
- Syntax highlighting para código
- Auto-save
- Histórico de versões
- Modo zen/distraction-free
- Suporte a Markdown preview

#### Sistema de Permissões (Multi-usuário Fase 2)
**Prioridade:** Baixa  
**Descrição:** Compartilhamento de arquivos entre usuários com permissões granulares.

**Funcionalidades:**
- Compartilhar pasta/arquivo com outro usuário
- Permissões: Leitura, Escrita, Administrador
- Visualizar "Compartilhado comigo"
- Notificações de novos compartilhamentos
- Aceitar/rejeitar compartilhamentos
- Revogar acesso

#### Sincronização Desktop
**Prioridade:** Muito Baixa  
**Descrição:** Cliente desktop para sincronização automática de arquivos.

**Funcionalidades:**
- Cliente Python/Electron
- Sincronização bidirecional
- Notificações de mudanças
- Sincronização seletiva
- Resolução de conflitos
- Suporte offline

---

## Recursos Considerados (Não Planejados)

### Por que não estão no roadmap:

#### Aplicativo Mobile Nativo
**Motivo:** A interface web otimizada para mobile já oferece excelente experiência no navegador. Um app nativo seria redundante e adicionaria complexidade de manutenção sem benefícios significativos.

#### Integração com Provedores de Nuvem Externos
**Motivo:** O propósito do projeto é fornecer uma alternativa auto-hospedada. Integração com AWS S3, Google Drive, etc., iria contra a filosofia de controle total dos dados.

#### Criptografia End-to-End
**Motivo:** Adiciona complexidade significativa ao gerenciamento de chaves e recuperação de senha. Para uso pessoal/familiar, a criptografia no nível do sistema de arquivos (LUKS, BitLocker) é mais apropriada.

#### Comentários e Anotações em Arquivos
**Motivo:** Recurso complexo com casos de uso limitados em um sistema de armazenamento pessoal. Existem ferramentas especializadas melhores para colaboração.

---

## Como Contribuir com Novos Recursos

Gostaria de ver um recurso implementado? Aqui está como você pode ajudar:

1. **Abra uma Issue** no GitHub descrevendo o recurso
2. **Vote em Issues Existentes** com 👍 para mostrar interesse
3. **Envie um Pull Request** implementando o recurso
4. **Discuta no GitHub Discussions** sobre grandes mudanças

### Critérios de Aceitação

Novos recursos são avaliados com base em:

- **Utilidade Geral** - Beneficia a maioria dos usuários?
- **Complexidade** - Adiciona muita complexidade ao código?
- **Manutenibilidade** - Será fácil de manter?
- **Performance** - Impacta negativamente a performance?
- **Compatibilidade** - Funciona em todas as plataformas suportadas?
- **Segurança** - Introduz riscos de segurança?

---

## Histórico de Versões

### v1.1.0 (Agosto 2026)
- Sistema de lixeira completo
- Painel de detalhes de arquivos/pastas
- Renomear arquivos e pastas
- Player de áudio customizado
- Melhorias nas animações mobile
- Redesign das páginas de autenticação

### v1.0.0 (Agosto 2026)
- Lançamento inicial
- Sistema de autenticação avançado
- Compartilhamento de arquivos
- Interface otimizada para mobile
- Deploy em produção

### v0.9.0 (Julho 2026)
- Beta pública
- Sistema de compartilhamento de arquivos
- Autenticação de dois fatores

### v0.8.0 (Junho 2026)
- Sistema de autenticação básico
- Upload/download de arquivos
- Interface básica

---

**Última atualização:** Agosto 2026  
**Próxima revisão prevista:** Outubro 2026
