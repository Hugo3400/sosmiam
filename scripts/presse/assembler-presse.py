# Refait presse/ (Espace presse du logiciel de gestion, et fichiers des kits médias du site) : voir LISEZMOI.md.
# Usage : python3 -I scripts/presse/assembler-presse.py <travail> [--depuis-presse]
#   <travail>/sortie/ : ce qu'exporter-maquettes.py a produit (affiches, reseaux, imprimes, capitaine, flyer et
#   index-canevas.json), plus miam-safe/, textes/ et documents/ (exportés à la main, voir LISEZMOI.md).
#   --depuis-presse : ce qui manque dans <travail>/sortie/ est repris du presse/ actuel (on ne refait que ce qu'on a exporté).
# Le reste vient du dépôt : visuels des stores, kit de marque, et le pack vidéos, sons et images (kits/SOSMiam_partie_*.zip,
# décompressé dans <travail>/pack-videos/). Construit dans <travail>, puis échangé d'un coup avec presse/ : un commit pris
# pendant l'export ne voit jamais un dossier à moitié vide (le 14/10, un commit en avait noté 120 suppressions).
import datetime, glob, json, os, re, shutil, subprocess, sys
from PIL import Image

RACINE = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
TRAVAIL = os.path.abspath(sys.argv[1])
DEPUIS_PRESSE = '--depuis-presse' in sys.argv[2:]
PRESSE = f'{RACINE}/presse'
O = f'{TRAVAIL}/sortie'
P = f'{TRAVAIL}/presse-nouveau'
PACK = f'{TRAVAIL}/pack-videos/SOS_Miam'
FFMPEG = os.environ.get('FFMPEG', '/var/www/bot/node_modules/ffmpeg-static/ffmpeg')
MANUELLES = ['affiches', 'reseaux', 'imprimes', 'miam-safe', 'textes', 'capitaine', 'flyer', 'documents']

