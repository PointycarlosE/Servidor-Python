// ==========================================================================
// CLOUD STORAGE APP — EXPLORAR.JS
// Módulo do Explorador de Arquivos (Google Drive Material 3)
// ==========================================================================

let isInternalDrag = false;

// ===== 1. LIGHTBOX PARA IMAGENS =====
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

    if (!lightbox || !lightboxImage) return;

    let currentImageIndex = 0;
    let images = [];

    function updateImageList() {
        images = [];
        document.querySelectorAll('.item-imagem').forEach((card, index) => {
            const link = card.closest('.item-link');
            if (link) {
                const thumbnail = card.querySelector('.item-thumbnail-preview, .item-thumbnail');
                const nomeElement = card.querySelector('.item-card-title, .item-nome');
                const downloadBtn = card.querySelector('a[href^="/download/"]');
                const deleteForm = card.querySelector('form');
                images.push({
                    nome: nomeElement ? nomeElement.textContent.trim() : '',
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
        lightboxInfo.textContent = `${currentImageIndex + 1} de ${images.length}`;
        lightboxDownload.href = image.downloadUrl;

        lightboxDelete.onclick = async function (e) {
            e.preventDefault();
            const img = images[currentImageIndex];
            const confirmado = await ConfirmModal.open({
                title: 'Excluir Imagem',
                message: `Deseja mover a imagem "${img.nome}" para a lixeira?`,
                detail: 'Você poderá restaurá-la a qualquer momento em até 30 dias.'
            });
            if (confirmado && img.deleteForm) {
                closeLightbox();
                const form = img.deleteForm;
                if (form.action) {
                    executarExclusaoAjax(form.action, img.nome, 'arquivo');
                } else {
                    form.submit();
                }
            }
        };

        lightbox.style.display = 'flex';
        setTimeout(() => lightbox.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';

        if (!history.state?.lightboxOpen) {
            history.pushState({ lightboxOpen: true }, '');
        }
    }

    function closeLightbox() {
        lightbox.classList.remove('active');
        setTimeout(() => {
            lightbox.style.display = 'none';
            lightboxImage.src = '';
            document.body.style.overflow = '';
        }, 200);

        if (history.state?.lightboxOpen) {
            history.back();
        }
    }

    window.addEventListener('popstate', function () {
        if (lightbox.classList.contains('active')) {
            lightbox.classList.remove('active');
            lightbox.style.display = 'none';
            lightboxImage.src = '';
            document.body.style.overflow = '';
        }
    });

    function prevImage() {
        if (images.length > 0) {
            currentImageIndex = (currentImageIndex - 1 + images.length) % images.length;
            openLightbox(currentImageIndex);
        }
    }

    function nextImage() {
        if (images.length > 0) {
            currentImageIndex = (currentImageIndex + 1) % images.length;
            openLightbox(currentImageIndex);
        }
    }

    updateImageList();

    // Clique para abrir lightbox na imagem
    document.addEventListener('click', function (e) {
        const card = e.target.closest('.item-imagem');
        if (card) {
            if (e.ctrlKey) return;
            if (e.target.closest('.item-menu-wrapper') || e.target.closest('.btn-card-more') || e.target.closest('.item-checkbox')) {
                return;
            }
            e.preventDefault();
            e.stopPropagation();
            updateImageList();
            const newIndex = Array.from(document.querySelectorAll('.item-imagem')).indexOf(card);
            if (newIndex !== -1) openLightbox(newIndex);
        }
    });

    lightboxClose?.addEventListener('click', closeLightbox);
    lightboxPrev?.addEventListener('click', prevImage);
    lightboxNext?.addEventListener('click', nextImage);

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && lightbox.classList.contains('active')) closeLightbox();
        if (lightbox.classList.contains('active')) {
            if (e.key === 'ArrowLeft') prevImage();
            else if (e.key === 'ArrowRight') nextImage();
        }
    });

    lightbox?.addEventListener('click', function (e) {
        if (e.target === lightbox) closeLightbox();
    });
});

// ===== 2. BARRA DE PESQUISA =====
document.addEventListener('DOMContentLoaded', function () {
    const searchInput = document.getElementById('pesquisa-input');
    const searchClear = document.getElementById('pesquisa-limpar');
    let searchTimeout;

    function performSearch() {
        const searchTerm = searchInput.value.toLowerCase().trim();
        const items = document.querySelectorAll('.item-link');

        if (searchTerm === '') {
            items.forEach(item => { item.style.display = ''; });
            return;
        }

        items.forEach(item => {
            const nome = item.querySelector('.item-card-title, .item-nome')?.textContent.toLowerCase() || '';
            const tipo = item.dataset.tipo?.toLowerCase() || '';
            const matches = nome.includes(searchTerm) || tipo.includes(searchTerm);
            item.style.display = matches ? '' : 'none';
        });
    }

    if (searchInput) {
        searchInput.addEventListener('input', function () {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(performSearch, 120);
        });
    }

    if (searchClear && searchInput) {
        searchClear.addEventListener('click', function () {
            searchInput.value = '';
            performSearch();
            searchInput.focus();
        });
    }

    document.addEventListener('listaAtualizada', performSearch);
});

// ===== 3. ALTERNADOR DE VISUALIZAÇÃO (GRADE / LISTA SEGMENTADO) =====
document.addEventListener('DOMContentLoaded', function () {
    const viewGrid = document.getElementById('view-grid');
    const viewList = document.getElementById('view-list');

    const savedView = localStorage.getItem('viewMode') || 'grid';
    setViewMode(savedView);

    viewGrid?.addEventListener('click', () => setViewMode('grid'));
    viewList?.addEventListener('click', () => setViewMode('list'));

    function setViewMode(mode) {
        const listagemContainer = document.querySelector('.listagem-itens');
        viewGrid?.classList.toggle('active', mode === 'grid');
        viewList?.classList.toggle('active', mode === 'list');
        if (listagemContainer) listagemContainer.classList.toggle('list-view', mode === 'list');
        localStorage.setItem('viewMode', mode);
    }

    document.addEventListener('listaAtualizada', () => {
        setViewMode(localStorage.getItem('viewMode') || 'grid');
    });
});

// ===== 4. ORDENAÇÃO DE ARQUIVOS (GOOGLE DRIVE POPOVER — IMAGEM 2) =====
document.addEventListener('DOMContentLoaded', function () {
    const sortBtn = document.getElementById('sort-dropdown-btn');
    const sortLabel = document.getElementById('sort-dropdown-label');
    const sortArrow = document.getElementById('sort-indicator-arrow');
    const popoverOverlay = document.getElementById('sort-popover-overlay');
    const popoverMenu = document.getElementById('sort-popover-menu');
    const descLabel = document.getElementById('sort-desc-label');
    const ascLabel = document.getElementById('sort-asc-label');

    const labels = {
        data: 'Data de modificação',
        nome: 'Nome',
        tipo: 'Tipo de arquivo',
        tamanho: 'Tamanho'
    };

    let ordenacaoAtual = { criterio: 'data', ordem: 'desc' };
    let isOrdenando = false;

    try {
        const saved = localStorage.getItem('ordenacao');
        if (saved) ordenacaoAtual = JSON.parse(saved);
    } catch (e) {}

    function atualizarTextosDirecao() {
        if (!descLabel || !ascLabel) return;
        if (ordenacaoAtual.criterio === 'data') {
            descLabel.textContent = 'Do mais recente ao mais antigo';
            ascLabel.textContent = 'Do mais antigo ao mais recente';
        } else if (ordenacaoAtual.criterio === 'nome') {
            descLabel.textContent = 'De Z a A';
            ascLabel.textContent = 'De A a Z';
        } else if (ordenacaoAtual.criterio === 'tamanho') {
            descLabel.textContent = 'Do maior ao menor';
            ascLabel.textContent = 'Do menor ao maior';
        } else if (ordenacaoAtual.criterio === 'tipo') {
            descLabel.textContent = 'Arquivos primeiro';
            ascLabel.textContent = 'Pastas primeiro';
        }
    }

    function atualizarEstadoUI() {
        if (sortLabel) sortLabel.textContent = labels[ordenacaoAtual.criterio] || 'Data de modificação';
        if (sortArrow) {
            sortArrow.setAttribute('data-lucide', ordenacaoAtual.ordem === 'asc' ? 'arrow-up' : 'arrow-down');
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }

        atualizarTextosDirecao();

        // Atualiza classes ativas no popover
        document.querySelectorAll('.sort-popover-item[data-criterio]').forEach(item => {
            const crit = item.getAttribute('data-criterio');
            item.classList.toggle('active', crit === ordenacaoAtual.criterio);
        });

        document.querySelectorAll('.sort-popover-item[data-ordem]').forEach(item => {
            const ord = item.getAttribute('data-ordem');
            item.classList.toggle('active', ord === ordenacaoAtual.ordem);
        });
    }

    function abrirPopover() {
        if (!popoverMenu || !popoverOverlay) return;
        atualizarEstadoUI();
        popoverOverlay.style.display = 'block';
        popoverMenu.style.display = 'flex';
        if (typeof lucide !== 'undefined') lucide.createIcons();
    }

    function fecharPopover() {
        if (popoverMenu) popoverMenu.style.display = 'none';
        if (popoverOverlay) popoverOverlay.style.display = 'none';
    }

    sortBtn?.addEventListener('click', (e) => {
        e.stopPropagation();
        abrirPopover();
    });

    popoverOverlay?.addEventListener('click', fecharPopover);

    // Cliques nos critérios
    document.querySelectorAll('.sort-popover-item[data-criterio]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            ordenacaoAtual.criterio = item.getAttribute('data-criterio');
            ordenarItens();
            fecharPopover();
        });
    });

    // Cliques na direção
    document.querySelectorAll('.sort-popover-item[data-ordem]').forEach(item => {
        item.addEventListener('click', (e) => {
            e.stopPropagation();
            ordenacaoAtual.ordem = item.getAttribute('data-ordem');
            ordenarItens();
            fecharPopover();
        });
    });

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
            if (h) {
                const hoje = new Date();
                hoje.setHours(parseInt(h[1]), parseInt(h[2]), 0, 0);
                return hoje.getTime();
            }
            return Date.now();
        }
        const partes = d.split(' ')[0].split('/');
        if (partes.length === 3) {
            const [dia, mes, ano] = partes;
            const dataObj = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia));
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
            if (ordenacaoAtual.criterio !== 'tipo') {
                const aIsPasta = a.dataset.tipo === 'pasta';
                const bIsPasta = b.dataset.tipo === 'pasta';
                if (aIsPasta && !bIsPasta) return -1;
                if (!aIsPasta && bIsPasta) return 1;
            }

            let valA, valB;
            if (ordenacaoAtual.criterio === 'nome') {
                valA = (a.dataset.nome || '').toLowerCase();
                valB = (b.dataset.nome || '').toLowerCase();
            } else if (ordenacaoAtual.criterio === 'tipo') {
                valA = ordemTipos[a.dataset.tipo] ?? 99;
                valB = ordemTipos[b.dataset.tipo] ?? 99;
            } else if (ordenacaoAtual.criterio === 'tamanho') {
                valA = parseTamanho(a.querySelector('.item-tamanho')?.textContent);
                valB = parseTamanho(b.querySelector('.item-tamanho')?.textContent);
            } else if (ordenacaoAtual.criterio === 'data') {
                valA = parseData(a.querySelector('.item-data')?.textContent);
                valB = parseData(b.querySelector('.item-data')?.textContent);
            }

            if (valA < valB) return ordenacaoAtual.ordem === 'asc' ? -1 : 1;
            if (valA > valB) return ordenacaoAtual.ordem === 'asc' ? 1 : -1;
            return 0;
        });

        items.forEach(item => container.appendChild(item));
        atualizarEstadoUI();
        localStorage.setItem('ordenacao', JSON.stringify(ordenacaoAtual));
        isOrdenando = false;
    }

    document.addEventListener('listaAtualizada', ordenarItens);
    ordenarItens();
});

