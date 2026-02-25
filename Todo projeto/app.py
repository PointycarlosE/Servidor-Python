from flask import Flask, render_template, redirect, url_for, abort, send_from_directory, request
from werkzeug.utils import secure_filename
import shutil
import os

app = Flask(__name__)

# Defina a pasta base corretamente
PASTA_BASE = os.path.abspath("C:/Users")

# -------- HOME --------
@app.route('/')
def home():
    return render_template('home.html')

# -------- PAGINA DE OBJETIVOS --------
@app.route('/objetivos')
def objetivos():
    return render_template('objetivos.html')

# -------- EXPLORADOR --------
from flask import Flask, render_template, abort
import os

@app.route('/explorar/')
@app.route('/explorar/<path:caminho>')
def explorar(caminho=""):
    try:
        # 🔒 Monta caminho absoluto
        pasta_atual = os.path.abspath(os.path.join(PASTA_BASE, caminho))

        # 🔐 Segurança: impedir sair da pasta base
        if os.path.commonpath([PASTA_BASE, pasta_atual]) != PASTA_BASE:
            abort(403)

        # ❌ Pasta não existe
        if not os.path.exists(pasta_atual):
            return render_template("erro.html", 
                                   mensagem="Pasta não encontrada."), 404

        # ❌ Não é uma pasta (é arquivo)
        if not os.path.isdir(pasta_atual):
            return render_template("erro.html", 
                                   mensagem="O caminho não é uma pasta."), 400

        # 📂 Tenta listar conteúdo (pode dar PermissionError)
        itens = os.listdir(pasta_atual)

        pastas = []
        arquivos = []
        imagens = []
        audios = []

        exetensoes_imagens= ('.png','.jpg','.jpeg','.gif','.webp','.bmp')
        extensoes_audio = ('.mp3', '.wav', '.ogg', '.m4a', '.flac')

        for item in itens:
            caminho_item = os.path.join(pasta_atual, item)
            if os.path.isdir(caminho_item):
                pastas.append(item)
            else:
                nome_lower = item.lower()
                if nome_lower.endswith(exetensoes_imagens):
                    imagens.append(item)
                elif nome_lower.endswith(extensoes_audio):
                    audios.append(item)
                else:
                    arquivos.append(item)

        # 🔙 Pasta pai
        pasta_pai = os.path.dirname(caminho) if caminho else None

        return render_template(
            'explorar.html',
            pastas=pastas,
            arquivos=arquivos,
            imagens=imagens,
            audios=audios,
            caminho=caminho,
            pasta_pai=pasta_pai
        )

    except PermissionError:
        return render_template("erro.html", 
                               mensagem="Acesso negado: você não tem permissão para acessar esta pasta."), 403

    except Exception as e:
        # Captura qualquer erro inesperado
        return render_template("erro.html", 
                               mensagem=f"Erro inesperado: {str(e)}"), 500
# --- Downloads ---
@app.route('/download/<path:caminho_arquivo>')
def download(caminho_arquivo):
    # Caminho absoluto do arquivo
    caminho_completo = os.path.abspath(os.path.join(PASTA_BASE, caminho_arquivo))

    # Segurança: impede sair da pasta base
    if not caminho_completo.startswith(PASTA_BASE):
        abort(403)

    # Verifica se o arquivo existe
    if not os.path.exists(caminho_completo):
        abort(404)

    # Verifica se é arquivo (não pasta)
    if not os.path.isfile(caminho_completo):
        abort(404)

    # Pasta do arquivo
    pasta = os.path.dirname(caminho_completo)
    nome_arquivo = os.path.basename(caminho_completo)

    # Envia o arquivo para download
    return send_from_directory(pasta, nome_arquivo, as_attachment=True)

# -------- UPLOAD DE ARQUIVOS --------
@app.route('/upload/<path:caminho>', methods=['POST'])
@app.route('/upload/', defaults={'caminho': ''}, methods=['POST'])
def upload(caminho):
    pasta_destino = os.path.abspath(os.path.join(PASTA_BASE, caminho))

    # 🔐 Segurança: impedir sair da pasta base
    if os.path.commonpath([PASTA_BASE, pasta_destino]) != PASTA_BASE:
        abort(403)

    if not os.path.exists(pasta_destino) or not os.path.isdir(pasta_destino):
        abort(400)

    if 'arquivo' not in request.files:
        return "Nenhum arquivo enviado", 400

    arquivo = request.files['arquivo']

    if arquivo.filename == '':
        return "Arquivo inválido", 400

    #  Remove caracteres perigosos do nome
    nome_seguro = secure_filename(arquivo.filename)

    caminho_final = os.path.join(pasta_destino, nome_seguro)

    #  Evita sobrescrever arquivos existentes
    contador = 1
    nome_base, extensao = os.path.splitext(nome_seguro)

    while os.path.exists(caminho_final):
        novo_nome = f"{nome_base}_{contador}{extensao}"
        caminho_final = os.path.join(pasta_destino, novo_nome)
        contador += 1

    arquivo.save(caminho_final)

    return redirect(url_for('explorar', caminho=caminho))

