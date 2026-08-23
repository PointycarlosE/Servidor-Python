// Variável global para rastrear se o drag começou dentro da página
let isInternalDrag = false;

// ===== LIGHTBOX PARA IMAGENS =====
document.addEventListener('DOMContentLoaded', function () {
    const lightbox = document.getElementById('lightbox');
    const lightboxImage = document.getElementById('lightbox-image');
    const lightboxTitle = document.getElementById('lightbox-title');
    const lightboxInfo = document.getElementById('lightbox-info');
    const lightboxDownload = document.getElementById('lightbox-download');
    const lightboxDelete = document.getElementById('lightbox-delete');
    const lightboxClose = document.getElementById('lightbox-close');
    const lightboxPrev = document.getElementById('lightbox-prev');
    const lightboxNext = document.getElementById('lightbox-next');

    // Debug: verificar se os elementos existem
    console.log('Lightbox elementos:', {
        lightbox: !!lightbox,
        lightboxImage: !!lightboxImage,
        lightboxTitle: !!lightboxTitle
    });

    if (!lightbox || !lightboxImage) {
        console.error('Elementos do lightbox não encontrados!');
        return;
    }

    let currentImageIndex = 0;
    let images = [];

    function updateImageList() {
        images = [];
        document.querySelectorAll('.item-imagem').forEach((card, index) => {
            const link = card.closest('.item-link');
            if (link) {
                const thumbnail = card.querySelector('.item-thumbnail');
                const nomeElement = card.querySelector('.item-nome');
                const downloadBtn = card.querySelector('a[href^="/download/"]');
                const deleteForm = card.querySelector('form');
                images.push({
                    nome: nomeElement ? nomeElement.textContent : '',
                    visualizarUrl: thumbnail ? thumbnail.src : '',
                    downloadUrl: downloadBtn ? downloadBtn.getAttribute('href') : '',
                    deleteForm: deleteForm,
                    elemento: card,
                    index: index
                });
            }
        });
    }

    function openLightbox(index) {
        if (images.length === 0) return;
        currentImageIndex = index;
        const image = images[currentImageIndex];
        lightboxImage.src = image.visualizarUrl;
        lightboxTitle.textContent = image.nome;
        lightboxInfo.textContent = `Imagem ${currentImageIndex + 1} de ${images.length}`;
        lightboxDownload.href = image.downloadUrl;

        lightboxDelete.onclick = async function (e) {
            e.preventDefault();
            const image = images[currentImageIndex];
            const confirmado = await ConfirmModal.open({
                title: 'Excluir imagem',
                message: `Tem certeza que deseja excluir a imagem "${image.nome}"?`,
                detail: 'Esta ação não pode ser desfeita.'
            });
            if (confirmado && image.deleteForm) {
                showToast(`Excluindo ${image.nome}...`, 'info', 2000);
                const form = image.deleteForm.cloneNode(true);
                document.body.appendChild(form);
                form.submit();
                setTimeout(() => { if (document.body.contains(form)) document.body.removeChild(form); }, 1000);
            }
        };

        lightbox.classList.add('active');
        lightbox.style.display = 'flex'; // Forçar exibição do modal
        console.log('Lightbox aberto! Classes:', lightbox.className, 'Display:', lightbox.style.display);

        // Não bloquear o scroll do body - removido: document.body.style.overflow = 'hidden';

        // Empurra um estado falso no histórico para capturar o botão voltar do celular
        if (!history.state?.lightboxOpen) {
            history.pushState({ lightboxOpen: true }, '');
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightbox.style.display = 'none'; // Esconder o modal
        lightboxImage.src = '';
        console.log('Lightbox fechado!');
        // Não é necessário restaurar overflow - removido: document.body.style.overflow = '';

        // Descarta o estado falso que empurramos ao abrir
        if (history.state?.lightboxOpen) {
            history.back();
        }
    }

    // Intercepta o botão "voltar" do celular (e Alt+Seta no desktop)
    window.addEventListener('popstate', function (e) {
        if (lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            lightbox.style.display = 'none'; // Esconder o modal
            lightboxImage.src = '';
            // Não é necessário restaurar overflow
        }
    });

    function prevImage() {
        if (images.length > 0) { currentImageIndex = (currentImageIndex - 1 + images.length) % images.length; openLightbox(currentImageIndex); }
    }

    function nextImage() {
        if (images.length > 0) { currentImageIndex = (currentImageIndex + 1) % images.length; openLightbox(currentImageIndex); }
    }

    updateImageList();

    // ✅ DELEGAÇÃO DE EVENTO: Lightbox para imagens
    document.addEventListener('click', function (e) {
        const link = e.target.closest('.item-link');
        if (link && link.querySelector('.item-imagem')) {
            console.log('Clique em imagem detectado!', link);

            if (e.ctrlKey) return; // Ctrl+Clique é para seleção, não para abrir lightbox
            if (e.target.closest('.botao-download') || e.target.closest('.botao-excluir') ||
                e.target.closest('form') || e.target.closest('button') ||
                e.target.closest('.item-checkbox') || e.target.closest('.item-checkbox-input')) {
                console.log('Clique em botão/checkbox detectado, ignorando');
                return;
            }

            console.log('Abrindo lightbox...');
            e.preventDefault();
            e.stopPropagation();
            updateImageList();
            const currentCard = link.querySelector('.item-imagem');
            const newIndex = Array.from(document.querySelectorAll('.item-imagem')).indexOf(currentCard);
            console.log('Index da imagem:', newIndex, 'Total de imagens:', images.length);
            if (newIndex !== -1) openLightbox(newIndex);
        }
    });

    lightboxClose.addEventListener('click', closeLightbox);
    lightboxPrev.addEventListener('click', prevImage);
    lightboxNext.addEventListener('click', nextImage);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
        if (lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') prevImage();
            else if (e.key === 'ArrowRight') nextImage();
        }
    });

    lightbox.addEventListener('click', function (e) { if (e.target === lightbox) closeLightbox(); });
});

