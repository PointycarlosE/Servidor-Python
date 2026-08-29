// trash.js — Funcionalidades da Lixeira com Design Google Drive

let itensSelecionadosLixeira = new Set();

document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initBuscaLixeira();
    initSelecaoLixeira();
});

// ===== BUSCA EM TEMPO REAL =====
function initBuscaLixeira() {
    const inputBusca = document.getElementById('pesquisa-lixeira');
    const btnLimpar = document.getElementById('pesquisa-limpar');

    if (!inputBusca) return;

    let timeout;
    inputBusca.addEventListener('input', (e) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const query = e.target.value.toLowerCase().trim();
            filtrarItensLixeira(query);
        }, 150);
    });

    if (btnLimpar) {
        btnLimpar.addEventListener('click', () => {
            inputBusca.value = '';
            filtrarItensLixeira('');
            inputBusca.focus();
        });
    }
}

function filtrarItensLixeira(query) {
    const itens = document.querySelectorAll('.trash-item');
    let visiveis = 0;

    itens.forEach(item => {
        const nome = (item.dataset.nome || '').toLowerCase();
        const path = (item.dataset.path || '').toLowerCase();

        if (!query || nome.includes(query) || path.includes(query)) {
            item.style.display = 'flex';
            visiveis++;
        } else {
            item.style.display = 'none';
        }
    });

    const totalEl = document.getElementById('total-itens');
    if (totalEl && !query) {
        totalEl.textContent = itens.length;
    }
}

// ===== SELEÇÃO MÚLTIPLA =====
function initSelecaoLixeira() {
    const bulkBar = document.getElementById('bulk-actions-bar');
    const selectedCount = document.getElementById('selected-count');
    const btnSelectAll = document.getElementById('btn-select-all');
    const btnClear = document.getElementById('btn-clear-selection');
    const btnRestoreSelected = document.getElementById('btn-restore-selected');
    const btnDeleteSelected = document.getElementById('btn-delete-selected');

    document.addEventListener('change', (e) => {
        if (e.target.classList.contains('trash-item-checkbox')) {
            const id = e.target.dataset.id;
            const item = e.target.closest('.trash-item');
            if (e.target.checked) {
                itensSelecionadosLixeira.add(id);
                item?.classList.add('selected');
            } else {
                itensSelecionadosLixeira.delete(id);
                item?.classList.remove('selected');
            }
            atualizarBarraLixeira();
        }
    });

    function atualizarBarraLixeira() {
        const count = itensSelecionadosLixeira.size;
        if (selectedCount) selectedCount.textContent = count;

        if (bulkBar) {
            if (count > 0) {
                bulkBar.style.display = 'flex';
            } else {
                bulkBar.style.display = 'none';
            }
        }
    }

    btnSelectAll?.addEventListener('click', () => {
        const checkboxes = document.querySelectorAll('.trash-item-checkbox');
        const todosMarcados = Array.from(checkboxes).every(cb => cb.checked);

        checkboxes.forEach(cb => {
            cb.checked = !todosMarcados;
            const id = cb.dataset.id;
            const item = cb.closest('.trash-item');
            if (!todosMarcados) {
                itensSelecionadosLixeira.add(id);
                item?.classList.add('selected');
            } else {
                itensSelecionadosLixeira.delete(id);
                item?.classList.remove('selected');
            }
        });
        atualizarBarraLixeira();
    });

    btnClear?.addEventListener('click', () => {
        document.querySelectorAll('.trash-item-checkbox').forEach(cb => {
            cb.checked = false;
            cb.closest('.trash-item')?.classList.remove('selected');
        });
        itensSelecionadosLixeira.clear();
        atualizarBarraLixeira();
    });

    btnRestoreSelected?.addEventListener('click', () => {
        if (itensSelecionadosLixeira.size === 0) return;
        const count = itensSelecionadosLixeira.size;
        ConfirmModal.open({
            title: 'Restaurar Itens',
            message: `Deseja restaurar os ${count} itens selecionados?`,
            detail: 'Eles voltarão para suas pastas de origem.'
        }).then(confirmado => {
            if (confirmado) {
                restaurarMultiplos(Array.from(itensSelecionadosLixeira));
            }
        });
    });

    btnDeleteSelected?.addEventListener('click', () => {
        if (itensSelecionadosLixeira.size === 0) return;
        const count = itensSelecionadosLixeira.size;
        ConfirmModal.open({
            title: 'Excluir Permanentemente',
            message: `Tem certeza que deseja excluir ${count} itens permanentemente?`,
            detail: '⚠️ Esta ação NÃO pode ser desfeita.'
        }).then(confirmado => {
            if (confirmado) {
                deletarMultiplos(Array.from(itensSelecionadosLixeira));
            }
        });
    });
}

