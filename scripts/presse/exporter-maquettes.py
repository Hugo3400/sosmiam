# Exporte les canevas des maquettes (artifacts « Design » de claude.ai) en PNG et en PDF, pour presse/ (voir LISEZMOI.md).
# Usage : python3 -I scripts/presse/exporter-maquettes.py <travail> <famille>…
#   familles : affiches, reseaux, imprimes, recrutement, capitaine, flyer
#   entrée  : <travail>/canevas/<famille>/project/*.dc.html et canvas.json, et les fichiers du canevas (/_blob/<id>)
#             enregistrés à côté sous le nom <id>.<extension> (lecture d'un artifact avec son id d'élément) ;
#   sortie  : <travail>/sortie/<famille>/, et pour affiches, reseaux et imprimes leurs lignes dans
#             <travail>/sortie/index-canevas.json (lu par assembler-presse.py).
# Rendu par le Chrome sans écran de Playwright, avec les polices Bricolage Grotesque et Inter du dépôt (node_modules).
import glob, json, os, re, subprocess, sys
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRAVAIL = os.path.abspath(sys.argv[1])
FAMILLES = sys.argv[2:]
SORTIE = f'{TRAVAIL}/sortie'
CHROME = sorted(glob.glob(os.path.expanduser('~/.cache/ms-playwright/chromium_headless_shell-*/chrome-headless-shell-linux64/chrome-headless-shell')))[-1]
POLICES = f'{RACINE}/node_modules/@fontsource-variable'
FF = f"""@font-face{{font-family:'Bricolage Grotesque';font-weight:200 800;src:url(file://{POLICES}/bricolage-grotesque/files/bricolage-grotesque-latin-wght-normal.woff2)}}
@font-face{{font-family:'Inter';font-weight:100 900;src:url(file://{POLICES}/inter/files/inter-latin-wght-normal.woff2)}}"""
LARGEUR_A4_MM = 794 * 25.4 / 96

# Les noms de fichiers des affiches et des imprimés (tableau de bord du canevas → nom)
NOMS_AFFICHES = {
    'Main.dc.html': 'affiche-sauve-une-table', 'GP-Pepite.dc.html': 'affiche-pepite-a-2-rues', 'GP-Chaines.dc.html': 'affiche-moins-de-chaines',
    'GP-Salle-vide.dc.html': 'affiche-salle-vide', 'Amb-Aventure.dc.html': 'affiche-ambassadeurs-aventure', 'Amb-Badges.dc.html': 'affiche-ambassadeurs-badges',
    'Amb-Fondateur.dc.html': 'affiche-ambassadeurs-fondateur', 'Vitrine-Lieu.dc.html': 'affiche-vitrine-lieu-exemple',
    'Vitrine-Generique.dc.html': 'affiche-vitrine-on-est-sur-sos-miam', 'Vitrine-Miam-Safe.dc.html': 'affiche-vitrine-miam-safe',
}
NOMS_IMPRIMES = {
    'Main.dc.html': 'flyer-a6-grand-public', 'Flyer-Ambassadeurs.dc.html': 'flyer-a6-ambassadeurs', 'Carte-Ambassadeur.dc.html': 'carte-visite-ambassadeur',
    'Chevalet-Table.dc.html': 'chevalet-de-table', 'Stickers.dc.html': 'planche-stickers-a4', 'Badges-Epingle.dc.html': 'badges-epingle-38mm',
}
NOMS_CAPITAINE = {'Main.dc.html': ('carrousel-capitaine-1-presentation', 1350), 'Fiche.dc.html': ('carrousel-capitaine-2-fiche-identite', 1350),
                  'Humeurs.dc.html': ('carrousel-capitaine-3-six-humeurs', 1350), 'Story.dc.html': ('story-capitaine-au-rapport', 1920)}
# Une affiche « au nom du lieu » se fait par lieu sur le site (/lieu/:id/vitrine) : pas d'A3 ni de 40 × 60 ici
SANS_GRANDS_FORMATS = {'affiche-vitrine-lieu-exemple'}


