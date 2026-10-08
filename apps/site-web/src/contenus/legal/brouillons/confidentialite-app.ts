// BROUILLONS de la partie « L'app » de la politique de confidentialité — À RELIRE PAR HUGO, NON PUBLIÉS.
// Ce fichier n'est importé nulle part : une publication du site (npm run site:deployer) ne peut pas le mettre en ligne.
// Sources : sos-miam-e9 (l'app telle qu'elle est, relue contre le code de l'app), sos-miam-1f (la future version avec comptes,
// déclarée chez Apple) ; « 30 jours » des sauvegardes : section « securite » de confidentialite.ts (30 sauvegardes de nuit gardées).
//
// 1. sectionAppAujourdhui : à intégrer dès que l'app est distribuée, même en test (TestFlight, Play Console).
//    En l'intégrant dans confidentialite.ts, mettre aussi à jour : l'introduction (« l'app est en développement, et il n'y a
//    ni compte ni pub ») ; une puce « L'app » dans « En bref » ; la section « destinataires » (géocodage d'Apple ou de Google,
//    seulement si on autorise la position) ; la puce « L'app mobile » de « Ce qui arrivera plus tard » (garder le compte).
// 2. sectionAppAvecComptes : à intégrer seulement le jour où la version à comptes sort, en remplaçant la première.
//    Les repères « À DÉCIDER PAR HUGO » doivent tous disparaître avant.
import type { SectionLegale } from "~/contenus/legal/type-legal";

/** L'app telle qu'elle est aujourd'hui : tout reste sur le téléphone. */
export const sectionAppAujourdhui: SectionLegale = {
  id: "app",
  titre: "L'app SOS Miam",
  blocs: [
    "L'app SOS Miam (iPhone et Android) est en test. Dans sa version actuelle, **rien de ce que tu y fais n'est envoyé à notre serveur** : tout reste sur ton téléphone, et nous n'y avons pas accès.",
    {
      liste: [
        "**Ton profil** (ta date de naissance, un régime particulier…) : gardé sur ton téléphone, dans son coffre-fort chiffré (le Trousseau sur iPhone, le Keystore sur Android).",
        "**Ta photo de profil, ton activité, tes signalements et tes préférences de notifications** : gardés dans les fichiers de l'app, sur ton téléphone. L'app ne les chiffre pas.",
        "**L'appareil photo et tes photos** : seulement si tu choisis une photo de profil. L'app ne reçoit que la photo que tu choisis (pas ta galerie), et ton téléphone te demande ton accord avant d'ouvrir l'appareil photo. La photo reste sur ton téléphone.",
        "**Ta position** : seulement si tu l'autorises, l'app la lit une seule fois pour trouver le nom de ta ville. Cette conversion passe par le service de géocodage d'Apple (sur iPhone) ou de Google (sur Android), selon leurs propres règles. L'app ne garde que le nom de la ville, jamais ta position.",
        "**L'âge** : l'app est ouverte à partir de 15 ans. Si tu as moins de 15 ans, elle ne garde qu'une chose : la date de tes 15 ans, dans le coffre-fort chiffré du téléphone (sur iPhone, elle reste même si tu supprimes l'app). L'inscription reste fermée sur ce téléphone jusqu'à ce jour-là ; la date de naissance que tu as donnée, elle, n'est pas gardée.",
        "**Ce que l'app ne fait pas** : pas de compte, pas de publicité, pas de suivi publicitaire, pas d'accès à tes contacts, et pas d'outil de suivi des plantages pour l'instant.",
        "**Tout effacer** : dans les réglages de l'app, « Effacer mes données et recommencer » efface tout ce que l'app a gardé, sauf la date de tes 15 ans si l'âge a bloqué l'inscription : elle s'efface toute seule ce jour-là. Sur iPhone, supprimer l'app ne vide pas le Trousseau : utilise d'abord ce bouton.",
      ],
    },
    "Avant que l'app envoie quoi que ce soit à notre serveur (avec l'arrivée des comptes, par exemple), cette partie sera mise à jour pour dire ce qui part, pourquoi, sur quelle base légale et combien de temps on le garde.",
  ],
};

