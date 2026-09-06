#!/usr/bin/env python3
"""
Icones da marca — Happy Soaring
===============================

Gera, a partir dos dois mestres, tudo o que o browser e o Google precisam:

    python scripts/gerar-icones.py <simbolo.png> <logo.png>

    simbolo.png  ->  favicon.ico (16/32/48)
                     images/marca/hs-simbolo-{192,256,384,512}.png
                     images/marca/hs-apple-touch-icon.png (180, opaco)
    logo.png     ->  images/marca/happy-soaring-logo-512.png

--simular mostra o que faria sem escrever nada.

PORQUE E O SIMBOLO E NAO O LOGOTIPO
  O que o Google mostra ao lado do nome do site nos resultados e o favicon, e
  um favicon vive a 16 ou 32 pixeis. A esse tamanho "HAPPY SOARING" em duas
  linhas e uma mancha cinzenta; o HS com o sorriso ainda se le. O logotipo
  completo fica para o `logo` da Organization, que aparece grande.

PORQUE SE CORTA A MARGEM TRANSPARENTE
  Os mestres tem o circulo centrado numa tela maior. A 16 pixeis, cada linha
  de margem e 6% do icone gasto a nada. Corta-se pela caixa do alfa e o
  circulo passa a encher o quadrado.

PORQUE E QUE O APPLE TOUCH ICON E OPACO
  O iOS nao respeita transparencia: compoe o que estiver por baixo, e o
  resultado e imprevisivel. O circulo e preto, portanto assenta-se em branco
  — que e como a marca aparece em todo o lado.
"""

import sys
from pathlib import Path
from PIL import Image

RAIZ = Path(__file__).resolve().parent.parent
DESTINO = RAIZ / "images" / "marca"

SIMBOLO_PNG = [192, 256, 384, 512]
FAVICON_ICO = [16, 32, 48]
APPLE = 180
LOGO = 512


def carregar(caminho: Path) -> Image.Image:
    """Abre em RGBA e corta a margem totalmente transparente."""
    im = Image.open(caminho).convert("RGBA")
    caixa = im.split()[3].getbbox()
    if caixa and caixa != (0, 0, im.width, im.height):
        antes = im.size
        im = im.crop(caixa)
        print(f"    margem cortada: {antes[0]}x{antes[1]} -> {im.width}x{im.height}")
    return quadrado(im)


def quadrado(im: Image.Image) -> Image.Image:
    """Centra numa tela quadrada. Um icone que nao e quadrado e recusado
       pelo Google e deformado pelo browser."""
    if im.width == im.height:
        return im
    lado = max(im.width, im.height)
    tela = Image.new("RGBA", (lado, lado), (0, 0, 0, 0))
    tela.paste(im, ((lado - im.width) // 2, (lado - im.height) // 2))
    print(f"    quadrado: {im.width}x{im.height} -> {lado}x{lado}")
    return tela


def medir(im: Image.Image, lado: int) -> Image.Image:
    return im.resize((lado, lado), Image.LANCZOS)


def gravar(im: Image.Image, destino: Path, simular: bool) -> None:
    destino.parent.mkdir(parents=True, exist_ok=True)
    if simular:
        print(f"  [simulado] {destino.relative_to(RAIZ)}")
        return
    im.save(destino, optimize=True)
    print(f"  {destino.relative_to(RAIZ)}  ({destino.stat().st_size:,} bytes)")


def main() -> int:
    args = [a for a in sys.argv[1:] if not a.startswith("--")]
    simular = "--simular" in sys.argv
    if len(args) != 2:
        print(__doc__)
        return 2

    simbolo_src, logo_src = Path(args[0]), Path(args[1])
    for p in (simbolo_src, logo_src):
        if not p.exists():
            print(f"nao encontrei: {p}")
            return 1

    print(f"simbolo: {simbolo_src.name}")
    simbolo = carregar(simbolo_src)
    print(f"logo:    {logo_src.name}")
    logo = carregar(logo_src)

    print("\nPNG do simbolo:")
    for lado in SIMBOLO_PNG:
        gravar(medir(simbolo, lado), DESTINO / f"hs-simbolo-{lado}.png", simular)

    print("\nApple touch icon (opaco, sobre branco):")
    apple = Image.new("RGB", (APPLE, APPLE), (255, 255, 255))
    pequeno = medir(simbolo, APPLE)
    apple.paste(pequeno, (0, 0), pequeno)
    gravar(apple, DESTINO / "hs-apple-touch-icon.png", simular)

    print("\nLogotipo completo (para o `logo` da Organization):")
    gravar(medir(logo, LOGO), DESTINO / f"happy-soaring-logo-{LOGO}.png", simular)

    print("\nfavicon.ico:")
    destino_ico = RAIZ / "favicon.ico"
    if simular:
        print(f"  [simulado] favicon.ico  ({'/'.join(str(s) for s in FAVICON_ICO)})")
    else:
        medir(simbolo, max(FAVICON_ICO)).save(
            destino_ico, format="ICO", sizes=[(s, s) for s in FAVICON_ICO]
        )
        print(f"  favicon.ico  ({destino_ico.stat().st_size:,} bytes, "
              f"{'/'.join(str(s) for s in FAVICON_ICO)})")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
