# app/routes/files.py
import os
import shutil
import zipfile
import tempfile
import mimetypes
from flask import (
    render_template, abort, redirect, url_for,
    request, send_from_directory, send_file, Blueprint, current_app,
    after_this_request, jsonify
)
from werkzeug.utils import secure_filename
from flask_login import current_user

from app.config import PASTA_BASE, MAX_ZIP_FILES, MAX_ZIP_SIZE_MB, MAX_FILE_SIZE_MB
from app.config import RATELIMIT_UPLOAD, RATELIMIT_DELETE, RATELIMIT_ZIP, BLOCKED_EXTENSIONS_SET, ITEMS_PER_PAGE
from app.extensions import limiter
from app.utils.helpers import get_info_arquivo
from app.auth.decorators import login_required_optional
from app.utils.audit import (
    log_upload, log_upload_bloqueado, log_download,
    log_delete, log_acesso_negado, log_path_traversal, log_zip_bloqueado,
    log_moved_to_trash
)
from app.trash import mover_para_lixeira
from app.share.models import revogar_links_por_caminho

file_bp = Blueprint('file', __name__)


# ===== HELPER: VALIDAÇÃO DE CAMINHO =====
def caminho_seguro(caminho_relativo: str) -> str | None:
    """
    Resolve o caminho relativo dentro de PASTA_BASE.
    Retorna o caminho real absoluto se for seguro, None se for path traversal.
    Usa realpath para bloquear escapes por symlink.
    """
    try:
        pasta_base_real = os.path.realpath(PASTA_BASE)
        caminho_real = os.path.realpath(os.path.join(pasta_base_real, caminho_relativo))

        if os.path.commonpath([pasta_base_real, caminho_real]) != pasta_base_real:
            return None
        return caminho_real
    except (ValueError, TypeError):
        return None


# ===== VALIDAÇÃO DE EXTENSÃO BLOQUEADA =====
def extensao_bloqueada(nome_arquivo: str) -> bool:
    """
    Verifica se a extensão do arquivo está na lista de bloqueados.
    A lista é configurável via .env (BLOCKED_EXTENSIONS).

    Por padrão, bloqueia apenas extensões executáveis no servidor:
    .php, .cgi, .sh, .bat, .exe, etc.

    Arquivos como .py, .js são permitidos para backup de código.
    """
    nome_lower = os.path.basename(nome_arquivo.lower())

    # Verifica se o nome completo está bloqueado (ex: .htaccess)
    if nome_lower in BLOCKED_EXTENSIONS_SET:
        return True

    # Verifica extensão
    _, ext = os.path.splitext(nome_lower)
    return ext in BLOCKED_EXTENSIONS_SET


# ===== HELPER: CLASSIFICAR ITENS =====
EXTENSOES_IMAGENS = ('.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp')
EXTENSOES_AUDIO = ('.mp3', '.wav', '.ogg', '.m4a', '.flac')
EXTENSOES_PDF = ('.pdf',)


def classificar_itens(pasta_atual, limit=None, offset=0):
    """
    Classifica os itens de uma pasta em categorias.

    Args:
        pasta_atual: Caminho da pasta para listar
        limit: Quantidade máxima de itens a retornar (None = todos)
        offset: Quantos itens pular no início

    Returns:
        Tupla (pastas, arquivos, imagens, audios, pdfs, total_count)
    """
    pastas, arquivos, imagens, audios, pdfs = [], [], [], [], []

    # Lista todos os itens primeiro para contar o total
    todos_itens = sorted(os.listdir(pasta_atual))
    total_count = len(todos_itens)

    # Aplica paginação se solicitada
    if limit is not None:
        todos_itens = todos_itens[offset:offset + limit]

    for item in todos_itens:
        caminho_item = os.path.join(pasta_atual, item)
        item_info = get_info_arquivo(caminho_item, item)

        if os.path.isdir(caminho_item):
            item_info['tamanho_formatado'] = '--'
            pastas.append(item_info)
        else:
            nome_lower = item.lower()
            if nome_lower.endswith(EXTENSOES_IMAGENS):
                imagens.append(item_info)
            elif nome_lower.endswith(EXTENSOES_AUDIO):
                audios.append(item_info)
            elif nome_lower.endswith(EXTENSOES_PDF):
                pdfs.append(item_info)
            else:
                arquivos.append(item_info)

    return pastas, arquivos, imagens, audios, pdfs, total_count


