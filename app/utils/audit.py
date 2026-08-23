# app/utils/audit.py
"""
Log de auditoria para o Cloud Storage App.
Registra eventos de segurança e acesso em instance/audit.log.
Rotação automática ao atingir o tamanho máximo configurado.
"""
import os
import logging
from logging.handlers import RotatingFileHandler
from datetime import datetime
from flask import request

from app.config import AUDIT_LOG_PATH, AUDIT_LOG_MAX_MB

# ===== CONFIGURAÇÃO DO LOGGER =====
_audit_logger = None

def _get_logger():
    global _audit_logger
    if _audit_logger is not None:
        return _audit_logger

    os.makedirs(os.path.dirname(AUDIT_LOG_PATH), exist_ok=True)

    logger = logging.getLogger('audit')
    logger.setLevel(logging.INFO)

    # Evitar handlers duplicados se o módulo for recarregado
    if not logger.handlers:
        handler = RotatingFileHandler(
            AUDIT_LOG_PATH,
            maxBytes=AUDIT_LOG_MAX_MB * 1024 * 1024,
            backupCount=3,          # mantém até 3 arquivos antigos (audit.log.1, .2, .3)
            encoding='utf-8'
        )
        handler.setFormatter(logging.Formatter('%(message)s'))
        logger.addHandler(handler)

    _audit_logger = logger
    return logger


def _get_ip():
    """Retorna o IP real do cliente, considerando proxies reversos."""
    # X-Forwarded-For é adicionado por proxies (nginx, cloudflare, etc.)
    forwarded = request.headers.get('X-Forwarded-For')
    if forwarded:
        # Pega o primeiro IP da cadeia (o do cliente original)
        return forwarded.split(',')[0].strip()
    return request.remote_addr or 'unknown'


def _registrar(nivel: str, evento: str, usuario: str = '-', detalhe: str = ''):
    """
    Formato do log:
    2025-01-15 14:32:01 | INFO     | 192.168.1.10 | admin | LOGIN_OK | -
    """
    try:
        logger = _get_logger()
        timestamp = datetime.now().strftime('%Y-%m-%d %H:%M:%S')
        ip = _get_ip()
        linha = f"{timestamp} | {nivel:<8} | {ip:<15} | {usuario:<20} | {evento:<25} | {detalhe}"
        logger.info(linha)
    except Exception:
        # Log de auditoria nunca deve derrubar a aplicação
        pass


# ===== FUNÇÕES PÚBLICAS =====

def log_login_ok(usuario: str):
    _registrar('INFO', 'LOGIN_OK', usuario)

def log_login_falhou(usuario_tentado: str):
    _registrar('WARN', 'LOGIN_FALHOU', usuario_tentado)

def log_login_bloqueado(usuario_tentado: str):
    _registrar('WARN', 'LOGIN_BLOQUEADO', usuario_tentado)

def log_logout(usuario: str):
    _registrar('INFO', 'LOGOUT', usuario)

def log_setup_concluido(usuario: str):
    _registrar('INFO', 'SETUP_CONCLUIDO', usuario)

def log_upload(usuario: str, caminho: str, nome_arquivo: str):
    _registrar('INFO', 'UPLOAD', usuario, f"{caminho}/{nome_arquivo}")

def log_upload_bloqueado(usuario: str, nome_arquivo: str, motivo: str):
    _registrar('WARN', 'UPLOAD_BLOQUEADO', usuario, f"{nome_arquivo} — {motivo}")

def log_download(usuario: str, caminho: str):
    _registrar('INFO', 'DOWNLOAD', usuario, caminho)

def log_delete(usuario: str, caminho: str):
    _registrar('WARN', 'DELETE', usuario, caminho)

def log_acesso_negado(usuario: str, caminho: str):
    _registrar('WARN', 'ACESSO_NEGADO', usuario, caminho)

def log_path_traversal(caminho_tentado: str):
    """Tentativa de sair da pasta base — evento crítico."""
    _registrar('CRIT', 'PATH_TRAVERSAL', '-', caminho_tentado)

def log_csrf_falhou(rota: str):
    _registrar('WARN', 'CSRF_FALHOU', '-', rota)

def log_zip_bloqueado(usuario: str, motivo: str):
    _registrar('WARN', 'ZIP_BLOQUEADO', usuario, motivo)


# ===== EVENTOS DA LIXEIRA =====

def log_moved_to_trash(usuario: str, caminho: str):
    """Arquivo/pasta movido para lixeira."""
    _registrar('INFO', 'MOVED_TO_TRASH', usuario, caminho)

def log_restored(usuario: str, caminho_original: str):
    """Arquivo/pasta restaurado da lixeira."""
    _registrar('INFO', 'RESTORED', usuario, caminho_original)

def log_permanently_deleted(usuario: str, caminho: str):
    """Arquivo/pasta removido permanentemente da lixeira."""
    _registrar('WARN', 'PERMANENTLY_DELETED', usuario, caminho)

def log_trash_emptied(usuario: str, quantidade: int):
    """Lixeira esvaziada."""
    _registrar('INFO', 'TRASH_EMPTIED', usuario, f"{quantidade} itens removidos")