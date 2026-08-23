// trash.js - Funcionalidades da lixeira

// ===== INICIALIZAÇÃO =====
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    initTrashEvents();
    initBulkActions();
    initSearch();
    initModal();
});

// ===== VARIÁVEIS GLOBAIS =====
let selectedItems = new Set();
let modalCallback = null;

// ===== FUNÇÕES DE ÍCONE =====
function getFileIcon(filename) {
    const ext = filename.split('.').pop().toLowerCase();
    const icons = {
        'pdf': 'file-text',
        'doc': 'file-text', 'docx': 'file-text',
        'xls': 'file-spreadsheet', 'xlsx': 'file-spreadsheet',
        'ppt': 'file', 'pptx': 'file',
        'zip': 'archive', 'rar': 'archive', '7z': 'archive',
        'mp3': 'music', 'wav': 'music', 'ogg': 'music', 'flac': 'music', 'm4a': 'music',
        'mp4': 'video', 'mkv': 'video', 'avi': 'video', 'mov': 'video', 'webm': 'video',
        'jpg': 'image', 'jpeg': 'image', 'png': 'image', 'gif': 'image', 'webp': 'image', 'bmp': 'image', 'svg': 'image',
        'txt': 'file-text', 'md': 'file-text',
        'json': 'file-code', 'js': 'file-code', 'py': 'file-code', 'html': 'file-code', 'css': 'file-code',
    };
    return icons[ext] || 'file';
}

// ===== EVENTOS PRINCIPAIS =====
function initTrashEvents() {
    // Botões de restaurar individuais
    document.querySelectorAll('.restore-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            restoreItem(itemId);
        });
    });

    // Botões de excluir permanentemente individuais
    document.querySelectorAll('.delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.stopPropagation();
            const itemId = btn.dataset.id;
            const itemName = getItemName(itemId);
            showConfirmModal(
                'Excluir permanentemente',
                `Tem certeza que deseja excluir "${itemName}" permanentemente?`,
                true,
                () => deleteItem(itemId)
            );
        });
    });

    // Botão de esvaziar lixeira
    const emptyTrashBtn = document.getElementById('empty-trash-btn');
    if (emptyTrashBtn) {
        emptyTrashBtn.addEventListener('click', () => {
            const count = document.querySelectorAll('.file-item').length;
            if (count === 0) {
                showToast('A lixeira já está vazia', 'info');
                return;
            }
            showConfirmModal(
                'Esvaziar lixeira',
                `Tem certeza que deseja excluir todos os ${count} itens permanentemente?`,
                true,
                emptyTrash
            );
        });
    }
}

// ===== AÇÕES EM LOTE =====
function initBulkActions() {
    const checkboxes = document.querySelectorAll('.item-checkbox');
    const bulkBar = document.getElementById('bulk-actions-bar');
    const selectionCount = document.getElementById('selection-count');

    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', () => {
            if (checkbox.checked) {
                selectedItems.add(checkbox.value);
            } else {
                selectedItems.delete(checkbox.value);
            }
            updateBulkBar();
        });
    });

    // Seleção por clique no item
    document.querySelectorAll('.file-item').forEach(item => {
        item.addEventListener('click', (e) => {
            // Ignorar se clicou em botão de ação
            if (e.target.closest('.file-actions') || e.target.closest('.file-checkbox')) {
                return;
            }
            const checkbox = item.querySelector('.item-checkbox');
            checkbox.checked = !checkbox.checked;
            checkbox.dispatchEvent(new Event('change'));
        });
    });

    // Botão restaurar em lote
    document.getElementById('bulk-restore-btn')?.addEventListener('click', () => {
        if (selectedItems.size === 0) return;
        showConfirmModal(
            'Restaurar itens',
            `Restaurar ${selectedItems.size} item(s) selecionado(s)?`,
            false,
            () => restoreMultiple(Array.from(selectedItems))
        );
    });

    // Botão excluir em lote
    document.getElementById('bulk-delete-btn')?.addEventListener('click', () => {
        if (selectedItems.size === 0) return;
        showConfirmModal(
            'Excluir permanentemente',
            `Excluir ${selectedItems.size} item(s) permanentemente?`,
            true,
            () => deleteMultiple(Array.from(selectedItems))
        );
    });

    // Botão cancelar seleção
    document.getElementById('bulk-cancel-btn')?.addEventListener('click', () => {
        clearSelection();
    });

    function updateBulkBar() {
        if (selectedItems.size > 0) {
            bulkBar.style.display = 'flex';
            selectionCount.textContent = `${selectedItems.size} item(s) selecionado(s)`;
        } else {
            bulkBar.style.display = 'none';
        }
    }
}

// ===== BUSCA =====
function initSearch() {
    const searchInput = document.getElementById('pesquisa-input');
    const searchClear = document.getElementById('pesquisa-limpar');

    if (!searchInput) return;

    let searchTimeout;
    searchInput.addEventListener('input', () => {
        clearTimeout(searchTimeout);
        searchTimeout = setTimeout(() => {
            filterItems(searchInput.value);
        }, 200);
    });

    searchClear?.addEventListener('click', () => {
        searchInput.value = '';
        filterItems('');
    });
}

