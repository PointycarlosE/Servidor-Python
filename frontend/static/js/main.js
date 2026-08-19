// ===== CSRF TOKEN =====
function getCsrfToken() {
    const meta = document.querySelector('meta[name="csrf-token"]');
    return meta ? meta.getAttribute('content') : '';
}

// ===== TOAST NOTIFICATION =====
function showToast(message, type = 'success', duration = 3000) {
    const toast = document.getElementById('toast');
    if (!toast) return;

    const toastIcon = document.getElementById('toast-icon');
    const toastMessage = document.getElementById('toast-message');

    // Ícones SVG inline por tipo
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

    setTimeout(() => { toast.style.display = 'none'; }, duration);
}

// ===== MODAL PERSONALIZADO =====
const ConfirmModal = {
    modal: document.getElementById('confirmModal'),
    title: document.getElementById('modalTitle'),
    message: document.getElementById('modalMessage'),
    detail: document.getElementById('modalDetail'),
    cancelBtn: document.getElementById('modalCancel'),
    confirmBtn: document.getElementById('modalConfirm'),
    closeBtn: document.getElementById('modalClose'),
    resolvePromise: null,

    init() {
        if (!this.modal) return;
        this.cancelBtn?.addEventListener('click', () => this.close(false));
        this.confirmBtn?.addEventListener('click', () => this.close(true));
        this.closeBtn?.addEventListener('click', () => this.close(false));
        this.modal.addEventListener('click', (e) => { if (e.target === this.modal) this.close(false); });
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && this.modal.style.display === 'flex') this.close(false);
        });
    },

    open(options = {}) {
        const { title = 'Confirmar exclusão', message = '', detail = '' } = options;
        this.title.textContent = title;
        this.message.textContent = message;
        this.detail.textContent = detail;
        this.detail.style.display = detail ? 'block' : 'none';
        this.modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        return new Promise((resolve) => { this.resolvePromise = resolve; });
    },

    close(result) {
        this.modal.style.display = 'none';
        document.body.style.overflow = '';
        if (this.resolvePromise) {
            this.resolvePromise(result);
            this.resolvePromise = null;
        }
    }
};

document.addEventListener('DOMContentLoaded', () => ConfirmModal.init());

// Exclusão via AJAX
async function executarExclusaoAjax(url, nomeItem, tipo = 'arquivo') {
    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'X-CSRFToken': getCsrfToken(), 'X-Requested-With': 'XMLHttpRequest' }
        });
        if (response.ok) {
            showToast(`"${nomeItem}" excluído com sucesso!`, 'success');
            if (typeof atualizarLista === 'function') atualizarLista();
            else window.location.reload();
        } else {
            const erro = await response.text();
            showToast(`Erro ao excluir: ${erro}`, 'error');
        }
    } catch (error) {
        showToast('Erro de conexão ao excluir item', 'error');
    }
}

window.confirmarExclusao = async (nomeArquivo, form) => {
    const result = await ConfirmModal.open({
        title: 'Excluir arquivo',
        message: `Tem certeza que deseja excluir o arquivo "${nomeArquivo}"?`,
        detail: 'Esta ação não pode ser desfeita.'
    });
    if (result) {
        if (form && form.action) executarExclusaoAjax(form.action, nomeArquivo, 'arquivo');
        else { sessionStorage.setItem('toastMessage', `"${nomeArquivo}" excluído com sucesso!`); sessionStorage.setItem('toastType', 'success'); form.submit(); }
    }
};

window.confirmarExclusaoPasta = async (nomePasta, form) => {
    const result = await ConfirmModal.open({
        title: 'Excluir pasta',
        message: `Tem certeza que deseja excluir a pasta "${nomePasta}"?`,
        detail: 'ATENÇÃO! TODOS os arquivos dentro dela serão apagados permanentemente.'
    });
    if (result) {
        if (form && form.action) executarExclusaoAjax(form.action, nomePasta, 'pasta');
        else { sessionStorage.setItem('toastMessage', `"${nomePasta}" excluída com sucesso!`); sessionStorage.setItem('toastType', 'success'); form.submit(); }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    const message = sessionStorage.getItem('toastMessage');
    const type = sessionStorage.getItem('toastType');
    if (message) {
        showToast(message, type || 'success');
        sessionStorage.removeItem('toastMessage');
        sessionStorage.removeItem('toastType');
    }
});

// ===== GERENCIAMENTO DO MENU MOBILE (SIDEBAR) =====
document.addEventListener('DOMContentLoaded', function () {
    const sidebar = document.querySelector('.sidebar');
    const menuBtn = document.getElementById('mobile-menu-btn');
    
    // Cria o overlay dinamicamente se não existir
    let overlay = document.querySelector('.sidebar-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'sidebar-overlay';
        document.body.appendChild(overlay);
    }

    function openMenu() {
        if (!sidebar || !overlay) return; // Garante que os elementos existem
        sidebar.classList.add('active');
        overlay.classList.add('active');
        document.body.style.overflow = 'hidden'; // Bloqueia a rolagem do corpo
    }

    function closeMenu() {
        if (!sidebar || !overlay) return; // Garante que os elementos existem
        sidebar.classList.remove('active');
        overlay.classList.remove('active');
        document.body.style.overflow = ''; // Restaura a rolagem do corpo
    }

    menuBtn?.addEventListener('click', openMenu);
    overlay?.addEventListener('click', closeMenu);

    // Fecha ao clicar em itens de navegação (útil para links internos)
    document.querySelectorAll('.nav-item').forEach(item => {
        item.addEventListener('click', () => {
            if (sidebar?.classList.contains('active')) closeMenu();
        });
    });

    // Fecha com a tecla Escape
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && sidebar?.classList.contains('active')) {
            closeMenu();
        }
    });
});

