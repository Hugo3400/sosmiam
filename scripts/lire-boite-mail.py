#!/usr/bin/env python3
"""Lit la boîte bonjour@sosmiam.fr en IMAP pour la boîte de réception du logiciel de gestion (l'API l'appelle).
Rien n'est gardé ailleurs : chaque appel relit la boîte. Commandes (résultat en JSON sur la sortie) ; <dossier> est
facultatif : recus (par défaut), envoyes ou indesirables :
    liste [dossier] <nombre> [adresse]  les derniers messages (de, à, objet, date, lu, répondu), éventuellement d'une seule
                                        adresse (expéditeur, ou destinataire pour les envoyés) ; rien n'est marqué comme lu
    message [dossier] <uid>             un message en entier (texte, pièces jointes et images) ; marqué comme lu
    piece [dossier] <uid> <numero>      une pièce jointe ou une image du message, en base64 (20 Mo au plus)
    repondu <uid>                       marque le message reçu comme « répondu »
    non-lus                             le nombre de messages reçus pas encore lus
    ranger-envoye                       range dans « Envoyés » le mail brut lu sur l'entrée (copie d'un mail parti)
Connexion : le fichier de la boîte (FICHIER_BOITE_MAIL, par défaut /root/sos-miam-secrets/boite-bonjour.env), lignes
IMAP_SERVEUR, IMAP_UTILISATEUR, IMAP_MOT_DE_PASSE (les mêmes que pour l'envoi et les désinscriptions).
"""
import email
import email.policy
import email.utils
import base64
import html
import imaplib
import json
import os
import re
import sys
import time

FICHIER = os.environ.get("FICHIER_BOITE_MAIL", "/root/sos-miam-secrets/boite-bonjour.env")
# Mails envoyés par des robots (retours de mails non distribués, inscriptions de l'ancienne page « Bientôt »…)
AUTOMATIQUES = re.compile(r"mailer-daemon|postmaster|no-?reply|ne-pas-repondre", re.I)
# Les dossiers, retrouvés par leur rôle (RFC 6154) puis par leur nom courant
DOSSIERS = {"recus": None, "envoyes": ("\\Sent", ["Sent", "INBOX.Sent", "Envoy&AOk-s"]), "indesirables": ("\\Junk", ["Junk", "Spam", "INBOX.Junk"])}
PIECE_MAX = 20 * 1024 * 1024
OBJETS_AUTOMATIQUES = re.compile(r"^(inscription à la newsletter sos miam|undelivered|delivery status|mail delivery|non remis)", re.I)


def lire_reglages():
    reglages = {}
    with open(FICHIER, encoding="utf-8") as fichier:
        for ligne in fichier:
            if "=" in ligne and not ligne.lstrip().startswith("#"):
                cle, valeur = ligne.split("=", 1)
                reglages[cle.strip()] = valeur.strip()
    return reglages


def nom_du_dossier(boite, dossier):
    if not DOSSIERS.get(dossier):
        return "INBOX"
    role, noms = DOSSIERS[dossier]
    _, lignes = boite.list()
    existants = {}
    for ligne in lignes or []:
        texte = ligne.decode(errors="replace")
        trouve = re.match(r'\((?P<drapeaux>[^)]*)\) "[^"]*" "?(?P<nom>[^"]*)"?$', texte)
        if trouve:
            existants[trouve.group("nom")] = trouve.group("drapeaux")
    for nom, drapeaux in existants.items():
        if role in drapeaux:
            return nom
    return next((nom for nom in noms if nom in existants), noms[0])


def connecter(lecture_seule, dossier="recus"):
    reglages = lire_reglages()
    boite = imaplib.IMAP4_SSL(reglages["IMAP_SERVEUR"], 993, timeout=30)
    boite.login(reglages["IMAP_UTILISATEUR"], reglages["IMAP_MOT_DE_PASSE"])
    boite.select(nom_du_dossier(boite, dossier), readonly=lecture_seule)
    return boite


def expediteur(valeur):
    nom, adresse = email.utils.parseaddr(str(valeur or ""))
    return {"nom": nom, "adresse": adresse.lower()}


def date_iso(valeur):
    try:
        return email.utils.parsedate_to_datetime(str(valeur)).isoformat()
    except (TypeError, ValueError):
        return None


def texte_du_message(message):
    corps = message.get_body(preferencelist=("plain", "html"))
    if corps is None:
        return ""
    contenu = corps.get_content()
    if corps.get_content_type() == "text/html":
        contenu = re.sub(r"(?is)<(script|style).*?</\1>", "", contenu)
        contenu = re.sub(r"(?i)<br\s*/?>|</p>|</div>", "\n", contenu)
        contenu = html.unescape(re.sub(r"<[^>]+>", "", contenu))
    return re.sub(r"\n{3,}", "\n\n", contenu).strip()[:20000]


def destinataires(valeur):
    return [{"nom": nom, "adresse": adresse.lower()} for nom, adresse in email.utils.getaddresses([str(valeur or "")]) if adresse]


