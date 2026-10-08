#!/usr/bin/env python3
"""Tient la liste des inscrits à la newsletter à partir de la boîte bonjour@sosmiam.fr.

Le bouton « Je m'inscris à la newsletter » de la page Bientôt ouvre un mail tout prêt
(objet « Inscription à la newsletter SOS Miam », ligne « Ma ville : »). Ce script lit la boîte
en IMAP, sans rien marquer comme lu ni déplacer, et écrit la liste dans un CSV :
une ligne par adresse encore inscrite, sans doublons.

Désinscriptions, reconnues toutes seules : un mail dont l'objet contient « désinscri… » ou
« unsubscribe », ou une réponse dont la première ligne est « STOP ». La dernière action l'emporte :
une personne désinscrite qui écrit à nouveau pour s'inscrire revient dans la liste.
Les autres demandes (un mail libre « je ne veux plus rien recevoir ») se notent à la main dans
/root/sos-miam-donnees/desinscrits.txt, une adresse par ligne :
    lea@exemple.fr 2026-10-12   → désinscrite ce jour-là (une réinscription plus récente l'emporte)
    tom@exemple.fr              → désinscrit pour de bon, tant que la ligne reste

Usage : npm run inscrits:recuperer (en root). Pas encore lancé automatiquement : une tâche cron de nuit reste à installer.
Connexion : /root/sos-miam-secrets/boite-bonjour.env (lisible par root seulement), trois lignes :
    IMAP_SERVEUR=mail.yubox.io
    IMAP_UTILISATEUR=bonjour@sosmiam.fr
    IMAP_MOT_DE_PASSE=le-mot-de-passe-de-la-boite
Résultat : /root/sos-miam-donnees/inscrits.csv (séparateur « ; », s'ouvre tel quel dans un tableur).
La colonne a_relancer dit « oui » après 3 ans sans aucun message (la politique de confidentialité
promet alors de redemander, puis d'effacer sans réponse). Les données restent hors du dépôt.
"""
import base64
import csv
import email
import email.policy
import imaplib
import os
import re
import sys
import tempfile
import time
from datetime import datetime, timedelta, timezone
from email.utils import parseaddr, parsedate_to_datetime

FICHIER_CONNEXION = "/root/sos-miam-secrets/boite-bonjour.env"
DOSSIER_DONNEES = "/root/sos-miam-donnees"
FICHIER_INSCRITS = os.path.join(DOSSIER_DONNEES, "inscrits.csv")
FICHIER_DESINSCRITS = os.path.join(DOSSIER_DONNEES, "desinscrits.txt")
DELAI_RELANCE = timedelta(days=3 * 365)

# Recherches IMAP en ASCII (accepté par tous les serveurs), affinées ensuite en Python
RECHERCHES = (
    ("SUBJECT", '"newsletter SOS Miam"'),
    ("OR", "OR", "SUBJECT", '"sinscri"', "SUBJECT", '"unsubscribe"', "BODY", '"stop"'),
)
OBJET_INSCRIPTION = re.compile(r"newsletter SOS Miam", re.IGNORECASE)
OBJET_DESINSCRIPTION = re.compile(r"d[ée]sinscri|unsubscribe", re.IGNORECASE)
LIGNE_STOP = re.compile(r"^stop\W*$", re.IGNORECASE)
# Dossiers où sont nos propres mails ou les mails jetés : on ne les lit pas
DRAPEAUX_IGNORES = {"\\trash", "\\sent", "\\drafts", "\\noselect"}
NOMS_IGNORES = re.compile(r"trash|corbeille|deleted|supprim|sent|envoy|draft|brouillon", re.IGNORECASE)
ADRESSE_VALIDE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
LIGNE_VILLE = re.compile(r"^[>\s]*Ma ville\s*:[ \t]*(.*)$", re.IGNORECASE | re.MULTILINE)


def lire_connexion(chemin=FICHIER_CONNEXION):
    """Lit le fichier de connexion (CLE=valeur) et refuse s'il est lisible par d'autres que root."""
    if not os.path.exists(chemin):
        sys.exit(f"Fichier de connexion absent : {chemin} (voir l'en-tête de ce script).")
    if os.stat(chemin).st_mode & 0o077:
        sys.exit(f"{chemin} est lisible par d'autres comptes : lance « chmod 600 {chemin} ».")
    reglages = {}
    with open(chemin, encoding="utf-8") as fichier:
        for ligne in fichier:
            ligne = ligne.rstrip("\r\n")
            if ligne.strip() and not ligne.lstrip().startswith("#") and "=" in ligne:
                cle, valeur = ligne.split("=", 1)
                reglages[cle.strip()] = valeur
    manquants = [cle for cle in ("IMAP_SERVEUR", "IMAP_UTILISATEUR", "IMAP_MOT_DE_PASSE") if not reglages.get(cle)]
    if manquants:
        sys.exit(f"Il manque dans {chemin} : {', '.join(manquants)}.")
    return reglages


