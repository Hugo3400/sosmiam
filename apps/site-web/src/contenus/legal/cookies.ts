// Page « Cookies » : loi Informatique et Libertés (art. 82) et lignes directrices + recommandation de la CNIL (2020).
// Inventaire RÉEL, relevé le 14 octobre 2026 en simple visiteur (Playwright, sans se connecter) sur sosmiam.fr, ambassadeur.,
// pro. et api.sosmiam.fr, puis complété par le code :
// - cf_clearance (Cloudflare) : posé dès la première page de sosmiam.fr par la détection des robots de Cloudflare
//   (« JavaScript Detections », script /cdn-cgi/challenge-platform/…), Domain=sosmiam.fr, HttpOnly, Secure, SameSite=None,
//   Partitioned, expiration 1 an. __cf_bm : pas relevé, gardé dans la liste car Cloudflare peut le poser.
// - __Host-sosmiam-session (services/session-compte.server.ts) : un par hôte (sosmiam.fr pour « Mon compte »,
//   ambassadeur., pro., aperçu), 90 jours au plus, HttpOnly, SameSite=Lax.
// - __Host-sosmiam-connexion-externe (SameSite=None), __Host-sosmiam-inscription-externe et
//   __Host-sosmiam-confirmation-externe (Lax, relier Apple ou Google sans mot de passe), 10 minutes, chiffrés
//   (services/cookies-connexion-externe.server.ts) ; __Host-sosmiam-connexion-qr (Lax), 2 minutes, chiffré, posé par
//   « Me connecter avec l'app » (connexion par QR code, même fichier).
// - sosmiam-sans-statistiques (services/mesure.server.ts) : 13 mois, posé seulement par la page /statistiques.
// - sosmiam-langue (fonctions/langue/ecrire-cookie-langue.ts) : 1 an, Domain=sosmiam.fr, HttpOnly, posé seulement quand on
//   choisit une langue (pied de page ou bandeau qui propose l'autre langue).
// - Stockage de session : react-router-scroll-positions (toutes les pages), react-router-manifest-version (après une mise
//   à jour du site). Aucun localStorage. Aucune requête vers un autre domaine (polices, images, scripts : tout vient de sosmiam.fr).
// - Pas des cookies : scripts ajoutés par Cloudflare (détection des robots, décodage des adresses e-mail
//   /cdn-cgi/scripts/…/email-decode.min.js). L'en-tête NEL (rapports d'erreurs réseau vers Cloudflare) est coupé depuis le
//   14 octobre 2026 (« Journalisation des erreurs réseau » sur Off, vérifié : plus d'en-tête NEL ni Report-To).
// - sosmiam-consentement (fonctions/consentement/ecrire-cookie-consentement.ts) : le choix du bandeau, 6 mois,
//   Domain=sosmiam.fr (un choix pour les trois hôtes), lisible par la page. Pas encore posé en ligne : aucune catégorie
//   facultative n'est active (contenus/cookies-consentement.ts), donc ni bandeau ni choix ; seulement en aperçu.
// Tous strictement nécessaires (délibération CNIL n° 2020-091) : le bandeau reste caché. La partie « mes-choix » est la
// cible du lien « Gérer mes cookies » du pied de page, et reçoit le formulaire des choix (composants/cookies/ReglagesCookies)
// dès qu'une catégorie est active. À mettre à jour AVANT d'activer une catégorie (pub, vidéos intégrées) : la liste, les
// partenaires, et les textes qui disent « rien à accepter ».
import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import type { DocumentLegal } from "~/contenus/legal/type-legal";
import { editeur, prestataires, site } from "~/contenus/legal/informations-legales";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;
// Raison sociale complète à la première mention, puis le nom court.
const cloudflareNomComplet = prestataires.reseau.nom;
const cloudflare = "Cloudflare";
const hoteAmbassadeur = adresseEspaceAmbassadeur.replace("https://", "");