# ===== EXPLORADOR =====
@file_bp.route('/explorar/')
@file_bp.route('/explorar/<path:caminho>')
@login_required_optional
def explorar(caminho=""):
    try:
        pasta_atual = caminho_seguro(caminho)

        if pasta_atual is None:
            log_path_traversal(caminho)
            abort(403)

        if not os.path.exists(pasta_atual):
            return render_template("erro.html", mensagem="Pasta não encontrada."), 404

        if not os.path.isdir(pasta_atual):
            return render_template("erro.html", mensagem="O caminho não é uma pasta."), 400

        # Paginação: carrega apenas ITEMS_PER_PAGE itens inicialmente
        pastas, arquivos, imagens, audios, pdfs, total_count = classificar_itens(
            pasta_atual,
            limit=ITEMS_PER_PAGE,
            offset=0
        )

        pasta_pai = os.path.dirname(caminho) if caminho else None

        partes = []
        if caminho:
            caminho_acumulado = ""
            for parte in caminho.split('/'):
                if parte:
                    caminho_acumulado = parte if not caminho_acumulado else f"{caminho_acumulado}/{parte}"
                    partes.append({'nome': parte, 'caminho': caminho_acumulado})

        return render_template(
            'explorar.html',
            pastas=pastas,
            arquivos=arquivos,
            imagens=imagens,
            audios=audios,
            pdfs=pdfs,
            caminho=caminho,
            caminho_atual=caminho,
            pasta_pai=pasta_pai,
            partes=partes,
            total_count=total_count,
            items_per_page=ITEMS_PER_PAGE
        )

    except PermissionError:
        return render_template("erro.html", mensagem="Acesso negado."), 403
    except Exception:
        current_app.logger.exception("Erro inesperado ao explorar pasta: %s", caminho)
        return render_template("erro.html", mensagem="Erro inesperado."), 500


# ===== LISTA PARCIAL (AJAX) =====
@file_bp.route('/partial/lista/<path:caminho>')
@file_bp.route('/partial/lista/', defaults={'caminho': ''})
@login_required_optional
def lista_parcial(caminho=""):
    pasta_atual = caminho_seguro(caminho)

    if pasta_atual is None:
        log_path_traversal(caminho)
        abort(403)

    if not os.path.exists(pasta_atual) or not os.path.isdir(pasta_atual):
        abort(404)

    # Suporte para paginação via query params
    offset = int(request.args.get('offset', 0))
    limit = int(request.args.get('limit', ITEMS_PER_PAGE))

    pastas, arquivos, imagens, audios, pdfs, _ = classificar_itens(
        pasta_atual,
        limit=limit,
        offset=offset
    )

    return render_template(
        'partials/_lista_arquivos.html',
        pastas=pastas,
        arquivos=arquivos,
        imagens=imagens,
        audios=audios,
        pdfs=pdfs,
        caminho=caminho
    )


# ===== DOWNLOAD INDIVIDUAL =====
@file_bp.route('/download/<path:caminho_arquivo>')
@login_required_optional
def download(caminho_arquivo):
    caminho_completo = caminho_seguro(caminho_arquivo)

    if caminho_completo is None:
        log_path_traversal(caminho_arquivo)
        abort(403)

    if not os.path.exists(caminho_completo) or not os.path.isfile(caminho_completo):
        abort(404)

    log_download(current_user.username, caminho_arquivo)
    pasta = os.path.dirname(caminho_completo)
    nome_arquivo = os.path.basename(caminho_completo)
    return send_from_directory(pasta, nome_arquivo, as_attachment=True)


# ===== VISUALIZAR ARQUIVO =====
@file_bp.route('/visualizar/<path:caminho_arquivo>')
@login_required_optional
def visualizar_arquivo(caminho_arquivo):
    caminho_completo = caminho_seguro(caminho_arquivo)

    if caminho_completo is None:
        log_path_traversal(caminho_arquivo)
        abort(403)

    if not os.path.exists(caminho_completo) or not os.path.isfile(caminho_completo):
        abort(404)

    pasta = os.path.dirname(caminho_completo)
    nome_arquivo = os.path.basename(caminho_completo)
    return send_from_directory(pasta, nome_arquivo, as_attachment=False)


