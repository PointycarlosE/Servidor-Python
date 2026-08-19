# 📧 Como Configurar Email no Meu Drive Pessoal

Este guia explica como configurar o envio de emails para recuperação de senha, notificações de login e autenticação de dois fatores.

---

## 📋 Pré-requisitos

Você precisará de:
- Uma conta de email (Gmail, Outlook ou servidor SMTP próprio)
- Acesso às configurações de segurança da conta
- As credenciais SMTP do provedor

---

## 🔧 Configuração por Provedor

### Gmail (Recomendado)

**1. Ativar verificação em 2 etapas:**
- Acesse: https://myaccount.google.com/security
- Clique em "Verificação em duas etapas" e ative

**2. Gerar senha de app:**
- Acesse: https://myaccount.google.com/apppasswords
- Selecione "App: Email" e "Dispositivo: Outro (nome personalizado)"
- Digite "Meu Drive" e clique em "Gerar"
- Copie a senha de 16 caracteres gerada

**3. Configurar no `.env`:**
```env
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@gmail.com
MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx
MAIL_DEFAULT_SENDER=seu-email@gmail.com
```

---

### Outlook / Hotmail

**1. Permitir acesso de apps menos seguros (se necessário):**
- Acesse: https://account.live.com/activity
- Vá em "Segurança" → "Opções de segurança avançadas"
- Ative "Permitir aplicativos que usam autenticação menos segura"

**2. Configurar no `.env`:**
```env
MAIL_SERVER=smtp-mail.outlook.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=seu-email@outlook.com
MAIL_PASSWORD=sua-senha-normal
MAIL_DEFAULT_SENDER=seu-email@outlook.com
```

---

### Servidor SMTP Customizado

Se você tem um domínio próprio com servidor SMTP:

```env
MAIL_SERVER=mail.seudominio.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=noreply@seudominio.com
MAIL_PASSWORD=sua-senha
MAIL_DEFAULT_SENDER=noreply@seudominio.com
```

**Portas comuns:**
- `587`: TLS/STARTTLS (recomendado)
- `465`: SSL
- `25`: Sem criptografia (não recomendado)

Para SSL (porta 465), use:
```env
MAIL_PORT=465
MAIL_USE_TLS=False
MAIL_USE_SSL=True
```

---

## 🚀 Instalação das Dependências

Instale as bibliotecas necessárias:

```bash
pip install -r requirements.txt
```

Ou manualmente:

```bash
pip install Flask-Mail pyotp qrcode[pil] Pillow pytz
```

---

## ✅ Testando a Configuração

Após configurar, teste o envio de emails:

1. **Teste de recuperação de senha:**
   - Acesse `/login`
   - Clique em "Esqueceu a senha?"
   - Digite seu email
   - Verifique se recebeu o email

2. **Teste de notificação de login:**
   - Faça login normalmente
   - Verifique se recebeu email de notificação

3. **Teste de 2FA (opcional):**
   - Acesse `/perfil`
   - Clique em "Ativar 2FA"
   - O QR code deve aparecer

---

## 🔍 Solução de Problemas

### Email não está sendo enviado

**1. Verifique os logs:**
```bash
# Os erros aparecem no terminal onde o servidor está rodando
python run.py
```

**2. Credenciais incorretas:**
- Gmail: certifique-se de usar senha de app, não a senha normal
- Outlook: verifique se apps menos seguros estão permitidos
- SMTP customizado: teste credenciais com telnet ou ferramenta SMTP

**3. Firewall/Porta bloqueada:**
- Alguns provedores de internet bloqueiam porta 587
- Tente usar porta 465 com SSL
- Em VPS/servidor: verifique regras de firewall

**4. Gmail: "Acesso menos seguro bloqueado":**
- Use senha de app (passo 2 da configuração Gmail)
- Nunca use sua senha normal do Gmail

### Email vai para spam

Para evitar que emails caiam no spam:

1. **Use domínio próprio:**
   - Emails de domínios conhecidos (Gmail, Outlook) têm mais chance de ser aceitos
   - Configure SPF, DKIM e DMARC no seu domínio

2. **Conteúdo do email:**
   - Os templates já estão otimizados
   - Evite editar o HTML dos emails sem conhecimento

3. **Volume de envios:**
   - Gmail/Outlook limitam envios por dia
   - Para volume alto, use serviços como SendGrid, Mailgun, Amazon SES

---

## 📊 Limites de Envio

### Gmail
- **Gratuito:** 500 emails/dia
- **Google Workspace:** 2000 emails/dia

### Outlook
- **Gratuito:** 300 emails/dia
- **Office 365:** Variável conforme plano

### Recomendações
- Para aplicação pessoal/pequena: Gmail/Outlook são suficientes
- Para uso intenso: considere serviços dedicados (SendGrid, Mailgun, SES)

---

## 🔐 Segurança

### Boas Práticas

1. **Nunca comite o `.env`:**
   - O arquivo `.env` contém senhas
   - Já está no `.gitignore`
   - Use `.env.example` para documentar

2. **Use senhas de app:**
   - Gmail: sempre use senha de app
   - Nunca use sua senha principal

3. **Proteja o servidor:**
   - Em produção, use HTTPS
   - Configure firewall adequadamente

4. **Rotação de senhas:**
   - Troque senhas de app periodicamente
   - Se vazarem, revogue imediatamente

---

## 🎯 Próximos Passos

Após configurar email, você pode:

1. ✅ **Recuperar senha** quando esquecer
2. ✅ **Receber notificações** de login
3. ✅ **Ativar 2FA** para maior segurança

Para ativar 2FA:
1. Instale Google Authenticator ou Microsoft Authenticator no celular
2. Acesse `/perfil`
3. Clique em "Ativar 2FA"
4. Escaneie o QR code
5. Guarde os códigos de backup em local seguro

---

## 📚 Recursos Adicionais

- **Gmail App Passwords:** https://support.google.com/accounts/answer/185833
- **Outlook Security:** https://support.microsoft.com/account-billing
- **Flask-Mail Docs:** https://flask-mail.readthedocs.io/
- **SMTP Test Tool:** https://www.smtper.net/

---

**Criado em:** 2026-08-19  
**Versão:** 1.0