// ===== BARRA DE PESQUISA =====
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('pesquisa-input');
    const searchClear = document.getElementById('pesquisa-limpar');
    const searchCounter = document.getElementById('pesquisa-contador');
    let searchTimeout;

    function updateCounter() {
        const items = document.querySelectorAll('.item-link');
        const visibleItems = Array.from(items).filter(item => item.style.display !== 'none').length;
        if (!searchCounter) return;
        if (visibleItems === 0) searchCounter.textContent = 'Nenhum resultado';
        else if (visibleItems === 1) searchCounter.textContent = '1 resultado';
        else searchCounter.textContent = `${visibleItems} resultados`;
    }

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const items = document.querySelectorAll('.item-link');
        searchClear.classList.toggle('visible', searchTerm.length > 0);

        if (searchTerm === '') {
            items.forEach(item => { item.style.display = 'block'; item.classList.remove('destaque-pesquisa'); });
            updateCounter();
            if (typeof window.updateItemCount === 'function') window.updateItemCount();
            return;
        }

        items.forEach(item => {
            const nome = item.querySelector('.item-nome')?.textContent.toLowerCase() || '';
            const tipo = item.querySelector('.item-tipo')?.textContent.toLowerCase() || '';
            const matches = nome.includes(searchTerm) || tipo.includes(searchTerm);
            if (matches) {
                item.style.display = 'block';
                if (nome === searchTerm || tipo === searchTerm) {
                    item.classList.add('destaque-pesquisa');
                    setTimeout(() => item.classList.remove('destaque-pesquisa'), 1000);
                }
            } else {
                item.style.display = 'none';
            }
        });

        updateCounter();
        if (typeof window.updateItemCount === 'function') window.updateItemCount();
    }

    if (searchInput) searchInput.addEventListener('input', function () { clearTimeout(searchTimeout); searchTimeout = setTimeout(performSearch, 150); });
    if (searchClear) searchClear.addEventListener('click', function () { searchInput.value = ''; searchInput.focus(); performSearch(); });
    
    // Re-executa busca se a lista for atualizada via AJAX
    document.addEventListener('listaAtualizada', performSearch);
    updateCounter();
});

// ===== ALTERNAR VISUALIZAÇÃO (GRID/LISTA) =====
document.addEventListener('DOMContentLoaded', function () {
    const viewGrid = document.getElementById('view-grid');
    const viewList = document.getElementById('view-list');
    const totalItensSpan = document.getElementById('view-total-itens');

    window.updateItemCount = function () {
        const visibleItems = document.querySelectorAll('.item-link:not([style*="display: none"])').length;
        if (totalItensSpan) totalItensSpan.textContent = visibleItems;
    };

    const savedView = localStorage.getItem('viewMode') || 'grid';
    setViewMode(savedView);

    if (viewGrid) viewGrid.addEventListener('click', () => setViewMode('grid'));
    if (viewList) viewList.addEventListener('click', () => setViewMode('list'));

    function setViewMode(mode) {
        const listagemContainer = document.querySelector('.listagem-itens');
        viewGrid?.classList.toggle('active', mode === 'grid');
        viewList?.classList.toggle('active', mode === 'list');
        if (listagemContainer) listagemContainer.classList.toggle('view-list', mode === 'list');
        localStorage.setItem('viewMode', mode);
        setTimeout(window.updateItemCount, 50);
    }

    document.addEventListener('listaAtualizada', () => {
        setViewMode(localStorage.getItem('viewMode') || 'grid');
        window.updateItemCount();
    });

    window.updateItemCount();
});

// ===== ORDENAÇÃO =====
document.addEventListener('DOMContentLoaded', function () {
    const ordenacaoBotoes = {
        nome: document.getElementById('ordenar-nome'),
        tipo: document.getElementById('ordenar-tipo'),
        tamanho: document.getElementById('ordenar-tamanho'),
        data: document.getElementById('ordenar-data')
    };

    if (!ordenacaoBotoes.nome) return;

    // Tamanho e data iniciam desc (maior/mais recente primeiro), os demais asc
    const ordemPadrao = { nome: 'asc', tipo: 'asc', tamanho: 'desc', data: 'desc' };
    let ordenacaoAtual = { criterio: 'tipo', ordem: 'asc' };
    let isOrdenando = false;

    try {
        const saved = localStorage.getItem('ordenacao');
        if (saved) ordenacaoAtual = JSON.parse(saved);
    } catch (e) {}

    function atualizarBotoesOrdenacao() {
        Object.values(ordenacaoBotoes).forEach(btn => { if (btn) { btn.classList.remove('active'); btn.removeAttribute('data-order'); } });
        const btnAtual = ordenacaoBotoes[ordenacaoAtual.criterio];
        if (btnAtual) { btnAtual.classList.add('active'); btnAtual.setAttribute('data-order', ordenacaoAtual.ordem); }
    }

    function parseTamanho(t) {
        if (!t || t === '--') return 0;
        const m = t.match(/([\d.]+)\s*(\w+)/);
        if (!m) return 0;
        const units = { 'B': 1, 'KB': 1024, 'MB': 1024 ** 2, 'GB': 1024 ** 3, 'TB': 1024 ** 4 };
        return parseFloat(m[1]) * (units[m[2]] || 1);
    }

    function parseData(d) {
        if (!d) return 0;

        // Formato: "Hoje às HH:MM"
        if (d.includes('Hoje')) {
            const h = d.match(/(\d{2}):(\d{2})/);
            if (h) {
                const hoje = new Date();
                hoje.setHours(parseInt(h[1]), parseInt(h[2]), 0, 0);
                return hoje.getTime();
            }
            return new Date().getTime(); // Se não conseguir extrair hora, usar agora
        }

        // Formato: "DD/MM/YYYY" ou "DD/MM/YYYY HH:MM"
        const partes = d.split(' ')[0].split('/'); // Pega só a parte da data antes do espaço
        if (partes.length === 3) {
            const [dia, mes, ano] = partes;
            const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));

            // Se tiver horário também, adiciona
            const horario = d.match(/(\d{2}):(\d{2})/);
            if (horario) {
                dataObj.setHours(parseInt(horario[1]), parseInt(horario[2]), 0, 0);
            }

            return dataObj.getTime();
        }

        return 0;
    }

    function ordenarItens() {
        if (isOrdenando) return;
        isOrdenando = true;
        const container = document.querySelector('.listagem-itens');
        if (!container) { isOrdenando = false; return; }
        const items = Array.from(container.querySelectorAll('.item-link'));
        const ordemTipos = { 'pasta': 0, 'imagem': 1, 'audio': 2, 'pdf': 3, 'arquivo': 4 };

        items.sort((a, b) => {
            // Pastas sempre primeiro em qualquer critério exceto tipo (que já tem ordem própria)
            if (ordenacaoAtual.criterio !== 'tipo') {
                const aIsPasta = a.dataset.tipo === 'pasta';
                const bIsPasta = b.dataset.tipo === 'pasta';
                if (aIsPasta && !bIsPasta) return -1;
                if (!aIsPasta && bIsPasta) return 1;
            }

            let valA, valB;
            if (ordenacaoAtual.criterio === 'nome') { valA = a.dataset.nome.toLowerCase(); valB = b.dataset.nome.toLowerCase(); }
            else if (ordenacaoAtual.criterio === 'tipo') {
                valA = ordemTipos[a.dataset.tipo] ?? 99;
                valB = ordemTipos[b.dataset.tipo] ?? 99;
            }
            else if (ordenacaoAtual.criterio === 'tamanho') { valA = parseTamanho(a.querySelector('.item-tamanho')?.textContent); valB = parseTamanho(b.querySelector('.item-tamanho')?.textContent); }
            else if (ordenacaoAtual.criterio === 'data') { valA = parseData(a.querySelector('.item-data')?.textContent); valB = parseData(b.querySelector('.item-data')?.textContent); }
            if (valA < valB) return ordenacaoAtual.ordem === 'asc' ? -1 : 1;
            if (valA > valB) return ordenacaoAtual.ordem === 'asc' ? 1 : -1;
            return 0;
        });
        items.forEach(item => container.appendChild(item));
        atualizarBotoesOrdenacao();
        localStorage.setItem('ordenacao', JSON.stringify(ordenacaoAtual));
        isOrdenando = false;
    }

    Object.entries(ordenacaoBotoes).forEach(([criterio, btn]) => {
        if (btn) btn.addEventListener('click', () => {
            if (ordenacaoAtual.criterio === criterio) {
                ordenacaoAtual.ordem = ordenacaoAtual.ordem === 'asc' ? 'desc' : 'asc';
            } else {
                ordenacaoAtual.criterio = criterio;
                ordenacaoAtual.ordem = ordemPadrao[criterio] || 'asc';
            }
            ordenarItens();
        });
    });

    document.addEventListener('listaAtualizada', ordenarItens);
    ordenarItens();
});