# ===== UPLOAD =====
@file_bp.route('/upload/<path:caminho>', methods=['POST'])
@file_bp.route('/upload/', defaults={'caminho': ''}, methods=['POST'])
@limiter.limit(RATELIMIT_UPLOAD)
@login_required_optional
def upload(caminho):
    pasta_destino = caminho_seguro(caminho)

    if pasta_destino is None:
        log_path_traversal(caminho)
        abort(403)

    if not os.path.exists(pasta_destino) or not os.path.isdir(pasta_destino):
        abort(400)

    if 'arquivo' not in request.files:
        msg = "Nenhum arquivo enviado"
        return jsonify(erro=msg) if request.is_json else (msg, 400)

    arquivos = request.files.getlist('arquivo')
    if not arquivos or arquivos[0].filename == '':
        msg = "Nenhum arquivo válido"
        return jsonify(erro=msg) if request.is_json else (msg, 400)

    usuario = current_user.username
    max_file_bytes = MAX_FILE_SIZE_MB * 1024 * 1024

    for arquivo in arquivos:
        if arquivo.filename == '':
            continue

        # Validação de tamanho individual
        arquivo.seek(0, os.SEEK_END)
        tamanho = arquivo.tell()
        arquivo.seek(0)
        if tamanho > max_file_bytes:
            log_upload_bloqueado(usuario, arquivo.filename, f'excedeu limite individual {MAX_FILE_SIZE_MB}MB')
            return jsonify(erro=f"Arquivo {arquivo.filename} muito grande. Máx: {MAX_FILE_SIZE_MB}MB"), 413

        nome_seguro = secure_filename(arquivo.filename)

        if not nome_seguro:
            log_upload_bloqueado(usuario, arquivo.filename, 'nome inválido após sanitização')
            continue

        if extensao_bloqueada(nome_seguro):
            log_upload_bloqueado(usuario, nome_seguro, 'extensão bloqueada')
            msg = f"Tipo de arquivo não permitido: {os.path.splitext(nome_seguro)[1]}"
            return jsonify(erro=msg) if request.is_json else (msg, 400)

        # Validação básica de MIME para imagens/audios/vídeos (pode ser expandido no futuro)
        _ = mimetypes.guess_type(nome_seguro)  # Por enquanto apenas registramos

        caminho_final = os.path.join(pasta_destino, nome_seguro)

        contador = 1
        nome_base, extensao = os.path.splitext(nome_seguro)
        while os.path.exists(caminho_final):
            novo_nome = f"{nome_base}_{contador}{extensao}"
            caminho_final = os.path.join(pasta_destino, novo_nome)
            contador += 1

            # Prevenção extra de race conditions e loop infinito
            if contador > 1000:
                import time
                timestamp = int(time.time() * 1000)
                novo_nome = f"{nome_base}_{timestamp}{extensao}"
                caminho_final = os.path.join(pasta_destino, novo_nome)
                break

        # Tenta salvar lidando com race condition (outro processo/thread criá-lo neste microsegundo)
        try:
            arquivo.save(caminho_final)
        except Exception:
            import time
            timestamp = int(time.time() * 1000)
            novo_nome = f"{nome_base}_{timestamp}{extensao}"
            caminho_final = os.path.join(pasta_destino, novo_nome)
            arquivo.save(caminho_final)

        log_upload(usuario, caminho, os.path.basename(caminho_final))

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json:
        return jsonify(sucesso=True, mensagem="Upload concluído")
    return redirect(url_for('file.explorar', caminho=caminho))