def liste(nombre, adresse=None, dossier="recus"):
    boite = connecter(True, dossier)
    critere = [("TO" if dossier == "envoyes" else "FROM"), adresse] if adresse else ["ALL"]
    _, donnees = boite.uid("search", None, *critere)
    uids = (donnees[0] or b"").split()[-nombre:]
    messages = []
    if uids:
        _, reponses = boite.uid("fetch", b",".join(uids), "(UID FLAGS RFC822.SIZE BODY.PEEK[HEADER.FIELDS (FROM TO SUBJECT DATE)])")
        for reponse in reponses:
            if not isinstance(reponse, tuple):
                continue
            entete = reponse[0].decode(errors="replace")
            uid = re.search(r"UID (\d+)", entete)
            drapeaux = re.search(r"FLAGS \(([^)]*)\)", entete)
            taille = re.search(r"RFC822\.SIZE (\d+)", entete)
            tete = email.message_from_bytes(reponse[1], policy=email.policy.default)
            de = expediteur(tete["From"])
            objet = str(tete["Subject"] or "")
            messages.append({
                "uid": int(uid.group(1)) if uid else 0,
                "de": de,
                "a": destinataires(tete["To"]),
                "objet": objet,
                "date": date_iso(tete["Date"]),
                "lu": "\\Seen" in (drapeaux.group(1) if drapeaux else ""),
                "repondu": "\\Answered" in (drapeaux.group(1) if drapeaux else ""),
                "taille": int(taille.group(1)) if taille else 0,
                "automatique": bool(AUTOMATIQUES.search(de["adresse"]) or OBJETS_AUTOMATIQUES.search(objet)),
            })
    boite.logout()
    return sorted(messages, key=lambda m: m["uid"], reverse=True)


def lire_brut(uid, dossier, marquer_lu):
    boite = connecter(not marquer_lu, dossier)
    _, reponses = boite.uid("fetch", str(uid), "(BODY.PEEK[])")
    brut = next((r[1] for r in reponses if isinstance(r, tuple)), None)
    if brut is not None and marquer_lu:
        boite.uid("store", str(uid), "+FLAGS", "(\\Seen)")
    boite.logout()
    return None if brut is None else email.message_from_bytes(brut, policy=email.policy.default)


def lister_pieces(message):
    """Les pièces jointes et les images du message, numérotées par leur place dans le message (hors texte lui-même)."""
    corps = message.get_body(preferencelist=("plain", "html"))
    pieces = []
    for numero, partie in enumerate(message.walk()):
        if partie.is_multipart() or partie is corps:
            continue
        type_ = partie.get_content_type()
        nom = partie.get_filename()
        jointe = partie.get_content_disposition() == "attachment"
        if not (jointe or nom or type_.startswith("image/")):
            continue
        pieces.append({"numero": numero, "nom": nom or f"image-{numero}.{type_.split('/')[-1]}", "type": type_,
                       "taille": len(partie.get_payload(decode=True) or b""), "enLigne": not jointe})
    return pieces


def lire(uid, dossier="recus"):
    message = lire_brut(uid, dossier, dossier != "envoyes")
    if message is None:
        return None
    pieces = lister_pieces(message)
    return {
        "uid": uid,
        "de": expediteur(message["From"]),
        "a": destinataires(message["To"]),
        "repondreA": expediteur(message["Reply-To"] or message["From"]),
        "objet": str(message["Subject"] or ""),
        "date": date_iso(message["Date"]),
        "messageId": str(message["Message-ID"] or "").strip() or None,
        "references": str(message["References"] or "").strip() or None,
        "texte": texte_du_message(message),
        "pieces": pieces,
    }


def piece(uid, numero, dossier="recus"):
    message = lire_brut(uid, dossier, False)
    if message is None:
        return None
    for place, partie in enumerate(message.walk()):
        if place == numero and not partie.is_multipart():
            contenu = partie.get_payload(decode=True) or b""
            if len(contenu) > PIECE_MAX:
                return {"erreur": "piece-trop-lourde"}
            return {"nom": partie.get_filename() or f"image-{numero}", "type": partie.get_content_type(), "contenu": base64.b64encode(contenu).decode()}
    return None


def ranger_envoye(brut):
    boite = connecter(False, "envoyes")
    boite.append(nom_du_dossier(boite, "envoyes"), "(\\Seen)", imaplib.Time2Internaldate(time.time()), brut)
    boite.logout()
    return {"ok": True}


def marquer_repondu(uid):
    boite = connecter(False)
    boite.uid("store", str(uid), "+FLAGS", "(\\Answered)")
    boite.logout()
    return {"ok": True}


def non_lus():
    boite = connecter(True)
    _, donnees = boite.uid("search", None, "UNSEEN")
    boite.logout()
    return {"nonLus": len((donnees[0] or b"").split())}


def principal(arguments):
    commande = arguments[0] if arguments else ""
    reste = arguments[1:]
    dossier = reste.pop(0) if reste and reste[0] in DOSSIERS else "recus"
    if commande == "liste":
        nombre = max(1, min(200, int(reste[0]) if reste and reste[0].isdigit() else 50))
        return liste(nombre, reste[1] if len(reste) > 1 else None, dossier)
    if commande == "message" and reste and reste[0].isdigit():
        return lire(int(reste[0]), dossier)
    if commande == "piece" and len(reste) > 1 and reste[0].isdigit() and reste[1].isdigit():
        return piece(int(reste[0]), int(reste[1]), dossier)
    if commande == "ranger-envoye":
        return ranger_envoye(sys.stdin.buffer.read())
    if commande == "repondu" and len(arguments) > 1 and arguments[1].isdigit():
        return marquer_repondu(int(arguments[1]))
    if commande == "non-lus":
        return non_lus()
    raise SystemExit("Usage : lire-boite-mail.py liste [dossier] <nombre> [adresse] | message [dossier] <uid> | piece [dossier] <uid> <numero> | repondu <uid> | non-lus | ranger-envoye")


if __name__ == "__main__":
    try:
        print(json.dumps(principal(sys.argv[1:]), ensure_ascii=False))
    except FileNotFoundError:
        print(json.dumps({"erreur": "boite-absente"}))
        sys.exit(2)
    except (imaplib.IMAP4.error, OSError) as erreur:
        print(json.dumps({"erreur": "boite-injoignable", "detail": str(erreur)[:200]}))
        sys.exit(3)