// ===== MODAL CRIAR PASTA =====
document.addEventListener('DOMContentLoaded', function () {
    const createFolderTrigger = document.getElementById('create-folder-trigger');
    const createFolderModal = document.getElementById('create-folder-modal');
    const closeFolderModal = document.getElementById('close-folder-modal');
    const cancelFolderModal = document.getElementById('cancel-folder-modal');
    const closeModal = () => { if (createFolderModal) createFolderModal.style.display = 'none'; };
    if (createFolderTrigger) createFolderTrigger.addEventListener('click', () => { if (createFolderModal) createFolderModal.style.display = 'flex'; });
    if (closeFolderModal) closeFolderModal.addEventListener('click', closeModal);
    if (cancelFolderModal) cancelFolderModal.addEventListener('click', closeModal);
    if (createFolderModal) createFolderModal.addEventListener('click', (e) => { if (e.target === createFolderModal) closeModal(); });
});

// ===== UPLOAD DE ARQUIVOS =====
const _uploadIconeMap = {
    pdf: 'file-text', jpg: 'image', jpeg: 'image', png: 'image', gif: 'image', webp: 'image', bmp: 'image',
    mp3: 'music', wav: 'music', ogg: 'music', m4a: 'music', flac: 'music',
    mp4: 'video', avi: 'video', mkv: 'video', mov: 'video',
    doc: 'file-text', docx: 'file-text', xls: 'bar-chart-2', xlsx: 'bar-chart-2',
    ppt: 'presentation', pptx: 'presentation',
    zip: 'archive', rar: 'archive', '7z': 'archive', tar: 'archive', gz: 'archive',
    txt: 'file-text',
};

function _getUploadIconeSvg(nomeArquivo) {
    const ext = nomeArquivo.split('.').pop().toLowerCase();
    const lucideIcon = _uploadIconeMap[ext] || 'file';
    return `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-${lucideIcon}" style="color:var(--primary);"><use href="#lucide-${lucideIcon}"/></svg>
    <i data-lucide="${lucideIcon}" style="width:24px;height:24px;color:var(--primary);"></i>`;
}

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
            <div class="upload-item-icon">
                <i data-lucide="${iconName}" style="width:24px;height:24px;color:var(--primary);"></i>
            </div>
            <div class="upload-item-body">
                <div class="upload-name" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</div>
                <div class="upload-progress-row">
                    <div class="upload-bar"><div class="upload-fill"></div></div>
                    <span class="upload-percent">0%</span>
                </div>
                <div class="upload-status">Aguardando...</div>
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
                if (status) status.textContent = 'Enviando...';
            }
        });

        xhr.onload = () => {
            if (xhr.status === 200 || xhr.status === 302) {
                if (fill) fill.style.width = '100%';
                if (percent) percent.textContent = '100%';
                if (status) status.textContent = 'Concluído ✓';
                item.classList.add('success');
                showToast(`"${file.name}" enviado com sucesso!`, 'success');
                setTimeout(() => { if (typeof atualizarLista === 'function') atualizarLista(); }, 500);
            } else if (xhr.status === 400) {
                if (percent) percent.textContent = '';
                if (status) status.textContent = 'Tipo não permitido';
                item.classList.add('error');
                showToast(`Tipo de arquivo não permitido: "${file.name}"`, 'error');
            } else if (xhr.status === 413) {
                if (percent) percent.textContent = '';
                if (status) status.textContent = 'Arquivo muito grande';
                item.classList.add('error');
                showToast(`"${file.name}" excede o limite de tamanho`, 'error');
            } else {
                if (percent) percent.textContent = '';
                if (status) status.textContent = 'Erro no envio';
                item.classList.add('error');
                showToast(`Erro ao enviar "${file.name}"`, 'error');
            }
        };

        xhr.onerror = () => {
            if (percent) percent.textContent = '';
            if (status) status.textContent = 'Erro de conexão';
            item.classList.add('error');
            showToast(`Erro de conexão ao enviar "${file.name}"`, 'error');
        };

        xhr.send(formData);
    });
};

// ===== UPLOAD VIA BOTÃO =====
document.addEventListener('DOMContentLoaded', function () {
    setTimeout(function () {
        const uploadInput = document.getElementById('arquivo');
        const uploadBtn = document.querySelector('.upload-btn');
        if (uploadInput) {
            uploadInput.addEventListener('change', function (e) {
                const files = e.target.files;
                if (files && files.length > 0) { window.uploadFiles(files); uploadInput.value = ''; }
            });
        }
        if (uploadBtn && uploadInput) {
            const newBtn = uploadBtn.cloneNode(true);
            uploadBtn.parentNode.replaceChild(newBtn, uploadBtn);
            newBtn.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); uploadInput.click(); });
        }
    }, 100);
});

// ===== HELPER =====
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}