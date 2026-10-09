// Page « Cookies » : loi Informatique et Libertés (art. 82) et lignes directrices + recommandation de la CNIL (2020).
// Aujourd'hui : aucun cookie de suivi. Exceptions possibles (exemptées) : cookies de sécurité de Cloudflare, le cookie de refus
// des statistiques (« sosmiam-sans-statistiques », posé seulement par la page /statistiques) et le cookie de session de
// l'espace ambassadeur (« __Host-sosmiam-session », posé sur l'hôte où l'on se connecte : ambassadeur.sosmiam.fr, ou
// l'aperçu apercu.sosmiam.fr ; apps/site-web/src/services/session-compte.server.ts), exempté car il sert à s'authentifier
// (délibération CNIL n° 2020-091, point 49). Les statistiques de visite sont comptées par le serveur, sans cookie.
// À mettre à jour AVANT l'arrivée de la pub ou des vidéos intégrées.
// cf_clearance (défi anti-robots de Cloudflare) : à ajouter à la liste seulement après vérification du réglage « Challenge Passage ».
import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import type { DocumentLegal } from "~/contenus/legal/type-legal";
import { editeur, prestataires, site } from "~/contenus/legal/informations-legales";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;
// Raison sociale complète à la première mention, puis le nom court.
const cloudflareNomComplet = prestataires.reseau.nom;
const cloudflare = "Cloudflare";