# ─── Entrées ───
if DEPUIS_PRESSE:
    for d in MANUELLES:
        if not os.path.exists(f'{O}/{d}') and os.path.exists(f'{PRESSE}/{d}'):
            shutil.copytree(f'{PRESSE}/{d}', f'{O}/{d}', ignore=shutil.ignore_patterns('sos-miam-*.zip'))
    if not os.path.exists(f'{O}/index-canevas.json'):
        ancien = json.load(open(f'{PRESSE}/index.json', encoding='utf-8'))['familles']
        garder = [{'id': f['id'], 'titre': f['titre'], 'fichiers': [
            {k: x[k] for k in ('nom', 'chemin', 'format', 'taille', 'description')} for x in f['fichiers'] if not re.search(r'-(a3|40x60)\.pdf$', x['nom'])
        ]} for f in ancien if f['id'] in ('affiches', 'reseaux', 'imprimes')]
        json.dump({'familles': garder}, open(f'{O}/index-canevas.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
manquants = [d for d in MANUELLES if not os.path.exists(f'{O}/{d}')]
if manquants: raise SystemExit(f'❌ Il manque {", ".join(manquants)} dans {O} (ou relance avec --depuis-presse).')
if not os.path.exists(PACK):
    os.makedirs(f'{TRAVAIL}/pack-videos', exist_ok=True)
    for z in sorted(glob.glob(f'{RACINE}/kits/SOSMiam_partie_*.zip')):
        subprocess.run(['unzip', '-q', '-o', z, '-d', f'{TRAVAIL}/pack-videos'], check=True)


# ─── Outils ───
def lier(src, dst):
    """Lien dur (les vidéos ne prennent pas deux fois la place), ou copie si le dossier de travail est sur un autre disque"""
    os.makedirs(os.path.dirname(dst), exist_ok=True)
    if os.path.exists(dst): os.remove(dst)
    try:
        os.link(src, dst)
    except OSError:
        shutil.copy2(src, dst)


def taille_image(p):
    w, h = Image.open(p).size
    return f'{w} × {h} px'


def fmt(p):
    return {'.jpg': 'JPG', '.jpeg': 'JPG', '.png': 'PNG', '.svg': 'SVG', '.txt': 'TXT', '.md': 'MD', '.pdf': 'PDF', '.mp4': 'MP4', '.mp3': 'MP3', '.ogg': 'OGG', '.wav': 'WAV'}[os.path.splitext(p)[1].lower()]


ACCENTS = {'banniere': 'bannière', 'bannieres': 'bannières', 'icone': 'icône', 'validee': 'validée', 'envoyee': 'envoyée', 'presentation': 'présentation',
           'apercu': 'aperçu', 'role': 'rôle', 'ecusson': 'écusson', 'epingle': 'épingle', 'epingles': 'épingles', 'patisseries': 'pâtisseries', 'detoure': 'détouré',
           'bouee': 'bouée', 'a': 'à', 'pepites': 'pépites', 'cest': 'c’est', 'fete': 'fête', 'doeil': 'd’œil', 'coeur': 'cœur', 'gouts': 'goûts',
           'evenement': 'événement', 'empile': 'empilé', 'emblemes': 'emblèmes', 'reseaux': 'réseaux', 'sos': 'SOS', 'big': 'BIG', 'tete': 'tête'}


def accentuer(t):
    def mot(m):
        w = m.group(0)
        r = ACCENTS.get(w.lower())
        if not r: return w
        return r if r.isupper() or not w[0].isupper() else r[:1].upper() + r[1:]
    return re.sub(r'[A-Za-z]+', mot, t)


def lisible(nom):
    n = accentuer(os.path.splitext(nom)[0].replace('SOSMiam_', '').replace('_', ' '))
    return n[:1].upper() + n[1:]


# ─── Les familles ───
idx = json.load(open(f'{O}/index-canevas.json', encoding='utf-8'))['familles']
FORMATS_AFFICHES = [('a3', 'A3 (297 × 420 mm)', 'en A3'), ('40x60', '40 × 60 cm', 'en 40 × 60 cm (rallongée, rien n’est déformé)')]
for fam in idx:
    if fam['id'] != 'affiches': continue
    liste = []
    for f in fam['fichiers']:
        liste.append(f)
        base = os.path.splitext(f['nom'])[0]
        if f['format'] == 'PDF':
            for suffixe, taille, dit in FORMATS_AFFICHES:
                if os.path.exists(f'{O}/affiches/{base}-{suffixe}.pdf'):
                    liste.append({'nom': f'{base}-{suffixe}.pdf', 'chemin': f'affiches/{base}-{suffixe}.pdf', 'format': 'PDF', 'taille': taille, 'description': f"{f['description']}, {dit}"})
    fam['fichiers'] = liste
idx.append({'id': 'miam-safe', 'titre': 'Miam Safe', 'fichiers': [
    {'nom': 'fiche-miam-safe-miamis.png', 'chemin': 'miam-safe/fiche-miam-safe-miamis.png', 'format': 'PNG', 'taille': '1080 × 1350 px', 'description': 'Fiche Miamis (4:5) : les façons d’avoir de l’aide, bientôt dans l’app'},
    {'nom': 'fiche-miam-safe-lieux.png', 'chemin': 'miam-safe/fiche-miam-safe-lieux.png', 'format': 'PNG', 'taille': '1080 × 1350 px', 'description': 'Fiche lieux (4:5) : le badge, les alertes, la charte'},
    {'nom': 'fiche-miam-safe-memo-equipe.png', 'chemin': 'miam-safe/fiche-miam-safe-memo-equipe.png', 'format': 'PNG', 'taille': '1080 × 1350 px', 'description': 'Mémo d’équipe pour l’arrière du comptoir'},
    {'nom': 'story-miam-safe-bientot.png', 'chemin': 'miam-safe/story-miam-safe-bientot.png', 'format': 'PNG', 'taille': '1080 × 1920 px', 'description': 'Story « Bientôt » Miam Safe'},
    {'nom': 'concept-miam-safe.pdf', 'chemin': 'miam-safe/concept-miam-safe.pdf', 'format': 'PDF', 'taille': None, 'description': 'La page concept Miam Safe (décisions du 9 octobre 2026)'},
]})
idx.append({'id': 'textes', 'titre': 'Textes (presse, newsletters, Discord)', 'fichiers': [
    {'nom': 'textes-promo-sos-miam.md', 'chemin': 'textes/textes-promo-sos-miam.md', 'format': 'MD', 'taille': None, 'description': 'Communiqué et dossier de presse, 4 newsletters, annonces Discord, légendes des carrousels, règles de ton'},
]})

if os.path.exists(P): shutil.rmtree(P)
os.makedirs(P)
for d in MANUELLES: shutil.copytree(f'{O}/{d}', f'{P}/{d}', ignore=shutil.ignore_patterns('sos-miam-*.zip'))

desc = {'carrousel-capitaine-1-presentation': 'Carrousel Capitaine Bouiboui, image 1/3 : « Voici Capitaine Bouiboui »',
        'carrousel-capitaine-2-fiche-identite': 'Carrousel Capitaine Bouiboui, image 2/3 : sa fiche d’identité',
        'carrousel-capitaine-3-six-humeurs': 'Carrousel Capitaine Bouiboui, image 3/3 : ses six humeurs',
        'story-capitaine-au-rapport': 'Story « Capitaine Bouiboui au rapport ! »'}
idx.append({'id': 'capitaine', 'titre': 'Capitaine Bouiboui (réseaux)', 'fichiers': [
    {'nom': f'{n}.png', 'chemin': f'capitaine/{n}.png', 'format': 'PNG', 'taille': taille_image(f'{P}/capitaine/{n}.png'), 'description': d} for n, d in desc.items()]})
flyer = []
for n, d in [('flyer-a5-recto', 'Flyer A5, recto : « Les pépites de ton quartier »'), ('flyer-a5-verso', 'Flyer A5, verso : comment ça marche, QR Instagram')]:
    flyer.append({'nom': f'{n}.png', 'chemin': f'flyer/{n}.png', 'format': 'PNG', 'taille': taille_image(f'{P}/flyer/{n}.png'), 'description': d})
    flyer.append({'nom': f'{n}.pdf', 'chemin': f'flyer/{n}.pdf', 'format': 'PDF', 'taille': 'A5', 'description': d})
idx.append({'id': 'flyer', 'titre': 'Flyer A5 recto verso', 'fichiers': flyer})
docs = [('mail-de-presentation.md', 'Mail de présentation de SOS Miam (partenaires, commerçants, futurs ambassadeurs), version du 5 octobre'),
        ('fiche-de-presentation-du-lieu.md', 'Fiche à remplir par un lieu pour créer sa page (version du 8 octobre)'),
        ('recrutement-ambassadeurs-fondateurs.md', 'Campagne de recrutement des ambassadeurs fondateurs : calendrier, messages, formulaire, FAQ'),
        ('kit-reseaux-sociaux.md', 'Kit réseaux sociaux : bios, formats, ton et hashtags'),
        ('kit-de-marque-explications.md', 'Le kit de marque expliqué : couleurs, typos, rôle de chaque logo')]
idx.append({'id': 'documents', 'titre': 'Documents (mail, fiche lieu, recrutement, réseaux)', 'fichiers': [
    {'nom': n, 'chemin': f'documents/{n}', 'format': 'MD', 'taille': None, 'description': d} for n, d in docs if os.path.exists(f'{P}/documents/{n}')]})

# Visuels des stores (apps/app-mobile/visuels-stores)
src = f'{RACINE}/apps/app-mobile/visuels-stores'
rangs = {'ios/iphone-6-9-pouces': 'iPhone 6,9 pouces', 'ios/iphone-6-3-pouces': 'iPhone 6,3 pouces', 'ios/ipad-13-pouces': 'iPad 13 pouces', 'ios/en-tete': 'En-tête App Store',
         'android/telephone': 'Android téléphone', 'android/tablette': 'Android tablette', 'android': 'Play Store', '': 'Icône de l’app'}
stores = []
for racine, _, fs in sorted(os.walk(src)):
    for f in sorted(fs):
        rel = os.path.relpath(os.path.join(racine, f), src)
        dos = os.path.dirname(rel)
        os.makedirs(f'{P}/stores/{dos}', exist_ok=True)
        shutil.copy2(os.path.join(racine, f), f'{P}/stores/{rel}')
        stores.append({'nom': rel.replace('/', '-'), 'chemin': f'stores/{rel}', 'format': fmt(f), 'taille': taille_image(f'{P}/stores/{rel}'), 'description': f'{rangs.get(dos, dos)} · {lisible(f).replace("-", " ")}'})
idx.append({'id': 'stores', 'titre': 'Visuels App Store et Play Store', 'fichiers': stores})

# Kit de marque (kits/SOS_Miam_kit_de_marque)
src = f'{RACINE}/kits/SOS_Miam_kit_de_marque'
marque = []
for racine, _, fs in sorted(os.walk(src)):
    for f in sorted(fs):
        rel = os.path.relpath(os.path.join(racine, f), src)
        os.makedirs(os.path.dirname(f'{P}/kit-de-marque/{rel}'), exist_ok=True)
        shutil.copy2(os.path.join(racine, f), f'{P}/kit-de-marque/{rel}')
        rubrique = accentuer(re.sub(r'^\d+_', '', rel.split('/')[0]).replace('_', ' ')) if '/' in rel else 'Kit de marque'
        t = fmt(f)
        marque.append({'nom': f, 'chemin': f'kit-de-marque/{rel}', 'format': t, 'taille': taille_image(f'{P}/kit-de-marque/{rel}') if t == 'PNG' else None,
                       'description': f'{rubrique} · {lisible(f)}' if f != 'LISEZMOI.txt' else 'Mode d’emploi du kit de marque (vocabulaire : les Miamis, la Brigade)'})
idx.append({'id': 'kit-de-marque', 'titre': 'Kit de marque (logos, mascotte, pictos, bannières)', 'fichiers': marque})

# Pack vidéos, sons et images de campagne (presse/videos/ est hors git)
campagne = []
for racine, _, fs in sorted(os.walk(f'{PACK}/Images')):
    for f in sorted(fs):
        rel = os.path.relpath(os.path.join(racine, f), f'{PACK}/Images')
        lier(os.path.join(racine, f), f'{P}/campagne/{f}')
        campagne.append({'nom': f, 'chemin': f'campagne/{f}', 'format': 'PNG', 'taille': taille_image(f'{P}/campagne/{f}'), 'description': f'{accentuer(rel.split("/")[0].replace("_", " "))} · {lisible(f)}'})
idx.append({'id': 'campagne', 'titre': 'Images de campagne (ambassadeurs, présentation, profil)', 'fichiers': campagne})
TITRES_VIDEOS = {'00': 'Jingle du logo', '01': 'Présentation en 30 s', '02': 'Alerte SOS', '03': 'Pour les commerçants', '04': 'Comment ça marche', '05': 'Pépite de la semaine',
                 '06': 'Intro du logo', '07': 'Présentation dynamique', '08': 'Jeu vidéo rétro', '09': 'Avant / après', '10': 'Canapé contre pépite', '11': 'La mascotte à la rescousse',
                 '12': 'La ville qui joue', '13': 'Soirée en accéléré', '14': 'Unboxing du kit', '15': 'Compte à rebours', '16': 'Prévention alcool : « retour sûr »',
                 '17': 'Prévention sécurité en soirée', '18': 'Le concept en 1 minute', '19': 'Recrutement ambassadeurs', '20': 'Ouverture bientôt'}
videos = []
for racine, _, fs in sorted(os.walk(f'{PACK}/Videos')):
    for f in sorted(fs):
        num = f.split('_')[1]
        lier(os.path.join(racine, f), f'{P}/videos/{f}')
        m = re.search(r'_(\d+s|1min)', f)
        duree = m.group(1).replace('1min', '1 min').replace('s', ' s') if m else ''
        j = re.search(r'_(J-\d|Jour_J)_', f)
        jour = f' · {j.group(1).replace("_", " ")}' if j else ''
        variante = ' · sans musique' if 'sans_musique' in f else (' · mélodie seule' if 'melodie_seule' in f else '')
        videos.append({'nom': f, 'chemin': f'videos/{f}', 'format': 'MP4', 'taille': duree or None, 'description': f'Vidéo {num} · {TITRES_VIDEOS.get(num, num)}{jour}{variante}'})
idx.append({'id': 'videos', 'titre': 'Vidéos', 'fichiers': videos, 'zip_sans_compression': True})
sons = []
for f in sorted(os.listdir(f'{PACK}/Sons')):
    lier(f'{PACK}/Sons/{f}', f'{P}/sons/{f}')
    sons.append({'nom': f, 'chemin': f'sons/{f}', 'format': fmt(f), 'taille': None, 'description': lisible(f)})
idx.append({'id': 'sons', 'titre': 'Sons (jingle et notifications)', 'fichiers': sons})


# ─── Canaux de diffusion (filtres de l'Espace presse) ───
def canaux(fam, f):
    c, n, t = f['chemin'], f['nom'].lower(), f['taille'] or ''
    story = '1920 px' in t or 'story' in n or 'stories' in n
    if f['format'] in ('MD', 'TXT'): base = ['textes']
    elif fam in ('affiches', 'imprimes', 'flyer'): base = ['impression']
    elif fam == 'textes': base = ['textes']
    elif fam == 'miam-safe': base = ['textes'] if f['format'] == 'PDF' else (['instagram', 'tiktok'] if story else ['instagram'])
    elif fam in ('reseaux', 'capitaine', 'campagne') and not (fam == 'campagne' and ('apercu' in n or 'photo_de_profil' in n)): base = ['instagram', 'tiktok'] if story else ['instagram']
    elif fam == 'campagne': base = ['presentation'] if 'apercu' in n else ['instagram', 'tiktok']  # planches « aperçu » : pas à poster
    elif fam == 'videos': base = ['instagram', 'tiktok']  # toutes en 1080 × 1920 (Reels, TikTok)
    elif fam == 'sons': base = ['sons']
    elif fam == 'stores': base = ['ios'] if c.startswith('stores/ios/') else (['android'] if c.startswith('stores/android/') else ['ios', 'android'])
    elif fam == 'kit-de-marque':
        if '/01_Logos/Icones/' in c: base = ['instagram', 'tiktok'] if 'avatar' in n else (['ios', 'android'] if 'icone' in n else ['web'])
        elif '/01_Logos/' in c or '/02_Mascotte/' in c: base = ['instagram', 'tiktok', 'impression']
        elif '/03_Pictos' in c: base = ['instagram', 'impression']
        elif '/Instagram_stories_a_la_une/' in c: base = ['instagram']
        elif '/Facebook/' in c: base = ['facebook']
        elif '/Bannieres_3x1/' in c: base = ['x']
        else: base = []
    else: base = []
    return base + ['marque'] if fam == 'kit-de-marque' else base


# ─── Aperçus, zips, index ───
os.makedirs(f'{P}/apercus')
video_sans_apercu = not os.path.exists(FFMPEG)
if video_sans_apercu: print(f'⚠️  {FFMPEG} introuvable : les vidéos n’auront pas d’aperçu (réglage : FFMPEG=…)')
for fam in idx:
    for f in fam['fichiers']:
        f['apercu'] = None
        a = f'apercus/{f["chemin"].replace("/", "-")}'
        if f['format'] in ('PNG', 'JPG'):
            a = os.path.splitext(a)[0] + ('.png' if f['format'] == 'PNG' else '.jpg')
            im = Image.open(f'{P}/{f["chemin"]}').convert('RGB')
            im.thumbnail((360, 480))
            im.save(f'{P}/{a}', optimize=True)
            f['apercu'] = a
        elif f['format'] == 'MP4' and not video_sans_apercu:
            a = os.path.splitext(a)[0] + '.jpg'
            subprocess.run([FFMPEG, '-v', 'error', '-y', '-ss', '1.5', '-i', f'{P}/{f["chemin"]}', '-frames:v', '1', '-vf', 'scale=360:-2', f'{P}/{a}'], check=True)
            f['apercu'] = a
    # Un zip déterministe par famille (même contenu, même fichier : git ne voit pas de changement)
    z = f'{fam["id"]}/sos-miam-{fam["id"]}.zip'
    chemins = sorted(f['chemin'] for f in fam['fichiers'])
    for c in chemins: os.utime(f'{P}/{c}', (1767225600, 1767225600))
    subprocess.run(['zip', '-q', '-X', '-D', *(['-0'] if fam.pop('zip_sans_compression', False) else []), z, *chemins], cwd=P, check=True)
    fam['zip'] = z
# Un PDF prend l'aperçu de l'image du même nom (une affiche en A3 ou 40 × 60 cm, celui de l'affiche)
for fam in idx:
    apercus = {os.path.splitext(f['nom'])[0]: f['apercu'] for f in fam['fichiers'] if f['apercu']}
    for f in fam['fichiers']:
        if not f['apercu']: f['apercu'] = apercus.get(re.sub(r'-(a3|40x60)$', '', os.path.splitext(f['nom'])[0]))
        f['canaux'] = canaux(fam['id'], f)

# Les zips des kits médias du site (apps/site-web/src/contenus/maquettes-kits.ts)
os.makedirs(f'{P}/kits')
ambassadeurs = [f['chemin'] for fam in idx for f in fam['fichiers'] if (fam['id'] == 'affiches' and 'vitrine' not in f['nom'])
                or (fam['id'] == 'imprimes' and re.match(r'(flyer-a6|planche-stickers|badges-epingle)', f['nom']))]
subprocess.run(['zip', '-q', '-X', '-D', 'kits/sos-miam-affiches-et-imprimes.zip', *sorted(ambassadeurs)], cwd=P, check=True)
series = {}
for fam in idx:
    if fam['id'] == 'reseaux':
        for f in fam['fichiers']: series.setdefault(re.sub(r'-\d+\.png$', '', f['nom']), []).append(f['chemin'])
for serie, chemins in series.items():
    subprocess.run(['zip', '-q', '-X', '-D', f'kits/reseaux-{serie}.zip', *sorted(chemins)], cwd=P, check=True)

json.dump({'genere': datetime.date.today().isoformat(), 'familles': idx}, open(f'{P}/index.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
shutil.copy2(f'{RACINE}/scripts/presse/presse-lisezmoi.md', f'{P}/LISEZMOI.md')
print(sum(len(f['fichiers']) for f in idx), 'fichiers,', len(idx), 'familles')

# L'échange, d'un coup
ancien = f'{TRAVAIL}/presse-ancien'
if os.path.exists(ancien): shutil.rmtree(ancien)
if os.path.exists(PRESSE): os.rename(PRESSE, ancien)
os.rename(P, PRESSE)
if os.path.exists(ancien): shutil.rmtree(ancien)