// ===== 5. CLIQUE NOS ITENS (NAVEGAÇÃO / ABERTURA) =====
document.addEventListener('DOMContentLoaded', function () {
    document.addEventListener('click', function (e) {
        const card = e.target.closest('.item-link');
        if (!card) return;
        if (e.target.closest('.item-menu-wrapper') || e.target.closest('.btn-card-more') ||
            e.target.closest('form') || e.target.closest('button') ||
            e.target.closest('.item-checkbox') || e.target.closest('.item-checkbox-input') ||
            e.ctrlKey) return;

        const tipo = card.dataset.tipo;
        const caminho = card.dataset.caminho;

        if (tipo === 'pasta') {
            if (caminho) window.location.href = `/explorar/${encodeURIComponent(caminho).replace(/%2F/g, '/')}`;
        } else if (tipo === 'imagem') {
            return; // Tratado pelo lightbox
        } else if (tipo === 'audio') {
            e.preventDefault();
            e.stopPropagation();
            const nome = card.querySelector('.item-card-title, .item-nome')?.textContent.trim() || '';
            if (typeof window.openAudioModal === 'function') {
                window.openAudioModal(`/visualizar/${caminho}`, nome, `/download/${caminho}`, card.querySelector('.form-excluir'));
            }
        } else if (tipo === 'pdf') {
            if (caminho) window.open(`/visualizar/${caminho}`, '_blank');
        } else if (tipo === 'arquivo') {
            if (caminho) window.location.href = `/download/${caminho}`;
        }
    });
});

