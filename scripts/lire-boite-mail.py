#!/usr/bin/env python3
"""Lit la boîte bonjour@sosmiam.fr en IMAP pour la boîte de réception du logiciel de gestion (l'API l'appelle).
Rien n'est gardé ailleurs : chaque appel relit la boîte. Commandes (résultat en JSON sur la sortie) :
    liste <nombre> [adresse]   les derniers messages (de, objet, date, lu, répondu), éventuellement d'une seule adresse ;
                               rien n'est marqué comme lu
    message <uid>              un message en entier (texte, pièces jointes nommées) ; il est alors marqué comme lu
    repondu <uid>              marque le message comme « répondu »
    non-lus                    le nombre de messages pas encore lus
Connexion : le fichier de la boîte (FICHIER_BOITE_MAIL, par défaut /root/sos-miam-secrets/boite-bonjour.env), lignes
IMAP_SERVEUR, IMAP_UTILISATEUR, IMAP_MOT_DE_PASSE (les mêmes que pour l'envoi et les désinscriptions).
"""
import email
import email.policy
import email.utils
import html
import imaplib
import json
import os
import re
import sys

FICHIER = os.environ.get("FICHIER_BOITE_MAIL", "/root/sos-miam-secrets/boite-bonjour.env")
# Mails envoyés par des robots (retours de mails non distribués, inscriptions de l'ancienne page « Bientôt »…)
AUTOMATIQUES = re.compile(r"mailer-daemon|postmaster|no-?reply|ne-pas-repondre", re.I)
OBJETS_AUTOMATIQUES = re.compile(r"^(inscription à la newsletter sos miam|undelivered|delivery status|mail delivery|non remis)", re.I)


def lire_reglages():
    reglages = {}
    with open(FICHIER, encoding="utf-8") as fichier:
        for ligne in fichier:
            if "=" in ligne and not ligne.lstrip().startswith("#"):
                cle, valeur = ligne.split("=", 1)
                reglages[cle.strip()] = valeur.strip()
    return reglages


def connecter(lecture_seule):
    reglages = lire_reglages()
    boite = imaplib.IMAP4_SSL(reglages["IMAP_SERVEUR"], 993, timeout=30)
    boite.login(reglages["IMAP_UTILISATEUR"], reglages["IMAP_MOT_DE_PASSE"])
    boite.select("INBOX", readonly=lecture_seule)
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


def liste(nombre, adresse=None):
    boite = connecter(True)
    critere = ["FROM", adresse] if adresse else ["ALL"]
    _, donnees = boite.uid("search", None, *critere)
    uids = (donnees[0] or b"").split()[-nombre:]
    messages = []
    if uids:
        _, reponses = boite.uid("fetch", b",".join(uids), "(UID FLAGS RFC822.SIZE BODY.PEEK[HEADER.FIELDS (FROM SUBJECT DATE)])")
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
                "objet": objet,
                "date": date_iso(tete["Date"]),
                "lu": "\\Seen" in (drapeaux.group(1) if drapeaux else ""),
                "repondu": "\\Answered" in (drapeaux.group(1) if drapeaux else ""),
                "taille": int(taille.group(1)) if taille else 0,
                "automatique": bool(AUTOMATIQUES.search(de["adresse"]) or OBJETS_AUTOMATIQUES.search(objet)),
            })
    boite.logout()
    return sorted(messages, key=lambda m: m["uid"], reverse=True)


def lire(uid):
    boite = connecter(False)
    _, reponses = boite.uid("fetch", str(uid), "(BODY.PEEK[])")
    brut = next((r[1] for r in reponses if isinstance(r, tuple)), None)
    if brut is None:
        boite.logout()
        return None
    boite.uid("store", str(uid), "+FLAGS", "(\\Seen)")
    boite.logout()
    message = email.message_from_bytes(brut, policy=email.policy.default)
    pieces = [partie.get_filename() for partie in message.iter_attachments() if partie.get_filename()]
    return {
        "uid": uid,
        "de": expediteur(message["From"]),
        "repondreA": expediteur(message["Reply-To"] or message["From"]),
        "objet": str(message["Subject"] or ""),
        "date": date_iso(message["Date"]),
        "messageId": str(message["Message-ID"] or "").strip() or None,
        "references": str(message["References"] or "").strip() or None,
        "texte": texte_du_message(message),
        "pieces": pieces,
    }


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
    if commande == "liste":
        nombre = max(1, min(200, int(arguments[1]) if len(arguments) > 1 else 50))
        return liste(nombre, arguments[2] if len(arguments) > 2 else None)
    if commande == "message" and len(arguments) > 1 and arguments[1].isdigit():
        return lire(int(arguments[1]))
    if commande == "repondu" and len(arguments) > 1 and arguments[1].isdigit():
        return marquer_repondu(int(arguments[1]))
    if commande == "non-lus":
        return non_lus()
    raise SystemExit("Usage : lire-boite-mail.py liste <nombre> [adresse] | message <uid> | repondu <uid> | non-lus")


if __name__ == "__main__":
    try:
        print(json.dumps(principal(sys.argv[1:]), ensure_ascii=False))
    except FileNotFoundError:
        print(json.dumps({"erreur": "boite-absente"}))
        sys.exit(2)
    except (imaplib.IMAP4.error, OSError) as erreur:
        print(json.dumps({"erreur": "boite-injoignable", "detail": str(erreur)[:200]}))
        sys.exit(3)