export const documentCookies: DocumentLegal = {
  titre: "Cookies et autres traceurs",
  description:
    "Cookies sur SOS Miam : ni pub ni pistage, des statistiques sans cookie, juste le cookie de connexion des espaces ambassadeur et pro et d'éventuels cookies de sécurité. Ce qui changera avec la pub, et comment les gérer.",
  miseAJour: "9 octobre 2026",
  introduction: [
    "Chez SOS Miam, les seuls cookies qu'on aime, ce sont ceux de la pâtisserie du coin. **Notre site ne dépose aucun cookie de suivi dans ton navigateur.** Pas de pub, pas de pistage, et des statistiques de visite comptées par notre serveur, sans cookie. Seules exceptions possibles : des cookies de sécurité de notre prestataire Cloudflare, un cookie qui retient ton refus d'être compté, si tu le demandes, et celui qui te garde connecté à ton espace ambassadeur. Tout est expliqué plus bas.",
    `Cette page t'explique ce qu'est un cookie, ce qui se passe vraiment aujourd'hui quand tu visites ${site.adresse} (y compris les espaces ambassadeur et pro, et la version du site en préparation), et comment ça marchera le jour où la pub arrivera : rien de facultatif sans ton accord.`,
  ],
  sections: [
    {
      id: "definition",
      titre: "Un cookie, c'est quoi ?",
      blocs: [
        "Un cookie est un petit fichier qu'un site enregistre dans ton navigateur (sur ton ordinateur, ta tablette ou ton téléphone) quand tu le visites. Il permet à ce site, ou à une autre entreprise, de reconnaître ton navigateur d'une page à l'autre ou à ta visite suivante.",
        "D'autres techniques font le même travail : le stockage local du navigateur (« localStorage »), les pixels invisibles placés dans une page ou un mail, les identifiants publicitaires des téléphones, ou l'empreinte de ton appareil (« fingerprinting »). On les appelle des **traceurs**. La loi les traite tous comme des cookies, et sur cette page, quand on dit « cookies », on parle de tous les traceurs.",
        "Certains cookies sont indispensables, par exemple pour protéger un site contre les attaques. D'autres servent à mesurer l'audience, à afficher de la publicité ciblée ou à faire fonctionner des contenus venus d'autres sites (vidéos, cartes, boutons de réseaux sociaux).",
        "**Ce que dit la loi.** L'article 82 de la loi Informatique et Libertés (loi n° 78-17 du 6 janvier 1978), qui transpose la directive européenne 2002/58/CE dite « ePrivacy », interdit de déposer ou de lire un traceur dans ton appareil sans ton accord préalable. Deux exceptions seulement : le traceur a pour seul but de permettre ou de faciliter la communication par voie électronique (par exemple acheminer la page jusqu'à toi), ou il est strictement nécessaire au service en ligne que tu as expressément demandé. La CNIL détaille ces règles dans ses lignes directrices et sa recommandation de septembre 2020.",
      ],
    },
    {
      id: "aujourd-hui",
      titre: "Aujourd'hui : aucun cookie de suivi",
      blocs: [
        `**${site.nom} ne dépose aucun cookie de suivi.** Concrètement :`,
        {
          liste: [
            "des statistiques de visite comptées par notre serveur, **sans cookie ni script** dans ta page : on ne garde que des totaux, jamais ton adresse IP (détails dans la [politique de confidentialité](/confidentialite#statistiques)) ;",
            "un cookie de notre part, seulement si tu le demandes : **sosmiam-sans-statistiques**, posé quand tu refuses d'être compté sur la page [Tes visites et nos statistiques](/statistiques). Il retient ton refus pendant 13 mois et ne sert qu'à ça : la loi le dispense d'accord ;",
            `un autre, seulement si tu te connectes à ton [espace ambassadeur](${adresseEspaceAmbassadeur}) ou à ton [espace pro](https://pro.sosmiam.fr) : **__Host-sosmiam-session**, qui te garde connecté d'une page à l'autre. Il contient seulement une clé tirée au hasard, n'est envoyé qu'au site où tu t'es connecté (${adresseEspaceAmbassadeur.replace("https://", "")} ou pro.sosmiam.fr, chacun le sien, ou la version du site en préparation), jamais à ${site.adresse} ni à un autre site, dure **90 jours au plus** et s'efface quand tu te déconnectes. Il est strictement nécessaire pour rester connecté : la loi le dispense d'accord, et il ne sert à rien d'autre ;`,
            "aucune publicité ;",
            "aucun contenu d'un autre site intégré dans nos pages : ni vidéo, ni carte, ni bouton de réseau social ;",
            "des polices de caractères hébergées avec le site, sur notre serveur chez notre hébergeur : pour afficher le site, ton navigateur n'appelle ni Google Fonts ni aucun autre service de polices ;",
            "rien n'est enregistré dans le stockage local de ton navigateur (« localStorage »). Seule exception, strictement nécessaire à la navigation : le site en préparation et ces pages légales gardent, dans le stockage de session (« sessionStorage »), la position où tu étais sur chaque page pour t'y ramener quand tu reviens en arrière. Aucun identifiant, rien ne quitte ton navigateur, et tout s'efface quand tu fermes l'onglet.",
          ],
        },
        "C'est pour ça que tu ne vois pas de bandeau cookies : il n'y a rien à accepter. L'autre exception possible vient de notre prestataire de sécurité, expliquée juste en dessous.",
        "Comme presque tous les sites, notre serveur note chaque visite dans un journal technique (adresse IP, page demandée, date et heure…), gardé 15 jours au plus pour la sécurité et le dépannage. Ce n'est pas un cookie : rien n'est déposé dans ton appareil. Tout est expliqué dans la [politique de confidentialité](/confidentialite).",
      ],
    },
    {
      id: "cloudflare",
      titre: `Les cookies de sécurité de ${cloudflare}`,
      blocs: [
        `Tout le trafic de ${site.adresse} passe par ${cloudflareNomComplet}, notre prestataire, qui diffuse le site et le protège contre les attaques et les robots malveillants. Pour faire ce travail, ${cloudflare} peut déposer des cookies de sécurité dans ton navigateur, sur le domaine ${site.adresse}. Par exemple :`,
        {
          liste: [
            `**__cf_bm** : déposé par ${cloudflare}, il aide à distinguer les visiteurs humains des robots (« bot management ») ; durée : environ 30 minutes.`,
          ],
        },
        "À ce jour, on n'en a observé aucun sur nos pages, mais ça peut arriver dans certains cas, pour protéger le site.",
        `Ces cookies sont **strictement nécessaires** à la sécurité du site : la loi les dispense de ton accord. Ils ne servent qu'à protéger le site, pas à la publicité ni à la mesure d'audience, et on ne s'en sert pas pour te suivre. C'est l'éditeur de ${site.nom} qui a choisi ce prestataire : il reste donc responsable de ces cookies, même quand c'est ${cloudflare} qui les dépose.`,
        "Tu peux quand même les bloquer ou les effacer depuis ton navigateur (voir plus bas). La protection du site pourrait alors te demander une vérification supplémentaire, voire t'empêcher d'y accéder tant qu'elle est active.",
        `${cloudflare} est une entreprise américaine : des données peuvent donc être traitées aux États-Unis. Ce transfert est encadré par le Data Privacy Framework UE–États-Unis, auquel ${cloudflare} est certifié, et par des clauses contractuelles types. Les données traitées et ces garanties sont détaillées dans notre [politique de confidentialité](/confidentialite). Tu peux aussi lire la [politique de confidentialité de Cloudflare](https://www.cloudflare.com/privacypolicy/).`,
      ],
    },
    {
      id: "plus-tard",
      titre: "Quand la pub ou les vidéos arriveront",
      blocs: [
        "SOS Miam est gratuit, pour toi comme pour les lieux. Pour le financer, on prévoit de la **publicité, toujours signalée comme telle et sans aucun effet sur le classement des lieux**. Il n'y en a pas encore.",
        "Plus tard, certains outils pourront avoir besoin de cookies :",
        {
          liste: [
            "la publicité ;",
            "les vidéos intégrées depuis d'autres plateformes, par exemple celles des créateurs qui soutiennent un lieu pendant un BIG SOS.",
          ],
        },
        "**Rien de tout ça n'est en place aujourd'hui.** Avant que le moindre de ces outils démarre, on mettra à jour cette page (et la date en haut), ainsi que la [politique de confidentialité](/confidentialite).",
        "Cette page listera alors chaque cookie, avec :",
        {
          liste: [
            "son nom ;",
            "à quoi il sert ;",
            "combien de temps il reste dans ton navigateur ;",
            "qui le dépose : SOS Miam ou un partenaire, désigné par son nom.",
          ],
        },
        "L'app mobile, quand elle sortira, aura elle aussi ses informations, publiées avant son lancement.",
      ],
    },
    {
      id: "ton-choix",
      titre: "Ton choix, et comment il sera respecté",
      blocs: [
        "Ces cookies-là seront **facultatifs** : aucun ne sera déposé ni lu sans ton accord. Concrètement :",
        {
          liste: [
            "un bandeau s'affichera à ta première visite, avant le dépôt de tout cookie facultatif ;",
            "**accepter et refuser seront aussi simples et aussi visibles l'un que l'autre**, en un clic chacun ;",
            "tu pourras aussi choisir usage par usage (pub, vidéos…) ;",
            "si tu fermes le bandeau ou que tu continues ta visite sans choisir, rien de facultatif ne sera déposé ;",
            "une vidéo hébergée par une autre plateforme ne sera chargée qu'avec ton accord ;",
            "ton choix sera gardé **6 mois**, puis on te reposera la question ;",
            "tu pourras le changer à tout moment, depuis un lien présent sur toutes les pages : retirer ton accord sera aussi simple que de le donner.",
          ],
        },
        "Pour retenir ton choix, une petite information sera enregistrée dans ton navigateur pendant 6 mois. Elle sert uniquement à respecter ta décision, et la loi la dispense d'accord.",
      ],
    },
    {
      id: "navigateur",
      titre: "Gérer les cookies dans ton navigateur",
      blocs: [
        "Quel que soit le site, ton navigateur te laisse décider. Dans ses réglages, souvent dans une rubrique « Confidentialité », « Vie privée » ou « Cookies », tu peux en général :",
        {
          liste: [
            "voir les cookies enregistrés et les effacer, site par site ou tous d'un coup ;",
            "bloquer les cookies « tiers », c'est-à-dire ceux déposés par d'autres sites que celui que tu visites ;",
            "bloquer tous les cookies (attention, certains sites marchent alors moins bien) ;",
            "utiliser la navigation privée : les cookies sont effacés quand tu fermes les fenêtres privées.",
          ],
        },
        "Sur téléphone et tablette, ces options se trouvent dans les réglages du navigateur, ou parfois dans ceux de l'appareil. L'aide de ton navigateur explique pas à pas où les trouver.",
        "Ces réglages ne valent que pour le navigateur et l'appareil sur lesquels tu les fais : pense à les refaire si tu en changes.",
        "Pour aller plus loin, la CNIL publie des conseils pratiques sur [cnil.fr](https://www.cnil.fr).",
      ],
    },
    {
      id: "contact",
      titre: "Une question ?",
      blocs: [
        `Le responsable du traitement, y compris pour les cookies et autres traceurs, est l'éditeur du site : ${editeur.nom}, ${editeur.statut} (voir les [mentions légales](/mentions-legales)).`,
        `Une question sur les cookies ? Écris à ${lienContact}.`,
        "Pour tout ce qui touche à tes données personnelles et à tes droits (accès, effacement, opposition…), lis la [politique de confidentialité](/confidentialite). Tu peux aussi adresser une réclamation à la CNIL sur [cnil.fr/fr/plaintes](https://www.cnil.fr/fr/plaintes).",
      ],
    },
  ],
};