// ===== CLIQUE NOS ITENS (DELEGAÇÃO) =====
document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
        const card = e.target.closest('.item-link');
        if (!card) return;
        if (e.target.closest('.botao-download') || e.target.closest('.botao-excluir') ||
            e.target.closest('form') || e.target.closest('button') ||
            e.target.closest('.item-checkbox') || e.target.closest('.item-checkbox-input') ||
            e.ctrlKey) return;

        const tipo = card.dataset.tipo;
        const caminho = card.dataset.caminho;

        if (tipo === 'pasta') {
            if (caminho) window.location.href = `/explorar/${caminho}`;
        } else if (tipo === 'imagem') {
            // NÃO fazer nada aqui - o lightbox é tratado por outro listener
            // Retornar para não bloquear o evento
            return;
        } else if (tipo === 'audio') {
            if (e.target.closest('audio')) return;
            e.preventDefault(); e.stopPropagation();
            const nome = card.querySelector('.item-nome')?.textContent || '';
            if (typeof window.openAudioModal === 'function') {
                window.openAudioModal(`/visualizar/${caminho}`, nome, `/download/${caminho}`, card.querySelector('.form-excluir'));
            }
        } else if (tipo === 'pdf') {
            // PDF abre em nova aba para visualização no navegador
            if (caminho) window.open(`/visualizar/${caminho}`, '_blank');
        } else if (tipo === 'arquivo') {
            if (caminho) window.location.href = `/download/${caminho}`;
        }
    });
});