export const documentCookies: DocumentLegal = {
  titre: "Cookies et autres traceurs",
  description:
    "Cookies sur SOS Miam : ni pub ni pistage, des statistiques sans cookie, et la liste exacte des quelques cookies strictement nécessaires (sécurité, connexion, tes choix), avec leur durée. Comment marchera le bandeau avec la pub, et comment gérer tes cookies.",
  miseAJour: "28 octobre 2026",
  introduction: [
    "Chez SOS Miam, les seuls cookies qu'on aime, ce sont ceux de la pâtisserie du coin. **Notre site ne dépose aucun cookie de suivi dans ton navigateur.** Pas de pub, pas de pistage, et des statistiques de visite comptées par notre serveur, sans cookie.",
    `Cette page t'explique ce qu'est un cookie, ce qui se passe vraiment aujourd'hui quand tu visites ${site.adresse} (y compris les espaces ambassadeur et pro, et la version du site en préparation), avec la liste exacte des cookies, et comment ça marchera le jour où la pub arrivera : rien de facultatif sans ton accord.`,
  ],
  enBref: [
    {
      liste: [
        "**Aucun cookie de suivi**, aucune pub, aucun pistage, aucun contenu d'un autre site dans nos pages.",
        `**Quelques cookies strictement nécessaires** : un cookie de sécurité de ${cloudflare}, celui qui te garde connecté si tu te connectes, deux cookies de 10 minutes pendant une connexion avec Apple ou Google, un de 2 minutes quand tu te connectes avec l'app, celui qui retient ton refus des statistiques si tu le demandes, et celui qui retient la langue que tu choisis. Ils sont tous dans [la liste](#liste-des-cookies).`,
        "**Pas de bandeau aujourd'hui** : la loi dispense ces cookies d'accord, donc il n'y a [rien à accepter ni à refuser](#mes-choix). Le bandeau est prêt, mais il ne s'affiche que s'il y a un vrai choix à faire.",
        "**Le jour où la pub ou les vidéos arriveront**, rien de facultatif ne sera déposé sans ton accord : « Tout accepter », « Tout refuser » ou « Choisir », trois boutons de la même taille, et ton choix gardé 6 mois.",
      ],
    },
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
            "un autre, seulement si tu choisis une langue (en bas de chaque page, ou dans le bandeau qui te propose la page dans une autre langue) : **sosmiam-langue**, qui retient « fr » ou « en » pendant **1 an**, pour sosmiam.fr et ses espaces ambassadeur et pro. Il ne contient rien d'autre et ne sert qu'à t'afficher le site dans la langue que tu as choisie : la loi le dispense d'accord ;",
            `un autre, seulement si tu te connectes, à « [Mon compte](/mon-compte) », à ton [espace ambassadeur](${adresseEspaceAmbassadeur}) ou à ton [espace pro](https://pro.sosmiam.fr) : **__Host-sosmiam-session**, qui te garde connecté d'une page à l'autre. Il contient seulement une clé tirée au hasard et n'est envoyé qu'au site où tu t'es connecté (${site.adresse}, ${hoteAmbassadeur} ou pro.sosmiam.fr, chacun le sien, ou la version du site en préparation), jamais à un autre. Il dure **90 jours au plus** et s'efface quand tu te déconnectes. Il est strictement nécessaire pour rester connecté : la loi le dispense d'accord, et il ne sert à rien d'autre ;`,
            "un autre, seulement quand tu touches « Me connecter avec l'app » (connexion par QR code) : **__Host-sosmiam-connexion-qr**, qui garde pendant **2 minutes au plus** le code secret du QR affiché, pour vérifier que c'est bien ton app qui valide la connexion. Chiffré, illisible par les scripts de la page et effacé dès qu'il a servi, il est strictement nécessaire à la connexion que tu demandes : la loi le dispense d'accord ;",
            "trois autres au plus, seulement quand tu touches « Continuer avec Apple » ou « Continuer avec Google » : **__Host-sosmiam-connexion-externe**, qui retient pendant **10 minutes au plus** un code tiré au hasard pour vérifier que la réponse d'Apple ou de Google correspond bien à ta demande (il doit pouvoir être lu quand Apple ou Google te renvoie chez nous, d'où son réglage « SameSite=None »), et, si tu crées ton compte, confirmes sa suppression, ou relies ou délies Apple ou Google, **__Host-sosmiam-inscription-externe**, qui garde l'attestation d'Apple ou de Google le temps de finir (**10 minutes au plus**). Si ton compte n'a pas de mot de passe, relier Apple ou Google demande aussi l'attestation de ta clé actuelle : **__Host-sosmiam-confirmation-externe** la garde de la même façon (**10 minutes au plus**). Tous sont chiffrés, illisibles par les scripts de la page, effacés dès qu'ils ont servi, et strictement nécessaires à la connexion que tu demandes : la loi les dispense d'accord ;",
            "aucune publicité ;",
            "aucun contenu d'un autre site intégré dans nos pages : ni vidéo, ni carte, ni bouton de réseau social ;",
            "des polices de caractères hébergées avec le site, sur notre serveur chez notre hébergeur : pour afficher le site, ton navigateur n'appelle ni Google Fonts ni aucun autre service de polices ;",
            "rien n'est enregistré dans le stockage local de ton navigateur (« localStorage »). Seule exception, strictement nécessaire à la navigation : le site garde, dans le stockage de session (« sessionStorage »), la position où tu étais sur chaque page pour t'y ramener quand tu reviens en arrière, et parfois le numéro de version du site après une mise à jour. Aucun identifiant, rien ne quitte ton navigateur, et tout s'efface quand tu fermes l'onglet.",
          ],
        },
        `C'est pour ça que tu ne vois pas de bandeau cookies : il n'y a rien à accepter. Le bandeau est prêt pour le jour où un cookie facultatif arrivera (voir [Ton choix, et comment il sera respecté](#ton-choix)) ; d'ici là, il reste caché, pour ne pas te faire choisir pour rien. Les cookies de sécurité de ${cloudflare}, notre prestataire, sont expliqués un peu plus bas.`,
        "Comme presque tous les sites, notre serveur note chaque visite dans un journal technique (adresse IP, page demandée, date et heure…), gardé 15 jours au plus pour la sécurité et le dépannage. Ce n'est pas un cookie : rien n'est déposé dans ton appareil. Tout est expliqué dans la [politique de confidentialité](/confidentialite).",
      ],
    },
    {
      id: "liste-des-cookies",
      titre: "La liste complète",
      blocs: [
        "Voici tout ce qui peut être enregistré dans ton navigateur quand tu utilises le site, relevé le 14 octobre 2026 et complété le 28 octobre 2026. Tout est **strictement nécessaire**, et posé **sur nos propres adresses** (sosmiam.fr et ses sous-domaines) : aucun cookie d'un autre site.",
        {
          tableau: {
            legende: "Les cookies et le stockage du navigateur utilisés par SOS Miam : nom, usage, durée et qui les dépose.",
            colonnes: ["Nom", "À quoi il sert", "Durée", "Qui le pose, et quand"],
            lignes: [
              ["cf_clearance", "Sécurité : retient que ton navigateur a passé la vérification anti-robots, pour ne pas te la redemander à chaque page.", "1 an", `${cloudflare}, notre prestataire de sécurité, dès ta première page, sur ${site.adresse} et ses sous-domaines.`],
              ["__cf_bm", "Sécurité : aide à distinguer les visiteurs humains des robots.", "Environ 30 minutes", `${cloudflare}, seulement dans certains cas (pas relevé à ce jour).`],
              ["__Host-sosmiam-session", "Te garder connecté, d'une page à l'autre.", "90 jours au plus, effacé quand tu te déconnectes", "SOS Miam, seulement si tu te connectes (« Mon compte », espace ambassadeur ou pro), un par site."],
              ["__Host-sosmiam-connexion-externe", "Vérifier que la réponse d'Apple ou de Google correspond bien à ta demande. Chiffré.", "10 minutes au plus", "SOS Miam, quand tu touches « Continuer avec Apple » ou « Continuer avec Google »."],
              ["__Host-sosmiam-inscription-externe", "Garder l'attestation d'Apple ou de Google le temps de finir ton inscription, de confirmer une suppression, ou de relier ou délier Apple ou Google. Chiffré.", "10 minutes au plus", "SOS Miam, seulement dans ces cas."],
              ["__Host-sosmiam-confirmation-externe", "Garder l'attestation de ta clé actuelle (Apple ou Google) quand tu relies l'autre à un compte sans mot de passe. Chiffré.", "10 minutes au plus", "SOS Miam, seulement dans ce cas."],
              ["__Host-sosmiam-connexion-qr", "Vérifier que c'est bien ton app qui valide « Me connecter avec l'app » (le code secret du QR affiché). Chiffré.", "2 minutes au plus, effacé dès qu'il a servi", "SOS Miam, quand tu touches « Me connecter avec l'app » (connexion par QR code)."],
              ["sosmiam-sans-statistiques", "Retenir ton refus d'être compté dans les statistiques de visite.", "13 mois", "SOS Miam, seulement si tu le demandes sur la page [Statistiques](/statistiques)."],
              ["sosmiam-langue", "Retenir la langue que tu as choisie pour le site (« fr » ou « en »). Aucun identifiant.", "1 an", "SOS Miam, seulement quand tu choisis une langue (en bas de page, ou dans le bandeau qui te propose l'autre langue), pour sosmiam.fr et ses espaces ambassadeur et pro."],
              ["sosmiam-consentement", "Retenir tes choix sur les cookies facultatifs : ce que tu acceptes ou refuses, la date du choix et la version de la liste des partenaires. Aucun identifiant.", "6 mois", "SOS Miam, seulement quand tu fais un choix dans le bandeau ou dans « Gérer mes cookies », pour sosmiam.fr et ses espaces ambassadeur et pro. Pas encore posé : il n'y a aucun choix à faire aujourd'hui."],
              ["react-router-scroll-positions (stockage de session)", "Te ramener où tu étais sur une page quand tu reviens en arrière.", "Jusqu'à la fermeture de l'onglet", "Le site, dans ton navigateur : rien n'est envoyé à notre serveur."],
              ["react-router-manifest-version (stockage de session)", "Après une mise à jour du site, recharger la page une seule fois, sans tourner en rond.", "Jusqu'à la fermeture de l'onglet", "Le site, dans ton navigateur, seulement après une mise à jour."],
            ],
          },
        },
        "Les cookies dont le nom commence par « __Host- » ne sont envoyés qu'au site exact qui les a posés, et seulement par une connexion chiffrée. Aucun de ces cookies ne peut être lu par les scripts de la page, sauf le stockage de session et sosmiam-consentement (la page doit lire ton choix pour savoir ce qu'elle a le droit de charger) : ni l'un ni l'autre ne contient d'identifiant ou de donnée personnelle.",
      ],
    },
    {
      id: "cloudflare",
      titre: `Les cookies de sécurité de ${cloudflare}`,
      blocs: [
        `Tout le trafic de ${site.adresse} passe par ${cloudflareNomComplet}, notre prestataire, qui diffuse le site et le protège contre les attaques et les robots malveillants. Pour faire ce travail, ${cloudflare} dépose des cookies de sécurité dans ton navigateur, sur le domaine ${site.adresse} :`,
        {
          liste: [
            `**cf_clearance** : déposé par ${cloudflare} dès ta première page, après une vérification automatique et invisible de ton navigateur, il retient que tu n'es pas un robot ; durée relevée : 1 an.`,
            `**__cf_bm** : déposé par ${cloudflare} dans certains cas, il aide à distinguer les visiteurs humains des robots (« bot management ») ; durée : environ 30 minutes. On ne l'a pas relevé sur nos pages à ce jour.`,
          ],
        },
        `Ces cookies sont **strictement nécessaires** à la sécurité du site : la loi les dispense de ton accord. Ils ne servent qu'à protéger le site, pas à la publicité ni à la mesure d'audience, et on ne s'en sert pas pour te suivre. C'est l'éditeur de ${site.nom} qui a choisi ce prestataire : il reste donc responsable de ces cookies, même quand c'est ${cloudflare} qui les dépose.`,
        `Pour faire ce travail, ${cloudflare} ajoute aussi à nos pages deux petits scripts servis depuis notre propre adresse : l'un vérifie que ton navigateur n'est pas un robot, l'autre protège notre adresse e-mail des robots qui ramassent les adresses. Ce ne sont pas des cookies, et ils ne servent pas à la publicité.`,
        "Tu peux quand même bloquer ou effacer ces cookies depuis ton navigateur (voir plus bas). La protection du site pourrait alors te demander une vérification supplémentaire, voire t'empêcher d'y accéder tant qu'elle est active.",
        `${cloudflare} est une entreprise américaine : des données peuvent donc être traitées aux États-Unis. Ce transfert est encadré par le Data Privacy Framework UE–États-Unis, auquel ${cloudflare} est certifié, et par des clauses contractuelles types. Les données traitées et ces garanties sont détaillées dans notre [politique de confidentialité](/confidentialite#cloudflare). Tu peux aussi lire la [politique de confidentialité de Cloudflare](https://www.cloudflare.com/privacypolicy/).`,
      ],
    },
    {
      id: "mes-choix",
      titre: "Gérer mes cookies : rien à accepter ni à refuser pour l'instant",
      blocs: [
        "Tu cherches le bouton « Tout refuser » ? Bonne nouvelle : **il n'y a rien à refuser**. Tous les cookies de [la liste](#liste-des-cookies) sont strictement nécessaires : à la sécurité du site, à la connexion que tu demandes, au respect de ton refus des statistiques, ou à ton choix de langue. La loi les dispense de ton accord, et aucun ne sert à la pub ni à te suivre.",
        "C'est aussi pour ça qu'aucun bandeau ne s'affiche : on ne va pas te demander d'accepter quelque chose qu'on ne fait pas. Le bandeau et le formulaire de choix sont prêts : ils n'apparaîtront qu'avec le premier cookie facultatif.",
        "Ce que tu peux faire quand même :",
        {
          liste: [
            "ne plus être compté dans nos statistiques (anonymes, sans cookie) : un clic sur la page [Tes visites et nos statistiques](/statistiques) ;",
            "te déconnecter : le cookie de connexion s'efface aussitôt ;",
            "effacer ou bloquer les cookies depuis ton navigateur (voir juste en dessous) : tu devras alors te reconnecter, et la protection du site pourra te redemander une vérification.",
          ],
        },
        "Le jour où des cookies facultatifs arriveront (pub, vidéos…), ce même lien « Gérer mes cookies », en bas de chaque page de sosmiam.fr et de ses espaces ambassadeur et pro, rouvrira tes choix, modifiables à tout moment. Sans JavaScript, il mène ici, où un formulaire te laissera choisir de la même façon (voir [Ton choix, et comment il sera respecté](#ton-choix)).",
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
        "Ces cookies-là seront **facultatifs** : aucun ne sera déposé ni lu sans ton accord. Le bandeau qui te demandera ton avis est déjà prêt ; il reste caché tant qu'aucun cookie facultatif n'existe sur le site. Voici comment il marchera :",
        {
          liste: [
            "il s'affichera en bas de l'écran à ta première visite, avant le dépôt de tout cookie facultatif, sans t'empêcher de lire la page ;",
            "**trois boutons de la même taille** : « Tout accepter », « Tout refuser » et « Choisir ». Refuser sera aussi simple et aussi visible qu'accepter, en un clic ;",
            "« Choisir » ouvrira le détail, usage par usage (vidéos et contenus d'autres sites, publicité, et mesure d'audience si un jour un outil en a besoin), avec le nom de chaque partenaire et de ses cookies. Tout y sera décoché au départ ;",
            "fermer le bandeau avec la croix vaudra refus. Faire défiler la page ou continuer ta visite ne vaudra pas accord : sans réponse, rien de facultatif ne sera déposé ;",
            "une vidéo, une carte ou une publication d'un autre site sera remplacée par une vignette tant que tu n'auras pas dit oui, avec un bouton pour l'afficher quand même, juste cette fois ;",
            "ton choix sera gardé **6 mois**, puis on te reposera la question ; plus tôt aussi si la liste des partenaires change (un nouveau partenaire, un nouvel usage) ;",
            "il vaudra pour sosmiam.fr et ses espaces ambassadeur et pro : un seul choix, pas trois bandeaux ;",
            "tu pourras le changer à tout moment avec le lien « Gérer mes cookies », en bas de chaque page, même sans JavaScript. Retirer ton accord sera aussi simple que de le donner : on effacera alors les cookies de cet usage qu'on peut atteindre (ceux posés sur nos adresses) et on rechargera la page. Ceux qu'un partenaire pose sur son propre site s'effacent depuis ton navigateur (voir [Gérer les cookies dans ton navigateur](#navigateur)).",
          ],
        },
        "Pour retenir ton choix, un petit cookie, **sosmiam-consentement**, sera enregistré dans ton navigateur pendant 6 mois : ce que tu acceptes ou refuses, la date et la version de la liste des partenaires, rien d'autre. Il sert uniquement à respecter ta décision, et la loi le dispense d'accord. Il figure déjà dans [la liste](#liste-des-cookies).",
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
  chapitres: [
    { id: "c-est-quoi", titre: "Un cookie, c'est quoi ?", sections: ["definition"] },
    { id: "chez-sos-miam", titre: "Ce qu'on dépose aujourd'hui", sections: ["aujourd-hui", "liste-des-cookies", "cloudflare"] },
    { id: "gerer", titre: "Tes choix", sections: ["mes-choix", "navigateur"] },
    { id: "demain", titre: "Demain : la pub et les vidéos", sections: ["plus-tard", "ton-choix"] },
    { id: "une-question", titre: "Une question ?", sections: ["contact"] },
  ],
};