// ===== 6. SELEÇÃO MÚLTIPLA & BARRA FLUTUANTE =====
document.addEventListener('DOMContentLoaded', function () {
    const selecaoBarra = document.getElementById('selecao-barra');
    const selecaoContador = document.getElementById('selecao-contador');
    const selecaoSelectAll = document.getElementById('selecao-select-all');
    const selecaoClear = document.getElementById('selecao-clear');
    const selecaoDelete = document.getElementById('selecao-delete');
    const selecaoDownload = document.getElementById('selecao-download');

    let itensSelecionados = new Set();

    document.addEventListener('click', function (e) {
        if (e.ctrlKey) {
            const card = e.target.closest('.item-link');
            if (card) {
                e.preventDefault();
                e.stopPropagation();
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
        if (selecaoContador) selecaoContador.textContent = count;

        if (selecaoBarra) {
            selecaoBarra.style.display = count > 0 ? 'flex' : 'none';
        }

        document.querySelectorAll('.item-card').forEach(card => {
            const link = card.closest('.item-link');
            if (link) {
                card.classList.toggle('selected', itensSelecionados.has(link.dataset.caminho));
            }
        });
    }

    document.addEventListener('change', function (e) {
        if (e.target.classList.contains('item-checkbox-input')) {
            const checkbox = e.target;
            const caminho = checkbox.dataset.caminho;
            const card = checkbox.closest('.item-card');
            if (checkbox.checked) {
                itensSelecionados.add(caminho);
                card?.classList.add('selected');
            } else {
                itensSelecionados.delete(caminho);
                card?.classList.remove('selected');
            }
            atualizarSelecao();
        }
    });

    selecaoSelectAll?.addEventListener('click', function () {
        const checkboxes = document.querySelectorAll('.item-checkbox-input');
        const todosSelecionados = Array.from(checkboxes).every(cb => cb.checked);
        checkboxes.forEach(checkbox => {
            checkbox.checked = !todosSelecionados;
            const caminho = checkbox.dataset.caminho;
            const card = checkbox.closest('.item-card');
            if (!todosSelecionados) {
                itensSelecionados.add(caminho);
                card?.classList.add('selected');
            } else {
                itensSelecionados.delete(caminho);
                card?.classList.remove('selected');
            }
        });
        atualizarSelecao();
    });

    selecaoClear?.addEventListener('click', function () {
        document.querySelectorAll('.item-checkbox-input').forEach(cb => {
            cb.checked = false;
            cb.closest('.item-card')?.classList.remove('selected');
        });
        itensSelecionados.clear();
        atualizarSelecao();
    });

    document.addEventListener('listaAtualizada', () => {
        itensSelecionados.clear();
        atualizarSelecao();
    });

    // Exclusão em lote
    selecaoDelete?.addEventListener('click', async function (e) {
        e.stopPropagation();
        if (itensSelecionados.size === 0) return;

        const count = itensSelecionados.size;
        const confirmado = await ConfirmModal.open({
            title: 'Excluir Itens Selecionados',
            message: `Deseja mover os ${count} itens selecionados para a lixeira?`,
            detail: 'Você poderá restaurá-los nos próximos 30 dias.'
        });

        if (!confirmado) return;

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
                showToast(`✅ ${resultado.excluidos} itens movidos para a lixeira.`, 'success');
                if (typeof atualizarLista === 'function') atualizarLista();
            } else {
                showToast(`Erro: ${resultado.erro}`, 'error');
            }
        } catch (error) {
            showToast('Erro de conexão ao excluir itens selecionados', 'error');
        }
    });

    // Download ZIP
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
        setTimeout(() => {
            if (document.body.contains(form)) document.body.removeChild(form);
        }, 1000);
    });
});