// ===== SELEÇÃO MÚLTIPLA =====
document.addEventListener('DOMContentLoaded', function () {
    const selecaoBarra    = document.getElementById('selecao-barra');
    const selecaoContador = document.getElementById('selecao-contador');
    const selecaoSelectAll = document.getElementById('selecao-select-all');
    const selecaoClear    = document.getElementById('selecao-clear');
    const selecaoDelete   = document.getElementById('selecao-delete');
    const selecaoDownload = document.getElementById('selecao-download');

    let itensSelecionados = new Set();

    // Ctrl+Clique para seleção individual (Delegação)
    document.addEventListener('click', function (e) {
        if (e.ctrlKey) {
            const card = e.target.closest('.item-link');
            if (card) {
                e.preventDefault(); e.stopPropagation();
                const checkbox = card.querySelector('.item-checkbox-input');
                if (checkbox) {
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                }
            }
        }
    });

    function atualizarSelecao() {
        const count = itensSelecionados.size;
        if (selecaoContador) {
            selecaoContador.textContent = count;
        }
        
        if (selecaoBarra) {
            if (count > 0) {
                if (selecaoBarra.style.display === 'none') {
                    selecaoBarra.style.display = 'flex';
                }
                requestAnimationFrame(() => {
                    selecaoBarra.classList.add('active');
                });
            } else {
                selecaoBarra.classList.remove('active');
                setTimeout(() => {
                    if (itensSelecionados.size === 0) {
                        selecaoBarra.style.display = 'none';
                    }
                }, 400);
            }
        }
        
        document.querySelectorAll('.item-link').forEach(item => {
            item.classList.toggle('selecionado', itensSelecionados.has(item.dataset.caminho));
        });
    }

    // ✅ DELEGAÇÃO DE EVENTO: Checkboxes
    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('item-checkbox-input')) {
            const checkbox = e.target;
            const caminho = checkbox.dataset.caminho;
            const item = checkbox.closest('.item-link');
            if (checkbox.checked) { itensSelecionados.add(caminho); item?.classList.add('selecionado'); }
            else { itensSelecionados.delete(caminho); item?.classList.remove('selecionado'); }
            atualizarSelecao();
        }
    });

    selecaoSelectAll?.addEventListener('click', function () {
        const checkboxes = document.querySelectorAll('.item-checkbox-input');
        const todosSelecionados = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(checkbox => {
            checkbox.checked = !todosSelecionados;
            const caminho = checkbox.dataset.caminho;
            const item = checkbox.closest('.item-link');
            if (!todosSelecionados) { itensSelecionados.add(caminho); item?.classList.add('selecionado'); }
            else { itensSelecionados.delete(caminho); item?.classList.remove('selecionado'); }
        });
        atualizarSelecao();
    });

    selecaoClear?.addEventListener('click', function () {
        document.querySelectorAll('.item-checkbox-input').forEach(cb => { cb.checked = false; cb.closest('.item-link')?.classList.remove('selecionado'); });
        itensSelecionados.clear();
        atualizarSelecao();
    });

    // Limpar seleção ao atualizar lista
    document.addEventListener('listaAtualizada', () => {
        itensSelecionados.clear();
        atualizarSelecao();
    });

    // ===== DELETAR MÚLTIPLOS — com CSRF =====
    selecaoDelete?.addEventListener('click', async function (e) {
        e.stopPropagation();
        if (itensSelecionados.size === 0) return;

        const mensagem = itensSelecionados.size === 1
            ? 'Tem certeza que deseja excluir este item?'
            : `Tem certeza que deseja excluir ${itensSelecionados.size} itens?`;

        const detalhe = Array.from(itensSelecionados).slice(0, 5).join('\n')
            + (itensSelecionados.size > 5 ? `\n... e mais ${itensSelecionados.size - 5} itens` : '');

        const confirmado = await ConfirmModal.open({ title: 'Excluir itens selecionados', message: mensagem, detail: detalhe });
        if (!confirmado) return;

        const textoOriginal = selecaoDelete.innerHTML;
        selecaoDelete.disabled = true;
        selecaoDelete.textContent = '⏳';

        try {
            const response = await fetch('/deletar_multiplos', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ caminhos: Array.from(itensSelecionados) })
            });

            const resultado = await response.json();

            if (resultado.sucesso) {
                if (resultado.erros && resultado.erros.length > 0) {
                    showToast(`✅ ${resultado.excluidos} excluídos | ❌ ${resultado.erros.length} falhas`, 'warning');
                } else {
                    showToast(`✅ ${resultado.excluidos} itens excluídos com sucesso!`, 'success');
                }
                if (typeof atualizarLista === 'function') atualizarLista();
            } else {
                showToast(`Erro: ${resultado.erro}`, 'error');
            }
        } catch (error) {
            showToast('Erro ao excluir itens. Tente novamente.', 'error');
        } finally {
            selecaoDelete.disabled = false;
            selecaoDelete.innerHTML = textoOriginal;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    // ===== DOWNLOAD ZIP — com CSRF =====
    selecaoDownload?.addEventListener('click', function () {
        if (itensSelecionados.size === 0) return;

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = '/download_zip';
        form.style.display = 'none';

        const csrfInput = document.createElement('input');
        csrfInput.type = 'hidden';
        csrfInput.name = 'csrf_token';
        csrfInput.value = getCsrfToken();
        form.appendChild(csrfInput);

        itensSelecionados.forEach(caminho => {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = 'caminhos';
            input.value = caminho;
            form.appendChild(input);
        });

        document.body.appendChild(form);
        form.submit();
        setTimeout(() => { if (document.body.contains(form)) document.body.removeChild(form); }, 1000);
    });

    // Atalhos de teclado
    document.addEventListener('keydown', function (e) {
        const tag = e.target.tagName.toLowerCase();
        if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;

        // Ctrl+A: Selecionar todos
        if (e.ctrlKey && e.key.toLowerCase() === 'a') {
            e.preventDefault();
            selecaoSelectAll?.click();
        }

        // Delete: Excluir selecionados
        if (e.key === 'Delete' || e.key === 'Del') {
            if (itensSelecionados.size > 0) {
                e.preventDefault();
                selecaoDelete?.click();
            }
        }
    });
});