# -------- DELETAR ARQUIVO --------
@app.route('/deletar/<path:caminho_arquivo>', methods=['POST'])
def deletar_arquivo(caminho_arquivo):
    # Caminho absoluto do arquivo
    caminho_completo = os.path.abspath(os.path.join(PASTA_BASE, caminho_arquivo))

    # 🔐 Segurança: impedir sair da pasta base
    if os.path.commonpath([PASTA_BASE, caminho_completo]) != PASTA_BASE:
        abort(403)

    # Verifica se existe
    if not os.path.exists(caminho_completo):
        abort(404)

    # Verifica se é arquivo (não pasta)
    if not os.path.isfile(caminho_completo):
        return "Isso não é um arquivo", 400

    try:
        os.remove(caminho_completo)  # 🗑️ Apaga o arquivo
    except PermissionError:
        return "Sem permissão para deletar este arquivo", 403

    # Volta para a pasta onde o arquivo estava
    pasta_relativa = os.path.dirname(caminho_arquivo)

    return redirect(url_for('explorar', caminho=pasta_relativa))

# -------- CRIAR PASTA --------
@app.route('/criar_pasta/<path:caminho>', methods=['POST'])
@app.route('/criar_pasta/', defaults={'caminho': ''}, methods=['POST'])
def criar_pasta(caminho):
    pasta_atual = os.path.abspath(os.path.join(PASTA_BASE, caminho))

    # 🔐 Segurança: impedir sair da pasta base
    if os.path.commonpath([PASTA_BASE, pasta_atual]) != PASTA_BASE:
        abort(403)

    # Verifica se a pasta atual existe
    if not os.path.exists(pasta_atual) or not os.path.isdir(pasta_atual):
        abort(400)

    # Pega o nome da nova pasta do formulário
    nome_pasta = request.form.get('nome_pasta')

    if not nome_pasta:
        return "Nome da pasta inválido", 400

    # Remove caracteres perigosos (segurança)
    from werkzeug.utils import secure_filename
    nome_seguro = secure_filename(nome_pasta)

    # Caminho final da nova pasta
    nova_pasta = os.path.join(pasta_atual, nome_seguro)

    try:
        os.mkdir(nova_pasta)  # cria a pasta
    except FileExistsError:
        return "A pasta já existe", 400
    except PermissionError:
        return "Sem permissão para criar pasta aqui", 403

    # Redireciona de volta para a pasta atual
    return redirect(url_for('explorar', caminho=caminho))

# -------- DELETAR PASTA --------
@app.route('/deletar_pasta/<path:caminho_pasta>', methods=['POST'])
def deletar_pasta(caminho_pasta):
    # Caminho absoluto da pasta
    pasta_completa = os.path.abspath(os.path.join(PASTA_BASE, caminho_pasta))

    # 🔐 Segurança: impedir sair da pasta base
    if os.path.commonpath([PASTA_BASE, pasta_completa]) != PASTA_BASE:
        abort(403)

    # Verifica se existe
    if not os.path.exists(pasta_completa):
        abort(404)

    # Verifica se realmente é uma pasta
    if not os.path.isdir(pasta_completa):
        return "Isso não é uma pasta", 400

    try:
        # 🗑️ Deleta a pasta e TUDO dentro dela
        shutil.rmtree(pasta_completa)
    except PermissionError:
        return "Sem permissão para deletar esta pasta", 403

    # Volta para a pasta pai
    pasta_pai = os.path.dirname(caminho_pasta)

    return redirect(url_for('explorar', caminho=pasta_pai))
# -------- VISUALIZAR ARQUIVO --------
@app.route('/visualizar/<path:caminho_arquivo>')
def visualizar_arquivo(caminho_arquivo):
    caminho_completo = os.path.abspath(os.path.join(PASTA_BASE, caminho_arquivo))

    # 🔐 Segurança: impedir sair da pasta base
    if os.path.commonpath([PASTA_BASE, caminho_completo]) != PASTA_BASE:
        abort(403)

    # Verifica se existe
    if not os.path.exists(caminho_completo):
        abort(404)

    # Verifica se é arquivo
    if not os.path.isfile(caminho_completo):
        abort(404)

    pasta = os.path.dirname(caminho_completo)
    nome_arquivo = os.path.basename(caminho_completo)

    # 👁️ Envia para visualização (NÃO download)
    return send_from_directory(pasta, nome_arquivo, as_attachment=False)

if __name__ == '__main__':
    app.run(debug=True)