def decoder_nom_dossier(nom):
    """Les noms de dossiers IMAP accentués sont codés en « UTF-7 modifié » (ex. Envoy&AOk-s)."""
    def remplacer(trouve):
        morceau = trouve.group(1)
        if not morceau:
            return "&"
        morceau = morceau.replace(",", "/")
        return base64.b64decode(morceau + "=" * (-len(morceau) % 4)).decode("utf-16-be")
    return re.sub(r"&([^-]*)-", remplacer, nom)


def lister_dossiers(imap):
    """Dossiers à fouiller : tous, sauf la corbeille, les envoyés et les brouillons (Spam compris)."""
    statut, lignes = imap.list()
    if statut != "OK":
        return ["INBOX"]
    dossiers = []
    for ligne in lignes:
        if isinstance(ligne, tuple):  # nom envoyé à part par le serveur (« littéral ») : on le remet entre guillemets
            ligne = ligne[0].rsplit(b" ", 1)[0] + b' "' + ligne[1] + b'"'
        trouve = re.match(rb'\((?P<drapeaux>[^)]*)\) (?:"[^"]*"|NIL) (?P<nom>.+)$', ligne or b"")
        if not trouve:
            continue
        drapeaux = {d.lower() for d in trouve.group("drapeaux").decode().split()}
        nom = trouve.group("nom").decode()
        if drapeaux & DRAPEAUX_IGNORES or NOMS_IGNORES.search(decoder_nom_dossier(nom.strip('"'))):
            continue
        dossiers.append(nom)
    return dossiers or ["INBOX"]


def lire_texte(message):
    """Texte du mail (la partie texte, sinon la partie HTML sans ses balises)."""
    corps = message.get_body(preferencelist=("plain", "html"))
    texte = corps.get_content() if corps else ""
    if corps and corps.get_content_type() == "text/html":
        texte = re.sub(r"<br\s*/?>|</p>|</div>", "\n", texte, flags=re.IGNORECASE)
        texte = re.sub(r"<[^>]+>", "", texte)
    return texte


def lire_evenement(octets, reception, adresse_boite):
    """Transforme un mail en inscription ou en désinscription datée. None si ce n'est ni l'un ni l'autre."""
    message = email.message_from_bytes(octets, policy=email.policy.default)
    adresse = parseaddr(str(message["From"] or ""))[1].strip().lower()
    if not ADRESSE_VALIDE.match(adresse) or adresse == adresse_boite.lower():
        return None
    try:
        moment = parsedate_to_datetime(str(message["Date"]))
    except (TypeError, ValueError):
        moment = reception
    if moment.tzinfo is None:
        moment = moment.replace(tzinfo=timezone.utc)
    objet, texte = str(message["Subject"] or ""), lire_texte(message)
    premiere_ligne = next((l.strip() for l in texte.splitlines() if l.strip() and not l.lstrip().startswith(">")), "")
    if OBJET_DESINSCRIPTION.search(objet) or LIGNE_STOP.match(premiere_ligne):
        return {"type": "desinscription", "adresse": adresse, "moment": moment}
    if not OBJET_INSCRIPTION.search(objet):
        return None
    ville = LIGNE_VILLE.search(texte)
    return {"type": "inscription", "adresse": adresse, "moment": moment, "ville": ville.group(1).strip()[:80] if ville else ""}


def lire_desinscrits(chemin=FICHIER_DESINSCRITS):
    """Désinscriptions notées à la main : datées (événements) ou sans date (blocage définitif)."""
    evenements, bloques = [], set()
    if not os.path.exists(chemin):
        return evenements, bloques
    with open(chemin, encoding="utf-8") as fichier:
        for ligne in fichier:
            morceaux = ligne.split("#", 1)[0].split()
            if not morceaux:
                continue
            adresse = morceaux[0].lower()
            try:
                jour = datetime.strptime(morceaux[1], "%Y-%m-%d") if len(morceaux) > 1 else None
            except ValueError:
                jour = None
            if jour is None:
                bloques.add(adresse)
            else:  # fin de journée : l'emporte sur une inscription du même jour
                fin = jour.replace(hour=23, minute=59, second=59, tzinfo=timezone.utc)
                evenements.append({"type": "desinscription", "adresse": adresse, "moment": fin})
    return evenements, bloques


