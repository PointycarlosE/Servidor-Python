"""
Modelo de links compartilhados
"""
import secrets
import time
from typing import Optional, Dict, Any
from werkzeug.security import generate_password_hash, check_password_hash


class SharedLink:
    """Representa um link de compartilhamento de arquivo"""

    def __init__(
        self,
        token: str,
        file_path: str,
        created_by: str,
        expires_at: Optional[float] = None,
        password_hash: Optional[str] = None,
        link_id: Optional[str] = None
    ):
        self.id = link_id or secrets.token_urlsafe(16)
        self.token = token
        self.file_path = file_path
        self.created_by = created_by
        self.created_at = time.time()
        self.expires_at = expires_at
        self.password_hash = password_hash
        self.downloads_count = 0
        self.last_accessed = None
        self.is_active = True

    @staticmethod
    def gerar_token() -> str:
        """Gera token único de 8 caracteres"""
        chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
        return ''.join(secrets.choice(chars) for _ in range(8))

    def definir_senha(self, senha: str) -> None:
        """Define senha para o link"""
        self.password_hash = generate_password_hash(senha)

    def verificar_senha(self, senha: str) -> bool:
        """Verifica se a senha está correta"""
        if not self.password_hash:
            return True
        return check_password_hash(self.password_hash, senha)

    def esta_expirado(self) -> bool:
        """Verifica se o link expirou"""
        if not self.expires_at:
            return False
        return time.time() > self.expires_at

    def esta_valido(self) -> bool:
        """Verifica se o link está válido (ativo e não expirado)"""
        return self.is_active and not self.esta_expirado()

    def registrar_acesso(self) -> None:
        """Registra um acesso ao link"""
        self.downloads_count += 1
        self.last_accessed = time.time()

    def revogar(self) -> None:
        """Revoga o link (torna inativo)"""
        self.is_active = False

    @property
    def tem_senha(self) -> bool:
        """Verifica se o link tem senha"""
        return bool(self.password_hash)

    def to_dict(self) -> Dict[str, Any]:
        """Converte para dicionário"""
        return {
            'id': self.id,
            'token': self.token,
            'file_path': self.file_path,
            'created_by': self.created_by,
            'created_at': self.created_at,
            'expires_at': self.expires_at,
            'password_hash': self.password_hash,
            'downloads_count': self.downloads_count,
            'last_accessed': self.last_accessed,
            'is_active': self.is_active
        }

    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'SharedLink':
        """Cria instância a partir de dicionário"""
        link = cls(
            token=data['token'],
            file_path=data['file_path'],
            created_by=data['created_by'],
            expires_at=data.get('expires_at'),
            password_hash=data.get('password_hash'),
            link_id=data.get('id')
        )
        link.created_at = data.get('created_at', time.time())
        link.downloads_count = data.get('downloads_count', 0)
        link.last_accessed = data.get('last_accessed')
        link.is_active = data.get('is_active', True)
        return link


# Armazenamento em memória (simples e funcional)
# No futuro pode migrar para banco de dados SQLite
_shared_links: Dict[str, SharedLink] = {}
_token_to_id: Dict[str, str] = {}


def criar_link(
    file_path: str,
    created_by: str,
    expires_in_hours: Optional[int] = None,
    password: Optional[str] = None
) -> SharedLink:
    """Cria um novo link de compartilhamento"""
    token = SharedLink.gerar_token()

    # Garantir que o token é único
    while token in _token_to_id:
        token = SharedLink.gerar_token()

    expires_at = None
    if expires_in_hours:
        expires_at = time.time() + (expires_in_hours * 3600)

    link = SharedLink(
        token=token,
        file_path=file_path,
        created_by=created_by,
        expires_at=expires_at
    )

    if password:
        link.definir_senha(password)

    _shared_links[link.id] = link
    _token_to_id[token] = link.id

    return link


def buscar_por_token(token: str) -> Optional[SharedLink]:
    """Busca link por token"""
    link_id = _token_to_id.get(token)
    if not link_id:
        return None
    return _shared_links.get(link_id)


def buscar_por_id(link_id: str) -> Optional[SharedLink]:
    """Busca link por ID"""
    return _shared_links.get(link_id)


def listar_links_usuario(username: str) -> list:
    """Lista todos os links de um usuário"""
    return [
        link for link in _shared_links.values()
        if link.created_by == username
    ]


def revogar_link(link_id: str, username: str) -> bool:
    """Revoga um link (apenas o dono pode revogar)"""
    link = _shared_links.get(link_id)
    if not link or link.created_by != username:
        return False

    link.revogar()
    return True


def limpar_links_expirados() -> int:
    """Remove links expirados da memória (limpeza periódica)"""
    removidos = 0
    for link_id in list(_shared_links.keys()):
        link = _shared_links[link_id]
        if link.esta_expirado() and not link.is_active:
            del _shared_links[link_id]
            del _token_to_id[link.token]
            removidos += 1
    return removidos
