// Politique de confidentialité, sections de l'app mobile, reprises par confidentialite.ts.
// « Aujourd'hui » : relu contre le code de l'app par la session app-mobile le 8 octobre 2026 (stockage/*.ts, app.json) :
// rien n'est envoyé à notre serveur, ni à un outil de mesure ou de suivi des plantages, et aucune notification n'est envoyée.
// « Bientôt avec un compte » : ce qui est déclaré dans la fiche « Confidentialité » d'App Store Connect. Durées décidées par
// Hugo le 8 octobre 2026 : compte effacé après 2 ans sans connexion (mail avant), signalements gardés 1 an après la décision.
// Messagerie, potes et pub réels : à décrire ici AVANT qu'ils démarrent (aujourd'hui, ce sont des démos sur le téléphone).
import { hebergeur } from "~/contenus/legal/informations-legales";
import type { SectionLegale } from "~/contenus/legal/type-legal";

/** L'app telle qu'elle est aujourd'hui : tout reste sur le téléphone. */
export const sectionApp: SectionLegale = {
  id: "app",
  titre: "L'app SOS Miam, aujourd'hui",
  blocs: [
    "L'app SOS Miam (iPhone et Android) est en préparation. Dans sa version actuelle, **rien de ce que tu y fais n'est envoyé à notre serveur** : tout reste sur ton téléphone, et nous n'y avons pas accès. Pas de compte, pas de pub, pas d'outil de mesure d'audience ni de suivi des plantages, et aucune notification envoyée.",
    {
      liste: [
        "**Ton profil** (ton prénom, ton pseudo, ta date de naissance, ta ville et tes envies, dont un éventuel régime particulier) : gardé dans le coffre-fort chiffré de ton téléphone (le Trousseau sur iPhone, le Keystore sur Android).",
        "**Ta photo de profil, ton activité** (tes rescousses, tes J'aime, les lieux que tu gardes ou que tu suis, les publications que tu masques), **tes signalements et tes réglages** (notifications, son du fil) : gardés dans les fichiers de l'app, sur ton téléphone. L'app ne les chiffre pas.",
        "**Les potes et la messagerie sont pour l'instant une démo** : les potes, les sorties, les listes, les commentaires et les conversations sont des exemples. Tes messages, tes photos et tes notes vocales restent sur ton téléphone : rien ne part vers de vraies personnes.",
        "**Ton code d'invitation** : tiré au hasard et gardé dans le coffre-fort de ton téléphone. Il ne sort que si tu montres ton QR code. Quand tu invites quelqu'un, le message ne contient que ton pseudo et l'adresse sosmiam.fr.",
        "**Les autorisations**, toujours demandées au moment où tu en as besoin, jamais au lancement : le **micro**, seulement quand tu enregistres une note vocale ; l'**appareil photo**, pour scanner le QR code d'un pote (l'image du scan n'est pas gardée), prendre ta photo de profil ou une photo à envoyer ; tes **photos**, pour en choisir une (l'app ne reçoit que celle que tu choisis, pas ta galerie).",
        "**Ta position** : seulement quand l'app est ouverte et que tu le demandes, jamais en arrière-plan. Elle sert à trouver le nom de ta ville à l'inscription, ou à te montrer les lieux autour de toi dans Explorer. L'app ne la garde jamais : seulement le nom de ta ville.",
        "**Ce qui passe par Apple ou Google** : pour trouver le nom de ta ville, ta position est envoyée au service de ton téléphone (celui d'Apple sur iPhone, celui de Google sur Android), à ce moment-là seulement. Sur iPhone, la carte d'Explorer est dessinée par Plans d'Apple, qui reçoit la zone que tu regardes ; sur Android, la carte n'est pas encore là, et cette page dira avant son arrivée comment elle marche. « Y aller » ouvre Plans ou Google Maps avec l'adresse du lieu (pas ta position) : tu quittes alors l'app. Dans tous ces cas, ce sont les règles de confidentialité d'Apple ou de Google qui s'appliquent.",
        "**L'âge** : l'app est ouverte à partir de 15 ans, et de 15 à 17 ans, tout ce qui touche à l'alcool est masqué. Si tu as moins de 15 ans, l'app ne garde qu'une chose : la date de tes 15 ans, dans le coffre-fort chiffré du téléphone (sur iPhone, elle y reste même si tu supprimes l'app). L'inscription reste fermée sur ce téléphone jusqu'à ce jour-là ; la date de naissance que tu as donnée, elle, n'est pas gardée.",
        "**La sauvegarde de ton téléphone** : comme pour toute app, ce qu'elle garde peut faire partie de la sauvegarde iCloud ou Google de ton téléphone, si tu l'as activée.",
        "**Tout effacer** : dans les réglages de l'app, « Effacer mes données et recommencer » efface tout ce que l'app a gardé, sauf la date de tes 15 ans si l'âge a bloqué l'inscription : elle s'efface toute seule ce jour-là. Sur iPhone, supprimer l'app ne vide pas le Trousseau : utilise d'abord ce bouton.",
      ],
    },
  ],
};

