"""Separa folhas de cores da Flow em fotos individuais, sem legendas.

Regras do documento:
  - fundo branco removido por preenchimento a partir dos 4 cantos (o branco de
    dentro da asa não se perde)
  - erosão de 2 px, para cortar a franja de compressão do JPEG
  - legendas apagadas SEMPRE; aqui procura-se a banda horizontal vazia que
    separa as asas das legendas e corta-se aí
"""
from PIL import Image, ImageDraw, ImageFilter
import numpy as np, os


def alfa_de(rgb, tol=42):
    """Branco ligado às bordas -> transparente. O interior branco fica."""
    marca = rgb.copy()
    w, h = marca.size
    for p in [(0, 0), (w - 1, 0), (0, h - 1), (w - 1, h - 1)]:
        ImageDraw.floodfill(marca, p, (255, 0, 255), thresh=tol)
    a = np.array(marca)
    fundo = (a[:, :, 0] > 245) & (a[:, :, 1] < 12) & (a[:, :, 2] > 245)
    m = Image.fromarray(np.where(fundo, 0, 255).astype('uint8'), 'L')
    m = m.filter(ImageFilter.MinFilter(3)).filter(ImageFilter.MinFilter(3))
    return m.filter(ImageFilter.GaussianBlur(0.7))


def linha_da_legenda(op):
    """Devolve a linha onde a banda das legendas começa, ou None.

    Procura, na metade de baixo, uma faixa de linhas vazias com pelo menos 12 px
    e conteúdo depois dela — é o intervalo entre as asas e as legendas.
    """
    h = op.shape[0]
    porLinha = op.sum(axis=1)
    vazias, ini = [], None
    for y in range(h // 2, h):
        if porLinha[y] == 0:
            if ini is None:
                ini = y
        else:
            if ini is not None and y - ini >= 12:
                vazias.append((ini, y))
            ini = None
    for a, b in vazias:
        if porLinha[b:].sum() > 0:       # há mesmo coisas depois: é a legenda
            return a
    return None


def grupos_de_colunas(op, folga=40):
    cols = np.where(op.any(axis=0))[0]
    if not len(cols):
        return []
    g, ini, ant = [], cols[0], cols[0]
    for c in cols[1:]:
        if c - ant > folga:
            g.append((int(ini), int(ant)))
            ini = c
        ant = c
    g.append((int(ini), int(ant)))
    return [x for x in g if x[1] - x[0] > 60]


def trata(caminho, chave, cores, saida='images/asas'):
    """As asas encostam-se e não se separam sozinhas; as legendas por baixo,
    essas, estão sempre bem afastadas. Usam-se os centros das legendas para
    calcular onde cortar as asas."""
    im = Image.open(caminho).convert('RGB')
    al = alfa_de(im)
    op = np.array(al) > 40

    corte = linha_da_legenda(op)
    if corte is None:
        print('  ! %s: nao encontrei a banda das legendas' % chave)
        return False

    legenda = op[corte:, :]
    gl = grupos_de_colunas(legenda, folga=30)
    if len(gl) != len(cores):
        print('  ! %s: %d legendas para %d cores %s' % (chave, len(gl), len(cores), gl))
        return False

    centros = [(a + b) // 2 for a, b in gl]

    # As asas são mais largas do que o espaçamento das legendas: cortar no ponto
    # médio decepa a ponta da asa. Procura-se o vale real — a coluna com menos
    # conteúdo — numa janela à volta desse ponto.
    asas = op[:corte, :]
    porCol = asas.sum(axis=0)
    limites = [0]
    for i in range(len(centros) - 1):
        m = (centros[i] + centros[i + 1]) // 2
        jan = range(max(1, m - 300), min(len(porCol) - 1, m + 300))
        limites.append(min(jan, key=lambda x: (porCol[x], abs(x - m))))
    limites.append(im.width)

    al = al.crop((0, 0, al.width, corte))
    im = im.crop((0, 0, im.width, corte))
    rgba = im.convert('RGBA')
    rgba.putalpha(al)

    for i, cor in enumerate(cores):
        parte = rgba.crop((limites[i], 0, limites[i + 1], rgba.height))
        bb = parte.split()[3].getbbox()
        if not bb:
            print('  ! %s/%s: vazio' % (chave, cor)); return False
        parte = parte.crop(bb)
        for suf, larg in [('', 1200), ('-card', 600)]:
            r = parte.resize((larg, round(parte.height * larg / parte.width)), Image.LANCZOS)
            r.save(os.path.join(saida, chave + '__' + cor + suf + '.webp'),
                   'WEBP', quality=84, method=6)
    print('  %-14s %d cores: %-30s legenda na linha %d' %
          (chave, len(cores), ', '.join(cores), corte))
    return True
