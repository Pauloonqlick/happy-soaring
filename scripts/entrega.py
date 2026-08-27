#!/usr/bin/env python3
"""
Gerador de entregas — Happy Soaring Music
=========================================

Recebe a mensagem de encomenda (a que o cliente envia por WhatsApp),
junta os WAV correspondentes, mete a licenca preenchida,
faz o ZIP e envia-o para a Cloudflare R2. Devolve o link para reencaminhar.

Por defeito entrega SÓ WAV. Usa --com-flac se quiseres incluir também FLAC.

Uso:
    python scripts/entrega.py <ficheiro-da-encomenda.txt> [--nome "Comprador"] [--com-flac] [--sem-upload]

Nada aqui toca no site.
"""
import sys, os, re, json, uuid, zipfile, subprocess, shutil, datetime, unicodedata

RAIZ = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
MUSIC_JSON = os.path.join(RAIZ, 'content', 'slides', 'music.json')
MASTERS = os.path.join(RAIZ, 'masters')
ENTREGAS = os.path.join(RAIZ, 'entregas')
MODELO = os.path.join(RAIZ, 'MODELO-LICENCA.txt')
BUCKET = 'happy-soaring-entregas'
DOMINIO = 'https://downloads.happysoaring.com'

# A REFERENCIA VEM DE FORA E TEM DE SER VERIFICADA
#
# Chega numa linha "Ref:" de uma mensagem que o cliente enviou, e ia daqui
# direita para tres sitios perigosos: o nome de uma pasta temporaria, o nome
# do ZIP e a chave do objecto no R2 -- que e passada a um processo externo.
#
# Uma referencia com "..", com barras ou com um caminho absoluto escrevia
# ficheiros fora da pasta de entregas: o os.path.join descarta o primeiro
# argumento assim que o segundo e absoluto. E como no Windows o npx e um
# .cmd, o CreateProcess lanca-o sempre atraves do cmd.exe -- mesmo sem
# shell=True -- por isso caracteres como & ou | podiam la chegar.
#
# O site gera as referencias com um formato fixo, e e esse que se exige.
# O alfabeto nao tem I, O, 0 nem 1, porque a ref e lida e escrita por
# pessoas (ver newOrderCode no app.js). Nao havendo razao nenhuma para
# aceitar outra coisa, nao se aceita.
REF_VALIDA = re.compile(r'^HS-\d{8}-[ABCDEFGHJKLMNPQRSTUVWXYZ23456789]{4}$')


def ref_do_dia():
    return 'HS-' + datetime.date.today().strftime('%Y%m%d') + '-XXXX'


def norm(s):
    s = unicodedata.normalize('NFD', str(s))
    s = ''.join(c for c in s if unicodedata.category(c) != 'Mn')
    return re.sub(r'[^a-z0-9]+', ' ', s.lower()).strip()


def ffmpeg():
    import imageio_ffmpeg
    return imageio_ffmpeg.get_ffmpeg_exe()


# ---------------------------------------------------------------- encomenda
def le_encomenda(caminho):
    txt = open(caminho, encoding='utf-8').read()
    nomes, ref, total = [], None, None
    for l in txt.splitlines():
        l = l.strip()
        if l.startswith('•'):
            n = re.sub(r'^•\s*', '', l)
            n = re.sub(r'\s*\(grátis\)\s*$', '', n).strip()
            if n:
                nomes.append(n)
        elif re.match(r'^Ref:', l, re.I):
            ref = re.sub(r'^Ref:\s*', '', l, flags=re.I).strip()
        elif re.match(r'^Total:', l, re.I):
            total = re.sub(r'^Total:\s*', '', l, flags=re.I).strip()
    return nomes, ref, total


# ---------------------------------------------------------------- catalogo
def catalogo():
    doc = json.load(open(MUSIC_JSON, encoding='utf-8'))
    el = [e for e in doc['elements'] if e.get('role') == 'music'][0]
    return el, {t['name']: t for t in el['tracks']}


def indexa_wav():
    idx = {}
    for base, _, ficheiros in os.walk(MASTERS):
        if '_apagados' in base:
            continue
        for f in ficheiros:
            if f.lower().endswith('.wav'):
                idx[norm(os.path.splitext(f)[0])] = os.path.join(base, f)
    return idx


# ---------------------------------------------------------------- licenca
def licenca(ref, comprador, faixas, total, whatsapp, formatos='WAV'):
    txt = open(MODELO, encoding='utf-8').read()
    lista = '\n'.join('  - ' + n for n in faixas)
    subs = {
        '{{REF}}': ref or '(sem referencia)',
        '{{DATA}}': datetime.date.today().strftime('%d/%m/%Y'),
        '{{COMPRADOR}}': comprador or '(nao indicado)',
        '{{FAIXAS}}': lista,
        '{{TOTAL}}': total or (str(len(faixas)) + ' faixas'),
        '{{WHATSAPP}}': whatsapp or '',
        'Formatos incluidos / Formats included: WAV + FLAC':
            'Formatos incluidos / Formats included: ' + formatos,
    }
    for k, v in subs.items():
        txt = txt.replace(k, v)
    return txt


