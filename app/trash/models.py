# app/trash/models.py
"""
Modelo de dados e operações da lixeira.
Os arquivos deletados são movidos para instance/trash/ e seus metadados
são salvos em instance/trash_metadata.json.
"""
import os
import json
import uuid
import time
import shutil
from typing import Optional, Dict, Any, List, Tuple
from datetime import datetime

from app.config import ROOT_DIR, PASTA_BASE

# ===== CAMINHOS =====
TRASH_DIR = os.path.join(ROOT_DIR, 'instance', 'trash')
METADATA_FILE = os.path.join(ROOT_DIR, 'instance', 'trash_metadata.json')

# ===== CONFIGURAÇÃO =====
RETENTION_DAYS = 30  # Dias antes de remover automaticamente
RETENTION_SECONDS = RETENTION_DAYS * 24 * 60 * 60

# ===== ARMAZENAMENTO EM MEMÓRIA =====
_trash_items: Dict[str, Dict[str, Any]] = {}


# ===== FUNÇÕES DE PERSISTÊNCIA =====

def _salvar_metadata() -> None:
    """Salva os metadados no arquivo JSON."""
    try:
        os.makedirs(os.path.dirname(METADATA_FILE), exist_ok=True)
        data = {'items': _trash_items}
        with open(METADATA_FILE, 'w', encoding='utf-8') as f:
            json.dump(data, f, indent=2, ensure_ascii=False)
    except Exception as e:
        print(f"Erro ao salvar metadados da lixeira: {e}", flush=True)