/** La future version avec comptes (décrite par sos-miam-1f, déclarée dans la fiche « Confidentialité » d'Apple). */
export const sectionAppAvecComptes: SectionLegale = {
  id: "app",
  titre: "L'app SOS Miam",
  blocs: [
    "Dans l'app SOS Miam (iPhone et Android), tu crées un compte. Voici ce qui est envoyé à notre serveur, et ce qui reste sur ton téléphone.",
    {
      liste: [
        "**Ton compte** : tu le crées avec Apple, avec Google ou avec ton e-mail. Avec Apple ou Google, ils nous transmettent ton e-mail et ton nom ; avec Apple, tu peux masquer ton adresse grâce à « Masquer mon adresse e-mail ». **[À DÉCIDER PAR HUGO : d'autres prestataires de connexion ?]**",
        "**Ce qu'on garde sur notre serveur** : ton prénom (obligatoire), ton nom (facultatif), ton e-mail et l'identifiant de ton compte ; la ville choisie à l'inscription ; ta date de naissance ; tes envies (lieux, cuisines, boissons, types de bar, musique, jeux, moments) ; ton activité (tes rescousses, 3 par semaine, tes J'aime et tes lieux gardés) ; tes signalements de publications (la raison, une précision et ton texte).",
        "**Pourquoi** : faire marcher ton compte, ton fil « Pour toi » (trié selon tes envies) et tes rescousses ; vérifier ton âge : on s'inscrit à partir de 15 ans, et de 15 à 17 ans, tout ce qui touche à l'alcool est masqué ; traiter les signalements.",
        "**Base légale** : l'exécution des conditions d'utilisation de l'app (article 6.1.b du RGPD) pour ton compte et ses fonctions ; notre intérêt légitime (article 6.1.f) pour la modération des signalements, qui protège tout le monde. **[À VALIDER PAR HUGO]**",
        "**Les signalements** : un modérateur les lit et les traite à la main, dans notre logiciel de gestion. Un signalement pour violence ou contenu sexuel masque la publication pour tout le monde dès le premier signalement, le temps de vérifier.",
        "**Tes régimes particuliers** (végétarien, vegan, halal, casher, sans gluten, allergies…) : ils peuvent révéler une religion ou un état de santé. Ils restent sur ton téléphone, dans son coffre-fort chiffré (le Trousseau sur iPhone, le Keystore sur Android), et ne partent pas à notre serveur sans ton accord explicite.",
        `**Où et comment** : sur notre serveur, loué à FEELB SARL et situé en France ; la base de données n'est jamais exposée à Internet. Ta date de naissance, ton nom et, si tu acceptes de les envoyer, tes régimes y sont chiffrés (AES-256-GCM, avec une clé gardée hors de la base). Les sauvegardes sont chiffrées, et les journaux du serveur ne contiennent aucune donnée personnelle de ton compte. Seul l'éditeur y a accès.`,
        "**Combien de temps** : ton compte et ce qui va avec, tant que tu le gardes : **[À DÉCIDER PAR HUGO : durée après la suppression, ou après une longue inactivité]**. Les signalements : **[À DÉCIDER PAR HUGO]**.",
        "**Supprimer ton compte** : dans l'app (Réglages > « Supprimer mon compte »), ou par e-mail à bonjour@sosmiam.fr. La suppression est réelle : ton compte et ses données sont effacés de notre serveur, puis des sauvegardes au plus tard 30 jours après.",
        "**Ce qui n'est pas collecté pour l'instant** : ton numéro de téléphone, ta position en continu (pour les lieux autour de toi, plus tard et seulement si tu l'autorises), un suivi des plantages, tes contacts, ainsi que toute publicité ou tout suivi publicitaire. Avant que l'un d'eux arrive, cette partie sera mise à jour ; les SMS publicitaires, par exemple, ne seront envoyés qu'avec ton accord explicite (case non cochée d'avance, et « STOP » pour arrêter).",
      ],
    },
    "On ne vend jamais tes données, et on ne les loue pas.",
  ],
};
