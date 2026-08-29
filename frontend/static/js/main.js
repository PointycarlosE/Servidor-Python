// ==========================================================================
// CLOUD STORAGE APP — MAIN.JS (SCRIPTS GLOBAIS)
// ==========================================================================

// ===== 1. CSRF TOKEN HELPER =====
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

// ===== 2. TOAST NOTIFICATIONS =====
function showToast(message, type = 'success', duration = 3200) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    const icons = {
        success: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#22c55e" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>',
        error:   '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#ef4444" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>',
        info:    '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>',
    };

    toast.classList.remove('success', 'error', 'warning', 'info');
    toast.classList.add(type);
    if (toastIcon) toastIcon.innerHTML = icons[type] || icons.info;
    if (toastMessage) toastMessage.textContent = message;

    toast.style.display = 'block';

    if (window._toastTimeout) clearTimeout(window._toastTimeout);
    window._toastTimeout = setTimeout(() => {
        toast.style.display = 'none';
    }, duration);
}

// Alias para compatibilidade
window.showToast = showToast;
window.mostrarToast = showToast;

// Flash messages salvos em sessionStorage
document.addEventListener('DOMContentLoaded', () => {
    const message = sessionStorage.getItem('toastMessage');
    const type = sessionStorage.getItem('toastType');
    if (message) {
        showToast(message, type || 'success');
        sessionStorage.removeItem('toastMessage');
        sessionStorage.removeItem('toastType');
    }
});

// ===== 3. CONFIRM MODAL UNIVERSAL =====
const ConfirmModal = {
    modal: null,
    title: null,
    message: null,
    detail: null,
    cancelBtn: null,
    confirmBtn: null,
    closeBtn: null,
    resolvePromise: null,

    init() {
        this.modal = document.getElementById('confirmModal');
        if (!this.modal) return;

        this.title = document.getElementById('modalTitle');
        this.message = document.getElementById('modalMessage');
        this.detail = document.getElementById('modalDetail');
        this.cancelBtn = document.getElementById('modalCancel');
        this.confirmBtn = document.getElementById('modalConfirm');
        this.closeBtn = document.getElementById('modalClose');

        this.cancelBtn?.addEventListener('click', () => this.close(false));
        this.confirmBtn?.addEventListener('click', () => this.close(true));
        this.closeBtn?.addEventListener('click', () => this.close(false));
        this.modal.addEventListener('click', (e) => {
            if (e.target === this.modal) this.close(false);
        });

        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') {
                this.close(false);
            }
        });
    },

    open(options = {}) {
        if (!this.modal) this.init();
        if (!this.modal) return Promise.resolve(false);

        const { title = 'Confirmar Ação', message = '', detail = '' } = options;
        if (this.title) this.title.textContent = title;
        if (this.message) this.message.textContent = message;
        if (this.detail) {
            this.detail.textContent = detail;
            this.detail.style.display = detail ? 'block' : 'none';
        }

        this.modal.style.display = 'flex';
        setTimeout(() => this.modal.classList.add('active'), 10);
        document.body.style.overflow = 'hidden';

        return new Promise((resolve) => {
            this.resolvePromise = resolve;
        });
    },

    close(result) {
        if (!this.modal) return;
        this.modal.classList.remove('active');
        setTimeout(() => {
            this.modal.style.display = 'none';
            document.body.style.overflow = '';
        }, 200);

        if (this.resolvePromise) {
            this.resolvePromise(result);
            this.resolvePromise = null;
        }
    }
};

window.ConfirmModal = ConfirmModal;
document.addEventListener('DOMContentLoaded', () => ConfirmModal.init());

// Funções de confirmação de exclusão
window.confirmarExclusao = async (nomeArquivo, form) => {
    const result = await ConfirmModal.open({
        title: 'Excluir Arquivo',
        message: `Deseja mover "${nomeArquivo}" para a lixeira?`,
        detail: 'Você poderá restaurá-lo nos próximos 30 dias.'
    });

    if (result) {
        if (form && form.action) {
            executarExclusaoAjax(form.action, nomeArquivo, 'arquivo');
        } else if (form) {
            form.submit();
        }
    }
};

