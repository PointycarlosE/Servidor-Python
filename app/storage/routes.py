# app/storage/routes.py
"""
Rotas para visualização e gerenciamento de armazenamento.
"""
from flask import Blueprint, render_template, jsonify, request
from flask_login import login_required, current_user

from .service import StorageService

storage_bp = Blueprint('storage', __name__)


@storage_bp.route('/armazenamento')
@login_required
def armazenamento_page():
    """Renderiza a página principal de gerenciamento de armazenamento."""
    stats = StorageService.get_storage_stats()
    return render_template('armazenamento.html', stats=stats)


@storage_bp.route('/api/storage/breakdown')
@login_required
def storage_breakdown_api():
    """Retorna JSON com as métricas detalhadas e maiores arquivos."""
    force = request.args.get('force', 'false').lower() == 'true'
    stats = StorageService.get_storage_stats(force_refresh=force)
    return jsonify({
        'success': True,
        'stats': stats
    })


@storage_bp.route('/api/storage/refresh', methods=['POST'])
@login_required
def storage_refresh_api():
    """Força a invalidação de cache e re-escaneamento do armazenamento."""
    StorageService.invalidate_cache()
    stats = StorageService.get_storage_stats(force_refresh=True)
    return jsonify({
        'success': True,
        'message': 'Armazenamento recalculado com sucesso',
        'stats': stats
    })
