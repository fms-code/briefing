#!/usr/bin/env python3
"""Troca uma foto nos três protótipos de uma vez.

    python3 trocar-foto.py principal  ~/Downloads/nova-foto.jpg
    python3 trocar-foto.py caso2      ~/Downloads/caso-novo.png
    python3 trocar-foto.py feedback3  ~/Downloads/print.png

Slots: principal, caso1, caso2, caso3, feedback1, feedback2, feedback3

O retrato é recortado em 3:4 automaticamente. Se o rosto ficar fora de
enquadramento, desloque o recorte para os lados:

    python3 trocar-foto.py principal foto.jpg --x 0.62     (0 = esquerda, 1 = direita)

Só precisa do Pillow:  pip install pillow
"""
import argparse, base64, io, pathlib, re, sys

try:
    from PIL import Image
except ImportError:
    sys.exit('Falta o Pillow. Rode:  pip install pillow')

SLOTS = ['principal', 'caso1', 'caso2', 'caso3', 'feedback1', 'feedback2', 'feedback3']
ARQUIVOS = ['index.html', 'curvas.html', 'editorial.html']
PASTA = pathlib.Path(__file__).parent


def preparar(caminho, slot, x):
    im = Image.open(caminho)

    if slot == 'principal':
        # recorte 3:4 na altura cheia, deslocável na horizontal
        alvo = im.height * 0.75
        if alvo <= im.width:
            esq = max(0, min(im.width - alvo, (im.width - alvo) * x * 2))
            im = im.crop((int(esq), 0, int(esq + alvo), im.height))
        else:  # imagem estreita: recorta na vertical
            alt = im.width / 0.75
            topo = max(0, (im.height - alt) * 0.25)
            im = im.crop((0, int(topo), im.width, int(topo + alt)))
        im = im.resize((760, 1013), Image.LANCZOS)
    else:
        # casos e prints entram inteiros (object-fit: contain), só limita o tamanho
        im.thumbnail((1100, 1100), Image.LANCZOS)

    if im.mode in ('RGBA', 'P', 'LA'):
        fundo = Image.new('RGB', im.size, (255, 255, 255))
        im = im.convert('RGBA')
        fundo.paste(im, mask=im.split()[-1])
        im = fundo

    buf = io.BytesIO()
    im.save(buf, 'JPEG', quality=84, optimize=True)
    return 'data:image/jpeg;base64,' + base64.b64encode(buf.getvalue()).decode(), len(buf.getvalue())


def main():
    ap = argparse.ArgumentParser(description='Troca uma foto nos três protótipos.')
    ap.add_argument('slot', choices=SLOTS)
    ap.add_argument('imagem')
    ap.add_argument('--x', type=float, default=0.5,
                    help='posição horizontal do recorte do retrato: 0 esquerda, 0.5 centro, 1 direita')
    a = ap.parse_args()

    if not pathlib.Path(a.imagem).exists():
        sys.exit(f'Não achei o arquivo: {a.imagem}')

    uri, tamanho = preparar(a.imagem, a.slot, a.x)
    print(f'{a.slot}: {tamanho/1024:.0f} KB')

    padrao = re.compile(r'(<img data-slot="' + a.slot + r'"[^>]*?src=")[^"]*(")')
    for nome in ARQUIVOS:
        arq = PASTA / nome
        if not arq.exists():
            print(f'  {nome}: não encontrado, pulei'); continue
        texto = arq.read_text(encoding='utf-8')
        novo, n = padrao.subn(lambda m: m.group(1) + uri + m.group(2), texto)
        if n != 1:
            sys.exit(f'  {nome}: encontrei {n} slots "{a.slot}", esperava 1. Nada foi alterado.')
        arq.write_text(novo, encoding='utf-8')
        print(f'  {nome}: trocado')

    print('\nPronto. Recarregue a página no navegador (Ctrl+Shift+R).')


if __name__ == '__main__':
    main()
