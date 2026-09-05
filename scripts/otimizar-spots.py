#!/usr/bin/env python3
"""
Otimizador de fotos dos spots — Happy Soaring
=============================================

Pega nas fotos originais (o que sai do telemóvel ou do drone, com 2 a 6 MB) e
prepara-as para a web: uma medida só, em WebP, com o nome já pronto para o CMS.

    python scripts/otimizar-spots.py <pasta-ou-ficheiro> [--saida images/spots]

    "Happy Soaring lagoa de albufeira.jpg"  ->  lagoa-de-albufeira.webp
    "Praia das Bicas 2.jpg"                 ->  praia-das-bicas-2.webp

--simular mostra o que faria sem escrever nada.

PORQUE E QUE E UMA MEDIDA SO, E NAO DUAS COMO NAS ASAS
  Nas asas ha `-card` porque a grelha mostra 22 produtos ao mesmo tempo e a
  diferenca entre 600 e 1200 px multiplicada por 22 conta. Aqui a mesma
  fotografia serve a peca da grelha e o popup: a peca corta-a com
  `object-fit`, o popup mostra-a inteira. Um ficheiro por spot em vez de dois
  significa que o CMS carrega uma imagem e acabou — sem ninguem ter de se
  lembrar de gerar a segunda. E o que fecha o ciclo de edicao.

  O preco e a peca descarregar ~250 KB em vez de ~85. Sao 165 KB por spot,
  numa seccao que carrega em diferido e esta abaixo da dobra.

O TECTO
  1000 px de largura e qualidade 80 poem uma fotografia de 5 MB em ~250 KB.
  A verificacao 15 recusa qualquer imagem de spot acima de 400 KB — e por isso
  que este script existe e nao e opcional.
"""
import sys, os, re, unicodedata
from PIL import Image

LARGURA = 1000
QUALIDADE = 80
TECTO_KB = 400


def slug(s):
    s = unicodedata.normalize('NFD', str(s))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return re.sub(r'-+', '-', s)


def nome_limpo(f):
    """tira o prefixo da marca, que nao diz nada no nome do ficheiro"""
    base = os.path.splitext(os.path.basename(f))[0]
    base = re.sub(r'^\s*happy\s*soaring\s*', '', base, flags=re.I)
    return slug(base)


def main():
    args = [a for a in sys.argv[1:] if not a.startswith('--')]
    simular = '--simular' in sys.argv
    saida = 'images/spots'
    if '--saida' in sys.argv:
        saida = sys.argv[sys.argv.index('--saida') + 1]
    if not args:
        print(__doc__)
        return 1

    origem = args[0]
    if os.path.isdir(origem):
        fichs = [os.path.join(origem, f) for f in sorted(os.listdir(origem))
                 if re.search(r'\.(jpe?g|png|webp)$', f, re.I)]
    else:
        fichs = [origem]
    if not fichs:
        print('  nada para converter em %s' % origem)
        return 1

    if not simular:
        os.makedirs(saida, exist_ok=True)

    print('-' * 74)
    antes = depois = 0
    for caminho in fichs:
        nome = nome_limpo(caminho)
        im = Image.open(caminho).convert('RGB')
        tam = os.path.getsize(caminho)
        antes += tam

        alvo = im
        if im.width > LARGURA:
            alvo = im.resize((LARGURA, round(im.height * LARGURA / im.width)),
                             Image.LANCZOS)
        destino = os.path.join(saida, nome + '.webp')
        if simular:
            print('  %-40s -> %s  %dx%d' % (os.path.basename(caminho),
                                            nome + '.webp', alvo.width, alvo.height))
            continue

        alvo.save(destino, 'WEBP', quality=QUALIDADE, method=6)
        kb = os.path.getsize(destino) / 1024
        depois += os.path.getsize(destino)
        aviso = '' if kb <= TECTO_KB else '   ! acima do tecto de %d KB' % TECTO_KB
        print('  %-40s -> %-28s %4dx%-4d %5.0f KB%s' % (
            os.path.basename(caminho), nome + '.webp', alvo.width, alvo.height, kb, aviso))

    print('-' * 74)
    if simular:
        print('  Simulacao: nada foi escrito.')
    elif antes:
        print('  %.1f MB  ->  %.1f MB   (%.0f%% do original)' % (
            antes / 1048576, depois / 1048576, depois / antes * 100))
    return 0


if __name__ == '__main__':
    sys.exit(main())