// ===== 7. DRAG & DROP BLINDADO =====
document.addEventListener('DOMContentLoaded', function () {
    const overlay = document.getElementById('global-drop-overlay');
    let dragCounter = 0;

    document.addEventListener('dragstart', () => { isInternalDrag = true; });
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

// ===== 8. PLAYER DE ÁUDIO CUSTOMIZADO =====
(function () {
    function initAudioModal() {
        const audioModal = document.getElementById('audioModal');
        const audioPlayer = document.getElementById('audioPlayer');
        const audioSource = document.getElementById('audioSource');
        const audioModalTitle = document.getElementById('audioModalTitle');
        const audioModalDownload = document.getElementById('audioModalDownload');
        const audioModalDelete = document.getElementById('audioModalDelete');
        const audioModalClose = document.getElementById('audioModalClose');
        const audioDuration = document.getElementById('audioDuration');

        if (!audioModal) return;

        let currentAudioDeleteForm = null;
        let audioCloseTimeout = null;

        function closeAudio() {
            audioPlayer?.pause();
            if (audioPlayer) audioPlayer.currentTime = 0;
            audioModal.classList.remove('active');
            if (audioCloseTimeout) clearTimeout(audioCloseTimeout);
            audioCloseTimeout = setTimeout(() => {
                audioModal.style.display = 'none';
                if (audioSource) audioSource.src = '';
                document.body.style.overflow = '';
            }, 200);
        }

        window.openAudioModal = function (audioUrl, audioName, downloadUrl, deleteForm) {
            if (audioCloseTimeout) clearTimeout(audioCloseTimeout);
            currentAudioDeleteForm = deleteForm;
            audioPlayer?.pause();
            if (audioPlayer) audioPlayer.currentTime = 0;
            if (audioSource) audioSource.src = audioUrl;
            audioPlayer?.load();
            if (audioDuration) audioDuration.textContent = '';
            if (audioModalTitle) audioModalTitle.textContent = audioName;
            if (audioModalDownload) audioModalDownload.href = downloadUrl;

            const handleDelete = async function (e) {
                e.preventDefault();
                const confirmado = await ConfirmModal.open({
                    title: 'Excluir Áudio',
                    message: `Deseja mover "${audioName}" para a lixeira?`,
                    detail: 'Você poderá restaurá-lo em até 30 dias.'
                });
                if (confirmado && currentAudioDeleteForm) {
                    closeAudio();
                    const form = currentAudioDeleteForm;
                    if (form.action) {
                        executarExclusaoAjax(form.action, audioName, 'arquivo');
                    } else {
                        form.submit();
                    }
                }
            };

            const deleteBtn = document.getElementById('audioModalDelete');
            if (deleteBtn) {
                deleteBtn.onclick = handleDelete;
            }

            audioModal.style.display = 'flex';
            setTimeout(() => audioModal.classList.add('active'), 10);
            document.body.style.overflow = 'hidden';

            audioPlayer?.play().catch(() => {});
        };

        if (audioModalClose) audioModalClose.onclick = closeAudio;
        if (audioModal) audioModal.onclick = (e) => { if (e.target === audioModal) closeAudio(); };

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && audioModal && audioModal.classList.contains('active')) {
                closeAudio();
            }
        });

        const playPauseBtn = document.getElementById('playPauseBtn');
        const progressBar = document.getElementById('progressBar');
        const progressFill = document.getElementById('progressFill');
        const currentTimeEl = document.getElementById('currentTime');
        const totalTimeEl = document.getElementById('totalTime');
        const volumeBtn = document.getElementById('volumeBtn');
        const volumeSlider = document.getElementById('volumeSlider');

        function formatTime(sec) {
            if (!sec || isNaN(sec)) return '0:00';
            const m = Math.floor(sec / 60);
            const s = Math.floor(sec % 60);
            return `${m}:${s.toString().padStart(2, '0')}`;
        }

        playPauseBtn?.addEventListener('click', () => {
            if (!audioPlayer) return;
            if (audioPlayer.paused) {
                audioPlayer.play();
                playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
            } else {
                audioPlayer.pause();
                playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
            }
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });

        audioPlayer?.addEventListener('play', () => {
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i data-lucide="pause"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });

        audioPlayer?.addEventListener('pause', () => {
            if (playPauseBtn) {
                playPauseBtn.innerHTML = '<i data-lucide="play"></i>';
                if (typeof lucide !== 'undefined') lucide.createIcons();
            }
        });

        audioPlayer?.addEventListener('loadedmetadata', () => {
            if (totalTimeEl) totalTimeEl.textContent = formatTime(audioPlayer.duration);
        });

        audioPlayer?.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const pct = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                if (progressFill) progressFill.style.width = pct + '%';
                if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            }
        });

        progressBar?.addEventListener('click', (e) => {
            if (!audioPlayer || !audioPlayer.duration) return;
            const rect = progressBar.getBoundingClientRect();
            const pct = (e.clientX - rect.left) / rect.width;
            audioPlayer.currentTime = pct * audioPlayer.duration;
        });

        volumeSlider?.addEventListener('input', (e) => {
            if (!audioPlayer) return;
            audioPlayer.volume = e.target.value / 100;
        });

        volumeBtn?.addEventListener('click', () => {
            if (!audioPlayer) return;
            audioPlayer.muted = !audioPlayer.muted;
            volumeBtn.innerHTML = audioPlayer.muted ? '<i data-lucide="volume-x"></i>' : '<i data-lucide="volume-2"></i>';
            if (typeof lucide !== 'undefined') lucide.createIcons();
        });
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initAudioModal);
    else initAudioModal();
})();