// ===== ÍCONES DINÂMICOS (LUCIDE) =====
document.addEventListener('DOMContentLoaded', function () {
    // Mapeia extensão → nome do ícone Lucide
    const iconMap = {
        'doc': 'file-text', 'docx': 'file-text', 'txt': 'file-text', 'rtf': 'file-text', 'md': 'file-text',
        'xls': 'bar-chart-2', 'xlsx': 'bar-chart-2', 'csv': 'bar-chart-2',
        'ppt': 'presentation', 'pptx': 'presentation',
        'mp4': 'video', 'avi': 'video', 'mkv': 'video', 'mov': 'video', 'webm': 'video',
        'zip': 'archive', 'rar': 'archive', '7z': 'archive', 'tar': 'archive', 'gz': 'archive',
        'html': 'globe', 'htm': 'globe',
        'css': 'palette',
        'js': 'zap', 'ts': 'zap', 'mjs': 'zap',
        'py': 'terminal', 'sh': 'terminal', 'bash': 'terminal',
        'json': 'braces', 'xml': 'braces', 'yaml': 'braces', 'yml': 'braces',
        'sql': 'database', 'db': 'database', 'sqlite': 'database',
        'exe': 'settings', 'msi': 'settings', 'bat': 'settings',
        'java': 'coffee', 'c': 'cpu', 'cpp': 'cpu', 'php': 'code',
    };

    function updateIcons() {
        document.querySelectorAll('.file-icon').forEach(icon => {
            if (icon.innerHTML.trim() !== '') return; // já tem ícone
            const ext = icon.dataset.extensao;
            const lucideIcon = (ext && iconMap[ext]) ? iconMap[ext] : 'file';
            icon.innerHTML = `<i data-lucide="${lucideIcon}" style="width:40px;height:40px;color:var(--text-secondary);"></i>`;
        });
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    updateIcons();
    document.addEventListener('listaAtualizada', updateIcons);
});

// ===== SALVAR POSIÇÃO DE ROLAGEM =====
(function () {
    window.addEventListener('beforeunload', () => sessionStorage.setItem('scrollPosition', window.scrollY));
    window.addEventListener('load', function () {
        const pos = sessionStorage.getItem('scrollPosition');
        if (pos) { setTimeout(() => { window.scrollTo(0, parseInt(pos)); sessionStorage.removeItem('scrollPosition'); }, 100); }
    });
})();

// ===== DRAG & DROP (BLINDADO) =====
document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('global-drop-overlay');
    let dragCounter = 0;

    document.addEventListener('dragstart', () => {
        isInternalDrag = true;
    });

    document.addEventListener('dragend', () => {
        isInternalDrag = false;
        dragCounter = 0;
        overlay?.classList.remove('active');
    });

    document.addEventListener('dragenter', (e) => {
        if (isInternalDrag) return;
        if (e.dataTransfer.types?.includes('Files')) {
            dragCounter++;
            overlay?.classList.add('active');
        }
    });

    document.addEventListener('dragleave', (e) => {
        if (isInternalDrag) return;
        if (e.relatedTarget === null || !document.body.contains(e.relatedTarget)) {
            dragCounter = 0;
        } else {
            dragCounter--;
        }
        if (dragCounter <= 0 && overlay) overlay.classList.remove('active');
    });

    document.addEventListener('dragover', (e) => {
        e.preventDefault();
        if (isInternalDrag) {
            e.dataTransfer.dropEffect = 'none';
            return;
        }
        if (e.dataTransfer.types?.includes('Files')) {
            e.dataTransfer.dropEffect = 'copy';
        }
    });

    document.addEventListener('drop', (e) => {
        e.preventDefault();
        overlay?.classList.remove('active');
        dragCounter = 0;

        if (isInternalDrag) {
            isInternalDrag = false;
            return;
        }

        const files = e.dataTransfer.files;
        if (files && files.length > 0) {
            if (typeof window.uploadFiles === 'function') {
                window.uploadFiles(files);
            }
        }
    });
});