def preparer(famille, tableau):
    """Le corps du tableau, ses styles, et chaque /_blob/<id> remplacé par le fichier <id>.<ext> enregistré à côté"""
    dossier = f'{TRAVAIL}/canevas/{famille}'
    s = open(f'{dossier}/project/{tableau}', encoding='utf-8').read()
    styles = ''.join(re.findall(r'<style>(.*?)</style>', s[:s.index('</helmet>')], re.S))
    corps = s[s.index('</helmet>') + 9:s.index('</x-dc>')]

    def fichier(m):
        trouves = glob.glob(f'{dossier}/{m.group(1)}.*')
        if not trouves: raise SystemExit(f'❌ {famille}/{tableau} : le fichier {m.group(1)} manque (lis-le dans l’artifact avec son id).')
        return 'file://' + trouves[0]
    return re.sub(r'/_blob/([0-9a-f]{32})', fichier, f'<!doctype html><meta charset="utf-8"><style>{FF}{styles} body{{margin:0}}</style>{corps}')


def capturer(html, largeur, hauteur, png, echelle):
    t = f'{SORTIE}/.tmp.html'
    open(t, 'w', encoding='utf-8').write(html)
    subprocess.run([CHROME, '--no-sandbox', '--hide-scrollbars', f'--force-device-scale-factor={echelle}', '--allow-file-access-from-files',
                    f'--window-size={largeur},{hauteur}', '--virtual-time-budget=8000', f'--screenshot={png}', f'file://{t}'], capture_output=True, check=True)


def pdf(html, largeur_mm, hauteur_mm, chemin, zoom):
    t = f'{SORTIE}/.tmp.html'
    page = f'@page{{size:{largeur_mm}mm {hauteur_mm}mm;margin:0}} html,body{{margin:0}} body{{zoom:{zoom}}} *{{-webkit-print-color-adjust:exact;print-color-adjust:exact}}'
    open(t, 'w', encoding='utf-8').write(html.replace('</style>', page + '</style>', 1))
    subprocess.run([CHROME, '--no-sandbox', '--no-pdf-header-footer', '--allow-file-access-from-files', '--virtual-time-budget=8000',
                    f'--print-to-pdf={chemin}', f'file://{t}'], capture_output=True, check=True)


def lire_canevas(famille):
    return json.load(open(f'{TRAVAIL}/canevas/{famille}/project/canvas.json', encoding='utf-8'))


index = {}
chemin_index = f'{SORTIE}/index-canevas.json'
if os.path.exists(chemin_index):
    index = {f['id']: f for f in json.load(open(chemin_index, encoding='utf-8'))['familles']}


def noter(famille, titre, nom, format_, taille, description):
    index.setdefault(famille, {'id': famille, 'titre': titre, 'fichiers': []})['fichiers'].append(
        {'nom': nom, 'chemin': f'{famille}/{nom}', 'format': format_, 'taille': taille, 'description': description})


def exporter_affiches():
    canevas = lire_canevas('affiches')
    index['affiches'] = {'id': 'affiches', 'titre': 'Affiches A4', 'fichiers': []}
    for tableau, nom in NOMS_AFFICHES.items():
        corps, titre = preparer('affiches', tableau), canevas['boards'][tableau]['title']
        capturer(corps, 794, 1123, f'{SORTIE}/affiches/{nom}.png', 3)
        pdf(corps, 210, 297, f'{SORTIE}/affiches/{nom}.pdf', 210 / LARGEUR_A4_MM)
        noter('affiches', 'Affiches A4', f'{nom}.png', 'PNG', '2382 × 3369 px', titre)
        noter('affiches', 'Affiches A4', f'{nom}.pdf', 'PDF', 'A4', titre)
        if nom in SANS_GRANDS_FORMATS: continue
        # A3 : même rapport que l'A4. 40 × 60 cm : rapport 2:3, l'affiche est rallongée (sa colonne « space-between »
        # répartit la place), rien n'est déformé. Ajoutés à l'index par assembler-presse.py.
        pdf(corps, 297, 420, f'{SORTIE}/affiches/{nom}-a3.pdf', 297 / LARGEUR_A4_MM)
        pdf(corps.replace('height: 1123px', 'height: 1191px', 1), 400, 600, f'{SORTIE}/affiches/{nom}-40x60.pdf', 400 / LARGEUR_A4_MM)


