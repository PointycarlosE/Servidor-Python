# app/utils/totp.py
import pyotp
import qrcode
import io
import base64
import secrets


def gerar_secret_2fa() -> str:
    """Gera secret aleatório para TOTP"""
    return pyotp.random_base32()


def gerar_qrcode_2fa(username: str, secret: str) -> str:
    """Gera QR code como base64 para exibir no HTML"""
    totp = pyotp.TOTP(secret)
    uri = totp.provisioning_uri(
        name=username,
        issuer_name='Meu Drive Pessoal'
    )

    # Gera QR code
    qr = qrcode.QRCode(version=1, box_size=10, border=4)
    qr.add_data(uri)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Converte para base64
    buffer = io.BytesIO()
    img.save(buffer, format='PNG')
    buffer.seek(0)
    img_base64 = base64.b64encode(buffer.getvalue()).decode()

    return f"data:image/png;base64,{img_base64}"


def verificar_codigo_2fa(secret: str, codigo: str) -> bool:
    """Verifica se código TOTP está correto"""
    if not secret or not codigo:
        return False

    totp = pyotp.TOTP(secret)
    # valid_window=1 aceita 1 código anterior/posterior (tolerância de ~30s)
    return totp.verify(codigo, valid_window=1)


def gerar_codigos_backup() -> list:
    """Gera 10 códigos de backup de 8 caracteres hexadecimais"""
    return [secrets.token_hex(4).upper() for _ in range(10)]
