# Recursos e Funcionalidades

Documentação completa de todos os recursos do Cloud Storage App.

## Índice

- [Gerenciamento de Arquivos](#gerenciamento-de-arquivos)
- [Gerenciamento de Armazenamento & Métricas](#gerenciamento-de-armazenamento--métricas)
- [Sistema de Lixeira](#sistema-de-lixeira)
- [Sistema de Compartilhamento](#sistema-de-compartilhamento)
- [Autenticação e Segurança](#autenticação-e-segurança)
- [Visualização de Arquivos](#visualização-de-arquivos)
- [Interface do Usuário](#interface-do-usuário)
- [Perfil do Usuário](#perfil-do-usuário)
- [Segurança e Auditoria](#segurança-e-auditoria)

---

## Gerenciamento de Arquivos

### Upload de Arquivos

#### Upload Múltiplo
Envie vários arquivos de uma vez.

**Como usar:**
1. Clique no botão "Upload" ou arraste arquivos para a janela
2. Selecione múltiplos arquivos (Ctrl+Clique ou Shift+Clique)
3. Aguarde o upload completar

**Recursos:**
- Upload de até 100 arquivos simultâneos
- Progresso individual por arquivo
- Detecção automática de conflitos de nome
- Cancelamento de uploads individuais
- Suporte a drag & drop

#### Drag & Drop (Arrastar e Soltar)
Arraste arquivos diretamente para o navegador.

**Como usar:**
1. Abra uma pasta de arquivos no seu computador
2. Arraste os arquivos para a janela do navegador
3. Solte para iniciar o upload

**Suportado em:**
- Navegadores modernos (Chrome, Firefox, Safari, Edge)
- Qualquer lugar da página (não precisa mirar em área específica)

#### Painel de Progresso
Acompanhe o progresso de uploads em tempo real.

**Informações mostradas:**
- Nome do arquivo
- Tamanho do arquivo
- Porcentagem completa
- Velocidade de upload
- Tempo estimado restante
- Status (enviando, processando, concluído, erro)

**Ícones por tipo:**
- Documentos: ícone de arquivo
- Imagens: ícone de imagem
- Vídeos: ícone de play
- Áudio: ícone de música
- Outros: ícone genérico

#### Limites de Upload
Configuráveis em `instance/.env`:

```env
MAX_UPLOAD_MB=500  # Tamanho máximo por upload
```

**Padrão:** 500 MB por requisição

### Download de Arquivos

#### Download Individual
Baixe um arquivo por vez.

**Como usar:**
1. Clique no menu de três pontos do arquivo
2. Selecione "Baixar"
3. O arquivo será baixado pelo navegador

#### Download em Lote (ZIP)
Baixe múltiplos arquivos compactados.

**Como usar:**
1. Selecione os arquivos (checkbox ou Ctrl+Clique)
2. Clique em "Baixar Selecionados"
3. Aguarde a criação do ZIP
4. O arquivo será baixado automaticamente

**Recursos:**
- Compactação automática em tempo real
- Nome do arquivo: `arquivos_YYYYMMDD_HHMMSS.zip`
- Preserva estrutura de pastas
- Progresso de criação do ZIP

**Limites:**
```env
MAX_ZIP_FILES=100    # Máximo de arquivos por ZIP
MAX_ZIP_SIZE_MB=1024 # Tamanho máximo do ZIP (1 GB)
```

### Navegação de Pastas

#### Breadcrumb
Navegação hierárquica de pastas.

**Recursos:**
- Clique em qualquer nível para voltar
- Mostra caminho completo
- Compacto em mobile

**Exemplo:**
```
Home > Documentos > Projetos > 2026
```

#### Criar Pasta
Organize seus arquivos em pastas.

**Como usar:**
1. Clique em "Nova Pasta"
2. Digite o nome da pasta
3. Pressione Enter ou clique em "Criar"

**Regras:**
- Nomes não podem conter: `/ \ : * ? " < > |`
- Máximo 255 caracteres
- Não pode ser vazio

#### Exclusão de Pastas
Delete pastas e todo seu conteúdo.

**Como usar:**
1. Clique no menu de três pontos da pasta
2. Selecione "Excluir"
3. Confirme a exclusão

**Comportamento:**
- Arquivos individuais vão para a **lixeira**
- Pastas vazias são excluídas permanentemente
- Pastas com conteúdo movem os arquivos para a lixeira

---

---

## Gerenciamento de Armazenamento & Métricas

### Visão Geral
Painel visual de alta precisão inspirado no Google Drive e OneDrive para monitorar o uso real de disco, auditar os maiores arquivos e liberar espaço rapidamente.

### Acessar o Gerenciador de Armazenamento
- Clique no widget de **Armazenamento** na barra lateral (ou no botão **"Gerenciar espaço"**)
- Ou acesse a rota direta `/armazenamento`

### Principais Recursos

#### 1. Cálculo Real e Seguro do App
- Calcula estritamente o espaço consumido pela **pasta do aplicativo (`PASTA_BASE`)** somado ao espaço retido na **Lixeira (`.trash`)**.
- Não mistura nem superestima o espaço com arquivos de sistema operacional, programas instalados ou outras pastas do computador.
- Ignora pastas de cache e desenvolvimento (`.git`, `node_modules`, `__pycache__`, `.venv`, etc.).
- Suporte a Cota Fixa configurável via `.env` (`STORAGE_QUOTA_GB`).

#### 2. Barra de Progresso Multi-Segmentada
- Gráfico de barras dividido e colorido dinamicamente por categorias de arquivos (Imagens, Vídeos, Áudios, Documentos, Compactados, Lixeira e Outros).
- Tooltips informativos ao passar o mouse ou tocar em cada segmento.

#### 3. Grade de Categorias e Filtro Instantâneo
- Cards de métricas exibindo o espaço total ocupado, quantidade de arquivos e porcentagem de cada categoria.
- **Filtro Interativo com 1 Clique**: clicar em qualquer categoria filtra instantaneamente a lista de arquivos abaixo para exibir apenas os arquivos do tipo selecionado.
- Barra superior de **pílulas de filtro (*pills*)** para alternar rapidamente entre "Todos", "Imagens", "Vídeos", "Áudios", "Documentos", "Compactados" e "Outros".

#### 4. Ações Rápidas de Limpeza
- **Esvaziar Lixeira**: botão de 1 clique com modal de confirmação para liberação instantânea de espaço ocupado por arquivos deletados.
- **Identificador de Arquivos Grandes**: destaque e atalho direto para arquivos com mais de 50 MB.
- **Recalcular em Tempo Real**: botão para atualizar o escaneamento e invalidar o cache sob demanda.

#### 5. Tabela Responsiva dos Maiores Arquivos (Desktop & Mobile)
- **Desktop**: Tabela com layout fixo sem rolagem horizontal indesejada, mantendo os botões de ação (Baixar e Mover para Lixeira) sempre visíveis e alinhados.
- **Encurtamento Inteligente de Pastas (`...`)**: caminhos profundos exibem as 3 pastas iniciais e as 2 finais (ex: `pasta1/pasta2/pasta3/.../subA/subB`), mantendo o caminho completo disponível via tooltip.
- **Mobile (Card View Exclusivo)**: em telas de smartphone (`<= 768px`), a tabela se transforma em uma sequência de cartões modernos, com badge de tamanho destacado, caminho com ícone dedicado e botões largos de toque para download e exclusão.

---

## Sistema de Lixeira

### Visão Geral
Sistema completo de recuperação de arquivos excluídos, permitindo restaurar arquivos deletados acidentalmente.

### Acessar a Lixeira

**Como usar:**
1. Menu lateral → "Lixeira"
2. Veja todos os arquivos excluídos
3. Restaure ou delete permanentemente

**Interface:**
- Design moderno e responsivo
- Busca em tempo real
- Ordenação por nome, tamanho, data de exclusão
- Seleção múltipla
- Visualização de grid ou lista

### Funcionalidades

#### Ver Arquivos na Lixeira

**Informações mostradas:**
- Nome original do arquivo
- Tamanho
- Data e hora da exclusão
- Caminho original (onde estava antes da exclusão)
- Ícone por tipo de arquivo

**Recursos:**
- Busca em tempo real
- Ordenação (nome, tamanho, data)
- Contador de arquivos na lixeira
- Preview de imagens

#### Restaurar Arquivos

**Restauração Individual:**
1. Clique no menu de três pontos do arquivo
2. Selecione "Restaurar"
3. Arquivo volta para o local original

**Restauração em Lote:**
1. Selecione múltiplos arquivos (Ctrl+Clique ou Ctrl+A)
2. Clique em "Restaurar Selecionados"
3. Todos os arquivos são restaurados

**Como funciona:**
- Arquivo é movido de volta para a pasta original
- Se a pasta original não existir mais, cria automaticamente
- Mantém o nome original do arquivo
- Log de auditoria registra a restauração

#### Excluir Permanentemente

**Exclusão Individual:**
1. Menu de três pontos → "Excluir Permanentemente"
2. Confirme a exclusão definitiva
3. Arquivo é removido do disco

**Exclusão em Lote:**
1. Selecione os arquivos
2. Clique em "Excluir Permanentemente"
3. Confirme a exclusão

**Aviso:** Esta ação é irreversível!

#### Esvaziar Lixeira

Exclui todos os arquivos da lixeira de uma vez.

**Como usar:**
1. Na página da lixeira, clique em "Esvaziar Lixeira"
2. Confirme a ação no modal
3. Todos os arquivos são excluídos permanentemente

**Confirmação:**
- Modal de confirmação com contagem de arquivos
- Aviso de ação irreversível
- Feedback visual após conclusão

#### Visualizar Arquivos

**Imagens:**
- Clique na imagem para abrir lightbox
- Visualização em tela cheia
- Navegação entre imagens
- Download e restauração direto do lightbox

**Áudios:**
- Clique no arquivo para abrir player
- Controles customizados
- Opções de restaurar ou excluir

**PDFs e outros:**
- Preview quando disponível
- Download direto

### Interface Mobile

**Otimizações para mobile:**
- Layout de grid responsivo (2 colunas)
- Cards compactos com informações essenciais
- Menu de contexto otimizado para toque
- Botões grandes e acessíveis
- Barra de ações flutuante
- Busca com teclado virtual otimizado

### Segurança

**Log de Auditoria:**
- Exclusões são registradas
- Restaurações são registradas
- Exclusões permanentes são registradas
- Timestamp e IP do usuário

**Permissões:**
- Apenas o usuário autenticado pode acessar
- Rate limiting aplicado
- Proteção CSRF em todas as ações

### Seleção de Arquivos

#### Seleção Individual
Clique no checkbox ao lado do arquivo.

#### Seleção Múltipla

**Ctrl + Clique:**
- Adiciona/remove arquivo da seleção
- Mantém seleção anterior

**Shift + Clique:**
- Seleciona intervalo entre dois arquivos
- Útil para selecionar muitos arquivos consecutivos

**Ctrl + A:**
- Seleciona todos os arquivos visíveis
- Pressione novamente para desselecionar

#### Contador de Seleção
Mostra quantos arquivos estão selecionados.

**Exemplo:** `3 arquivos selecionados`

### Exclusão de Arquivos

#### Exclusão Individual
Delete um arquivo por vez.

**Como usar:**
1. Menu de três pontos → "Excluir"
2. Confirme a exclusão no modal

#### Exclusão em Lote
Delete múltiplos arquivos de uma vez.

**Como usar:**
1. Selecione os arquivos
2. Clique em "Excluir Selecionados"
3. Confirme a exclusão

**Recursos:**
- Atualização AJAX (sem recarregar página)
- Feedback visual imediato
- Log de auditoria automático

### Busca de Arquivos

#### Busca em Tempo Real
Filtre arquivos enquanto digita.

**Como usar:**
1. Digite no campo de busca
2. Resultados aparecem instantaneamente
3. Busca por nome de arquivo

**Recursos:**
- Case-insensitive (não diferencia maiúsculas)
- Busca parcial (encontra partes do nome)
- Contador de resultados
- Limpa com o botão X

**Exemplo:**
- Digite "foto" para encontrar "foto.jpg", "Foto_2026.png", "minhas_fotos.zip"

### Ordenação

#### Tipos de Ordenação

**Por Tipo:**
- Agrupa arquivos por extensão
- Pastas sempre no topo
- Ordem alfabética dentro de cada tipo

**Por Nome:**
- Ordem alfabética A-Z
- Pastas primeiro
- Não diferencia maiúsculas

**Por Tamanho:**
- Do maior para o menor
- Pastas aparecem como "Pasta"
- Formato legível (KB, MB, GB)

**Por Data:**
- Mais recentes primeiro
- Formato: DD/MM/YYYY HH:mm
- Baseado em data de modificação

#### Como Usar
1. Clique no botão de ordenação
2. Escolha o tipo desejado
3. Arquivos são reordenados instantaneamente

### Paginação

#### Lazy Loading
Carrega arquivos sob demanda.

**Como funciona:**
- Carrega inicialmente 100 arquivos (padrão)
- Botão "Carregar Mais" no final
- Suporta pastas com milhares de arquivos

**Configurar:**
```env
ITEMS_PER_PAGE=100  # Ajuste conforme necessário
```

---

## Sistema de Compartilhamento

### Criar Link de Compartilhamento

**Como usar:**
1. Menu de três pontos do arquivo → "Compartilhar"
2. Configure as opções:
   - Senha (opcional)
   - Tempo de expiração
3. Clique em "Gerar Link"
4. Copie e compartilhe o link

### Opções de Compartilhamento

#### Proteção por Senha
Adicione uma camada extra de segurança.

**Como usar:**
1. Marque "Proteger com senha"
2. Digite uma senha forte
3. Compartilhe a senha separadamente

**Segurança:**
- Senha é hasheada (pbkdf2:sha256)
- Nunca é armazenada em texto plano
- Verificada apenas no momento do acesso

#### Tempo de Expiração

**Opções disponíveis:**
- **1 hora** - Para compartilhamentos rápidos
- **24 horas** - Recomendado para dia a dia
- **7 dias** - Compartilhamento de curto prazo
- **30 dias** - Compartilhamento de longo prazo
- **Sem expiração** - Permanente até revogação manual

**Como funciona:**
- Link deixa de funcionar após o prazo
- Usuário vê mensagem "Link expirado"
- Você pode ver o tempo restante na lista

### Página Pública de Download

A pessoa que recebe o link vê:

**Informações do Arquivo:**
- Nome do arquivo
- Tamanho
- Ícone por tipo de arquivo
- Quem compartilhou
- Tempo até expirar

**Recursos:**
- Design profissional e responsivo
- Funciona em todos os dispositivos
- Preview de imagens
- Tema claro/escuro automático

**Fluxo com senha:**
1. Abre o link
2. Vê informações do arquivo
3. Digite a senha
4. Botão de download aparece
5. Baixa o arquivo

**Fluxo sem senha:**
1. Abre o link
2. Vê informações do arquivo
3. Clica em "Baixar Arquivo"
4. Download inicia

### Gerenciar Links Compartilhados

#### Página de Gerenciamento
Acesse via menu principal → "Compartilhamentos"

**Lista de Links:**
Para cada link, você vê:
- Nome do arquivo
- Status (Ativo, Expirado, Revogado)
- Tempo restante
- Número de downloads
- Último acesso
- Tem senha ou não
- URL completa

**Ações disponíveis:**
- Copiar link
- Revogar link
- Ver detalhes

#### Revogar Link
Desative um link compartilhado.

**Como usar:**
1. Na lista de compartilhamentos
2. Clique em "Revogar" no link desejado
3. Confirme a revogação

**Efeito:**
- Link para de funcionar imediatamente
- Usuários veem "Link revogado pelo proprietário"
- Não pode ser reativado (precisa criar novo)

#### Estatísticas
Acompanhe o uso dos links.

**Informações disponíveis:**
- Número total de downloads
- Data/hora do último acesso
- IP do último acesso (em logs)

### Preview de Imagens
Links de imagens mostram preview antes do download.

**Formatos suportados:**
- JPG/JPEG
- PNG
- GIF
- WebP
- BMP

**Como funciona:**
- Imagem é carregada automaticamente
- Preview em tamanho máximo 300px altura
- Mantém proporções originais
- Não conta como download

---

## Autenticação e Segurança

### Páginas de Autenticação Redesenhadas

#### Design Moderno
Todas as páginas de autenticação foram completamente redesenhadas com um visual moderno e profissional.

**Características:**
- **Cards centralizados** com animação de entrada suave
- **Gradientes temáticos** para cada página:
  - Login: Azul (#3b82f6 → #2563eb)
  - Setup: Rosa (#ec4899 → #f472b6)
  - Reset de Senha: Verde (#10b981 → #059669)
- **Headers com ícones** grandes e estilizados
- **Formulários limpos** com validação em tempo real
- **Totalmente responsivo** para todos os dispositivos
- **Suporte a dark mode** com cores ajustadas

#### Toggle de Senha Melhorado
Sistema de visualização de senha aprimorado.

**Recursos:**
- Botão com ícone de olho (eye/eye-off)
- Troca suave de ícones sem duplicação
- Funciona em todos os campos de senha
- Feedback visual ao hover
- Acessível via teclado

**Páginas com toggle:**
- Login (senha)
- Setup (senha e confirmação)
- Reset de Senha (nova senha e confirmação)
- Perfil (senha atual e nova)

#### Indicador de Força de Senha
Validação visual em tempo real da força da senha.

**Recursos:**
- 4 barras coloridas que preenchem conforme requisitos
- Lista de requisitos que ficam verdes ao serem atendidos:
  - ✓ Mínimo 12 caracteres
  - ✓ Uma letra maiúscula
  - ✓ Uma letra minúscula
  - ✓ Um número
  - ✓ Um caractere especial
- Cores por força:
  - Vermelho: Muito fraca (1-2 requisitos)
  - Laranja: Fraca (2-3 requisitos)
  - Amarelo: Média (3-4 requisitos)
  - Verde: Forte (todos os requisitos)

**Onde aparece:**
- Página de Setup (configuração inicial)
- Página de Reset de Senha
- Perfil (ao trocar senha)

#### Responsividade
Otimizado para todos os tamanhos de tela.

**Desktop:**
- Card centralizado elegante
- Espaçamento generoso
- Ícones e textos grandes

**Tablet:**
- Card adaptado ao tamanho
- Elementos proporcionalmente reduzidos

**Mobile:**
- Card ocupa largura total
- Padding reduzido
- Inputs e botões otimizados para toque
- Teclado virtual otimizado

### Sistema de Login

#### Proteção contra Força Bruta
Rate limiting agressivo.

**Limites:**
- 10 tentativas por minuto
- Bloqueio temporário após limite
- Mensagem: "Rate limit exceeded"

**Configurar:**
```env
RATELIMIT_LOGIN=10 per minute
```

#### Validação de Senha
Senhas devem atender requisitos de segurança.

**Requisitos obrigatórios:**
- Mínimo 8 caracteres
- Pelo menos 1 letra maiúscula
- Pelo menos 1 letra minúscula
- Pelo menos 1 número
- Pelo menos 1 caractere especial (!@#$%^&*)

**Indicador de Força:**
- Vermelho: Fraca
- Amarelo: Média
- Verde: Forte

#### Toggle Mostrar/Ocultar Senha
Disponível em todos os campos de senha.

**Como usar:**
- Clique no ícone de olho
- Senha fica visível temporariamente
- Clique novamente para ocultar

### Autenticação de Dois Fatores (2FA)

#### O que é 2FA
Adiciona uma segunda camada de segurança além da senha.

**Benefícios:**
- Protege mesmo se a senha vazar
- Códigos mudam a cada 30 segundos
- Padrão usado por bancos e grandes empresas

#### Configurar 2FA

**Requisitos:**
- App autenticador instalado (Google Authenticator, Authy, etc.)
- Acesso ao seu email

**Passos:**
1. Login → Perfil
2. Seção "Autenticação de Dois Fatores"
3. Clique em "Ativar 2FA"
4. Escaneie o QR code com o app
5. Digite o código de teste
6. Salve os códigos de backup

#### Códigos de Backup
10 códigos de uso único para emergências.

**Quando usar:**
- Perdeu o celular
- App autenticador parou de funcionar
- Código TOTP não está funcionando

**Como usar:**
1. Na tela de 2FA, clique em "Usar código de backup"
2. Digite um dos códigos salvos
3. Código é consumido após o uso

**Importante:**
- Cada código funciona apenas uma vez
- Salve em local seguro
- Gere novos códigos se acabarem

#### Desativar 2FA

**Como:**
1. Login → Perfil
2. Seção "Autenticação de Dois Fatores"
3. Clique em "Desativar 2FA"
4. Confirme com senha

### Recuperação de Senha

#### Solicitar Reset

**Como usar:**
1. Na tela de login, clique em "Esqueceu sua senha?"
2. Digite seu email
3. Verifique seu email
4. Clique no link recebido
5. Digite nova senha
6. Faça login

**Segurança:**
- Token único e seguro
- Válido por apenas 1 hora
- Usado uma vez e destruído
- Rate limit: 5 tentativas por hora

**Problemas comuns:**
- Email não chega: verifique spam
- Link expirado: solicite novo reset
- Email não configurado: reset manual necessário

### Notificações de Login
Receba email a cada acesso.

**Informações no email:**
- Data e hora do login
- Endereço IP
- Navegador usado
- Sistema operacional

**Benefícios:**
- Detecta acessos não autorizados
- Saiba quando alguém tenta acessar sua conta
- Histórico de logins por email

**Configurar:**
Email deve estar configurado em `instance/.env`

### Sessões Seguras

#### Cookies Seguros
Configurados automaticamente:

**Atributos:**
- `HttpOnly`: JavaScript não pode acessar
- `SameSite=Lax`: Proteção contra CSRF
- `Secure`: Somente HTTPS (produção)

#### Tempo de Sessão
**Padrão:** 8 horas de inatividade

**Como funciona:**
- Sessão expira após 8 horas sem atividade
- Atividade renova o tempo
- Logout manual limpa sessão imediatamente

### Headers de Segurança
Aplicados automaticamente em produção:

**HSTS (Strict-Transport-Security):**
- Força HTTPS por 1 ano
- Inclui subdomínios

**X-Frame-Options: DENY:**
- Previne clickjacking
- Bloqueia iframe

**X-Content-Type-Options: nosniff:**
- Previne MIME sniffing
- Força content-type correto

**Content-Security-Policy:**
- Scripts apenas do próprio domínio
- Inline CSS/JS permitido (necessário)
- Imagens de qualquer origem
- Sem frames externos

**Referrer-Policy:**
- `strict-origin-when-cross-origin`
- Privacidade melhorada

---

## Visualização de Arquivos

### Lightbox de Imagens

**Recursos:**
- Visualização em tela cheia otimizada
- Fundo escuro semitransparente com blur
- Navegação entre imagens (anterior/próximo)
- Download direto
- Exclusão rápida
- **Design moderno e responsivo:**
  - Modal compacto sem scroll horizontal
  - Botões de navegação posicionados dentro do modal
  - Controles sempre acessíveis no mobile
  - Redimensionamento inteligente para telas pequenas

**Controles:**
- **Desktop:**
  - Setas esquerda/direita: navegar entre imagens
  - ESC: fechar lightbox
  - Clique fora do modal: fechar
  - Botões de navegação laterais
- **Mobile:**
  - Botões de navegação sobrepostos na imagem
  - Controles de footer sempre visíveis
  - Toque fora para fechar
  - Gestos de swipe (futuro)

**Formatos suportados:**
- JPG, JPEG
- PNG
- GIF (animado)
- WebP
- BMP
- SVG

**Responsividade:**
- **Desktop (>768px):** Modal 85vw x 85vh, botões laterais grandes
- **Tablet (768px):** Modal 90vw x 75vh, controles adaptados
- **Mobile (<480px):** Modal 100vw x 90vh, layout vertical compacto

### Player de Áudio

**Recursos:**
- **Player customizado com design moderno**
- Modal centralizado com gradiente roxo
- **Controles totalmente personalizados:**
  - Botão play/pause grande e estiloso
  - Barra de progresso interativa com handle arrastável
  - Controle de volume com slider expansível
  - Tempo atual e duração formatados (MM:SS)
  - Ícones que mudam dinamicamente
- **Interações avançadas:**
  - Clique na barra de progresso para pular
  - Arraste o handle para navegar
  - Hover no volume para expandir slider
  - Botão mute/unmute que lembra último volume

**Controles:**
- **Play/Pause:** Botão grande centralizado com ícone animado
- **Barra de Progresso:** Clique ou arraste para qualquer ponto do áudio
- **Volume:** Slider que aparece ao passar o mouse, ícone muda por nível
- **Tempo:** Mostra tempo atual e duração total
- **Download:** Baixar arquivo direto do player
- **Excluir:** Deletar com confirmação

**Formatos suportados:**
- MP3
- WAV
- OGG
- M4A
- AAC
- FLAC

**Como usar:**
1. Clique no arquivo de áudio
2. Player abre com controles customizados
3. Use play/pause para reproduzir
4. Clique na barra ou arraste para navegar
5. Ajuste volume com slider ou clique no ícone para mutar
6. Feche com X, ESC ou clicando fora

**Responsividade Mobile:**
- Controles reorganizados verticalmente
- Botões maiores para facilitar toque
- Slider de volume sempre visível
- Layout otimizado para telas pequenas

### Visualizador de PDF

**Recursos:**
- Abre direto no navegador
- Zoom in/out
- Navegação de páginas
- Download
- Impressão (se navegador suportar)

**Como usar:**
1. Clique no arquivo PDF
2. Abre em nova aba
3. Use controles do navegador

### Ícones por Tipo de Arquivo

**Sistema de ícones:** Lucide Icons (SVG)

**Tipos reconhecidos:**
- **Documentos:** PDF, DOC, DOCX, TXT, MD
- **Planilhas:** XLS, XLSX, CSV
- **Apresentações:** PPT, PPTX
- **Imagens:** JPG, PNG, GIF, etc.
- **Vídeos:** MP4, AVI, MOV, etc.
- **Áudio:** MP3, WAV, OGG, etc.
- **Código:** JS, PY, HTML, CSS, etc.
- **Arquivos:** ZIP, RAR, 7Z, TAR, GZ
- **Genérico:** Outros tipos

---

## Interface do Usuário

### Temas Claro e Escuro

#### Alternar Tema

**Como:**
1. Clique no ícone de sol/lua no topo
2. Tema muda instantaneamente
3. Preferência é salva

**Automático:**
- Carrega tema anterior na próxima visita
- Aplicado antes da página carregar (sem flash)

#### Personalização por Tema

**Tema Claro:**
- Fundo branco (#ffffff)
- Texto escuro (#1a1a1a)
- Cards cinza claro

**Tema Escuro:**
- Fundo escuro (#1a1a1a)
- Texto claro (#e5e5e5)
- Cards cinza escuro

### Design Responsivo

#### Desktop (> 1024px)
- Sidebar lateral fixa
- Grid de 4-6 colunas
- Cards maiores
- Controles completos visíveis

#### Tablet (768px - 1024px)
- Sidebar colapsável
- Grid de 3-4 colunas
- Cards médios
- Controles adaptados

#### Mobile (< 768px)
- Topbar compacta (56px)
- Grid de 2 colunas
- FAB expansível
- Controles minimalistas
- Breadcrumb compacto

#### Landscape Mobile
- Topbar extra compacta (48px)
- Grid de 3-4 colunas
- Cards menores
- Aproveita largura extra

### FAB Expansível (Mobile)

**Floating Action Button** no canto inferior direito.

**Recursos:**
- Botão principal sempre visível
- Expande para mostrar ações
- Upload e Nova Pasta
- Ícones intuitivos

**Como usar:**
1. Toque no FAB
2. Menu expande com opções
3. Toque na ação desejada
4. Menu recolhe automaticamente

### Menu de Contexto
Três pontinhos em cada arquivo/pasta.

**Ações disponíveis:**
- Baixar
- Compartilhar (arquivos)
- Excluir
- Ver detalhes (futuro)

**Design:**
- Estilo Google Drive
- Ícone vertical de três pontos
- Menu dropdown ao clicar

### Toast Notifications
Mensagens de feedback temporárias.

**Tipos:**
- **Sucesso:** Verde, ícone de check
- **Erro:** Vermelho, ícone de X
- **Info:** Azul, ícone de info
- **Aviso:** Amarelo, ícone de alerta

**Comportamento:**
- Aparece no topo da tela
- Desaparece após 3-5 segundos
- Pode ser fechado manualmente
- Múltiplos toasts empilham

**Exemplos:**
- "Arquivo enviado com sucesso"
- "3 arquivos excluídos"
- "Link copiado para área de transferência"
- "Erro ao fazer upload"

### Atalhos de Teclado

**Navegação:**
- `Alt + ←` - Voltar pasta anterior
- `Alt + →` - Avançar pasta
- `ESC` - Fechar modais/lightbox

**Seleção:**
- `Ctrl + A` - Selecionar todos
- `Ctrl + Clique` - Adicionar à seleção
- `Shift + Clique` - Selecionar intervalo

**Busca:**
- `/` - Focar campo de busca

**Outros:**
- `Enter` - Confirmar modal

---

## Perfil do Usuário

### Informações Pessoais

#### Nome de Exibição
Nome mostrado na interface.

**Como alterar:**
1. Perfil → Nome de Exibição
2. Digite novo nome
3. Salvar

**Nota:** Não afeta o nome de usuário de login.

#### Email
Email para recuperação de senha e notificações.

**Como alterar:**
1. Perfil → Email
2. Digite novo email
3. Salvar

**Importante:** Certifique-se de ter acesso ao email.

### Troca de Senha

**Como usar:**
1. Perfil → Alterar Senha
2. Digite senha atual
3. Digite nova senha
4. Confirme nova senha
5. Salvar

**Validação:**
- Senha atual deve estar correta
- Nova senha deve atender requisitos
- Confirmação deve ser igual
- Indicador de força em tempo real

**Efeito:**
- Todas as sessões ativas são mantidas
- Você não é deslogado

### Preferência de Tema

**Como usar:**
1. Perfil → Tema
2. Selecione Claro ou Escuro
3. Preview visual
4. Salvar

**Alternativa:** Use botão sol/lua no topo.

### Gerenciar 2FA

**No perfil você pode:**
- Ativar 2FA
- Desativar 2FA
- Ver códigos de backup
- Regenerar códigos de backup

Veja detalhes em [Autenticação de Dois Fatores](#autenticação-de-dois-fatores-2fa).

---

## Segurança e Auditoria

### Log de Auditoria

#### O que é Registrado

**Ações de usuário:**
- Logins (sucesso e falha)
- Logout
- Uploads de arquivo
- Downloads
- Exclusões
- Criação/exclusão de pastas
- Criação/revogação de links compartilhados

**Informações registradas:**
- Data e hora
- Usuário
- Ação realizada
- Arquivo/pasta afetado
- Endereço IP
- Resultado (sucesso/falha)

#### Formato do Log

```
[2026-08-20 14:30:45] INFO - LOGIN SUCESSO | Usuário: admin | IP: 192.168.1.100
[2026-08-20 14:31:20] INFO - UPLOAD | Usuário: admin | Arquivo: documento.pdf | Tamanho: 2.5MB
[2026-08-20 14:32:10] INFO - DOWNLOAD | Usuário: admin | Arquivo: relatorio.xlsx
[2026-08-20 14:35:00] INFO - DELETE | Usuário: admin | Arquivo: foto_antiga.jpg
```

#### Acessar Logs

**Arquivo:** `instance/audit.log`

**Via terminal:**
```bash
# Ver últimas 50 linhas
tail -50 instance/audit.log

# Seguir em tempo real
tail -f instance/audit.log

# Buscar por usuário
grep "admin" instance/audit.log

# Buscar por ação
grep "DELETE" instance/audit.log
```

#### Rotação de Logs
Automática quando atinge tamanho limite.

**Configurar:**
```env
AUDIT_LOG_MAX_MB=10  # Rotaciona a cada 10MB
```

**Como funciona:**
- Log atual: `audit.log`
- Após rotação: `audit.log.1`, `audit.log.2`, etc.

### Proteção CSRF
Proteção contra Cross-Site Request Forgery.

**Como funciona:**
- Token único por sessão
- Validado em todas as requisições POST
- Regenerado periodicamente

**Para o usuário:**
- Transparente (funciona automaticamente)
- Mensagem de erro se token expirar
- Recarregar página resolve

### Validação de Path Traversal
Previne acesso a arquivos fora da pasta base.

**Proteção:**
- Bloqueia `../` em caminhos
- Bloqueia paths absolutos maliciosos
- Valida todos os caminhos de arquivo

**Erro mostrado:**
```
File path traversal detected
```

**Solução:** Use nomes normais de arquivo/pasta.

### Rate Limiting
Proteção contra abuso.

**Aplicado em:**
- Login
- Upload
- Download
- Exclusão
- Criação de links
- Rotas públicas

**Mensagem de erro:**
```
Rate limit exceeded. Aguarde um momento.
```

Veja [Rate Limiting](CONFIGURATION.md#rate-limiting) para configuração.

---

## Recursos Futuros

Funcionalidades planejadas (veja [ROADMAP.md](ROADMAP.md)):

- Interface de visualização de logs de auditoria
- Player de vídeo integrado
- Sistema de favoritos
- Suporte multi-usuário com permissões
- Busca avançada com filtros
- Preview de documentos Office
- Editor de texto online
- Versionamento de arquivos
- Sincronização automática
- App mobile nativo

---

## Perguntas Frequentes

**Como adiciono mais usuários?**
Atualmente o sistema suporta apenas um usuário. Suporte multi-usuário está no roadmap.

**Posso recuperar arquivos excluídos?**
Sim! Use a **Lixeira** no menu lateral. Arquivos excluídos ficam lá até serem restaurados ou excluídos permanentemente.

**Por quanto tempo os arquivos ficam na lixeira?**
Indefinidamente, até você restaurá-los ou excluí-los permanentemente. A lixeira não tem limpeza automática.

**Qual o limite de armazenamento?**
Limitado pelo espaço em disco disponível no sistema.

**Posso acessar de qualquer lugar?**
Sim, usando Cloudflare Tunnel em modo produção.

**É seguro para dados sensíveis?**
Sim, com criptografia HTTPS, 2FA, e controle total dos dados.

**Funciona sem internet?**
Sim, na rede local. Internet é necessária apenas para acesso remoto.

---

## Próximos Passos

- [Configurar ajustes avançados](CONFIGURATION.md)
- [Fazer deploy em produção](DEPLOYMENT.md)
- [Solucionar problemas](TROUBLESHOOTING.md)