// ===== AÇÕES INDIVIDUAIS =====

window.restaurarItem = async function (itemId, nomeItem) {
    const confirmado = await ConfirmModal.open({
        title: 'Restaurar Item',
        message: `Deseja restaurar "${nomeItem}"?`,
        detail: 'O item voltará para seu local de origem.'
    });

    if (!confirmado) return;

    try {
        const response = await fetch(`/api/trash/restore/${itemId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message || `"${nomeItem}" restaurado com sucesso!`, 'success');
            removerItemDaTela(itemId);
        } else {
            showToast(data.error || 'Erro ao restaurar item', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão ao restaurar item', 'error');
    }
};

window.deletarPermanente = async function (itemId, nomeItem) {
    const confirmado = await ConfirmModal.open({
        title: 'Exclusão Permanente',
        message: `Excluir "${nomeItem}" permanentemente?`,
        detail: '⚠️ Esta ação não pode ser desfeita. O item será apagado do disco.'
    });

    if (!confirmado) return;

    try {
        const response = await fetch(`/api/trash/delete/${itemId}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message || `"${nomeItem}" excluído permanentemente.`, 'success');
            removerItemDaTela(itemId);
        } else {
            showToast(data.error || 'Erro ao excluir item', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão ao excluir item', 'error');
    }
};

window.confirmarEsvaziarLixeira = async function () {
    const confirmado = await ConfirmModal.open({
        title: 'Esvaziar Lixeira',
        message: 'Tem certeza que deseja esvaziar toda a lixeira?',
        detail: '⚠️ TODOS os itens na lixeira serão apagados permanentemente do disco.'
    });

    if (!confirmado) return;

    try {
        const response = await fetch('/api/trash/empty', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            }
        });

        const data = await response.json();

        if (data.success) {
            showToast('Lixeira esvaziada com sucesso!', 'success');
            setTimeout(() => location.reload(), 800);
        } else {
            showToast(data.error || 'Erro ao esvaziar lixeira', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão ao esvaziar lixeira', 'error');
    }
};

async function restaurarMultiplos(itemIds) {
    try {
        const response = await fetch('/api/trash/restore-multiple', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ items: itemIds })
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message || `${itemIds.length} itens restaurados com sucesso!`, 'success');
            itemIds.forEach(id => removerItemDaTela(id));
            itensSelecionadosLixeira.clear();
            document.getElementById('bulk-actions-bar').style.display = 'none';
        } else {
            showToast(data.error || 'Erro ao restaurar itens', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão ao restaurar itens', 'error');
    }
}

async function deletarMultiplos(itemIds) {
    try {
        const response = await fetch('/api/trash/delete-multiple', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-CSRFToken': getCsrfToken()
            },
            body: JSON.stringify({ items: itemIds })
        });

        const data = await response.json();

        if (data.success) {
            showToast(data.message || `${itemIds.length} itens excluídos permanentemente.`, 'success');
            itemIds.forEach(id => removerItemDaTela(id));
            itensSelecionadosLixeira.clear();
            document.getElementById('bulk-actions-bar').style.display = 'none';
        } else {
            showToast(data.error || 'Erro ao excluir itens', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão ao excluir itens', 'error');
    }
}

function removerItemDaTela(itemId) {
    const item = document.querySelector(`.trash-item[data-id="${itemId}"]`);
    if (item) {
        item.style.transition = 'all 0.3s ease';
        item.style.opacity = '0';
        item.style.transform = 'scale(0.9)';
        setTimeout(() => {
            item.remove();
            const restantes = document.querySelectorAll('.trash-item').length;
            const totalEl = document.getElementById('total-itens');
            if (totalEl) totalEl.textContent = restantes;
            if (restantes === 0) location.reload();
        }, 300);
    }
}
