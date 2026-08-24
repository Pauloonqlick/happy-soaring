#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Recolorir asas — Happy Soaring
==============================

Gera uma imagem da asa por cada cor de tecido da Flow, a partir de UMA foto
original. Corre uma vez, offline; o site limita-se a trocar o ficheiro.

Porque offline e nao no browser: as cores sao 18, nao infinitas. Assim nao ha
trabalho nenhum por clique, funciona em qualquer telemovel, e — o que mais
importa — da para abrir as 18 e corrigir as que sairem mal antes de alguem as
ver.

COMO A ZONA A MUDAR E ESCOLHIDA
  Nao ha mascara desenhada a mao. A zona da cor base escolhe-se pela SATURACAO:
  preto, branco, cinzento, costuras e o logotipo nao tem matiz nenhum, por isso
  ficam de fora sozinhos. A mascara e suave nas bordas, senao via-se o recorte.

COMO AS SOMBRAS SE MANTEM
  Nao se troca so o matiz. Mede-se a mediana da zona base e mapeia-se para a
  cor de destino, mantendo a variacao relativa de cada pixel. E isto que evita
  o erro classico: trocar rosa (tom medio) por amarelo (intrinsecamente claro)
  mantendo o brilho 1:1 da um amarelo acastanhado e sujo.

Uso:
    python scripts/recolorir-asa.py <foto> <chave-da-asa> [--so <ref>] [--sat 40]
Ex.:
    python scripts/recolorir-asa.py images/asas/mullet2__maui.webp mullet2 --so 317