# ---------------------------------------------------------------- principal
def main():
    args = sys.argv[1:]
    if not args:
        print(__doc__)
        sys.exit(1)
    pedido = args[0]
    comprador = None
    com_flac = '--com-flac' in args
    sem_upload = '--sem-upload' in args
    if '--nome' in args:
        comprador = args[args.index('--nome') + 1]

    nomes, ref, total = le_encomenda(pedido)
    if not nomes:
        print('ERRO: nao encontrei faixas na encomenda (linhas a comecar por •).')
        sys.exit(1)
    if not ref:
        ref = ref_do_dia()
        print('AVISO: encomenda sem "Ref:". Usei ' + ref)
    elif not REF_VALIDA.match(ref):
        print('AVISO: a referencia "' + ref[:60] + '" nao tem o formato do site.')
        ref = ref_do_dia()
        print('       Usei ' + ref + '. Confirma a encomenda antes de entregar.')

    el, cat = catalogo()
    idx = indexa_wav()

    faltam, encontrados = [], []
    for n in nomes:
        t = cat.get(n)
        if not t:
            faltam.append(n + '   (nao existe no catalogo)')
            continue
        w = idx.get(norm(n)) or idx.get(norm(t.get('file', '')))
        if not w:
            faltam.append(n + '   (sem WAV)')
            continue
        encontrados.append((n, w))

    print('=' * 62)
    print('  ENCOMENDA ' + ref)
    print('=' * 62)
    print('  pedidas   : %d' % len(nomes))
    print('  prontas   : %d' % len(encontrados))
    if faltam:
        print('  EM FALTA  : %d' % len(faltam))
        for f in faltam:
            print('     x ' + f)
        print('\nCorrige a encomenda ou o catalogo. Nada foi gerado.')
        sys.exit(2)

    os.makedirs(ENTREGAS, exist_ok=True)
    tmp = os.path.join(ENTREGAS, '_tmp_' + ref)
    if os.path.isdir(tmp):
        shutil.rmtree(tmp)
    os.makedirs(tmp)

    ff = ffmpeg() if com_flac else None
    zip_path = os.path.join(ENTREGAS, ref + '.zip')
    if os.path.exists(zip_path):
        os.remove(zip_path)

    print('\n  a preparar ficheiros...')
    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED, compresslevel=1) as z:
        for i, (nome, wav) in enumerate(encontrados, 1):
            seguro = re.sub(r'[\\/:*?"<>|]', '-', nome).strip()
            print('   [%2d/%d] %s' % (i, len(encontrados), nome))
            z.write(wav, 'WAV/%s.wav' % seguro)
            if com_flac:
                flac = os.path.join(tmp, seguro + '.flac')
                subprocess.run([ff, '-loglevel', 'error', '-y', '-i', wav,
                                '-compression_level', '8', flac], check=True)
                z.write(flac, 'FLAC/%s.flac' % seguro)
                os.remove(flac)
        wa = el.get('whatsapp', '')
        z.writestr('LICENCA.txt', licenca(ref, comprador, [n for n, _ in encontrados], total, wa,
                                          'WAV + FLAC' if com_flac else 'WAV'))

    shutil.rmtree(tmp, ignore_errors=True)
    mb = os.path.getsize(zip_path) / 1048576
    print('\n  ZIP: %s  (%.0f MB)' % (zip_path, mb))

    if sem_upload:
        print('  (--sem-upload: nao enviei para a Cloudflare)')
        return

    chave = 'd/%s/%s.zip' % (uuid.uuid4(), ref)
    print('\n  a enviar para a Cloudflare R2...')
    npx = shutil.which('npx')
    if not npx:
        print('  ERRO: nao encontrei o npx no PATH.')
        sys.exit(3)
    r = subprocess.run([npx, 'wrangler', 'r2', 'object', 'put',
                        '%s/%s' % (BUCKET, chave), '--file', zip_path,
                        '--content-type', 'application/zip', '--remote'],
                       cwd=RAIZ, capture_output=True, text=True)
    if r.returncode != 0:
        print('  ERRO no upload:\n' + (r.stderr or r.stdout)[-1200:])
        sys.exit(3)

    link = '%s/%s' % (DOMINIO, chave)
    print('\n' + '=' * 62)
    print('  LINK PARA O CLIENTE (expira em 30 dias)')
    print('  ' + link)
    print('=' * 62)


if __name__ == '__main__':
    main()
