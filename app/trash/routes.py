# app/trash/routes.py
"""
Rotas da lixeira - interface e API.
"""
import os
from flask import Blueprint, render_template, jsonify, request, redirect, url_for, flash
from flask_login import login_required, current_user

from app.trash import models as trash_models
from app.extensions import limiter
from app.utils.audit import (
    log_restored, log_permanently_deleted, log_trash_emptied
)

trash_bp = Blueprint('trash', __name__)


# ===== PÁGINA DA LIXEIRA =====

@trash_bp.route('/lixeira')
@login_required
def lixeira_page():
    """Página principal da lixeira."""
    # Listar itens do usuário
    itens = trash_models.listar_lixeira(usuario=current_user.username)

    # Calcular tamanho total
    tamanho_total = trash_models.tamanho_lixeira(usuario=current_user.username)

    # Formatar tamanho
    def formatar_tamanho(bytes_size):
        if bytes_size < 1024:
            return f"{bytes_size} B"
        elif bytes_size < 1024 * 1024:
            return f"{bytes_size / 1024:.1f} KB"
        elif bytes_size < 1024 * 1024 * 1024:
            return f"{bytes_size / (1024 * 1024):.1f} MB"
        else:
            return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"

    tamanho_formatado = formatar_tamanho(tamanho_total)

    return render_template(
        'lixeira.html',
        itens=itens,
        total_itens=len(itens),
        tamanho_total=tamanho_formatado
    )


# ===== API: LISTAR =====

@trash_bp.route('/api/trash/list')
@login_required
def listar():
    """Lista itens da lixeira via API."""
    try:
        itens = trash_models.listar_lixeira(usuario=current_user.username)

        return jsonify({
            'success': True,
            'items': itens,
            'total': len(itens)
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== API: RESTAURAR =====

@trash_bp.route('/api/trash/restore/<item_id>', methods=['POST'])
@login_required
@limiter.limit("30 per minute")
def restaurar(item_id):
    """Restaura um item da lixeira."""
    try:
        sucesso, mensagem = trash_models.restaurar_item(item_id, current_user.username)

        if sucesso:
            # Log de auditoria
            log_restored(current_user.username, mensagem)
            return jsonify({'success': True, 'message': mensagem})

        return jsonify({'error': mensagem}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== API: REMOVER PERMANENTEMENTE =====

@trash_bp.route('/api/trash/delete/<item_id>', methods=['POST'])
@login_required
@limiter.limit("30 per minute")
def deletar(item_id):
    """Remove permanentemente um item da lixeira."""
    try:
        sucesso, mensagem = trash_models.remover_permanentemente(item_id, current_user.username)

        if sucesso:
            # Log de auditoria
            log_permanently_deleted(current_user.username, mensagem)
            return jsonify({'success': True, 'message': mensagem})

        return jsonify({'error': mensagem}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== API: ESVAZIAR LIXEIRA =====

@trash_bp.route('/api/trash/empty', methods=['POST'])
@login_required
@limiter.limit("10 per minute")
def esvaziar():
    """Esvazia toda a lixeira do usuário."""
    try:
        sucesso, mensagem, quantidade = trash_models.esvaziar_lixeira(current_user.username)

        if sucesso:
            # Log de auditoria
            log_trash_emptied(current_user.username, quantidade)
            return jsonify({
                'success': True,
                'message': mensagem,
                'removed_count': quantidade
            })

        return jsonify({'error': mensagem}), 400

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== API: CONTAR ITENS =====

@trash_bp.route('/api/trash/count')
@login_required
def contar():
    """Retorna a quantidade de itens na lixeira do usuário."""
    try:
        quantidade = trash_models.contar_itens(usuario=current_user.username)

        return jsonify({
            'success': True,
            'count': quantidade
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== API: RESTAURAR MÚLTIPLOS =====

@trash_bp.route('/api/trash/restore-multiple', methods=['POST'])
@login_required
@limiter.limit("10 per minute")
def restaurar_multiplos():
    """Restaura múltiplos itens da lixeira."""
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({'error': 'Dados inválidos'}), 400

        item_ids = dados.get('items', [])
        if not item_ids:
            return jsonify({'error': 'Nenhum item selecionado'}), 400

        if len(item_ids) > 100:
            return jsonify({'error': 'Máximo de 100 itens por operação'}), 400

        sucessos = 0
        erros = []

        for item_id in item_ids:
            sucesso, mensagem = trash_models.restaurar_item(item_id, current_user.username)
            if sucesso:
                sucessos += 1
                log_restored(current_user.username, mensagem)
            else:
                erros.append(mensagem)

        return jsonify({
            'success': True,
            'restored': sucessos,
            'errors': erros,
            'message': f"{sucessos} item(s) restaurado(s)"
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


# ===== API: DELETAR MÚLTIPLOS PERMANENTEMENTE =====

@trash_bp.route('/api/trash/delete-multiple', methods=['POST'])
@login_required
@limiter.limit("10 per minute")
def deletar_multiplos():
    """Remove permanentemente múltiplos itens da lixeira."""
    try:
        dados = request.get_json()
        if not dados:
            return jsonify({'error': 'Dados inválidos'}), 400

        item_ids = dados.get('items', [])
        if not item_ids:
            return jsonify({'error': 'Nenhum item selecionado'}), 400

        if len(item_ids) > 100:
            return jsonify({'error': 'Máximo de 100 itens por operação'}), 400

        sucessos = 0
        erros = []

        for item_id in item_ids:
            sucesso, mensagem = trash_models.remover_permanentemente(item_id, current_user.username)
            if sucesso:
                sucessos += 1
                log_permanently_deleted(current_user.username, mensagem)
            else:
                erros.append(mensagem)

        return jsonify({
            'success': True,
            'deleted': sucessos,
            'errors': erros,
            'message': f"{sucessos} item(s) removido(s) permanentemente"
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500