def _carregar_metadata() -> None:
    """Carrega os metadados do arquivo JSON."""
    global _trash_items

    if not os.path.exists(METADATA_FILE):
        return

    try:
        with open(METADATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
        _trash_items = data.get('items', {})
    except Exception as e:
        print(f"Erro ao carregar metadados da lixeira: {e}", flush=True)
        _trash_items = {}


# ===== FUNÇÕES AUXILIARES =====

def _formatar_tamanho(bytes_size: int) -> str:
    """Formata tamanho em bytes para string legível."""
    if bytes_size < 1024:
        return f"{bytes_size} B"
    elif bytes_size < 1024 * 1024:
        return f"{bytes_size / 1024:.1f} KB"
    elif bytes_size < 1024 * 1024 * 1024:
        return f"{bytes_size / (1024 * 1024):.1f} MB"
    else:
        return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"


def _calcular_tamanho(caminho: str) -> int:
    """Calcula o tamanho total de um arquivo ou pasta."""
    if os.path.isfile(caminho):
        return os.path.getsize(caminho)
    elif os.path.isdir(caminho):
        total = 0
        for root, dirs, files in os.walk(caminho):
            for f in files:
                fp = os.path.join(root, f)
                if os.path.exists(fp):
                    total += os.path.getsize(fp)
        return total
    return 0


def _dias_restantes(expires_at: float) -> int:
    """Calcula dias restantes até a expiração."""
    segundos = expires_at - time.time()
    if segundos <= 0:
        return 0
    return max(1, int(segundos / (24 * 60 * 60)))


# ===== FUNÇÕES PRINCIPAIS =====

def mover_para_lixeira(
    caminho_relativo: str,
    caminho_absoluto: str,
    usuario: str
) -> Optional[str]:
    """
    Move um arquivo ou pasta para a lixeira.

    Args:
        caminho_relativo: Caminho relativo à PASTA_BASE (para metadados)
        caminho_absoluto: Caminho absoluto do arquivo/pasta
        usuario: Nome do usuário que deletou

    Returns:
        ID do item na lixeira ou None se falhou
    """
    try:
        # Criar pasta da lixeira se não existe
        os.makedirs(TRASH_DIR, exist_ok=True)

        # Gerar ID único para o item
        item_id = str(uuid.uuid4())

        # Informações do item
        nome_original = os.path.basename(caminho_relativo)
        is_folder = os.path.isdir(caminho_absoluto)
        tamanho = _calcular_tamanho(caminho_absoluto)

        # Nome na lixeira: nome_original_uuid (evita colisões)
        nome_base, ext = os.path.splitext(nome_original)
        nome_trash = f"{nome_base}_{item_id[:8]}{ext}"
        caminho_trash = os.path.join(TRASH_DIR, nome_trash)

        # Se for pasta, criar com sufixo UUID
        if is_folder:
            nome_trash = f"{nome_original}_{item_id[:8]}"
            caminho_trash = os.path.join(TRASH_DIR, nome_trash)

        # Mover arquivo/pasta
        shutil.move(caminho_absoluto, caminho_trash)

        # Criar registro de metadados
        now = time.time()
        _trash_items[item_id] = {
            'id': item_id,
            'original_path': caminho_relativo,
            'original_name': nome_original,
            'trash_path': caminho_trash,
            'deleted_at': now,
            'expires_at': now + RETENTION_SECONDS,
            'deleted_by': usuario,
            'is_folder': is_folder,
            'size': tamanho
        }

        # Salvar metadados
        _salvar_metadata()

        return item_id

    except Exception as e:
        print(f"Erro ao mover para lixeira: {e}", flush=True)
        return None


def listar_lixeira(
    usuario: Optional[str] = None,
    limit: Optional[int] = None,
    offset: int = 0
) -> List[Dict[str, Any]]:
    """
    Lista itens na lixeira.

    Args:
        usuario: Filtrar por usuário (None = todos)
        limit: Limite de itens a retornar
        offset: Pular primeiros N itens

    Returns:
        Lista de dicionários com informações dos itens
    """
    # Recarregar para garantir sincronização
    _carregar_metadata()

    itens = []
    for item_id, item in _trash_items.items():
        # Filtrar por usuário se especificado
        if usuario and item.get('deleted_by') != usuario:
            continue

        # Verificar se arquivo ainda existe na lixeira
        if not os.path.exists(item['trash_path']):
            continue

        # Adicionar informações formatadas
        item_info = item.copy()
        item_info['size_formatted'] = _formatar_tamanho(item['size'])
        item_info['days_remaining'] = _dias_restantes(item['expires_at'])
        item_info['deleted_at_formatted'] = datetime.fromtimestamp(
            item['deleted_at']
        ).strftime('%d/%m/%Y %H:%M')

        itens.append(item_info)

    # Ordenar por data de exclusão (mais recentes primeiro)
    itens.sort(key=lambda x: x['deleted_at'], reverse=True)

    # Aplicar paginação
    if limit is not None:
        itens = itens[offset:offset + limit]
    elif offset > 0:
        itens = itens[offset:]

    return itens


def restaurar_item(item_id: str, usuario: str) -> Tuple[bool, str]:
    """
    Restaura um item da lixeira para sua localização original.

    Args:
        item_id: ID do item na lixeira
        usuario: Nome do usuário que está restaurando

    Returns:
        Tupla (sucesso, mensagem)
    """
    # Recarregar metadados
    _carregar_metadata()

    if item_id not in _trash_items:
        return False, "Item não encontrado na lixeira"

    item = _trash_items[item_id]

    # Verificar permissão (apenas quem deletou pode restaurar)
    if item['deleted_by'] != usuario:
        return False, "Você não tem permissão para restaurar este item"

    # Verificar se arquivo existe na lixeira
    if not os.path.exists(item['trash_path']):
        # Limpar registro órfão
        del _trash_items[item_id]
        _salvar_metadata()
        return False, "Arquivo não encontrado na lixeira"

    # Determinar destino
    caminho_destino = os.path.join(PASTA_BASE, item['original_path'])

    # Verificar se a pasta pai existe
    pasta_pai = os.path.dirname(caminho_destino)
    if pasta_pai and not os.path.exists(pasta_pai):
        # Se pasta original não existe, restaurar na raiz
        caminho_destino = os.path.join(PASTA_BASE, item['original_name'])

    # Verificar conflito de nome
    if os.path.exists(caminho_destino):
        # Adicionar sufixo ao nome
        nome_base, ext = os.path.splitext(item['original_name'])
        contador = 1
        while os.path.exists(caminho_destino):
            novo_nome = f"{nome_base}_restaurado_{contador}{ext}"
            caminho_destino = os.path.join(
                os.path.dirname(caminho_destino), novo_nome
            ) if os.path.dirname(caminho_destino) else os.path.join(
                PASTA_BASE, novo_nome
            )
            contador += 1
            if contador > 100:
                return False, "Não foi possível encontrar nome disponível"

    try:
        # Mover de volta
        shutil.move(item['trash_path'], caminho_destino)

        # Remover registro
        del _trash_items[item_id]
        _salvar_metadata()

        caminho_relativo = item['original_path']
        return True, f"Restaurado para: {caminho_relativo}"

    except Exception as e:
        return False, f"Erro ao restaurar: {str(e)}"


def remover_permanentemente(item_id: str, usuario: str) -> Tuple[bool, str]:
    """
    Remove permanentemente um item da lixeira.

    Args:
        item_id: ID do item na lixeira
        usuario: Nome do usuário que está removendo

    Returns:
        Tupla (sucesso, mensagem)
    """
    # Recarregar metadados
    _carregar_metadata()

    if item_id not in _trash_items:
        return False, "Item não encontrado na lixeira"

    item = _trash_items[item_id]

    # Verificar permissão
    if item['deleted_by'] != usuario:
        return False, "Você não tem permissão para remover este item"

    try:
        # Remover do sistema de arquivos
        if os.path.exists(item['trash_path']):
            if os.path.isfile(item['trash_path']):
                os.remove(item['trash_path'])
            elif os.path.isdir(item['trash_path']):
                shutil.rmtree(item['trash_path'])

        # Remover registro
        del _trash_items[item_id]
        _salvar_metadata()

        return True, "Item removido permanentemente"

    except Exception as e:
        return False, f"Erro ao remover: {str(e)}"


def esvaziar_lixeira(usuario: str) -> Tuple[bool, str, int]:
    """
    Remove todos os itens da lixeira de um usuário.

    Args:
        usuario: Nome do usuário

    Returns:
        Tupla (sucesso, mensagem, quantidade_removida)
    """
    # Recarregar metadados
    _carregar_metadata()

    removidos = 0
    erros = 0

    for item_id in list(_trash_items.keys()):
        item = _trash_items[item_id]

        if item['deleted_by'] != usuario:
            continue

        try:
            # Remover do sistema de arquivos
            if os.path.exists(item['trash_path']):
                if os.path.isfile(item['trash_path']):
                    os.remove(item['trash_path'])
                elif os.path.isdir(item['trash_path']):
                    shutil.rmtree(item['trash_path'])

            # Remover registro
            del _trash_items[item_id]
            removidos += 1

        except Exception:
            erros += 1

    # Salvar alterações
    if removidos > 0 or erros > 0:
        _salvar_metadata()

    if erros > 0:
        return True, f"{removidos} itens removidos, {erros} erros", removidos

    return True, f"{removidos} itens removidos com sucesso", removidos


def limpar_expirados() -> int:
    """
    Remove automaticamente itens que expiraram (mais de 30 dias).

    Returns:
        Quantidade de itens removidos
    """
    # Recarregar metadados
    _carregar_metadata()

    now = time.time()
    removidos = 0

    for item_id in list(_trash_items.keys()):
        item = _trash_items[item_id]

        if item['expires_at'] < now:
            try:
                # Remover do sistema de arquivos
                if os.path.exists(item['trash_path']):
                    if os.path.isfile(item['trash_path']):
                        os.remove(item['trash_path'])
                    elif os.path.isdir(item['trash_path']):
                        shutil.rmtree(item['trash_path'])

                # Remover registro
                del _trash_items[item_id]
                removidos += 1

            except Exception as e:
                print(f"Erro ao limpar item expirado {item_id}: {e}", flush=True)

    # Salvar alterações
    if removidos > 0:
        _salvar_metadata()
        print(f"✓ {removidos} item(s) expirado(s) removido(s) da lixeira", flush=True)

    return removidos


def tamanho_lixeira(usuario: Optional[str] = None) -> int:
    """
    Calcula o tamanho total da lixeira em bytes.

    Args:
        usuario: Filtrar por usuário (None = todos)

    Returns:
        Tamanho total em bytes
    """
    # Recarregar metadados
    _carregar_metadata()

    total = 0
    for item in _trash_items.values():
        if usuario and item.get('deleted_by') != usuario:
            continue
        total += item.get('size', 0)

    return total


def contar_itens(usuario: Optional[str] = None) -> int:
    """
    Conta quantos itens há na lixeira.

    Args:
        usuario: Filtrar por usuário (None = todos)

    Returns:
        Quantidade de itens
    """
    # Recarregar metadados
    _carregar_metadata()

    if usuario:
        return sum(1 for item in _trash_items.values() if item.get('deleted_by') == usuario)

    return len(_trash_items)


# ===== INICIALIZAÇÃO =====

# Criar pasta da lixeira se não existe
os.makedirs(TRASH_DIR, exist_ok=True)

# Carregar metadados ao importar o módulo
_carregar_metadata()

# Executar limpeza de expirados ao iniciar
limpar_expirados()