// ===== 9. ATUALIZAR LISTA VIA AJAX =====
async function atualizarLista() {
    const container = document.getElementById('file-list-container');
    if (!container) return;
    const caminho = window.location.pathname.replace(/^\/explorar/, '') || '/';
    try {
        const response = await fetch(`/partial/lista${caminho}`);
        if (response.ok) {
            container.innerHTML = await response.text();
            document.dispatchEvent(new CustomEvent('listaAtualizada'));
        }
    } catch (error) {
        console.error('Erro ao atualizar lista:', error);
    }
}
window.atualizarLista = atualizarLista;

// ===== 10. DROPDOWN DESKTOP & BOTTOM SHEET MOBILE (3 PONTINHOS) =====
window.toggleDropdown = function (btn) {
    const isMobile = window.innerWidth <= 768;
    const card = btn.closest('.item-card');
    const link = btn.closest('.item-link');
    const dropdown = btn.closest('.item-menu-wrapper')?.querySelector('.item-dropdown');

    if (!card || !dropdown) return;

    if (isMobile) {
        // MOBILE: Abrir Bottom Sheet
        abrirBottomSheet(card, link, dropdown);
    } else {
        // DESKTOP: Menu suspenso ancorado
        let menu;
        if (btn.dataset.dropdownId) {
            menu = document.getElementById(btn.dataset.dropdownId);
        } else {
            menu = dropdown;
            const uniqueId = 'dropdown-' + Math.random().toString(36).substr(2, 9);
            menu.id = uniqueId;
            btn.dataset.dropdownId = uniqueId;
        }

        if (!menu) return;
        const isOpen = menu.classList.contains('open');
        fecharDropdowns();

        if (isOpen) return;

        if (menu.parentNode !== document.body) {
            document.body.appendChild(menu);
        }

        const rect = btn.getBoundingClientRect();
        const dropdownWidth = 180;
        let left = rect.right - dropdownWidth;
        let top = rect.bottom + 6;

        if (left < 10) left = 10;
        if (left + dropdownWidth > window.innerWidth - 10) {
            left = window.innerWidth - dropdownWidth - 10;
        }

        menu.style.position = 'fixed';
        menu.style.display = 'flex';
        menu.style.visibility = 'hidden';

        const dropdownHeight = menu.offsetHeight;
        if (top + dropdownHeight > window.innerHeight - 10) {
            top = rect.top - dropdownHeight - 6;
        }

        menu.style.visibility = 'visible';
        menu.style.top = top + 'px';
        menu.style.left = left + 'px';
        menu.style.zIndex = '10000';

        requestAnimationFrame(() => menu.classList.add('open'));
    }
};

