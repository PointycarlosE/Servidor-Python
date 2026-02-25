from flask import Flask, render_template, redirect, url_for, abort
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
@app.route('/explorar/')
@app.route('/explorar/<path:caminho>')
def explorar(caminho=""):

    # Garante que o caminho seja absoluto e seguro
    pasta_atual = os.path.abspath(os.path.join(PASTA_BASE, caminho))

    # 🔒 Impede sair da pasta base
    if not pasta_atual.startswith(PASTA_BASE):
        abort(403)

    # Verifica se existe
    if not os.path.exists(pasta_atual):
        abort(404)

    # Se não for diretório, não permite abrir
    if not os.path.isdir(pasta_atual):
        abort(404)

    itens = os.listdir(pasta_atual)

    pastas = []
    arquivos = []

    for item in itens:
        caminho_item = os.path.join(pasta_atual, item)
        if os.path.isdir(caminho_item):
            pastas.append(item)
        else:
            arquivos.append(item)

    # Define pasta pai para botão "voltar"
    if caminho == "":
        pasta_pai = None
    else:
        pasta_pai = os.path.dirname(caminho)

    return render_template(
        'explorar.html',
        pastas=pastas,
        arquivos=arquivos,
        caminho=caminho,
        pasta_pai=pasta_pai
    )

if __name__ == '__main__':
    app.run(debug=True)