window.confirmarExclusaoPasta = async (nomePasta, form) => {
    const result = await ConfirmModal.open({
        title: 'Excluir Pasta',
        message: `Deseja mover a pasta "${nomePasta}" para a lixeira?`,
        detail: 'Todos os arquivos e subpastas serão movidos para a lixeira.'
    });

    if (result) {
        if (form && form.action) {
            executarExclusaoAjax(form.action, nomePasta, 'pasta');
        } else if (form) {
            form.submit();
        }
    }
};

async function executarExclusaoAjax(url, nomeItem, tipo = 'arquivo') {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'X-CSRFToken': getCsrfToken(),
                'X-Requested-With': 'XMLHttpRequest'
            }
        });

        if (response.ok) {
            showToast(`"${nomeItem}" movido para a lixeira.`, 'success');
            if (typeof atualizarLista === 'function') {
                atualizarLista();
            } else {
                setTimeout(() => window.location.reload(), 500);
            }
        } else {
            const erro = await response.text();
            showToast(`Erro ao excluir: ${erro}`, 'error');
        }
    } catch (error) {
        showToast('Erro de conexão ao excluir item', 'error');
    }
}

// ===== 4. SIDEBAR DRAWER MOBILE =====
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.getElementById('sidebar');
    const menuBtn = document.getElementById('mobile-menu-btn');
    const overlay = document.getElementById('sidebar-overlay');

    function openMenu() {
        if (!sidebar || !overlay) return;
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeMenu() {
        if (!sidebar || !overlay) return;
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = '';
    }

    menuBtn?.addEventListener('click', openMenu);
    overlay?.addEventListener('click', closeMenu);

    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (sidebar?.classList.contains('active')) closeMenu();
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && sidebar?.classList.contains('active')) {
            closeMenu();
        }
    });
});

// ===== 5. MODAL CRIAR PASTA =====
document.addEventListener('DOMContentLoaded', function () {
    const createFolderTrigger = document.getElementById('create-folder-trigger');
    const createFolderModal = document.getElementById('create-folder-modal');
    const closeFolderModal = document.getElementById('close-folder-modal');
    const cancelFolderModal = document.getElementById('cancel-folder-modal');

    function openFolderModal() {
        if (!createFolderModal) return;
        createFolderModal.style.display = 'flex';
        setTimeout(() => createFolderModal.classList.add('active'), 10);
        document.getElementById('nome_pasta')?.focus();
    }

    function closeFolderModalFn() {
        if (!createFolderModal) return;
        createFolderModal.classList.remove('active');
        setTimeout(() => {
            createFolderModal.style.display = 'none';
        }, 200);
    }

    createFolderTrigger?.addEventListener('click', openFolderModal);
    closeFolderModal?.addEventListener('click', closeFolderModalFn);
    cancelFolderModal?.addEventListener('click', closeFolderModalFn);
    createFolderModal?.addEventListener('click', (e) => {
        if (e.target === createFolderModal) closeFolderModalFn();
    });

    window.abrirModalCriarPasta = openFolderModal;
    window.fecharModalCriarPasta = closeFolderModalFn;
});

// ===== 6. UPLOADS (XHR PROGRESS & DRAG AND DROP) =====
const _uploadIconeMap = {
    pdf: 'file-text', jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', bmp: 'image',
    mp3: 'music', wav: 'music', ogg: 'music', m4a: 'music', flac: 'music',
    mp4: 'video', avi: 'video', mkv: 'video', mov: 'video',
    doc: 'file-text', docx: 'file-text', xls: 'bar-chart-2', xlsx: 'bar-chart-2',
    ppt: 'presentation', pptx: 'presentation',
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
    txt: 'file-text',
};