// ===== AUDIO PLAYER MODAL =====
(function () {
    function initAudioModal() {
        const audioModal       = document.getElementById('audioModal');
        const audioPlayer      = document.getElementById('audioPlayer');
        const audioSource      = document.getElementById('audioSource');
        const audioModalTitle  = document.getElementById('audioModalTitle');
        const audioModalInfo   = document.getElementById('audioModalInfo');
        const audioModalDownload = document.getElementById('audioModalDownload');
        const audioModalDelete = document.getElementById('audioModalDelete');
        const audioModalClose  = document.getElementById('audioModalClose');
        const audioDuration    = document.getElementById('audioDuration');

        if (!audioModal) return;

        let currentAudioDeleteForm = null;

        function closeAudioModalAndReload() {
            audioPlayer?.pause();
            if (audioPlayer) audioPlayer.currentTime = 0;
            audioModal.classList.remove('active');
            document.body.style.overflow = '';
            // Recarregar a página para resetar o estado
            window.location.reload();
        }

        function closeAudioModalOnly() {
            audioModal.classList.remove('active');
            document.body.style.overflow = '';
            audioPlayer?.pause();
            if (audioPlayer) audioPlayer.currentTime = 0;
            // Recarregar a página para resetar o estado
            window.location.reload();
        }

        window.openAudioModal = function (audioUrl, audioName, downloadUrl, deleteForm) {
            currentAudioDeleteForm = deleteForm;
            audioPlayer?.pause();
            if (audioPlayer) audioPlayer.currentTime = 0;
            if (audioSource) audioSource.src = audioUrl;
            audioPlayer?.load();
            if (audioDuration) audioDuration.textContent = '';
            if (audioModalTitle) audioModalTitle.textContent = audioName;
            if (audioModalInfo) audioModalInfo.textContent = 'Áudio';
            if (audioModalDownload) audioModalDownload.href = downloadUrl;

            const handleDelete = async function (e) {
                e.preventDefault();
                const confirmado = await ConfirmModal.open({
                    title: 'Excluir áudio',
                    message: `Tem certeza que deseja excluir o áudio "${audioName}"?`,
                    detail: 'Esta ação não pode ser desfeita.'
                });
                if (confirmado && currentAudioDeleteForm) {
                    showToast(`Excluindo ${audioName}...`, 'info', 2000);
                    closeAudioModalOnly();
                    const form = currentAudioDeleteForm.cloneNode(true);
                    document.body.appendChild(form);
                    form.submit();
                }
            };

            if (audioModalDelete) {
                const newBtn = audioModalDelete.cloneNode(true);
                audioModalDelete.parentNode.replaceChild(newBtn, audioModalDelete);
                newBtn.addEventListener('click', handleDelete);
            }

            if (audioPlayer) {
                const updateDuration = function () {
                    const dur = audioPlayer.duration;
                    if (!isNaN(dur) && dur > 0) {
                        const m = Math.floor(dur / 60), s = Math.floor(dur % 60);
                        if (audioDuration) audioDuration.textContent = `Duração: ${m}:${s.toString().padStart(2, '0')}`;
                        audioPlayer.removeEventListener('loadedmetadata', updateDuration);
                    }
                };
                audioPlayer.addEventListener('loadedmetadata', updateDuration);
            }

            audioModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            audioPlayer?.play().catch(() => {});
        };

        if (audioModalClose) audioModalClose.onclick = closeAudioModalAndReload;
        if (audioModal) audioModal.onclick = (e) => { if (e.target === audioModal) closeAudioModalAndReload(); };

        // Listener de Escape para fechar o modal
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && audioModal && audioModal.classList.contains('active')) {
                e.preventDefault();
                closeAudioModalAndReload();
            }
        });

        // ===== CONTROLES CUSTOMIZADOS DO PLAYER =====
        const playPauseBtn = document.getElementById('playPauseBtn');
        const playPauseIcon = document.getElementById('playPauseIcon');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const progressHandle = document.getElementById('progressHandle');
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        const volumeBtn = document.getElementById('volumeBtn');
        const volumeIcon = document.getElementById('volumeIcon');
        const volumeSlider = document.getElementById('volumeSlider');

        let isDragging = false;

        // Formatar tempo (segundos para MM:SS)
        function formatTime(seconds) {
            if (!seconds || isNaN(seconds)) return '0:00';
            const mins = Math.floor(seconds / 60);
            const secs = Math.floor(seconds % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        // Play/Pause
        if (playPauseBtn && audioPlayer) {
            playPauseBtn.addEventListener('click', () => {
                if (audioPlayer.paused) {
                    audioPlayer.play();
                } else {
                    audioPlayer.pause();
                }
            });

            audioPlayer.addEventListener('play', () => {
                const oldIcon = document.getElementById('playPauseIcon');
                if (oldIcon) oldIcon.remove();

                const newIcon = document.createElement('i');
                newIcon.id = 'playPauseIcon';
                newIcon.setAttribute('data-lucide', 'pause');
                playPauseBtn.appendChild(newIcon);
                lucide.createIcons();
            });

            audioPlayer.addEventListener('pause', () => {
                const oldIcon = document.getElementById('playPauseIcon');
                if (oldIcon) oldIcon.remove();

                const newIcon = document.createElement('i');
                newIcon.id = 'playPauseIcon';
                newIcon.setAttribute('data-lucide', 'play');
                playPauseBtn.appendChild(newIcon);
                lucide.createIcons();
            });
        }

        // Atualizar progresso e tempo
        if (audioPlayer) {
            audioPlayer.addEventListener('loadedmetadata', () => {
                if (totalTimeEl) totalTimeEl.textContent = formatTime(audioPlayer.duration);
            });

            audioPlayer.addEventListener('timeupdate', () => {
                if (!isDragging && audioPlayer.duration) {
                    const percent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                    if (progressFill) progressFill.style.width = percent + '%';
                    if (progressHandle) progressHandle.style.left = percent + '%';
                    if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
                }
            });

            audioPlayer.addEventListener('ended', () => {
                playPauseIcon.setAttribute('data-lucide', 'play');
                lucide.createIcons();
                if (progressFill) progressFill.style.width = '0%';
                if (progressHandle) progressHandle.style.left = '0%';
            });
        }

        // Clicar na barra de progresso
        if (progressBar && audioPlayer) {
            progressBar.addEventListener('click', (e) => {
                const rect = progressBar.getBoundingClientRect();
                const percent = (e.clientX - rect.left) / rect.width;
                audioPlayer.currentTime = percent * audioPlayer.duration;
            });

            // Arrastar o handle
            progressHandle.addEventListener('mousedown', (e) => {
                isDragging = true;
                e.preventDefault();
            });

            document.addEventListener('mousemove', (e) => {
                if (isDragging && audioPlayer.duration) {
                    const rect = progressBar.getBoundingClientRect();
                    let percent = (e.clientX - rect.left) / rect.width;
                    percent = Math.max(0, Math.min(1, percent));

                    progressFill.style.width = (percent * 100) + '%';
                    progressHandle.style.left = (percent * 100) + '%';
                    audioPlayer.currentTime = percent * audioPlayer.duration;
                }
            });

            document.addEventListener('mouseup', () => {
                isDragging = false;
            });
        }

        // Controle de volume
        if (volumeSlider && audioPlayer) {
            volumeSlider.addEventListener('input', (e) => {
                const volume = e.target.value / 100;
                audioPlayer.volume = volume;

                // Atualizar ícone
                const oldIcon = document.getElementById('volumeIcon');
                if (oldIcon) oldIcon.remove();

                const newIcon = document.createElement('i');
                newIcon.id = 'volumeIcon';
                if (volume === 0) {
                    newIcon.setAttribute('data-lucide', 'volume-x');
                } else if (volume < 0.5) {
                    newIcon.setAttribute('data-lucide', 'volume-1');
                } else {
                    newIcon.setAttribute('data-lucide', 'volume-2');
                }
                volumeBtn.appendChild(newIcon);
                lucide.createIcons();
            });
        }

        // Botão de mute/unmute
        if (volumeBtn && audioPlayer) {
            let lastVolume = 1;
            volumeBtn.addEventListener('click', () => {
                const oldIcon = document.getElementById('volumeIcon');
                if (oldIcon) oldIcon.remove();

                const newIcon = document.createElement('i');
                newIcon.id = 'volumeIcon';

                if (audioPlayer.volume > 0) {
                    lastVolume = audioPlayer.volume;
                    audioPlayer.volume = 0;
                    volumeSlider.value = 0;
                    newIcon.setAttribute('data-lucide', 'volume-x');
                } else {
                    audioPlayer.volume = lastVolume;
                    volumeSlider.value = lastVolume * 100;
                    if (lastVolume < 0.5) {
                        newIcon.setAttribute('data-lucide', 'volume-1');
                    } else {
                        newIcon.setAttribute('data-lucide', 'volume-2');
                    }
                }
                volumeBtn.appendChild(newIcon);
                lucide.createIcons();
            });
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAudioModal);
    else initAudioModal();
})();

// ===== FECHAR PAINEL DE UPLOAD =====
function fecharPainel() {
    const panel = document.getElementById('upload-panel');
    if (panel) panel.style.display = 'none';
}

// ===== ATUALIZAR LISTA DE ARQUIVOS (AJAX) =====
async function atualizarLista() {
    const container = document.getElementById('file-list-container');
    if (!container) return;
    const caminho = window.location.pathname.replace(/^\/explorar/, '') || '/';
    try {
        const response = await fetch(`/partial/lista${caminho}`);
        if (response.ok) {
            container.innerHTML = await response.text();
            showToast('📂 Lista atualizada!', 'info', 2000);
            document.dispatchEvent(new CustomEvent('listaAtualizada'));
        }
    } catch (error) {
        console.error('Erro ao atualizar lista:', error);
    }
}