/** Ce qui changera avec les comptes : écrit au futur, à passer au présent le jour où la version à comptes sort. */
export const sectionAppComptes: SectionLegale = {
  id: "app-comptes",
  titre: "L'app, bientôt avec un compte",
  blocs: [
    "Bientôt, tu pourras créer un compte dans l'app. **Rien de ce qui suit ne fonctionne encore** : on te le dit à l'avance, et cette partie sera relue et mise à jour avant que les comptes ouvrent.",
    {
      liste: [
        "**Ton compte** : tu le créeras avec Apple, avec Google ou avec ton e-mail. Avec Apple ou Google, ils nous transmettront ton e-mail et ton nom ; avec Apple, tu pourras masquer ton adresse grâce à « Masquer mon adresse e-mail ». Avec ton e-mail, tu confirmeras ton adresse en touchant un lien qu'on t'enverra, et « Mot de passe oublié » t'enverra un lien valable 24 heures, une seule fois, comme pour l'espace ambassadeur.",
        "**Ce qu'on gardera sur notre serveur** : ton prénom (obligatoire), ton nom (facultatif), ton e-mail et l'identifiant de ton compte ; la ville choisie à l'inscription ; ta date de naissance ; tes envies (lieux, cuisines, boissons, types de bar, musique, jeux, moments) ; ton activité (tes rescousses, 3 par semaine, tes J'aime et tes lieux gardés) ; tes signalements de publications (la raison, une précision et ton texte).",
        "**Pourquoi** : faire marcher ton compte, ton fil « Pour toi » (trié selon tes envies) et tes rescousses ; appliquer les règles d'âge (inscription dès 15 ans, alcool masqué jusqu'à 18 ans) ; traiter les signalements.",
        "**Base légale** : l'exécution des conditions d'utilisation de l'app (article 6.1.b du RGPD) pour ton compte et ses fonctions ; notre intérêt légitime (article 6.1.f du RGPD) pour la modération des signalements, qui protège tout le monde.",
        "**Les signalements** : un modérateur les lira et les traitera à la main, dans notre logiciel de gestion. Un signalement pour violence ou contenu sexuel masquera la publication pour tout le monde dès le premier signalement, le temps de vérifier.",
        "**Tes régimes particuliers** (végétarien, vegan, halal, casher, sans gluten, allergies…) : ils peuvent révéler une religion ou un état de santé. Ils resteront sur ton téléphone, et ne partiront à notre serveur qu'avec ton accord explicite.",
        `**Où et comment** : sur notre serveur, loué à ${hebergeur.nom} et situé en France ; la base de données n'est jamais exposée à Internet. Ta date de naissance, ton nom et, si tu acceptes de les envoyer, tes régimes y seront chiffrés (AES-256-GCM, avec une clé gardée hors de la base). Les sauvegardes sont chiffrées, et les journaux du serveur ne contiendront aucune donnée personnelle de ton compte. Seul l'éditeur y aura accès.`,
        "**Combien de temps** : tant que tu gardes ton compte. **Après 2 ans sans connexion**, on te préviendra par e-mail, puis ton compte sera effacé en entier. Les signalements seront gardés **1 an** après la décision du modérateur, le temps de gérer une contestation ou de repérer des signalements abusifs.",
        "**Supprimer ton compte** : dans l'app (« Supprimer mon compte », dans les réglages), ou par e-mail à bonjour@sosmiam.fr. La suppression sera réelle : ton compte et ses données seront effacés de notre serveur tout de suite, puis de nos sauvegardes au plus tard 30 jours après.",
        "**Ce qui ne sera pas collecté au départ** : ton numéro de téléphone, ta position (elle restera sur ton téléphone), un suivi des plantages, tes contacts, ainsi que toute publicité ou tout suivi publicitaire. La messagerie et les potes, aujourd'hui en démo, ne deviendront réels qu'après une mise à jour de cette page. Les SMS publicitaires, s'il y en a un jour, ne seront envoyés qu'avec ton accord explicite (case non cochée d'avance, et « STOP » pour arrêter).",
      ],
    },
  ],
};