window.uploadFiles = function (files) {
    if (!files || files.length === 0) return;

    const panel = document.getElementById('upload-panel');
    const list = document.getElementById('upload-list');
    if (panel) panel.style.display = 'flex';

    const caminho = window.location.pathname.replace(/^\/explorar/, '') || '/';

    Array.from(files).forEach(file => {
        const ext = file.name.split('.').pop().toLowerCase();
        const iconName = _uploadIconeMap[ext] || 'file';

        const item = document.createElement('div');
        item.className = 'upload-item';
        item.innerHTML = `
            <div style="color: var(--primary); display: flex; align-items: center;">
                <i data-lucide="${iconName}" style="width:24px;height:24px;"></i>
            </div>
            <div class="upload-item-body">
                <div class="upload-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
                <div class="upload-progress-row">
                    <div class="upload-bar"><div class="upload-fill"></div></div>
                    <span class="upload-percent">0%</span>
                </div>
                <div class="upload-status">Enviando...</div>
            </div>
        `;
        if (list) list.appendChild(item);
        if (typeof lucide !== 'undefined') lucide.createIcons();

        const fill = item.querySelector('.upload-fill');
        const percent = item.querySelector('.upload-percent');
        const status = item.querySelector('.upload-status');

        const formData = new FormData();
        formData.append('arquivo', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', `/upload${caminho}`, true);
        xhr.setRequestHeader('X-CSRFToken', getCsrfToken());

        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const pct = Math.round((e.loaded / e.total) * 100);
                if (fill) fill.style.width = pct + '%';
                if (percent) percent.textContent = pct + '%';
            }
        });

        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 302) {
                if (fill) fill.style.width = '100%';
                if (percent) percent.textContent = '100%';
                if (status) status.textContent = 'Concluído ✓';
                item.classList.add('success');
                showToast(`"${file.name}" enviado com sucesso!`, 'success');
                setTimeout(() => {
                    if (typeof atualizarLista === 'function') atualizarLista();
                }, 400);
            } else if (xhr.status === 400) {
                if (status) status.textContent = 'Tipo não permitido';
                item.classList.add('error');
                showToast(`Tipo de arquivo não permitido: "${file.name}"`, 'error');
            } else if (xhr.status === 413) {
                if (status) status.textContent = 'Arquivo muito grande';
                item.classList.add('error');
                showToast(`"${file.name}" excede o limite de tamanho`, 'error');
            } else {
                if (status) status.textContent = 'Erro no envio';
                item.classList.add('error');
                showToast(`Erro ao enviar "${file.name}"`, 'error');
            }
        };

        xhr.onerror = () => {
            if (status) status.textContent = 'Erro de conexão';
            item.classList.add('error');
            showToast(`Erro de conexão ao enviar "${file.name}"`, 'error');
        };

        xhr.send(formData);
    });
};

window.fecharPainel = function () {
    const panel = document.getElementById('upload-panel');
    if (panel) panel.style.display = 'none';
};

// Disparar upload quando o input mudar
document.addEventListener('DOMContentLoaded', function () {
    const uploadInput = document.getElementById('arquivo');
    if (uploadInput) {
        uploadInput.addEventListener('change', function (e) {
            const files = e.target.files;
            if (files && files.length > 0) {
                window.uploadFiles(files);
                uploadInput.value = '';
            }
        });
    }
});

// ===== 7. HELPER HTML =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ===== 8. MENU NOVO NA SIDEBAR (GOOGLE DRIVE DESKTOP) =====
window.toggleNovoMenu = function (btn) {
    const dropdown = btn?.closest('.sidebar-action-container')?.querySelector('.novo-dropdown');
    if (!dropdown) return;
    const isOpen = dropdown.classList.contains('open');
    fecharNovoMenu();
    if (!isOpen) {
        dropdown.classList.add('open');
    }
};

window.fecharNovoMenu = function () {
    document.querySelectorAll('.novo-dropdown.open').forEach(el => el.classList.remove('open'));
};

document.addEventListener('click', (e) => {
    if (!e.target.closest('.sidebar-action-container')) {
        fecharNovoMenu();
    }
});