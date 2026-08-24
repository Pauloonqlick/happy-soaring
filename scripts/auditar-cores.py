#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Auditar as asas recoloridas — Happy Soaring
===========================================

Corre depois de recolorir-asa.py e diz, sem ser preciso abrir 36 imagens, se
alguma saiu mal. Tres perguntas, cada uma nascida de um erro que aconteceu:

  QUEIMA     brilhos a 255. Deu-se com o White 001 quando a mediana subia
             demais e a asa ficava chapada.
  CHAPADA    desvio-padrao do brilho baixo demais: perdeu-se o volume.
  AUREOLA    a linha palida a contornar as riscas. Mede-se do LADO DA BASE da
             fronteira e so ai — a primeira versao deste medidor apanhava 3px
             das proprias riscas e comparava riscas com base, o que nao quer
             dizer nada e dava alarme em 12 de 18.

Uso:
    python scripts/auditar-cores.py <chave> <esquema>
Ex.:
    python scripts/auditar-cores.py mullet2 sunrise
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def hsv(a):
    return np.array(Image.fromarray(a[:, :, :3], 'RGB').convert('HSV')).astype(int)


def cresce(m, k):
    return np.array(Image.fromarray((m * 255).astype('uint8')).filter(ImageFilter.MaxFilter(k))) > 0


def main():
    if len(sys.argv) < 3:
        print(__doc__); sys.exit(1)
    chave, esquema = sys.argv[1], sys.argv[2]
    cores = json.load(open(os.path.join(RAIZ, 'content/cores/flow-tecidos.json'),
                           encoding='utf-8'))['cores']

    orig = os.path.join(RAIZ, 'images/asas/%s__%s.webp' % (chave, esquema))
    o = np.array(Image.open(orig).convert('RGBA'))
    ho = hsv(o)
    op = o[:, :, 3] > 40
    H, S = ho[:, :, 0], ho[:, :, 1]

    fortes = op & (S > 90)
    h_base = int(np.argmax(np.bincount(H[fortes], minlength=256)))
    d = np.minimum(np.abs(H - h_base), 256 - np.abs(H - h_base))
    base = op & (d < 30) & (S > 110)
    outra = op & (d > 60) & (S > 110)          # riscas de outra cor, se houver

    # o LADO DA BASE da fronteira: pixeis de base a menos de 3px de outra cor
    beira = base & cresce(outra, 7) if outra.sum() > 500 else None
    miolo = base & ~cresce(outra, 15) if outra.sum() > 500 else base

    print('%s / %s   base matiz %d   riscas %.1f%% da asa'
          % (chave, esquema, h_base, 100.0 * outra.sum() / op.sum()))
    print('%-22s %7s %10s %10s' % ('cor', 'queima', 'contraste', 'aureola'))
    mau = 0
    for c in cores:
        f = os.path.join(RAIZ, 'images/asas-cores/%s__%s__%s.webp' % (chave, esquema, c['ref']))
        try:
            n = np.array(Image.open(f).convert('RGBA').resize((o.shape[1], o.shape[0])))
        except Exception:
            print('%-22s  (ilegivel — a gerar?)' % c['nome']); mau += 1; continue
        hn = hsv(n)
        V = hn[:, :, 2]
        queima = 100.0 * float((op & (V >= 254)).sum()) / op.sum()
        contraste = float(V[op].std())
        aur = 0.0
        if beira is not None and beira.sum() > 100:
            aur = float(np.median(hn[:, :, 1][miolo]) - np.median(hn[:, :, 1][beira]))
        avisos = ''
        if queima > 3: avisos += ' QUEIMA'
        if contraste < 20: avisos += ' CHAPADA'
        if aur > 35: avisos += ' AUREOLA'
        if avisos: mau += 1
        print('%-22s %6.1f%% %10.1f %10.0f%s' % (c['nome'], queima, contraste, aur, avisos))
    print('\n  com problema: %d de %d' % (mau, len(cores)))


if __name__ == '__main__':
    main()
