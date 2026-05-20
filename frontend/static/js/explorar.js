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

    let currentImageIndex = 0;
    let images = [];

    function updateImageList() {
        images = [];
        document.querySelectorAll('.item-imagem').forEach((card, index) => {
            const link = card.closest('.item-link');
            if (link) {
                const thumbnail = card.querySelector('.item-thumbnail');
                const nomeElement = card.querySelector('.item-nome');
                const downloadBtn = card.querySelector('.botao-download');
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
        document.body.style.overflow = 'hidden';

        // Empurra um estado falso no histórico para capturar o botão voltar do celular
        if (!history.state?.lightboxOpen) {
            history.pushState({ lightboxOpen: true }, '');
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        lightboxImage.src = '';
        document.body.style.overflow = '';

        // Descarta o estado falso que empurramos ao abrir
        if (history.state?.lightboxOpen) {
            history.back();
        }
    }

    // Intercepta o botão "voltar" do celular (e Alt+Seta no desktop)
    window.addEventListener('popstate', function (e) {
        if (lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            lightboxImage.src = '';
            document.body.style.overflow = '';
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
            if (e.ctrlKey) return; // Ctrl+Clique é para seleção, não para abrir lightbox
            if (e.target.closest('.botao-download') || e.target.closest('.botao-excluir') ||
                e.target.closest('form') || e.target.closest('button') ||
                e.target.closest('.item-checkbox') || e.target.closest('.item-checkbox-input')) return;
            
            e.preventDefault();
            e.stopPropagation();
            updateImageList();
            const currentCard = link.querySelector('.item-imagem');
            const newIndex = Array.from(document.querySelectorAll('.item-imagem')).indexOf(currentCard);
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
        if (d.includes('Hoje')) {
            const h = d.match(/(\d{2}):(\d{2})/);
            if (h) { const hoje = new Date(); hoje.setHours(parseInt(h[1]), parseInt(h[2]), 0, 0); return hoje.getTime(); }
        }
        const p = d.split('/');
        if (p.length === 3) return new Date(p[2], p[1] - 1, p[0]).getTime();
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
            // O clique na imagem já é tratado pela delegação do Lightbox acima
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
        selecaoDelete.innerHTML = '<span>⏳</span> Excluindo...';

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
        if (e.ctrlKey && e.key === 'a') { e.preventDefault(); e.stopPropagation(); selecaoSelectAll?.click(); }
        if ((e.key === 'Delete' || e.key === 'Del') && itensSelecionados.size > 0) {
            const tag = e.target.tagName.toLowerCase();
            if (tag !== 'input' && tag !== 'textarea' && !e.target.isContentEditable) {
                e.preventDefault(); e.stopPropagation();
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
            audioModal.style.display = 'none';
            document.body.style.overflow = '';
            if (typeof atualizarLista === 'function') atualizarLista();
        }

        function closeAudioModalOnly() {
            audioModal.style.display = 'none';
            document.body.style.overflow = '';
            audioPlayer?.pause();
            if (audioPlayer) audioPlayer.currentTime = 0;
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

            audioModal.style.display = 'flex';
            document.body.style.overflow = 'hidden';
            audioPlayer?.play().catch(() => {});
        };

        if (audioModalClose) audioModalClose.onclick = closeAudioModalAndReload;
        if (audioModal) audioModal.onclick = (e) => { if (e.target === audioModal) closeAudioModalAndReload(); };
        document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && audioModal.style.display === 'flex') closeAudioModalAndReload(); });
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

// ===== ATALHOS DE NAVEGAÇÃO =====
document.addEventListener('keydown', function (e) {
    if (e.altKey && e.key === 'ArrowLeft') { e.preventDefault(); document.querySelector('.back-btn')?.click() || window.history.back(); }
    if (e.altKey && e.key === 'ArrowRight') { e.preventDefault(); window.history.forward(); }
    if (e.ctrlKey && e.key === 'z') { e.preventDefault(); document.querySelector('.back-btn')?.click() || window.history.back(); }
});