function abrirBottomSheet(card, link, dropdown) {
    const bottomSheet = document.getElementById('mobile-bottom-sheet');
    const bottomSheetTitle = document.getElementById('bottom-sheet-title');
    const bottomSheetIcon = document.getElementById('bottom-sheet-icon');
    const bottomSheetOptions = document.getElementById('bottom-sheet-options');
    const overlay = document.getElementById('sidebar-overlay');

    if (!bottomSheet || !bottomSheetOptions) return;

    const nome = link?.dataset.nome || card.querySelector('.item-card-title, .item-nome')?.textContent.trim() || 'Arquivo';
    const tipo = link?.dataset.tipo || 'arquivo';
    const caminho = link?.dataset.caminho || '';

    if (bottomSheetTitle) bottomSheetTitle.textContent = nome;

    if (bottomSheetIcon) {
        const cardIcon = card.querySelector('.item-mini-icon i, .item-mini-icon svg');
        if (cardIcon) {
            bottomSheetIcon.innerHTML = cardIcon.outerHTML;
        } else {
            bottomSheetIcon.innerHTML = '<i data-lucide="file"></i>';
        }
    }

    bottomSheetOptions.innerHTML = '';

    // Pegar apenas elementos filhos diretos do dropdown (ignorando o que está dentro de forms)
    const items = Array.from(dropdown.children);

    items.forEach(el => {
        // Ignorar dividers
        if (el.classList.contains('dropdown-divider')) {
            return;
        }

        if (el.tagName.toLowerCase() === 'form') {
            const formClone = el.cloneNode(true);
            const submitBtn = formClone.querySelector('button');
            if (submitBtn) {
                submitBtn.className = 'bottom-sheet-btn danger';
                submitBtn.addEventListener('click', () => {
                    fecharBottomSheet();
                });
            }
            bottomSheetOptions.appendChild(formClone);
        } else if (el.classList.contains('dropdown-item')) {
            const btn = document.createElement(el.tagName.toLowerCase() === 'a' ? 'a' : 'button');
            btn.className = 'bottom-sheet-btn' + (el.classList.contains('danger') ? ' danger' : '');
            btn.innerHTML = el.innerHTML;
            if (el.href) btn.href = el.href;
            if (el.getAttribute('download') !== null) btn.setAttribute('download', '');
            if (el.getAttribute('target')) btn.setAttribute('target', el.getAttribute('target'));

            // Handler especial para "Ver informações"
            const onclickAttr = el.getAttribute('onclick');
            if (onclickAttr && onclickAttr.includes('DetailsPanel.open')) {
                btn.addEventListener('click', (e) => {
                    e.preventDefault();
                    fecharBottomSheet();
                    if (caminho) {
                        DetailsPanel.open(caminho);
                    }
                });
            } else {
                btn.addEventListener('click', (e) => {
                    fecharBottomSheet();
                    if (onclickAttr) {
                        eval(onclickAttr);
                    }
                });
            }

            bottomSheetOptions.appendChild(btn);
        }
    });

    bottomSheet.classList.add('active');
    overlay?.classList.add('active');
    document.body.style.overflow = 'hidden';

    if (typeof lucide !== 'undefined') lucide.createIcons();
}

function fecharBottomSheet() {
    const bottomSheet = document.getElementById('mobile-bottom-sheet');
    const overlay = document.getElementById('sidebar-overlay');
    if (bottomSheet) bottomSheet.classList.remove('active');
    if (overlay && !document.getElementById('sidebar')?.classList.contains('active')) {
        overlay.classList.remove('active');
    }
    document.body.style.overflow = '';
}

window.fecharDropdowns = function () {
    document.querySelectorAll('.item-dropdown.open').forEach(d => {
        d.classList.remove('open');
        d.style.display = 'none';
    });
    fecharBottomSheet();
};

document.addEventListener('click', function (e) {
    if (!e.target.closest('.item-menu-wrapper') && !e.target.closest('.mobile-bottom-sheet')) {
        fecharDropdowns();
    }
});