function filterItems(query) {
    const items = document.querySelectorAll('.file-item');
    const lowerQuery = query.toLowerCase().trim();

    items.forEach(item => {
        const name = item.dataset.name.toLowerCase();
        const path = item.dataset.path.toLowerCase();

        if (!lowerQuery || name.includes(lowerQuery) || path.includes(lowerQuery)) {
            item.style.display = '';
        } else {
            item.style.display = 'none';
        }
    });

    // Atualizar contador de itens visíveis
    const visibleItems = document.querySelectorAll('.file-item[style=""]');
    const countEl = document.getElementById('trash-count');
    if (countEl) {
        countEl.textContent = `${visibleItems.length} item(s)`;
    }
}

// ===== MODAL =====
function initModal() {
    const modal = document.getElementById('confirm-modal');
    const closeBtn = document.getElementById('modal-close');
    const cancelBtn = document.getElementById('modal-cancel');
    const confirmBtn = document.getElementById('modal-confirm');

    closeBtn?.addEventListener('click', hideModal);
    cancelBtn?.addEventListener('click', hideModal);

    confirmBtn?.addEventListener('click', () => {
        if (modalCallback) {
            modalCallback();
        }
        hideModal();
    });

    // Fechar ao clicar fora
    modal?.addEventListener('click', (e) => {
        if (e.target === modal) {
            hideModal();
        }
    });
}

function showConfirmModal(title, message, showWarning, callback) {
    const modal = document.getElementById('confirm-modal');
    const titleEl = document.getElementById('modal-title');
    const messageEl = document.getElementById('modal-message');
    const warningEl = document.getElementById('modal-warning');
    const confirmBtn = document.getElementById('modal-confirm');

    titleEl.textContent = title;
    messageEl.textContent = message;
    warningEl.style.display = showWarning ? 'block' : 'none';
    confirmBtn.className = showWarning ? 'btn btn-danger' : 'btn btn-primary';

    modalCallback = callback;
    modal.style.display = 'flex';
}

function hideModal() {
    const modal = document.getElementById('confirm-modal');
    modal.style.display = 'none';
    modalCallback = null;
}

// ===== FUNÇÕES DE API =====

async function restoreItem(itemId) {
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
            showToast(data.message, 'success');
            removeItemFromUI(itemId);
            updateTrashCount();
        } else {
            showToast(data.error || 'Erro ao restaurar', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

async function deleteItem(itemId) {
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
            showToast(data.message, 'success');
            removeItemFromUI(itemId);
            updateTrashCount();
        } else {
            showToast(data.error || 'Erro ao excluir', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

async function emptyTrash() {
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
            showToast(data.message, 'success');
            // Recarregar página para atualizar UI
            setTimeout(() => location.reload(), 1000);
        } else {
            showToast(data.error || 'Erro ao esvaziar lixeira', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

async function restoreMultiple(itemIds) {
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
            showToast(data.message, 'success');
            itemIds.forEach(id => removeItemFromUI(id));
            clearSelection();
            updateTrashCount();
        } else {
            showToast(data.error || 'Erro ao restaurar', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

async function deleteMultiple(itemIds) {
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
            showToast(data.message, 'success');
            itemIds.forEach(id => removeItemFromUI(id));
            clearSelection();
            updateTrashCount();
        } else {
            showToast(data.error || 'Erro ao excluir', 'error');
        }
    } catch (error) {
        showToast('Erro de conexão', 'error');
    }
}

// ===== FUNÇÕES AUXILIARES =====

function removeItemFromUI(itemId) {
    const item = document.querySelector(`.file-item[data-id="${itemId}"]`);
    if (item) {
        item.remove();
    }

    // Verificar se lixeira ficou vazia
    const remainingItems = document.querySelectorAll('.file-item');
    if (remainingItems.length === 0) {
        location.reload();
    }
}

function updateTrashCount() {
    const count = document.querySelectorAll('.file-item').length;
    const countEl = document.getElementById('trash-count');
    if (countEl) {
        countEl.textContent = `${count} item(s)`;
    }
}

function clearSelection() {
    selectedItems.clear();
    document.querySelectorAll('.item-checkbox').forEach(cb => {
        cb.checked = false;
    });
    document.getElementById('bulk-actions-bar').style.display = 'none';
}

function getItemName(itemId) {
    const item = document.querySelector(`.file-item[data-id="${itemId}"]`);
    return item ? item.dataset.name : 'item';
}

function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.content : '';
}

function showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i data-lucide="${type === 'success' ? 'check-circle' : type === 'error' ? 'x-circle' : 'info'}" style="width:18px;height:18px;"></i>
        <span>${message}</span>
    `;

    container.appendChild(toast);
    lucide.createIcons();

    setTimeout(() => {
        toast.classList.add('fade-out');
        setTimeout(() => toast.remove(), 300);
    }, 3000);
}
