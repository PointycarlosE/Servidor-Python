# app/email.py
from flask_mail import Mail, Message
from flask import current_app, render_template
from threading import Thread

mail = Mail()


def send_async_email(app, msg):
    """Envia email em background para não bloquear requisição"""
    with app.app_context():
        try:
            mail.send(msg)
        except Exception as e:
            app.logger.error(f"Erro ao enviar email: {e}")


def send_email(subject, recipients, text_body, html_body):
    """Envia email com versão texto e HTML"""
    try:
        msg = Message(subject, recipients=recipients)
        msg.body = text_body
        msg.html = html_body

        # Envia em thread separada para não bloquear
        Thread(
            target=send_async_email,
            args=(current_app._get_current_object(), msg)
        ).start()
    except Exception as e:
        current_app.logger.error(f"Erro ao preparar email: {e}")