def exporter_series(famille, titre_famille):
    """Chaque tableau porte une série de diapositives côte à côte (540 px + 40 d'écart), découpées en 1080 × 1350 ou 1920.
    Le nom vient du titre du tableau : « Carrousel · C'est quoi SOS Miam ? » → carrousel-cest-quoi-sos-miam-1.png…"""
    canevas = lire_canevas(famille)
    index[famille] = {'id': famille, 'titre': titre_famille, 'fichiers': []}
    for tableau in canevas['order']:
        b = canevas['boards'][tableau]
        n = (b['w'] + 40) // 580
        genre, sujet = (x.strip().lower() for x in b['title'].split('·', 1))
        for a, z in (('é', 'e'), ('è', 'e'), ('ê', 'e'), ('à', 'a'), ('ç', 'c'), ('’', ''), ("'", '')): sujet = sujet.replace(a, z)
        base = genre + '-' + re.sub(r'[^a-z0-9]+', '-', sujet).strip('-')
        tmp = f'{SORTIE}/.tmp.png'
        capturer(preparer(famille, tableau), b['w'], b['h'], tmp, 2)
        image = Image.open(tmp)
        for i in range(n):
            x = i * 580 * 2
            nom = f'{base}-{i + 1}.png' if n > 1 or genre != 'post' else f'{base}.png'
            image.crop((x, 0, x + 1080, b['h'] * 2)).save(f'{SORTIE}/{famille}/{nom}')
            noter(famille, titre_famille, nom, 'PNG', f'1080 × {b["h"] * 2} px', f'{b["title"]}, image {i + 1}/{n}' if n > 1 else b['title'])
        os.remove(tmp)


def exporter_reseaux():
    exporter_series('reseaux', 'Réseaux sociaux')


def exporter_recrutement():
    exporter_series('recrutement', 'Campagne ambassadeurs fondateurs')


def exporter_imprimes():
    canevas = lire_canevas('imprimes')
    index['imprimes'] = {'id': 'imprimes', 'titre': 'Imprimés', 'fichiers': []}
    for tableau, nom in NOMS_IMPRIMES.items():
        b, corps = canevas['boards'][tableau], preparer('imprimes', tableau)
        capturer(corps, b['w'], b['h'], f'{SORTIE}/imprimes/{nom}.png', 3)
        noter('imprimes', 'Imprimés', f'{nom}.png', 'PNG', f'{b["w"] * 3} × {b["h"] * 3} px', b['title'])
        if nom == 'planche-stickers-a4':
            pdf(corps, 210, 297, f'{SORTIE}/imprimes/{nom}.pdf', 210 / LARGEUR_A4_MM)
            noter('imprimes', 'Imprimés', f'{nom}.pdf', 'PDF', 'A4', b['title'])


def exporter_capitaine():
    for tableau, (nom, hauteur) in NOMS_CAPITAINE.items():
        capturer(preparer('capitaine', tableau), 1080, hauteur, f'{SORTIE}/capitaine/{nom}.png', 1)


def exporter_flyer():
    """Le flyer A5 recto verso (559 × 794 px, soit 148 × 210 mm)"""
    for tableau, nom in (('Main.dc.html', 'flyer-a5-recto'), ('Verso.dc.html', 'flyer-a5-verso')):
        corps = preparer('flyer', tableau)
        capturer(corps, 559, 794, f'{SORTIE}/flyer/{nom}.png', 3)
        pdf(corps, 148, 210, f'{SORTIE}/flyer/{nom}.pdf', 148 / (559 * 25.4 / 96))


EXPORTS = {'affiches': exporter_affiches, 'reseaux': exporter_reseaux, 'recrutement': exporter_recrutement, 'imprimes': exporter_imprimes, 'capitaine': exporter_capitaine, 'flyer': exporter_flyer}
if not FAMILLES or any(f not in EXPORTS for f in FAMILLES):
    raise SystemExit(f'Usage : exporter-maquettes.py <travail> <famille>… (familles : {", ".join(EXPORTS)})')
for famille in FAMILLES:
    os.makedirs(f'{SORTIE}/{famille}', exist_ok=True)
    EXPORTS[famille]()
    print(f'✅ {famille}')
if os.path.exists(f'{SORTIE}/.tmp.html'): os.remove(f'{SORTIE}/.tmp.html')
json.dump({'familles': list(index.values())}, open(chemin_index, 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