document.addEventListener('scroll', fecharDropdowns, true);

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') fecharDropdowns();
});

// ===== 11. FLOATING ACTION BUTTON (FAB DUPLO — IMAGEM 1) =====
document.addEventListener('DOMContentLoaded', function () {
    const fabMain = document.getElementById('fab-main');
    const fabUpload = document.getElementById('fab-upload-option');
    const uploadInput = document.getElementById('arquivo');

    fabUpload?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        uploadInput?.click();
    });

    fabMain?.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (typeof window.abrirModalCriarPasta === 'function') {
            window.abrirModalCriarPasta();
        }
    });
});

// ===== 12. MODAL DE RENOMEAR =====
(function () {
    const renameModal = document.getElementById('rename-modal');
    const renameForm = document.getElementById('rename-form');
    const renameCaminhoAntigo = document.getElementById('rename-caminho-antigo');
    const renameNovoNome = document.getElementById('rename-novo-nome');
    const renameTipoHint = document.getElementById('rename-tipo-hint');
    const closeRenameModal = document.getElementById('close-rename-modal');
    const cancelRenameModal = document.getElementById('cancel-rename-modal');

    if (!renameModal || !renameForm) return;

    window.abrirModalRenomear = function (caminho, nomeAtual, tipo) {
        renameCaminhoAntigo.value = caminho;
        renameNovoNome.value = nomeAtual;

        const tipoLabels = {
            'pasta': 'Pasta',
            'imagem': 'Imagem',
            'audio': 'Áudio',
            'pdf': 'PDF',
            'arquivo': 'Arquivo'
        };
        if (renameTipoHint) {
            renameTipoHint.textContent = `Renomeando ${tipoLabels[tipo] || 'arquivo'}: "${nomeAtual}"`;
        }

        fecharDropdowns();
        renameModal.style.display = 'flex';
        setTimeout(() => {
            renameModal.classList.add('active');
            renameNovoNome.focus();
            renameNovoNome.select();
        }, 10);
    };

    function fecharModalRenomear() {
        renameModal.classList.remove('active');
        setTimeout(() => {
            renameModal.style.display = 'none';
            renameForm.reset();
        }, 200);
    }

    closeRenameModal?.addEventListener('click', fecharModalRenomear);
    cancelRenameModal?.addEventListener('click', fecharModalRenomear);
    renameModal.addEventListener('click', (e) => {
        if (e.target === renameModal) fecharModalRenomear();
    });

    renameForm.addEventListener('submit', async function (e) {
        e.preventDefault();

        const caminhoAntigo = renameCaminhoAntigo.value;
        const novoNome = renameNovoNome.value.trim();

        if (!caminhoAntigo || !novoNome) {
            showToast('Nome inválido', 'error');
            return;
        }

        const renameUrl = `/renomear/${encodeURIComponent(caminhoAntigo).replace(/%2F/g, '/')}`;
        const submitBtn = renameForm.querySelector('button[type="submit"]');
        const originalText = submitBtn.innerHTML;

        submitBtn.disabled = true;
        submitBtn.innerHTML = '<i data-lucide="loader-2" style="animation:spin 1s linear infinite;"></i> Renomeando...';
        if (typeof lucide !== 'undefined') lucide.createIcons();

        try {
            const response = await fetch(renameUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': getCsrfToken()
                },
                body: JSON.stringify({ novo_nome: novoNome })
            });

            const data = await response.json();

            if (data.sucesso || data.success) {
                showToast(data.mensagem || data.message || 'Renomeado com sucesso!', 'success');
                fecharModalRenomear();
                if (typeof atualizarLista === 'function') atualizarLista();
            } else {
                showToast(data.erro || data.error || 'Erro ao renomear item', 'error');
            }
        } catch (error) {
            showToast('Erro ao renomear. Verifique sua conexão.', 'error');
        } finally {
            submitBtn.disabled = false;
            submitBtn.innerHTML = originalText;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && renameModal.classList.contains('active')) {
            fecharModalRenomear();
        }
    });
})();