# ===== CRIAR PASTA =====
@file_bp.route('/criar_pasta/<path:caminho>', methods=['POST'])
@file_bp.route('/criar_pasta/', defaults={'caminho': ''}, methods=['POST'])
@limiter.limit(RATELIMIT_DELETE)
@login_required_optional
def criar_pasta(caminho):
    pasta_atual = caminho_seguro(caminho)

    if pasta_atual is None:
        log_path_traversal(caminho)
        abort(403)

    if not os.path.exists(pasta_atual) or not os.path.isdir(pasta_atual):
        abort(400)

    nome_pasta = request.form.get('nome_pasta', '').strip()
    if not nome_pasta:
        return "Nome da pasta inválido", 400

    nome_seguro = secure_filename(nome_pasta)
    if not nome_seguro:
        return "Nome da pasta inválido após sanitização", 400

    nova_pasta = os.path.join(pasta_atual, nome_seguro)

    if caminho_seguro(os.path.relpath(nova_pasta, os.path.realpath(PASTA_BASE))) is None:
        abort(403)

    try:
        os.mkdir(nova_pasta)
    except FileExistsError:
        return "A pasta já existe", 400
    except PermissionError:
        return "Sem permissão", 403

    return redirect(url_for('file.explorar', caminho=caminho))


# ===== DELETAR ARQUIVO =====
@file_bp.route('/deletar/<path:caminho_arquivo>', methods=['POST'])
@limiter.limit(RATELIMIT_DELETE)
@login_required_optional
def deletar_arquivo(caminho_arquivo):
    caminho_completo = caminho_seguro(caminho_arquivo)

    if caminho_completo is None:
        log_path_traversal(caminho_arquivo)
        abort(403)

    if not os.path.exists(caminho_completo) or not os.path.isfile(caminho_completo):
        return "Arquivo não encontrado", 404

    try:
        # Mover para lixeira em vez de remover permanentemente
        item_id = mover_para_lixeira(
            caminho_relativo=caminho_arquivo,
            caminho_absoluto=caminho_completo,
            usuario=current_user.username
        )

        if item_id is None:
            return "Erro ao mover arquivo para a lixeira", 500

        # Revogar links de compartilhamento ativos desse arquivo
        revogados = revogar_links_por_caminho(caminho_arquivo, current_user.username)

        log_moved_to_trash(current_user.username, caminho_arquivo)
    except PermissionError:
        return "Sem permissão", 403

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json:
        msg = 'Arquivo movido para a lixeira'
        if revogados > 0:
            msg += f' ({revogados} link(s) de compartilhamento revogado(s))'
        return {'sucesso': True, 'mensagem': msg}

    pasta_relativa = os.path.dirname(caminho_arquivo)
    return redirect(url_for('file.explorar', caminho=pasta_relativa))


# ===== DELETAR PASTA =====
@file_bp.route('/deletar_pasta/<path:caminho_pasta>', methods=['POST'])
@limiter.limit(RATELIMIT_DELETE)
@login_required_optional
def deletar_pasta(caminho_pasta):
    pasta_completa = caminho_seguro(caminho_pasta)

    if pasta_completa is None:
        log_path_traversal(caminho_pasta)
        abort(403)

    if not os.path.exists(pasta_completa) or not os.path.isdir(pasta_completa):
        return "Pasta não encontrada", 404

    try:
        # Mover pasta para lixeira em vez de remover permanentemente
        item_id = mover_para_lixeira(
            caminho_relativo=caminho_pasta,
            caminho_absoluto=pasta_completa,
            usuario=current_user.username
        )

        if item_id is None:
            return "Erro ao mover pasta para a lixeira", 500

        # Revogar links de compartilhamento de arquivos dentro da pasta
        revogados = revogar_links_por_caminho(caminho_pasta, current_user.username)

        log_moved_to_trash(current_user.username, caminho_pasta)
    except PermissionError:
        return "Sem permissão", 403

    if request.headers.get('X-Requested-With') == 'XMLHttpRequest' or request.is_json:
        msg = 'Pasta movida para a lixeira'
        if revogados > 0:
            msg += f' ({revogados} link(s) de compartilhamento revogado(s))'
        return {'sucesso': True, 'mensagem': msg}

    pasta_pai = os.path.dirname(caminho_pasta)
    return redirect(url_for('file.explorar', caminho=pasta_pai))


