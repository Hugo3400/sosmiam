// Politique de confidentialité, section « Te connecter avec un QR code » (article 13 du RGPD), reprise par confidentialite.ts
// dans le chapitre « Ton compte et l'app ». Ce qui est vraiment fait (décidé le 14 octobre 2026) :
// apps/api/prisma/schema/connexion-qr.prisma (DemandeConnexionQr : empreintes SHA-256 du code et du secret, cible, origine,
// appareil, statut, compte, dates), apps/api/src/routes/connexion-qr.ts et services/connexion-qr-regles.ts (QR de 2 minutes,
// demande effacée par le ménage de nuit un jour après sa fin), apps/site-web/src/services/connexion-qr.server.ts et
// cookies-connexion-externe.server.ts (cookie chiffré __Host-sosmiam-connexion-qr, 2 minutes au plus).
import type { SectionLegale } from "~/contenus/legal/type-legal";

export const sectionConnexionQr: SectionLegale = {
  id: "connexion-qr",
  titre: "Te connecter avec un QR code",
  blocs: [
    "Sur sosmiam.fr (« Mon compte »), dans l'espace ambassadeur et dans l'espace pro, « Me connecter avec l'app » affiche un QR code ; un téléphone où tu n'es pas encore connecté peut aussi en afficher un. Tu le scannes avec l'app SOS Miam déjà connectée à ton compte, tu vérifies l'appareil qu'elle te montre, et tu acceptes (avec Face ID, ton empreinte ou le code de ton téléphone) : l'appareil qui attendait est connecté, sans taper ton mot de passe.",
    {
      liste: [
        "**Ce qu'on garde, le temps de la demande** : une courte description de l'appareil qui affiche le QR (par exemple « Chrome sur Mac », tirée de la signature de son navigateur, **jamais son adresse IP**), le site d'où vient la demande (sosmiam.fr, l'espace ambassadeur, l'espace pro ou l'app), le compte qui a scanné, l'état de la demande (en attente, scannée, acceptée ou refusée) et ses dates. Du code du QR et du code secret gardé par l'appareil qui attend, on ne garde que des **empreintes** (un calcul qui ne permet pas de les retrouver).",
        "**Combien de temps** : un QR ne marche que **2 minutes**, et une seule fois. La demande est effacée par notre ménage de nuit dès qu'elle a pris fin depuis plus d'**un jour** (soit 2 jours au plus), et tout de suite si tu supprimes ton compte. La connexion ouverte suit ensuite les règles habituelles (voir [Ton compte ambassadeur](#compte-ambassadeur) et [L'app SOS Miam : ton compte](#app-comptes)).",
        "**Un cookie de 2 minutes** : sur le site, pendant l'attente, le code secret est gardé dans un cookie chiffré, **__Host-sosmiam-connexion-qr**, effacé au bout de **2 minutes au plus** (voir la page [Cookies](/cookies#liste-des-cookies)). Il est strictement nécessaire : sans lui, impossible de savoir que c'est bien ton navigateur qui attend.",
        "**Ton adresse IP** sert seulement à limiter le nombre de QR demandés, contre les robots : elle reste en mémoire le temps de cette limite et n'est jamais enregistrée avec la demande. Notre serveur n'écrit ni le code, ni le secret, ni ton e-mail dans ses journaux. Seule exception : si le QR est ouvert dans un navigateur plutôt que dans l'app, son adresse passe, comme toute adresse visitée, dans le journal de la porte d'entrée du serveur (voir « Les journaux du serveur ») ; ce code ne sert de toute façon plus à rien au bout de 2 minutes.",
        "**Pourquoi** : te connecter sans taper ton mot de passe, en voyant bien quel appareil tu connectes. **Base légale** : l'exécution des [conditions d'utilisation](/cgu) que tu as acceptées en créant ton compte (article 6.1.b du RGPD).",
        "**Le conseil de sécurité qui compte** : ne scanne **jamais** le QR code de quelqu'un d'autre, même si on te le demande très gentiment (« scanne pour gagner un bonus », « c'est pour vérifier ton compte »…). Accepter un QR, c'est ouvrir ton compte sur l'appareil qui l'affiche : si ce n'est pas le tien, quelqu'un d'autre se retrouve dans ton compte. Et n'envoie ton QR à personne. Un doute ? Refuse dans l'app : rien ne se passe.",
      ],
    },
  ],
};