// ===== PAINEL DE DETALHES =====
const DetailsPanel = {
    panel: null,
    overlay: null,
    isOpen: false,
    currentPath: null,

    init() {
        this.panel = document.getElementById('details-panel');
        this.overlay = document.getElementById('details-overlay');

        const closeBtn = document.getElementById('details-panel-close');
        closeBtn?.addEventListener('click', () => this.close());
        this.overlay?.addEventListener('click', () => this.close());

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.isOpen) this.close();
        });
    },

    async open(caminho) {
        if (!this.panel) return;

        this.currentPath = caminho;
        this.isOpen = true;
        this.panel.classList.add('active');
        this.overlay?.classList.add('active');

        this.showLoading();
        await this.loadFileInfo(caminho);
    },

    close() {
        this.panel?.classList.remove('active');
        this.overlay?.classList.remove('active');
        this.isOpen = false;
        this.currentPath = null;
    },

    showLoading() {
        document.getElementById('details-loading').style.display = 'flex';
        document.getElementById('details-error').style.display = 'none';
        document.getElementById('details-info').style.display = 'none';
    },

    showError(message) {
        document.getElementById('details-loading').style.display = 'none';
        document.getElementById('details-error').style.display = 'flex';
        document.getElementById('details-info').style.display = 'none';
        document.getElementById('details-error-message').textContent = message;
    },

    showInfo() {
        document.getElementById('details-loading').style.display = 'none';
        document.getElementById('details-error').style.display = 'none';
        document.getElementById('details-info').style.display = 'block';
    },

    async loadFileInfo(caminho) {
        try {
            const response = await fetch(`/api/files/info/${encodeURIComponent(caminho).replace(/%2F/g, '/')}`);

            if (!response.ok) {
                throw new Error(response.status === 404 ? 'Arquivo não encontrado' : 'Erro ao carregar');
            }

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Erro desconhecido');

            this.renderFileInfo(result.data);
            this.showInfo();

        } catch (error) {
            console.error('Erro ao carregar info:', error);
            this.showError(error.message);
        }
    },

    renderFileInfo(data) {
        // Nome, tipo, tamanho
        document.getElementById('details-nome').textContent = data.nome;

        const tipoLabels = {
            'pasta': 'Pasta',
            'imagem': 'Imagem',
            'audio': 'Áudio',
            'pdf': 'Documento PDF',
            'arquivo': data.extensao ? data.extensao.toUpperCase() : 'Arquivo'
        };
        document.getElementById('details-tipo').textContent = tipoLabels[data.tipo] || 'Arquivo';
        document.getElementById('details-tamanho').textContent = data.tamanho_formatado;

        // Localização (pasta pai)
        const pathParts = data.caminho_relativo.split('/');
        pathParts.pop();
        document.getElementById('details-localizacao').textContent = pathParts.join('/') || '/';

        // Datas
        document.getElementById('details-modificado').textContent = data.data_modificacao;
        document.getElementById('details-criado').textContent = data.data_criacao;

        // Duração (áudio/vídeo)
        const durationRow = document.getElementById('details-duracao-row');
        if (data.duracao_formatada) {
            document.getElementById('details-duracao').textContent = data.duracao_formatada;
            durationRow.style.display = 'flex';
        } else {
            durationRow.style.display = 'none';
        }

        // Preview
        this.renderPreview(data);

        // Compartilhamento
        this.renderShareInfo(data.share_link);
    },

    renderPreview(data) {
        const preview = document.getElementById('details-preview');
        preview.innerHTML = '';

        if (data.tipo === 'imagem') {
            const img = document.createElement('img');
            img.src = `/visualizar/${data.caminho_relativo}`;
            img.alt = data.nome;
            img.loading = 'lazy';
            preview.appendChild(img);
        } else {
            const iconMap = {
                'pasta': 'folder',
                'audio': 'music',
                'pdf': 'file-text',
                'arquivo': 'file'
            };
            preview.innerHTML = `<i data-lucide="${iconMap[data.tipo] || 'file'}" class="details-preview-icon"></i>`;
            if (typeof lucide !== 'undefined') lucide.createIcons();
        }
    },

    renderShareInfo(shareLink) {
        const section = document.getElementById('details-share-section');

        if (!shareLink) {
            section.style.display = 'none';
            return;
        }

        section.style.display = 'block';

        const fullUrl = window.location.origin + shareLink.url;
        const linkEl = document.getElementById('details-share-link');
        linkEl.href = fullUrl;
        linkEl.textContent = shareLink.url;

        document.getElementById('details-share-expires').textContent = shareLink.expires_at;
        document.getElementById('details-share-downloads').textContent = shareLink.downloads_count;
    }
};

// Inicializar
document.addEventListener('DOMContentLoaded', () => {
    DetailsPanel.init();
});

// Modificar comportamento de clique quando painel aberto
document.addEventListener('click', function (e) {
    const itemLink = e.target.closest('.item-link');
    if (!itemLink) return;

    // Se painel aberto, atualizar info ao invés de navegar
    if (DetailsPanel.isOpen && !e.ctrlKey) {
        if (e.target.closest('.item-menu-wrapper') || e.target.closest('.item-checkbox')) {
            return;
        }

        e.preventDefault();
        e.stopPropagation();
        const caminho = itemLink.dataset.caminho;
        DetailsPanel.open(caminho);
    }
});

// Duplo-clique para abrir pastas quando painel aberto
document.addEventListener('dblclick', function (e) {
    const itemLink = e.target.closest('.item-link');
    if (!itemLink) return;

    const tipo = itemLink.dataset.tipo;
    const caminho = itemLink.dataset.caminho;

    if (tipo === 'pasta' && DetailsPanel.isOpen) {
        e.preventDefault();
        DetailsPanel.close();
        window.location.href = `/explorar/${encodeURIComponent(caminho).replace(/%2F/g, '/')}`;
    }
});

window.DetailsPanel = DetailsPanel;
