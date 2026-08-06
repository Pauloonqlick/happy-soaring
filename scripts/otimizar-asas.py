#!/usr/bin/env python3
"""
Otimizador de fotos de asas — Happy Soaring
===========================================

Pega nas fotos originais (PNG grandes, com transparência) e prepara-as para a
web: recorta o espaço vazio à volta da asa, gera duas medidas e grava em WebP.

    grande  1200 px  -> painel de detalhe
    cartao   600 px  -> grelha de produtos

Nome de saída:  <modelo>__<cor>.webp   (duplo underscore separa modelo de cor)
    "ALBATROXX Lime.png"   ->  albatroxx__lime.webp
    "MULLET2 Sunrise.png"  ->  mullet2__sunrise.webp

Uso:
    python scripts/otimizar-asas.py <pasta-origem> [--saida images/asas] [--simular]

--simular mostra o que faria sem escrever nada.
"""
import sys, os, re, unicodedata
from PIL import Image

LARGURAS = {'': 1200, '-card': 600}
QUALIDADE = 82


def slug(s):
    s = unicodedata.normalize('NFD', str(s))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    s = re.sub(r'[^a-zA-Z0-9]+', '-', s).strip('-').lower()
    return s


def parte_nome(ficheiro):
    """'ALBATROXX Lime.png' -> ('albatroxx', 'lime')

    Separador preferido é ' - ', porque há modelos com espaço no nome
    ('MULLET 2 - Sunrise.png'). Sem ele, assume que a COR é a última palavra,
    o que funciona para 'MULLET 2 Sunrise.png' e 'ALBATROXX Lime.png'.
    Para cores de duas palavras usa sempre ' - '.
    """
    base = os.path.splitext(os.path.basename(ficheiro))[0]
    base = re.sub(r'\s*\(\d+\)\s*$', '', base).strip()      # tira "(1)" de duplicados
    if ' - ' in base:
        modelo, cor = base.split(' - ', 1)
    else:
        partes = base.rsplit(None, 1)                        # última palavra = cor
        if len(partes) < 2:
            return slug(base), ''
        modelo, cor = partes
    return slug(modelo), slug(cor)


def recorta(im):
    """Remove o espaço transparente à volta — as fotos vêm com muita margem vazia."""
    if im.mode != 'RGBA':
        return im
    caixa = im.split()[3].getbbox()
    return im.crop(caixa) if caixa else im


def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    origem = args[0]
    saida = args[args.index('--saida') + 1] if '--saida' in args else os.path.join('images', 'asas')
    simular = '--simular' in args

    if not os.path.isdir(origem):
        print('ERRO: pasta nao encontrada: ' + origem)
        sys.exit(1)
    if not simular:
        os.makedirs(saida, exist_ok=True)

    ficheiros = sorted(f for f in os.listdir(origem)
                       if f.lower().endswith(('.png', '.jpg', '.jpeg', '.webp')))
    if not ficheiros:
        print('Nenhuma imagem em ' + origem)
        sys.exit(1)

    print('=' * 74)
    print('  origem : %s  (%d imagens)' % (origem, len(ficheiros)))
    print('  saida  : %s%s' % (saida, '   [SIMULACAO]' if simular else ''))
    print('=' * 74)

    antes = depois = 0
    vistos = {}
    for f in ficheiros:
        caminho = os.path.join(origem, f)
        modelo, cor = parte_nome(f)
        if not cor:
            print('  ! %s — sem cor no nome. Usa "MODELO Cor.png".' % f)
            continue
        chave = modelo + '__' + cor
        if chave in vistos:
            print('  ! %s — repetido (%s). Ignorado.' % (f, vistos[chave]))
            continue
        vistos[chave] = f

        tam_orig = os.path.getsize(caminho)
        antes += tam_orig
        im = Image.open(caminho)
        if im.mode != 'RGBA':
            im = im.convert('RGBA')
        im = recorta(im)

        linha = '  %-26s -> %-24s %5dx%-4d' % (f, chave, im.width, im.height)
        saiu = []
        for sufixo, larg in LARGURAS.items():
            alvo = im
            if im.width > larg:
                alt = round(im.height * larg / im.width)
                alvo = im.resize((larg, alt), Image.LANCZOS)
            destino = os.path.join(saida, chave + sufixo + '.webp')
            if simular:
                saiu.append('%s%s.webp' % (chave, sufixo))
            else:
                alvo.save(destino, 'WEBP', quality=QUALIDADE, method=6)
                kb = os.path.getsize(destino) / 1024
                depois += os.path.getsize(destino)
                saiu.append('%s=%.0fKB' % (sufixo or 'grande', kb))
        print(linha + '  ' + ' '.join(saiu))

    print('-' * 74)
    if simular:
        print('  Simulacao: nada foi escrito.')
    else:
        print('  originais : %6.1f MB' % (antes / 1048576))
        print('  otimizadas: %6.1f MB   (%d ficheiros: grande + cartao)' % (depois / 1048576, len(vistos) * 2))
        if antes:
            print('  poupanca  : %5.0f%%' % (100 - depois * 100.0 / antes))


if __name__ == '__main__':
    main()
