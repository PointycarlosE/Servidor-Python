# app/auth/models.py
from werkzeug.security import check_password_hash
import os

class User:
    """Modelo de usuário seguro"""

    def __init__(self, username, nome=None, password_hash=None, tema='light'):
        self.username = username
        self.nome = nome if nome else username  # Se não tiver nome, usa o username
        self.password_hash = password_hash
        self.tema = tema  # Preferência de tema: 'light' ou 'dark'
        self._is_authenticated = True
        self._is_active = True
        self._is_anonymous = False
    
    def get_id(self):
        return self.username
    
    def check_password(self, password):
        """Verifica se a senha está correta usando hash"""
        if not self.password_hash:
            return False
        return check_password_hash(self.password_hash, password)
    
    @staticmethod
    def get(username):
        """Busca usuário pelo nome"""
        admin_username = os.environ.get('ADMIN_USERNAME', 'admin')
        admin_nome = os.environ.get('ADMIN_NOME', admin_username)
        admin_password_hash = os.environ.get('ADMIN_PASSWORD_HASH', '')
        admin_tema = os.environ.get('ADMIN_TEMA', 'light')  # Tema do usuário

        if username == admin_username:
            return User(admin_username, admin_nome, admin_password_hash, admin_tema)
        return None
    
    @property
    def is_authenticated(self):
        """Read-only: usuário sempre autenticado após login"""
        return self._is_authenticated

    @property
    def is_active(self):
        """Read-only: usuário sempre ativo no sistema"""
        return self._is_active

    @property
    def is_anonymous(self):
        """Read-only: usuário nunca é anônimo após login"""
        return self._is_anonymous