# ===== DELETAR MÚLTIPLOS (AJAX) =====
@file_bp.route('/deletar_multiplos', methods=['POST'])
@limiter.limit(RATELIMIT_DELETE)
@login_required_optional
def deletar_multiplos():
    try:
        dados = request.get_json()
        if not dados:
            return {'sucesso': False, 'erro': 'Dados inválidos'}, 400

        caminhos = dados.get('caminhos', [])

        if not caminhos:
            return {'sucesso': False, 'erro': 'Nenhum item selecionado'}, 400
        if len(caminhos) > 500:
            return {'sucesso': False, 'erro': 'Máximo de 500 itens por operação'}, 400

        erros, sucessos = [], []
        usuario = current_user.username

        for caminho_relativo in caminhos:
            if not isinstance(caminho_relativo, str):
                continue

            caminho_completo = caminho_seguro(caminho_relativo)

            if caminho_completo is None:
                log_path_traversal(caminho_relativo)
                erros.append(f"{caminho_relativo}: Acesso negado")
                continue

            if not os.path.exists(caminho_completo):
                erros.append(f"{caminho_relativo}: Não encontrado")
                continue

            try:
                # Mover para lixeira em vez de remover permanentemente
                item_id = mover_para_lixeira(
                    caminho_relativo=caminho_relativo,
                    caminho_absoluto=caminho_completo,
                    usuario=usuario
                )

                if item_id is None:
                    erros.append(f"{caminho_relativo}: Erro ao mover para a lixeira")
                    continue

                # Revogar links de compartilhamento ativos
                revogar_links_por_caminho(caminho_relativo, usuario)

                log_moved_to_trash(usuario, caminho_relativo)
                sucessos.append(caminho_relativo)
            except Exception as ex:
                current_app.logger.exception(
                    "Erro ao deletar item em lote: %s", caminho_relativo
                )
                erros.append(f"{caminho_relativo}: {str(ex)}")

        return {
            'sucesso': True,
            'sucessos': sucessos,
            'erros': erros,
            'total': len(caminhos),
            'excluidos': len(sucessos)
        }

    except Exception:
        current_app.logger.exception("Erro interno ao deletar múltiplos itens")
        return {'sucesso': False, 'erro': 'Erro interno'}, 500


# ===== RENAME FILE/FOLDER =====
@file_bp.route('/renomear/<path:caminho_arquivo>', methods=['POST'])
@limiter.limit(RATELIMIT_DELETE)
@login_required_optional
def renomear(caminho_arquivo):
    """Renomeia um arquivo ou pasta"""
    caminho_completo = caminho_seguro(caminho_arquivo)

    if caminho_completo is None:
        log_path_traversal(caminho_arquivo)
        abort(403)

    if not os.path.exists(caminho_completo):
        if request.is_json:
            return jsonify(sucesso=False, erro="Item não encontrado"), 404
        return "Item não encontrado", 404

    if request.is_json:
        dados = request.get_json()
        novo_nome = dados.get('novo_nome', '').strip() if dados else ''
    else:
        novo_nome = request.form.get('novo_nome', '').strip()

    if not novo_nome:
        if request.is_json:
            return jsonify(sucesso=False, erro="Nome inválido"), 400
        return "Nome inválido", 400

    # Sanitizar nome
    from werkzeug.utils import secure_filename
    nome_seguro = secure_filename(novo_nome)
    if not nome_seguro:
        if request.is_json:
            return jsonify(sucesso=False, erro="Nome inválido após sanitização"), 400
        return "Nome inválido após sanitização", 400

    # Verificar se o novo nome já existe
    pasta_pai = os.path.dirname(caminho_completo)
    novo_caminho = os.path.join(pasta_pai, nome_seguro)

    if os.path.exists(novo_caminho):
        if request.is_json:
            return jsonify(sucesso=False, erro="Já existe um item com esse nome"), 400
        return "Já existe um item com esse nome", 400

    # Validar que o novo caminho continua dentro de PASTA_BASE
    if caminho_seguro(os.path.relpath(novo_caminho, os.path.realpath(PASTA_BASE))) is None:
        if request.is_json:
            return jsonify(sucesso=False, erro="Acesso negado"), 403
        return "Acesso negado", 403

    try:
        # Renomear
        os.rename(caminho_completo, novo_caminho)

        # Se for pasta, também precisamos revogar links de compartilhamento de arquivos dentro dela
        # O nome do caminho mudou, então links antigos não funcionariam mais
        if os.path.isdir(novo_caminho):
            revogar_links_por_caminho(caminho_arquivo, current_user.username)

        # Log de auditoria
        from app.utils.audit import log_rename
        log_rename(current_user.username, caminho_arquivo, novo_nome)

    except PermissionError:
        if request.is_json:
            return jsonify(sucesso=False, erro="Sem permissão"), 403
        return "Sem permissão", 403
    except Exception as e:
        current_app.logger.exception("Erro ao renomear: %s", caminho_arquivo)
        if request.is_json:
            return jsonify(sucesso=False, erro="Erro ao renomear"), 500
        return "Erro ao renomear", 500

    if request.is_json:
        return jsonify(sucesso=True, mensagem="Renomeado com sucesso", novo_nome=nome_seguro)

    pasta_relativa = os.path.dirname(caminho_arquivo)
    return redirect(url_for('file.explorar', caminho=pasta_relativa))


