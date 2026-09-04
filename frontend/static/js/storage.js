// frontend/static/js/storage.js
/**
 * Gerenciador de Armazenamento do Cloud Storage App
 * Controle dinâmico, estatísticas categorizadas, filtro interativo e ações rápidas.
 */

document.addEventListener('DOMContentLoaded', function () {
    const btnRefresh = document.getElementById('btn-refresh-storage');
    const refreshIcon = document.getElementById('refresh-icon');
    const btnEsvaziarLixeira = document.getElementById('btn-esvaziar-lixeira-storage');
    const searchInput = document.getElementById('pesquisa-storage');
    const searchClear = document.getElementById('pesquisa-limpar');
    const tableTitle = document.getElementById('storage-table-title');
    const tableCount = document.getElementById('storage-table-count');

    const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';

    let filtroCategoriaAtual = 'todos';

    // Labels amigáveis para as categorias
    const nomesCategorias = {
        'todos': 'Todos os Arquivos',
        'imagens': 'Arquivos de Imagens',
        'videos': 'Arquivos de Vídeos',
        'audios': 'Arquivos de Áudios',
        'documentos': 'Arquivos de Documentos',
        'compactados': 'Arquivos Compactados',
        'outros': 'Outros Arquivos'
    };

    // ===== FILTRO COMBINADO (CATEGORIA + BUSCA DE TEXTO) =====
    function aplicarFiltros() {
        const query = (searchInput?.value || '').trim().toLowerCase();
        const rows = document.querySelectorAll('.storage-row');
        let visiveis = 0;

        if (searchClear) {
            searchClear.style.display = query ? 'flex' : 'none';
        }

        rows.forEach(row => {
            const nome = row.getAttribute('data-nome') || '';
            const pasta = row.getAttribute('data-pasta') || '';
            const categoria = row.getAttribute('data-categoria') || '';

            const bateCategoria = (filtroCategoriaAtual === 'todos' || categoria === filtroCategoriaAtual);
            const bateTexto = (!query || nome.includes(query) || pasta.includes(query));

            if (bateCategoria && bateTexto) {
                row.style.display = '';
                visiveis++;
            } else {
                row.style.display = 'none';
            }
        });

        // Atualizar título e contagem da tabela
        if (tableTitle) {
            const nomeLabel = nomesCategorias[filtroCategoriaAtual] || 'Arquivos no Drive';
            tableTitle.innerHTML = `<i data-lucide="file-stack" style="color: var(--primary);"></i> <span>${nomeLabel}</span>`;
        }

        if (tableCount) {
            tableCount.textContent = `Mostrando ${visiveis} arquivo(s) ordenados por tamanho`;
        }

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // Eventos de Busca por Texto
    searchInput?.addEventListener('input', aplicarFiltros);
    searchClear?.addEventListener('click', function () {
        if (searchInput) searchInput.value = '';
        aplicarFiltros();
        searchInput?.focus();
    });

    // ===== CLIQUE NAS PÍLULAS DE FILTRO =====
    document.addEventListener('click', function (e) {
        const pill = e.target.closest('.filter-pill');
        if (pill) {
            const filter = pill.getAttribute('data-filter');
            if (filter) {
                selecionarFiltroCategoria(filter);
            }
            return;
        }

        // CLIQUE NOS CARDS SUPERIORES DE CATEGORIA
        const catCard = e.target.closest('.storage-cat-card');
        if (catCard) {
            const catKey = catCard.getAttribute('data-category');
            if (catKey === 'lixeira') {
                window.location.href = '/lixeira';
                return;
            }

            if (catKey) {
                selecionarFiltroCategoria(catKey);
                // Rolar suavemente até a tabela de arquivos
                const tabelaEl = document.getElementById('tabela-maiores-arquivos');
                if (tabelaEl) {
                    tabelaEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        }
    });

    function selecionarFiltroCategoria(categoria) {
        filtroCategoriaAtual = categoria;

        // Atualizar classes ativas nas pílulas
        document.querySelectorAll('.filter-pill').forEach(btn => {
            if (btn.getAttribute('data-filter') === categoria) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        aplicarFiltros();
    }

    // ===== RECALCULAR ARMAZENAMENTO =====
    btnRefresh?.addEventListener('click', async function () {
        if (refreshIcon) refreshIcon.classList.add('spin-icon');
        btnRefresh.disabled = true;

        try {
            const resp = await fetch('/api/storage/refresh', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await resp.json();
            if (data.success && data.stats) {
                renderizarEstatisticas(data.stats);
                if (typeof Toast !== 'undefined') {
                    Toast.success('Estatísticas de armazenamento atualizadas!');
                }
            } else {
                throw new Error(data.message || 'Erro ao recalcular');
            }
        } catch (err) {
            console.error('Erro ao recalcular armazenamento:', err);
            if (typeof Toast !== 'undefined') {
                Toast.error('Erro ao atualizar armazenamento: ' + err.message);
            }
        } finally {
            if (refreshIcon) refreshIcon.classList.remove('spin-icon');
            btnRefresh.disabled = false;
        }
    });

    // ===== ESVAZIAR LIXEIRA A PARTIR DO STORAGE =====
    btnEsvaziarLixeira?.addEventListener('click', async function () {
        const confirmado = await ConfirmModal.open({
            title: 'Esvaziar Lixeira',
            message: 'Tem certeza que deseja esvaziar a lixeira agora?',
            detail: 'Todos os arquivos retidos serão excluídos permanentemente.'
        });

        if (!confirmado) return;

        try {
            const resp = await fetch('/api/trash/empty', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await resp.json();
            if (data.success) {
                if (typeof Toast !== 'undefined') {
                    Toast.success(data.message || 'Lixeira esvaziada com sucesso!');
                }
                btnRefresh?.click();
            } else {
                throw new Error(data.error || 'Erro ao esvaziar lixeira');
            }
        } catch (err) {
            console.error('Erro:', err);
            if (typeof Toast !== 'undefined') {
                Toast.error(err.message);
            }
        }
    });

    // ===== ATUALIZAR INTERFACE =====
    function renderizarEstatisticas(stats) {
        const r = stats.resumo;

        // Atualizar textos do título
        const titleEl = document.getElementById('storage-title-text');
        const subtitleEl = document.getElementById('storage-subtitle-text');
        const sidebarTextEl = document.getElementById('sidebar-storage-text');

        if (titleEl) {
            titleEl.textContent = `${r.total_usado_formatado} de ${r.capacidade_total_formatado} usados`;
        }
        if (subtitleEl) {
            subtitleEl.textContent = `${r.percentual_usado}% em uso • ${r.espaco_livre_formatado} livres`;
        }
        if (sidebarTextEl) {
            sidebarTextEl.textContent = `${r.total_usado_formatado} de ${r.capacidade_total_formatado} usados`;
        }

        // Atualizar barra segmentada
        const segmentedBar = document.getElementById('storage-segmented-bar');
        if (segmentedBar) {
            segmentedBar.innerHTML = '';
            stats.categorias.forEach(cat => {
                if (cat.percentual_capacidade > 0) {
                    const seg = document.createElement('div');
                    seg.className = 'storage-segment';
                    seg.style.width = `${cat.percentual_capacidade}%`;
                    seg.style.backgroundColor = cat.color;
                    seg.title = `${cat.label}: ${cat.formatado} (${cat.percentual_usado}% do total usado)`;
                    segmentedBar.appendChild(seg);
                }
            });
        }

        // Atualizar grade de categorias
        const catGrid = document.getElementById('storage-cat-grid');
        if (catGrid) {
            catGrid.innerHTML = '';
            stats.categorias.forEach(cat => {
                const card = document.createElement('div');
                card.className = 'storage-cat-card';
                card.setAttribute('data-category', cat.chave);
                card.setAttribute('title', `Clique para listar arquivos de ${cat.label}`);
                card.innerHTML = `
                    <div class="storage-cat-icon cat-${cat.chave}">
                        <i data-lucide="${cat.icon}"></i>
                    </div>
                    <div class="storage-cat-info">
                        <span class="storage-cat-label">${cat.label}</span>
                        <span class="storage-cat-size">${cat.formatado}</span>
                        <span class="storage-cat-count">${cat.count} arquivo(s) (${cat.percentual_usado}%)</span>
                    </div>
                `;
                catGrid.appendChild(card);
            });
        }

        // Reaplicar filtros atuais na tabela
        aplicarFiltros();

        if (typeof lucide !== 'undefined') {
            lucide.createIcons();
        }
    }

    // ===== EXCLUSÃO DIRETA DE ARQUIVO DA TABELA =====
    window.confirmarExclusaoStorage = async function (nomeArquivo, formElement) {
        const confirmado = await ConfirmModal.open({
            title: 'Mover para Lixeira',
            message: `Deseja mover o arquivo "${nomeArquivo}" para a lixeira?`,
            detail: 'Você poderá restaurá-lo em até 30 dias.'
        });

        if (!confirmado) return;

        try {
            const resp = await fetch(formElement.action, {
                method: 'POST',
                headers: {
                    'X-CSRFToken': csrfToken,
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });

            const data = await resp.json();
            if (data.sucesso || data.success) {
                if (typeof Toast !== 'undefined') {
                    Toast.success(`"${nomeArquivo}" movido para a lixeira`);
                }
                const row = formElement.closest('tr');
                if (row) {
                    row.style.opacity = '0';
                    row.style.transition = 'opacity 0.3s ease';
                    setTimeout(() => {
                        row.remove();
                        aplicarFiltros();
                        btnRefresh?.click();
                    }, 300);
                }
            } else {
                throw new Error(data.erro || data.error || 'Erro ao excluir');
            }
        } catch (err) {
            console.error('Erro na exclusão:', err);
            if (typeof Toast !== 'undefined') {
                Toast.error(err.message);
            }
        }
    };

    // Inicializar contagem inicial
    aplicarFiltros();
});
