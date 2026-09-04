# app/storage/service.py
"""
Serviço de análise e métricas de armazenamento do aplicativo.
Calcula o uso real dentro da pasta base do aplicativo e da lixeira,
sem misturar com arquivos de sistema do sistema operacional.
"""
import os
import time
import shutil
import threading
from typing import Dict, Any, List, Optional
from datetime import datetime

from app.config import PASTA_BASE
from app.trash.models import tamanho_lixeira, contar_itens

# ===== CATEGORIAS DE EXTENSÕES =====
EXT_IMAGENS = {'.png', '.jpg', '.jpeg', '.gif', '.webp', '.bmp', '.svg', '.ico', '.tiff', '.heic', '.raw'}
EXT_VIDEOS = {'.mp4', '.mkv', '.webm', '.avi', '.mov', '.wmv', '.flv', '.m4v', '.3gp'}
EXT_AUDIO = {'.mp3', '.wav', '.ogg', '.m4a', '.flac', '.aac', '.wma', '.opus', '.mid'}
EXT_DOCS = {
    '.pdf', '.doc', '.docx', '.txt', '.xls', '.xlsx', '.ppt', '.pptx',
    '.odt', '.ods', '.csv', '.md', '.rtf', '.epub', '.pages', '.numbers', '.key'
}
EXT_ARCHIVES = {'.zip', '.rar', '.7z', '.tar', '.gz', '.bz2', '.iso', '.xz', '.tgz'}

# Pastas de sistema, build e cache a serem ignoradas no escaneamento
IGNORE_DIR_NAMES = {'.git', '.trash', 'node_modules', '__pycache__', '.venv', 'venv', '.cache', '.idea', '.vscode'}

# ===== CACHE EM MEMÓRIA =====
_cache_lock = threading.Lock()
_cache_stats: Optional[Dict[str, Any]] = None
_cache_timestamp: float = 0
CACHE_TTL = 300  # 5 minutos


def formatar_tamanho(bytes_size: int) -> str:
    """Formata bytes para string legível (B, KB, MB, GB, TB)."""
    if bytes_size < 0:
        return "0 B"
    if bytes_size < 1024:
        return f"{bytes_size} B"
    elif bytes_size < 1024 * 1024:
        return f"{bytes_size / 1024:.1f} KB"
    elif bytes_size < 1024 * 1024 * 1024:
        return f"{bytes_size / (1024 * 1024):.1f} MB"
    elif bytes_size < 1024 * 1024 * 1024 * 1024:
        return f"{bytes_size / (1024 * 1024 * 1024):.2f} GB"
    else:
        return f"{bytes_size / (1024 * 1024 * 1024 * 1024):.2f} TB"


def encurtar_caminho(caminho: str, inicio: int = 3, fim: int = 2) -> str:
    """
    Encurta caminhos de pastas muito longos inserindo '...' no meio.
    Mostra as primeiras `inicio` pastas e as últimas `fim` pastas.
    Ex: a/b/c/d/e/f/g -> a/b/c/.../f/g
    """
    if not caminho or caminho in ('.', 'Raiz', '/'):
        return 'Raiz'
    
    partes = [p for p in caminho.replace('\\', '/').strip('/').split('/') if p]
    if len(partes) > (inicio + fim):
        return f"{'/'.join(partes[:inicio])}/.../{'/'.join(partes[-fim:])}"
    return caminho


def _identificar_categoria(nome_arquivo: str) -> str:
    """Identifica a categoria do arquivo com base na extensão."""
    ext = os.path.splitext(nome_arquivo)[1].lower()
    if ext in EXT_IMAGENS:
        return 'imagens'
    elif ext in EXT_VIDEOS:
        return 'videos'
    elif ext in EXT_AUDIO:
        return 'audios'
    elif ext in EXT_DOCS:
        return 'documentos'
    elif ext in EXT_ARCHIVES:
        return 'compactados'
    else:
        return 'outros'