# ===== DOWNLOAD EM ZIP =====
@file_bp.route('/download_zip', methods=['POST'])
@limiter.limit(RATELIMIT_ZIP)
@login_required_optional
def download_zip():
    usuario = current_user.username
    caminhos = request.form.getlist('caminhos')

    if not caminhos:
        return "Nenhum arquivo selecionado", 400

    if len(caminhos) > MAX_ZIP_FILES:
        log_zip_bloqueado(usuario, f"muitos arquivos: {len(caminhos)} > {MAX_ZIP_FILES}")
        return f"Máximo de {MAX_ZIP_FILES} itens por ZIP", 400

    temp_zip = None
    cleanup_now = True
    try:
        temp_zip = tempfile.NamedTemporaryFile(suffix='.zip', delete=False)
        temp_zip.close()

        tamanho_total = 0
        max_bytes = MAX_ZIP_SIZE_MB * 1024 * 1024

        with zipfile.ZipFile(temp_zip.name, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for caminho_relativo in caminhos:
                if not isinstance(caminho_relativo, str):
                    continue

                caminho_absoluto = caminho_seguro(caminho_relativo)
                if caminho_absoluto is None:
                    log_path_traversal(caminho_relativo)
                    continue

                if not os.path.exists(caminho_absoluto):
                    continue

                if os.path.isfile(caminho_absoluto):
                    tamanho_total += os.path.getsize(caminho_absoluto)
                    if tamanho_total > max_bytes:
                        log_zip_bloqueado(usuario, f"tamanho excedido: >{MAX_ZIP_SIZE_MB}MB")
                        return f"Seleção excede o limite de {MAX_ZIP_SIZE_MB}MB por ZIP", 400
                    zipf.write(caminho_absoluto, caminho_relativo)

                elif os.path.isdir(caminho_absoluto):
                    for root, dirs, files in os.walk(caminho_absoluto):
                        dirs[:] = [
                            dirname for dirname in dirs
                            if caminho_seguro(
                                os.path.relpath(
                                    os.path.join(root, dirname),
                                    os.path.realpath(PASTA_BASE)
                                )
                            ) is not None
                        ]
                        for file in files:
                            file_path = os.path.join(root, file)
                            rel_path = os.path.relpath(file_path, os.path.realpath(PASTA_BASE))
                            if caminho_seguro(rel_path) is None:
                                log_path_traversal(rel_path)
                                continue

                            tamanho_total += os.path.getsize(file_path)
                            if tamanho_total > max_bytes:
                                log_zip_bloqueado(usuario, f"tamanho excedido: >{MAX_ZIP_SIZE_MB}MB")
                                return f"Seleção excede o limite de {MAX_ZIP_SIZE_MB}MB por ZIP", 400
                            zipf.write(file_path, rel_path)

        log_download(usuario, f"[ZIP] {len(caminhos)} itens")

        @after_this_request
        def remover_zip_temporario(response):
            if temp_zip and os.path.exists(temp_zip.name):
                try:
                    os.unlink(temp_zip.name)
                except OSError:
                    pass
            return response

        cleanup_now = False
        return send_file(
            temp_zip.name,
            as_attachment=True,
            download_name='arquivos_selecionados.zip',
            mimetype='application/zip'
        )

    except Exception:
        current_app.logger.exception("Erro ao criar ZIP")
        return "Erro ao criar ZIP", 500
    finally:
        if cleanup_now and temp_zip and os.path.exists(temp_zip.name):
            try:
                os.unlink(temp_zip.name)
            except OSError:
                pass