// ===== MENU DROPDOWN (TRÊS PONTINHOS) =====
window.toggleDropdown = function (btn) {
    // Identifica o dropdown associado ao botão
    // Se o dropdown já foi movido para o body, ele não é mais o nextElementSibling
    let dropdown;
    if (btn.dataset.dropdownId) {
        dropdown = document.getElementById(btn.dataset.dropdownId);
    } else {
        dropdown = btn.nextElementSibling;
        // Gera um ID único para o dropdown para podermos achá-lo depois de mover para o body
        const uniqueId = 'dropdown-' + Math.random().toString(36).substr(2, 9);
        dropdown.id = uniqueId;
        btn.dataset.dropdownId = uniqueId;
    }

    if (!dropdown) return;
    
    const isOpen = dropdown.classList.contains('open');
    
    // Se o dropdown clicado já estiver aberto, fecha tudo e para
    if (isOpen) {
        fecharDropdowns();
        return;
    }

    // Fecha qualquer outro dropdown aberto antes de abrir o novo
    fecharDropdowns();

    // Move o dropdown para o final do body para evitar problemas de overflow/z-index
    if (dropdown.parentNode !== document.body) {
        document.body.appendChild(dropdown);
    }

    // Calcula a posição
    const rect = btn.getBoundingClientRect();
    const dropdownWidth = 160; // Largura fixa definida no CSS
    const margin = 8;

    // Posição horizontal: alinhado à direita do botão
    let left = rect.right - dropdownWidth;
    
    // Posição vertical: logo abaixo do botão
    let top = rect.bottom + margin;

    // Ajustes de segurança para não sair da tela
    if (left < margin) left = margin;
    if (left + dropdownWidth > window.innerWidth - margin) {
        left = window.innerWidth - dropdownWidth - margin;
    }

    // Aplica estilos iniciais para medição
    dropdown.style.position = 'fixed';
    dropdown.style.display = 'flex';
    dropdown.style.visibility = 'hidden'; // Invisível para medir altura real

    // Se não couber embaixo, abre em cima
    const dropdownHeight = dropdown.offsetHeight;
    if (top + dropdownHeight > window.innerHeight - margin) {
        top = rect.top - dropdownHeight - margin;
    }

    // Aplica os estilos finais
    dropdown.style.visibility = 'visible';
    dropdown.style.top = top + 'px';
    dropdown.style.left = left + 'px';
    dropdown.style.zIndex = '10000';
    
    // Pequeno delay para a animação de fade-in funcionar
    requestAnimationFrame(() => {
        dropdown.classList.add('open');
    });
};

// Sobrescreve fecharDropdowns para lidar com os elementos movidos para o body
window.fecharDropdowns = function () {
    document.querySelectorAll('.item-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.style.display = 'none';
    });
};

// Fecha dropdown ao clicar fora ou rolar a página
document.addEventListener('click', function (e) {
    if (!e.target.closest('.item-menu-wrapper')) fecharDropdowns();
});

document.addEventListener('scroll', fecharDropdowns, true);

// Fecha dropdown com Escape
document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharDropdowns();
});

// ===== ATALHOS DE NAVEGAÇÃO =====
document.addEventListener('keydown', function (e) {
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); document.querySelector('.back-btn')?.click() || window.history.back(); }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); window.history.forward(); }
});

// ===== LAZY LOADING / PAGINAÇÃO =====
// Sistema de paginação para evitar travamento em pastas com muitos arquivos