"""
import sys, os, json, colorsys
import numpy as np
from PIL import Image, ImageFilter

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CORES = os.path.join(RAIZ, 'content', 'cores', 'flow-tecidos.json')
SAIDA = os.path.join(RAIZ, 'images', 'asas-cores')


def carrega_cores():
    return json.load(open(CORES, encoding='utf-8'))['cores']


def hsv_de_hex(h):
    h = h.lstrip('#')
    r, g, b = (int(h[i:i+2], 16) / 255.0 for i in (0, 2, 4))
    hh, ss, vv = colorsys.rgb_to_hsv(r, g, b)
    return hh * 255.0, ss * 255.0, vv * 255.0


def recolore(im, alvo_hex, sat_min=12.0, folga=26.0):
    """Devolve uma copia da imagem com a zona colorida trocada para alvo_hex."""
    a = np.array(im.convert('RGBA'))
    rgb = a[:, :, :3]
    alfa = a[:, :, 3]

    hsv = np.array(Image.fromarray(rgb, 'RGB').convert('HSV')).astype(np.float32)
    H, S, V = hsv[:, :, 0], hsv[:, :, 1], hsv[:, :, 2]

    op = alfa > 40
    # 1) O MATIZ BASE descobre-se da propria imagem: o pico do histograma
    #    entre os pixeis bem saturados. Assim isto serve qualquer asa, nao so
    #    uma rosa.
    fortes = op & (S > 90)
    if fortes.sum() < 500:
        raise SystemExit('ERRO: quase nao ha zona colorida nesta imagem.')
    hist = np.bincount(H[fortes].astype(int), minlength=256)
    h_base = float(np.argmax(hist))

    # 2) MASCARA = janela de matiz  x  rampa de saturacao.
    #    So a saturacao nao chega: as bordas onde o rosa encosta ao branco tem
    #    saturacao media e ficavam a meio caminho, deixando uma auréola rosada.
    #    So o matiz tambem nao chega: nos cinzentos o matiz e ruido.
    #    Cruzando os dois, a auréola converte-se e os neutros ficam intactos.
    d = np.abs(H - h_base)
    d = np.minimum(d, 256 - d)                       # o matiz da a volta
    f_matiz = np.clip((50.0 - d) / 20.0, 0.0, 1.0)   # cheio ate 30, zero aos 50

    #    Onde a base encosta a OUTRA COR saturada (o laranja e o amarelo da
    #    sunrise), os pixeis de mistura tem um matiz intermedio — 49, entre o
    #    turquesa 123 e o laranja 15 — que cai fora da janela e ficava por
    #    trocar: uma auréola turquesa a contornar cada risca, 3% da asa.
    #    Cresce-se a janela do matiz uns 2px para a engolir. Entrar 2px numa
    #    risca de 20 nao se ve; a auréola via-se toda.
    mi = Image.fromarray((f_matiz * 255).astype(np.uint8), 'L')
    mi = mi.filter(ImageFilter.MaxFilter(5)).filter(ImageFilter.GaussianBlur(0.8))
    f_matiz = np.asarray(mi).astype(np.float32) / 255.0

    #    A rampa da saturacao NAO cresce: e ela que protege os pretos, brancos e
    #    cinzentos, e crescida deixaria a tinta entrar-lhes pelas bordas.
    f_sat = np.clip((S - sat_min) / folga, 0.0, 1.0)
    m = f_matiz * f_sat
    m[alfa < 8] = 0.0

    forte = m > 0.85

    s_base = float(np.median(S[forte]))
    v_base = float(np.median(V[forte]))

    ht, st, vt = hsv_de_hex(alvo_hex)

    # 3) BRILHO — duas correccoes, ambas aprendidas a ver o resultado:
    #
    #    a) A cor de destino e o MEIO-TOM da asa, nao o seu ponto mais claro.
    #       Levar a mediana ate 254 (White 001) nao deixa margem nenhuma para os
    #       brilhos: saturam todos a 255 e a asa fica chapada, sem volume. O
    #       mesmo ao contrario no Black 102, que engolia os grafismos pretos.
    #       Por isso o alvo entra numa banda de trabalho.
    vt_ef = float(np.clip(vt, 46.0, 216.0))

    #    b) Mesmo dentro da banda, ninguem pode saturar: se o percentil 99 da
    #       zona passasse dos 250, encolhe-se a escala ate nao passar.
    escala = vt_ef / max(v_base, 1.0)
    v99 = float(np.percentile(V[forte], 99)) if forte.sum() else 255.0
    if v99 * escala > 250.0:
        escala = 250.0 / max(v99, 1.0)

    novo = hsv.copy()
    novo[:, :, 0] = ht
    # variacao relativa preservada em ambos os canais
    novo[:, :, 1] = np.clip(S * (st / max(s_base, 1.0)), 0, 255)
    novo[:, :, 2] = np.clip(V * escala, 0, 255)

    rec = np.array(Image.fromarray(novo.astype(np.uint8), 'HSV').convert('RGB')).astype(np.float32)

    m3 = m[:, :, None]
    saida = rgb.astype(np.float32) * (1 - m3) + rec * m3
    fora = np.dstack([saida.astype(np.uint8), alfa])
    return Image.fromarray(fora, 'RGBA')


def main():
    args = sys.argv[1:]
    if len(args) < 2:
        print(__doc__)
        sys.exit(1)
    foto, chave = args[0], args[1]
    # o esquema sai do proprio nome da foto (mullet2__maui.webp -> maui): cada
    # esquema tem as suas riscas, e uma cor custom so troca a BASE de cada um
    base = os.path.basename(foto)
    esquema = base.split('__')[1].split('.')[0] if '__' in base else 'base'
    so = args[args.index('--so') + 1] if '--so' in args else None
    sat = float(args[args.index('--sat') + 1]) if '--sat' in args else 12.0

    im = Image.open(os.path.join(RAIZ, foto)).convert('RGBA')
    os.makedirs(SAIDA, exist_ok=True)
    cores = [c for c in carrega_cores() if not so or c['ref'] == so]
    if not cores:
        sys.exit('ERRO: referencia "%s" nao existe na carta.' % so)

    print('%s  esquema "%s"  %dx%d  ->  %d cor(es)' % (foto, esquema, im.width, im.height, len(cores)))
    for c in cores:
        out = recolore(im, c['hex'], sat_min=sat)
        for suf, larg in [('', 1200), ('-card', 600)]:
            r = out.resize((larg, round(out.height * larg / out.width)), Image.LANCZOS)
            nome = '%s__%s__%s%s.webp' % (chave, esquema, c['ref'], suf)
            r.save(os.path.join(SAIDA, nome), 'WEBP', quality=84, method=6)
        kb = os.path.getsize(os.path.join(SAIDA, '%s__%s__%s.webp' % (chave, esquema, c['ref']))) / 1024
        print('  %-22s %-8s %5.1f KB' % (c['nome'], c['hex'], kb))


if __name__ == '__main__':
    main()