def fusionner_evenements(evenements, bloques, maintenant):
    """Rejoue les événements dans l'ordre : la dernière action de chaque adresse l'emporte."""
    lignes, ville = {}, {}
    for ev in sorted(evenements, key=lambda e: e["moment"]):
        adresse, jour = ev["adresse"], ev["moment"].date().isoformat()
        if ev["type"] == "desinscription":  # on oublie tout, ville comprise
            lignes.pop(adresse, None)
            ville.pop(adresse, None)
            continue
        ville[adresse] = ev["ville"] or ville.get(adresse, "")
        ligne = lignes.setdefault(adresse, {"adresse": adresse, "inscrit_le": jour})
        ligne["dernier_moment"] = ev["moment"]
    resultat = []
    for adresse, ligne in lignes.items():
        if adresse in bloques:
            continue
        a_relancer = maintenant - ligne["dernier_moment"] > DELAI_RELANCE
        resultat.append({"adresse": adresse, "ville": ville[adresse], "inscrit_le": ligne["inscrit_le"],
                         "dernier_message": ligne["dernier_moment"].date().isoformat(), "a_relancer": "oui" if a_relancer else "non"})
    return sorted(resultat, key=lambda l: (l["inscrit_le"], l["adresse"]))


def proteger_cellule(valeur):
    """Empêche un tableur d'exécuter une cellule qui commence comme une formule (=, +, -, @)."""
    return "'" + valeur if valeur[:1] in ("=", "+", "-", "@", "\t", "\r") else valeur


def ecrire_csv(lignes, chemin=FICHIER_INSCRITS):
    """Écrit le CSV d'un coup (fichier temporaire puis renommage), lisible par root seulement."""
    colonnes = ("adresse", "ville", "inscrit_le", "dernier_message", "a_relancer")
    os.makedirs(os.path.dirname(chemin), mode=0o700, exist_ok=True)
    descripteur, temporaire = tempfile.mkstemp(dir=os.path.dirname(chemin), suffix=".tmp")
    with os.fdopen(descripteur, "w", encoding="utf-8-sig", newline="") as fichier:
        ecrivain = csv.writer(fichier, delimiter=";")
        ecrivain.writerow(colonnes)
        for ligne in lignes:
            ecrivain.writerow([proteger_cellule(ligne[c]) for c in colonnes])
    os.chmod(temporaire, 0o600)
    os.replace(temporaire, chemin)


def recuperer_evenements(imap, adresse_boite):
    """Parcourt les dossiers en lecture seule et renvoie les inscriptions et désinscriptions trouvées."""
    evenements = []
    for dossier in lister_dossiers(imap):
        statut, _ = imap.select(dossier, readonly=True)
        if statut != "OK":
            continue
        numeros = set()
        for criteres in RECHERCHES:
            statut, trouves = imap.search(None, *criteres)
            if statut == "OK" and trouves and trouves[0]:
                numeros.update(trouves[0].split())
        for numero in sorted(numeros, key=int):
            statut, donnees = imap.fetch(numero, "(INTERNALDATE BODY.PEEK[])")
            partie = next((p for p in donnees or [] if isinstance(p, tuple)), None)
            if not partie:
                continue
            horodatage = imaplib.Internaldate2tuple(partie[0])
            reception = datetime.fromtimestamp(time.mktime(horodatage), timezone.utc) if horodatage else datetime.now(timezone.utc)
            evenement = lire_evenement(partie[1], reception, adresse_boite)
            if evenement:
                evenements.append(evenement)
        imap.close()
    return evenements


def lancer():
    reglages = lire_connexion()
    serveur, port = reglages["IMAP_SERVEUR"], int(reglages.get("IMAP_PORT") or 993)
    try:
        imap = imaplib.IMAP4_SSL(serveur, port, timeout=30)
        imap.login(reglages["IMAP_UTILISATEUR"], reglages["IMAP_MOT_DE_PASSE"])
    except (OSError, imaplib.IMAP4.error) as erreur:
        sys.exit(f"Connexion à {serveur}:{port} impossible : {erreur}")
    try:
        evenements = recuperer_evenements(imap, reglages["IMAP_UTILISATEUR"])
    finally:
        imap.logout()
    manuels, bloques = lire_desinscrits()
    lignes = fusionner_evenements(evenements + manuels, bloques, datetime.now(timezone.utc))
    ecrire_csv(lignes)
    desinscriptions = sum(1 for e in evenements + manuels if e["type"] == "desinscription") + len(bloques)
    a_relancer = sum(1 for l in lignes if l["a_relancer"] == "oui")
    print(f"{datetime.now():%Y-%m-%d %H:%M} : {len(lignes)} inscrit(s), {desinscriptions} désinscription(s) appliquée(s), "
          f"{a_relancer} à relancer → {FICHIER_INSCRITS}")


if __name__ == "__main__":
    lancer()