(function () {
    let currentOffset = 0;
    let isLoading = false;
    let hasMore = true;
    let itemsPerPage = 100;
    let totalCount = 0;

    function initPagination() {
        const explorarPage = document.querySelector('[data-total-count]');
        if (!explorarPage) return;

        const totalCountAttr = explorarPage.getAttribute('data-total-count');
        const itemsPerPageAttr = explorarPage.getAttribute('data-items-per-page');

        if (totalCountAttr) totalCount = parseInt(totalCountAttr);
        if (itemsPerPageAttr) itemsPerPage = parseInt(itemsPerPageAttr);

        const loadedItems = document.querySelectorAll('.item-link').length;
        currentOffset = loadedItems;
        hasMore = loadedItems < totalCount;

        updateLoadMoreButton();
    }

    function updateLoadMoreButton() {
        let loadMoreContainer = document.getElementById('load-more-container');

        if (hasMore && totalCount > currentOffset) {
            if (!loadMoreContainer) {
                loadMoreContainer = document.createElement('div');
                loadMoreContainer.id = 'load-more-container';
                loadMoreContainer.style.cssText = 'text-align:center;padding:2rem;';
                loadMoreContainer.innerHTML = `
                    <button id="load-more-btn" class="btn-secondary" style="padding:0.75rem 2rem;">
                        <i data-lucide="chevron-down" style="width:20px;height:20px;"></i>
                        Carregar mais (${totalCount - currentOffset} restantes)
                    </button>
                `;

                const container = document.querySelector('.listagem-itens');
                if (container && container.parentNode) {
                    container.parentNode.appendChild(loadMoreContainer);
                }

                document.getElementById('load-more-btn')?.addEventListener('click', loadMoreItems);
                if (typeof lucide !== 'undefined') lucide.createIcons();
            } else {
                const btn = document.getElementById('load-more-btn');
                if (btn) {
                    btn.innerHTML = `<i data-lucide="chevron-down"></i> Carregar mais (${totalCount - currentOffset} restantes)`;
                    if (typeof lucide !== 'undefined') lucide.createIcons();
                }
            }
        } else {
            if (loadMoreContainer) loadMoreContainer.remove();
        }
    }

    async function loadMoreItems() {
        if (isLoading || !hasMore) return;
        isLoading = true;
        const btn = document.getElementById('load-more-btn');

        if (btn) {
            btn.disabled = true;
            btn.innerHTML = '<i data-lucide="loader"></i> Carregando...';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        try {
            const caminho = window.location.pathname.replace(/^\/explorar\/?/, '');
            const url = `/partial/lista${caminho ? '/' + caminho : '/'}?offset=${currentOffset}&limit=${itemsPerPage}`;
            const response = await fetch(url);

            if (response.ok) {
                const html = await response.text();
                const container = document.querySelector('.listagem-itens');

                if (container) {
                    const temp = document.createElement('div');
                    temp.innerHTML = html;
                    const newItems = temp.querySelectorAll('.item-link');
                    newItems.forEach(item => container.appendChild(item));

                    currentOffset += newItems.length;
                    hasMore = currentOffset < totalCount;

                    document.dispatchEvent(new CustomEvent('listaAtualizada'));
                    updateLoadMoreButton();

                    if (typeof showToast === 'function') {
                        showToast(`✅ ${newItems.length} itens carregados`, 'success', 2000);
                    }
                }
            }
        } catch (error) {
            console.error('Erro ao carregar mais itens:', error);
            if (typeof showToast === 'function') {
                showToast('❌ Erro ao carregar mais itens', 'error');
            }
        } finally {
            isLoading = false;
            if (btn) btn.disabled = false;
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initPagination);
    } else {
        initPagination();
    }

    document.addEventListener('listaAtualizada', () => {
        currentOffset = document.querySelectorAll('.item-link').length;
        const explorarPage = document.querySelector('[data-total-count]');
        if (explorarPage) {
            const totalCountAttr = explorarPage.getAttribute('data-total-count');
            if (totalCountAttr) totalCount = parseInt(totalCountAttr);
        }
        hasMore = currentOffset < totalCount;
        updateLoadMoreButton();
    });
})();

// ===== FAB EXPANSÍVEL (MOBILE) =====
(function() {
    const fabContainer = document.getElementById('fab-container');
    const fabMain = document.getElementById('fab-main');
    const fabOverlay = document.getElementById('fab-overlay');
    const fabUploadOption = document.getElementById('fab-upload-option');
    const fabFolderOption = document.getElementById('fab-folder-option');
    const uploadInput = document.getElementById('arquivo');

    if (!fabContainer || !fabMain) return;

    // Toggle FAB menu
    function toggleFAB() {
        const isOpen = fabContainer.classList.contains('open');
        
        if (isOpen) {
            closeFAB();
        } else {
            openFAB();
        }
    }

    function openFAB() {
        fabContainer.classList.add('open');
        fabOverlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeFAB() {
        fabContainer.classList.remove('open');
        fabOverlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    // Event listeners
    fabMain.addEventListener('click', toggleFAB);
    fabOverlay.addEventListener('click', closeFAB);

    // Upload option
    if (fabUploadOption && uploadInput) {
        fabUploadOption.addEventListener('click', () => {
            closeFAB();
            uploadInput.click();
        });
    }

    // Folder option
    if (fabFolderOption) {
        fabFolderOption.addEventListener('click', () => {
            closeFAB();
            const createFolderTrigger = document.getElementById('create-folder-trigger');
            if (createFolderTrigger) {
                createFolderTrigger.click();
            } else {
                // Fallback: abre modal diretamente
                const createFolderModal = document.getElementById('create-folder-modal');
                if (createFolderModal) {
                    createFolderModal.style.display = 'flex';
                }
            }
        });
    }

    // Fecha FAB ao pressionar Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && fabContainer.classList.contains('open')) {
            closeFAB();
        }
    });
})();

// ===== DROPDOWN DE ORDENAÇÃO MOBILE =====
(function() {
    const dropdownBtn = document.getElementById('sort-dropdown-btn');
    const dropdownMenu = document.getElementById('sort-dropdown-menu');
    const dropdownLabel = document.getElementById('sort-dropdown-label');
    const dropdownItems = document.querySelectorAll('.sort-dropdown-item');

    // Botões desktop (para sincronizar)
    const desktopButtons = {
        tipo: document.getElementById('ordenar-tipo'),
        nome: document.getElementById('ordenar-nome'),
        tamanho: document.getElementById('ordenar-tamanho'),
        data: document.getElementById('ordenar-data')
    };

    if (!dropdownBtn || !dropdownMenu) return;

    // Toggle do dropdown
    dropdownBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        dropdownMenu.classList.toggle('open');
    });

    // Fechar ao clicar fora
    document.addEventListener('click', (e) => {
        if (!dropdownMenu.contains(e.target) && e.target !== dropdownBtn) {
            dropdownMenu.classList.remove('open');
        }
    });

    // Itens do dropdown
    dropdownItems.forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();

            const sortType = item.getAttribute('data-sort');
            const currentOrder = item.getAttribute('data-order') || 'asc';
            const newOrder = currentOrder === 'asc' ? 'desc' : 'asc';

            // Atualiza o estado visual do dropdown
            dropdownItems.forEach(i => {
                i.classList.remove('active');
                i.removeAttribute('data-order');
            });
            item.classList.add('active');
            item.setAttribute('data-order', newOrder);

            // Atualiza o label do botão
            dropdownLabel.textContent = item.querySelector('span').textContent;

            // Sincroniza com o botão desktop correspondente e aciona o clique
            const desktopBtn = desktopButtons[sortType];
            if (desktopBtn) {
                // Remove active de todos os botões desktop
                Object.values(desktopButtons).forEach(btn => {
                    if (btn) btn.classList.remove('active');
                });

                // Adiciona active no botão correto
                desktopBtn.classList.add('active');
                desktopBtn.setAttribute('data-order', newOrder);

                // Aciona o clique para executar a ordenação
                desktopBtn.click();
            }

            // Fecha o dropdown
            dropdownMenu.classList.remove('open');
        });
    });

    // Sincroniza quando os botões desktop são clicados
    Object.entries(desktopButtons).forEach(([sortType, btn]) => {
        if (!btn) return;

        btn.addEventListener('click', () => {
            const order = btn.getAttribute('data-order') || 'asc';
            const dropdownItem = Array.from(dropdownItems).find(
                item => item.getAttribute('data-sort') === sortType
            );

            if (dropdownItem) {
                // Atualiza dropdown
                dropdownItems.forEach(i => i.classList.remove('active'));
                dropdownItem.classList.add('active');
                dropdownItem.setAttribute('data-order', order);
                dropdownLabel.textContent = dropdownItem.querySelector('span').textContent;
            }
        });
    });

    // Fecha dropdown ao pressionar Escape
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && dropdownMenu.classList.contains('open')) {
            dropdownMenu.classList.remove('open');
        }
    });
})();
