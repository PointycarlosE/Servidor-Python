# app/trash/__init__.py
"""
Módulo de lixeira para o Cloud Storage App.
Gerencia arquivos e pastas deletados com possibilidade de restauração.
"""
from app.trash.models import (
    mover_para_lixeira,
    listar_lixeira,
    restaurar_item,
    remover_permanentemente,
    esvaziar_lixeira,
    limpar_expirados,
    tamanho_lixeira,
    contar_itens,
)

__all__ = [
    'mover_para_lixeira',
    'listar_lixeira',
    'restaurar_item',
    'remover_permanentemente',
    'esvaziar_lixeira',
    'limpar_expirados',
    'tamanho_lixeira',
    'contar_itens',
]