class StorageService:
    """Serviço central de escaneamento e gerenciamento de armazenamento."""

    @classmethod
    def invalidate_cache(cls) -> None:
        """Invalida o cache para forçar um recálculo na próxima requisição."""
        global _cache_stats, _cache_timestamp
        with _cache_lock:
            _cache_stats = None
            _cache_timestamp = 0

    @classmethod
    def _escanear_pasta_base(cls) -> Dict[str, Any]:
        """
        Varre a pasta base recursivamente usando os.scandir.
        Garante segurança contra symlinks e trata erros de permissão.
        """
        categorias = {
            'imagens': {'bytes': 0, 'count': 0, 'label': 'Imagens', 'color': '#3b82f6', 'icon': 'image'},
            'videos': {'bytes': 0, 'count': 0, 'label': 'Vídeos', 'color': '#ef4444', 'icon': 'video'},
            'audios': {'bytes': 0, 'count': 0, 'label': 'Áudios', 'color': '#a855f7', 'icon': 'music'},
            'documentos': {'bytes': 0, 'count': 0, 'label': 'Documentos', 'color': '#10b981', 'icon': 'file-text'},
            'compactados': {'bytes': 0, 'count': 0, 'label': 'Compactados', 'color': '#f59e0b', 'icon': 'archive'},
            'outros': {'bytes': 0, 'count': 0, 'label': 'Outros', 'color': '#6b7280', 'icon': 'file'}
        }

        todos_arquivos: List[Dict[str, Any]] = []
        total_arquivos = 0
        total_pastas = 0
        total_bytes_ativos = 0

        if PASTA_BASE and os.path.exists(PASTA_BASE):
            pilha = [PASTA_BASE]
            while pilha:
                dir_atual = pilha.pop()
                try:
                    with os.scandir(dir_atual) as entries:
                        for entry in entries:
                            try:
                                # Ignora links simbólicos para segurança e evitar loops
                                if entry.is_symlink():
                                    continue

                                if entry.is_dir(follow_symlinks=False):
                                    # Ignora pastas ocultas do sistema (ex: .git, .trash) e pastas de build/cache
                                    if entry.name.startswith('.') or entry.name.lower() in IGNORE_DIR_NAMES:
                                        continue
                                    total_pastas += 1
                                    pilha.append(entry.path)
                                elif entry.is_file(follow_symlinks=False):
                                    if entry.name.startswith('.'):
                                        continue
                                    
                                    stat = entry.stat()
                                    tamanho = stat.st_size
                                    mtime = stat.st_mtime
                                    cat = _identificar_categoria(entry.name)

                                    categorias[cat]['bytes'] += tamanho
                                    categorias[cat]['count'] += 1
                                    total_bytes_ativos += tamanho
                                    total_arquivos += 1

                                    # Caminho relativo dentro do drive
                                    rel_path = os.path.relpath(entry.path, PASTA_BASE).replace('\\', '/')
                                    dir_rel = os.path.dirname(rel_path) or 'Raiz'

                                    todos_arquivos.append({
                                        'nome': entry.name,
                                        'caminho': rel_path,
                                        'pasta': dir_rel,
                                        'pasta_curta': encurtar_caminho(dir_rel),
                                        'tamanho_bytes': tamanho,
                                        'tamanho_formatado': formatar_tamanho(tamanho),
                                        'categoria': cat,
                                        'modificado_em': datetime.fromtimestamp(mtime).strftime('%d/%m/%Y %H:%M'),
                                        'modificado_timestamp': mtime
                                    })
                            except (PermissionError, OSError):
                                continue
                except (PermissionError, OSError):
                    continue

        # Ordenar os maiores arquivos
        todos_arquivos.sort(key=lambda x: x['tamanho_bytes'], reverse=True)

        return {
            'categorias': categorias,
            'todos_arquivos': todos_arquivos,
            'total_arquivos': total_arquivos,
            'total_pastas': total_pastas,
            'total_bytes_ativos': total_bytes_ativos
        }

    @classmethod
    def get_storage_stats(cls, force_refresh: bool = False) -> Dict[str, Any]:
        """
        Retorna as estatísticas completas de armazenamento com cache.
        """
        global _cache_stats, _cache_timestamp

        agora = time.time()
        with _cache_lock:
            if not force_refresh and _cache_stats and (agora - _cache_timestamp < CACHE_TTL):
                return _cache_stats

        # 1. Escanear arquivos da pasta base
        scan_data = cls._escanear_pasta_base()
        categorias = scan_data['categorias']
        todos_arquivos = scan_data['todos_arquivos']
        total_arquivos = scan_data['total_arquivos']
        total_pastas = scan_data['total_pastas']
        total_bytes_ativos = scan_data['total_bytes_ativos']

        # 2. Obter estatísticas da lixeira
        try:
            bytes_lixeira = tamanho_lixeira()
            qtd_lixeira = contar_itens()
        except Exception:
            bytes_lixeira = 0
            qtd_lixeira = 0

        categorias['lixeira'] = {
            'bytes': bytes_lixeira,
            'count': qtd_lixeira,
            'label': 'Lixeira',
            'color': '#ef4444',
            'icon': 'trash-2'
        }

        # 3. Total usado pelo App (Pasta Base + Lixeira)
        total_usado_app = total_bytes_ativos + bytes_lixeira

        # 4. Calcular capacidade total disponível
        espaco_livre_disco = 0
        try:
            if PASTA_BASE and os.path.exists(PASTA_BASE):
                _, _, espaco_livre_disco = shutil.disk_usage(PASTA_BASE)
        except Exception:
            espaco_livre_disco = 100 * (1024 ** 3)  # Fallback 100 GB

        # Suporte a Cota Fixa configurada via .env (ex: STORAGE_QUOTA_GB=50)
        cota_configurada_gb = os.environ.get('STORAGE_QUOTA_GB')
        if cota_configurada_gb:
            try:
                cota_bytes = int(float(cota_configurada_gb) * (1024 ** 3))
                capacidade_total = min(cota_bytes, total_usado_app + espaco_livre_disco)
            except ValueError:
                capacidade_total = total_usado_app + espaco_livre_disco
        else:
            capacidade_total = total_usado_app + espaco_livre_disco

        if capacidade_total <= 0:
            capacidade_total = total_usado_app if total_usado_app > 0 else 1

        percentual_usado = round((total_usado_app / capacidade_total) * 100, 1)

        # 5. Formatar dados das categorias com percentuais
        breakdown_categorias = []
        for chave, dados in categorias.items():
            pct_total = round((dados['bytes'] / capacidade_total) * 100, 2) if capacidade_total > 0 else 0
            pct_usado = round((dados['bytes'] / total_usado_app) * 100, 1) if total_usado_app > 0 else 0
            breakdown_categorias.append({
                'chave': chave,
                'label': dados['label'],
                'color': dados['color'],
                'icon': dados['icon'],
                'bytes': dados['bytes'],
                'formatado': formatar_tamanho(dados['bytes']),
                'count': dados['count'],
                'percentual_capacidade': pct_total,
                'percentual_usado': pct_usado
            })

        # 6. Identificar arquivos grandes (> 50 MB)
        limite_grande = 50 * 1024 * 1024
        arquivos_grandes = [arq for arq in todos_arquivos if arq['tamanho_bytes'] >= limite_grande]

        resultado = {
            'resumo': {
                'total_usado_bytes': total_usado_app,
                'total_usado_formatado': formatar_tamanho(total_usado_app),
                'capacidade_total_bytes': capacidade_total,
                'capacidade_total_formatado': formatar_tamanho(capacidade_total),
                'espaco_livre_bytes': max(0, capacidade_total - total_usado_app),
                'espaco_livre_formatado': formatar_tamanho(max(0, capacidade_total - total_usado_app)),
                'percentual_usado': percentual_usado,
                'total_arquivos': total_arquivos,
                'total_pastas': total_pastas,
                'total_lixeira_bytes': bytes_lixeira,
                'total_lixeira_count': qtd_lixeira,
                'total_lixeira_formatado': formatar_tamanho(bytes_lixeira),
                'total_arquivos_grandes_count': len(arquivos_grandes),
                'total_arquivos_grandes_bytes': sum(a['tamanho_bytes'] for a in arquivos_grandes),
                'total_arquivos_grandes_formatado': formatar_tamanho(sum(a['tamanho_bytes'] for a in arquivos_grandes))
            },
            'categorias': breakdown_categorias,
            'maiores_arquivos': todos_arquivos[:500],  # Retornar até 500 para filtragem rica
            'timestamp': agora,
            'data_atualizacao': datetime.fromtimestamp(agora).strftime('%d/%m/%Y às %H:%M')
        }

        with _cache_lock:
            _cache_stats = resultado
            _cache_timestamp = agora

        return resultado

    @classmethod
    def get_storage_summary(cls) -> Dict[str, Any]:
        """
        Retorna um dicionário leve de resumo para ser injetado globalmente
        nos templates (substituindo o shutil.disk_usage genérico do SO).
        """
        try:
            stats = cls.get_storage_stats()
            resumo = stats['resumo']
            used_str = resumo['total_usado_formatado']
            total_str = resumo['capacidade_total_formatado']
            percent = resumo['percentual_usado']

            return {
                'used_str': used_str,
                'total_str': total_str,
                'percent': percent,
                'text': f"{used_str} de {total_str} usados"
            }
        except Exception as e:
            return {
                'used_str': '0 B',
                'total_str': '0 B',
                'percent': 0,
                'text': 'Armazenamento indisponível'
            }
