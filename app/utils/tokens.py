# app/utils/tokens.py
import secrets
import time
from typing import Optional, Dict

# Armazenamento em memória (simples, suficiente para single-user)
# Para produção com múltiplos usuários, migrar para banco de dados
_reset_tokens: Dict[str, Dict] = {}


def gerar_token_reset(email: str) -> str:
    """Gera token único de recuperação de senha"""
    token = secrets.token_urlsafe(32)
    _reset_tokens[token] = {
        'email': email,
        'timestamp': time.time(),
        'usado': False
    }
    return token


def validar_token_reset(token: str) -> Optional[str]:
    """Valida token e retorna email se válido (1h de expiração)"""
    if token not in _reset_tokens:
        return None

    dados = _reset_tokens[token]
    if dados['usado']:
        return None

    # Verifica expiração (3600 segundos = 1 hora)
    if time.time() - dados['timestamp'] > 3600:
        del _reset_tokens[token]
        return None

    return dados['email']


def marcar_token_usado(token: str):
    """Marca token como usado para evitar reutilização"""
    if token in _reset_tokens:
        _reset_tokens[token]['usado'] = True


def limpar_tokens_expirados():
    """Remove tokens expirados (chamado periodicamente se necessário)"""
    agora = time.time()
    tokens_expirados = [
        token for token, dados in _reset_tokens.items()
        if agora - dados['timestamp'] > 3600
    ]
    for token in tokens_expirados:
        del _reset_tokens[token]
