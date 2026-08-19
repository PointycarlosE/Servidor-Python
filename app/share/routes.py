"""
Rotas de compartilhamento de arquivos
"""
import os
import logging
from flask import Blueprint, request, jsonify, render_template, send_file, abort, flash, redirect, url_for
from flask_login import login_required, current_user
from werkzeug.utils import secure_filename
from app.share import models as share_models
from app.config import PASTA_BASE
from app.extensions import limiter
from app.routes.files import caminho_seguro
from app.utils.audit import log_download
import time

share_bp = Blueprint('share', __name__)

# Logger para compartilhamento
logger = logging.getLogger(__name__)

def log_share_action(action: str, user: str, file_path: str, details: str = ''):
    """Log de ações de compartilhamento"""
    msg = f"[SHARE] {action} | User: {user} | File: {file_path}"
    if details:
        msg += f" | {details}"
    logger.info(msg)


# ==================== ROTAS PARA USUÁRIOS LOGADOS ====================

@share_bp.route('/api/share/create', methods=['POST'])
@login_required
@limiter.limit("20 per minute")
def create_share():
    """Cria um novo link de compartilhamento"""
    try:
        data = request.get_json()
        file_path = data.get('file_path')
        expires_in_hours = data.get('expires_in_hours')
        password = data.get('password')

        if not file_path:
            return jsonify({'error': 'Caminho do arquivo não fornecido'}), 400

        # Validar caminho e verificar se arquivo existe
        full_path = caminho_seguro(file_path)

        if not full_path:
            return jsonify({'error': 'Caminho inválido'}), 400

        if not os.path.isfile(full_path):
            return jsonify({'error': 'Arquivo não encontrado'}), 404

        # Criar link
        link = share_models.criar_link(
            file_path=file_path,
            created_by=current_user.username,
            expires_in_hours=expires_in_hours,
            password=password
        )

        # Log de auditoria
        log_share_action(
            'CREATE',
            current_user.username,
            file_path,
            f"Token: {link.token}, Expira: {expires_in_hours or 'nunca'}h"
        )

        return jsonify({
            'success': True,
            'link': {
                'id': link.id,
                'token': link.token,
                'url': f'/s/{link.token}',
                'expires_at': link.expires_at,
                'has_password': link.tem_senha
            }
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@share_bp.route('/api/share/list', methods=['GET'])
@login_required
def list_shares():
    """Lista todos os links do usuário"""
    try:
        links = share_models.listar_links_usuario(current_user.username)

        links_data = []
        for link in links:
            # Pegar nome do arquivo
            filename = os.path.basename(link.file_path)

            # Calcular tempo restante
            tempo_restante = None
            if link.expires_at:
                segundos = link.expires_at - time.time()
                if segundos > 0:
                    if segundos < 3600:  # Menos de 1 hora
                        tempo_restante = f"{int(segundos / 60)}min"
                    elif segundos < 86400:  # Menos de 1 dia
                        tempo_restante = f"{int(segundos / 3600)}h"
                    else:  # Dias
                        tempo_restante = f"{int(segundos / 86400)}d"
                else:
                    tempo_restante = "Expirado"

            links_data.append({
                'id': link.id,
                'token': link.token,
                'filename': filename,
                'file_path': link.file_path,
                'url': f'/s/{link.token}',
                'created_at': link.created_at,
                'expires_at': link.expires_at,
                'tempo_restante': tempo_restante,
                'has_password': link.tem_senha,
                'downloads_count': link.downloads_count,
                'last_accessed': link.last_accessed,
                'is_active': link.is_active,
                'is_expired': link.esta_expirado()
            })

        # Ordenar por data de criação (mais recentes primeiro)
        links_data.sort(key=lambda x: x['created_at'], reverse=True)

        return jsonify({'success': True, 'links': links_data})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@share_bp.route('/api/share/revoke/<link_id>', methods=['POST'])
@login_required
@limiter.limit("30 per minute")
def revoke_share(link_id):
    """Revoga um link de compartilhamento"""
    try:
        success = share_models.revogar_link(link_id, current_user.username)

        if not success:
            return jsonify({'error': 'Link não encontrado ou sem permissão'}), 404

        link = share_models.buscar_por_id(link_id)
        if link:
            log_share_action(
                'REVOKE',
                current_user.username,
                link.file_path,
                f"Token: {link.token}"
            )

        return jsonify({'success': True, 'message': 'Link revogado com sucesso'})

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@share_bp.route('/compartilhamentos')
@login_required
def compartilhamentos_page():
    """Página de gerenciamento de compartilhamentos"""
    return render_template('compartilhamentos.html')


# ==================== ROTAS PÚBLICAS (SEM LOGIN) ====================

@share_bp.route('/s/<token>')
@limiter.limit("30 per minute")
def public_share(token):
    """Página pública de compartilhamento"""
    link = share_models.buscar_por_token(token)

    if not link:
        abort(404)

    if not link.esta_valido():
        return render_template('share_expired.html'), 410

    # Verificar se arquivo ainda existe
    full_path = os.path.join(PASTA_BASE, link.file_path)
    if not os.path.isfile(full_path):
        return render_template('share_not_found.html'), 404

    filename = os.path.basename(link.file_path)
    filesize = os.path.getsize(full_path)

    # Formatar tamanho
    if filesize < 1024:
        size_str = f"{filesize}B"
    elif filesize < 1024 * 1024:
        size_str = f"{filesize / 1024:.1f}KB"
    elif filesize < 1024 * 1024 * 1024:
        size_str = f"{filesize / (1024 * 1024):.1f}MB"
    else:
        size_str = f"{filesize / (1024 * 1024 * 1024):.2f}GB"

    # Detectar tipo de arquivo
    ext = os.path.splitext(filename)[1].lower()
    file_type = 'file'
    if ext in ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.bmp']:
        file_type = 'image'
    elif ext in ['.mp4', '.webm', '.ogg', '.mov']:
        file_type = 'video'
    elif ext in ['.mp3', '.wav', '.ogg', '.m4a']:
        file_type = 'audio'
    elif ext == '.pdf':
        file_type = 'pdf'

    # Calcular tempo de expiração
    expires_text = None
    if link.expires_at:
        segundos = link.expires_at - time.time()
        if segundos > 0:
            if segundos < 3600:
                expires_text = f"em {int(segundos / 60)} minutos"
            elif segundos < 86400:
                expires_text = f"em {int(segundos / 3600)} horas"
            else:
                expires_text = f"em {int(segundos / 86400)} dias"

    return render_template(
        'share_public.html',
        token=token,
        filename=filename,
        size=size_str,
        file_type=file_type,
        has_password=link.tem_senha,
        expires_text=expires_text,
        shared_by=link.created_by
    )


@share_bp.route('/s/<token>/download', methods=['POST'])
@limiter.limit("10 per minute")
def download_shared(token):
    """Download de arquivo compartilhado"""
    link = share_models.buscar_por_token(token)

    if not link or not link.esta_valido():
        return jsonify({'error': 'Link inválido ou expirado'}), 404

    # Verificar senha se necessário
    if link.tem_senha:
        data = request.get_json()
        password = data.get('password', '')

        if not link.verificar_senha(password):
            return jsonify({'error': 'Senha incorreta'}), 401

    # Verificar se arquivo existe
    full_path = os.path.join(PASTA_BASE, link.file_path)
    if not os.path.isfile(full_path):
        return jsonify({'error': 'Arquivo não encontrado'}), 404

    # Registrar acesso
    link.registrar_acesso()

    # Log
    log_share_action(
        'DOWNLOAD',
        'anonymous',
        link.file_path,
        f"Token: {token}, IP: {request.remote_addr}"
    )

    # Enviar arquivo
    filename = os.path.basename(link.file_path)
    return send_file(
        full_path,
        as_attachment=True,
        download_name=filename
    )


@share_bp.route('/s/<token>/verify-password', methods=['POST'])
@limiter.limit("10 per minute")
def verify_password(token):
    """Verifica senha antes de mostrar botão de download"""
    link = share_models.buscar_por_token(token)

    if not link or not link.esta_valido():
        return jsonify({'error': 'Link inválido'}), 404

    data = request.get_json()
    password = data.get('password', '')

    if link.verificar_senha(password):
        return jsonify({'success': True})
    else:
        return jsonify({'error': 'Senha incorreta'}), 401
