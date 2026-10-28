// Politique de confidentialité : uniquement ce qui est réellement traité au 9 octobre 2026.
// Toute nouveauté (comptes de l'app, pub, cookies de mesure, bons solidaires) doit être ajoutée ici AVANT de démarrer.
// Envoi des mails (8 octobre 2026) : par la boîte bonjour@ (SMTP de l'hébergement mail), sans autre prestataire ;
// journal des envois effacé après 90 jours (apps/api/src/services/courriels/file-courriels.ts).
// Statistiques de visite (8 octobre 2026) : comptage côté serveur, sans cookie, dans les conditions d'exemption de la CNIL
// (apps/api/src/services/mesure.ts, apps/site-web/src/services/mesure.server.ts, page /statistiques pour s'y opposer).
// Espace ambassadeur (8 octobre 2026) : comptes dès 18 ans, section « Ton compte ambassadeur » dans
// confidentialite-compte-ambassadeur.ts (apps/api/src/services/comptes.ts ; durées et sécurité : docs/decisions.md).
// App mobile (14 octobre 2026) : comptes dès la v1 des stores (confirmé par Hugo) ; ce que l'app garde sur le téléphone et
// sur le serveur : confidentialite-app.ts (relu contre le code par la session App) ; tableau des 13 types de données déclarés
// sur Google Play : confidentialite-donnees-app.ts.
// Partie sociale (15 octobre 2026, avant son ouverture) : confidentialite-social.ts (bande, suivis, profil, listes,
// commentaires, cloche, blocages, pseudos), confidentialite-messagerie.ts, confidentialite-signalements-sociaux.ts ;
// « Prévenir un pote » (Miam Safe) : confidentialite-miam-safe.ts. Relus contre le code par la session Site le 14 octobre.
// Newsletter (Hugo, 14 octobre 2026) : une case cochée d'avance, décochable, à l'inscription (soft opt-in, apps/api
// controleurs/comptes-newsletter.ts) : comptes de l'app inscrits tout de suite, ambassadeurs quand leur candidature est
// validée (statut « actif ») ; une case décochée met l'adresse dans la liste des désinscrits (noterDesinscription, 3 ans).
// Messagerie (vérifié le 8 octobre 2026) : le MX de sosmiam.fr est mail.yubox.io (159.100.240.189), chez Exoscale à Genève
// (RIPE « Exoscale Open Cloud GV2 », CH) ; hostmyservers.fr/mail-box : « hébergé en Suisse ». « En Suisse » est donc juste.
// Fournisseur (Hugo, 9 octobre 2026, d'après ses factures) : HOSTMYSERVERS SARL facture la boîte mail et le serveur
// (SIREN 842 789 000, 71 rue Francis de Pressensé, 69100 Villeurbanne ; hostmyservers.fr/mentions) ; à ne pas confondre avec
// FEELB (SIREN 817 701 311, Lyon), même gérant. Les noms affichés viennent de informations-legales.ts.
// Cloudflare : sous-traitant d'après son contrat de traitement des données (cloudflare.com/cloudflare-customer-dpa), mais sa
// politique de confidentialité indique qu'il tire du trafic des « Network Data » pour la sécurité de son réseau (usage propre).
// Journaux nginx : logrotate « daily / rotate 14 » (par nombre de fichiers) : une ligne vit jusqu'à 15 jours. Format
// « sosmiam_sans_parametres » (/etc/nginx/conf.d/sosmiam-journal.conf, depuis le 14 octobre 2026) : le chemin sans ce qui
// suit le « ? », et le referer coupé avant son « ? » ; les journaux d'avant ont été nettoyés le même soir. Le programme du site (apps/site-web/serveur/, audit du 14 octobre
// 2026) n'écrit que méthode, chemin sans paramètres, statut et durée ; ses journaux pm2 : 14 rotations aussi
// (/etc/logrotate.d/sos-miam-pm2). Connexion par QR : confidentialite-connexion-qr.ts.
// En ligne depuis le 15 octobre 2026 (API redémarrée vers 13 h), retiré de « Ce qui arrivera plus tard » : le ménage de nuit
// de la partie sociale (apps/api/src/services/menage-social*.ts), « Télécharger mes données sociales » (GET
// /app/social/export, 2 fois par 24 h : routes/social.ts, LIMITE_EXPORT_SOCIAL ; services/export-social-regles.ts : tes
// données et TES messages, jamais ceux des autres, photos et notes vocales non jointes, limitations du compte sans nom de
// l'équipe ; dans l'app : Réglages › Tes données) et l'écran « Décisions de la modération ». L'export fait par l'équipe sur
// demande (services/gestion/export-social.ts) contient les métadonnées sociales, jamais le texte d'un message.
import { sectionApp, sectionAppComptes } from "~/contenus/legal/confidentialite-app";
import { sectionActus } from "~/contenus/legal/confidentialite-actus";
import { sectionBoiteAIdees, sectionCommunaute, sectionSortiesMiamis } from "~/contenus/legal/confidentialite-communaute";
import { sectionDonneesApp } from "~/contenus/legal/confidentialite-donnees-app";
import { sectionMessagerie } from "~/contenus/legal/confidentialite-messagerie";
import { sectionMiamSafe, sectionPrevenirUnPote } from "~/contenus/legal/confidentialite-miam-safe";
import { sectionSignalementsSociaux } from "~/contenus/legal/confidentialite-signalements-sociaux";
import { sectionPotes } from "~/contenus/legal/confidentialite-social";
import { sectionCandidatures } from "~/contenus/legal/confidentialite-candidatures";
import { sectionCarteDesLieux } from "~/contenus/legal/confidentialite-carte-des-lieux";
import { sectionSignalerImage } from "~/contenus/legal/confidentialite-signaler-image";
import { sectionChasseAuxBugs } from "~/contenus/legal/confidentialite-securite";
import { sectionCompteAmbassadeur } from "~/contenus/legal/confidentialite-compte-ambassadeur";
import { sectionComptePro } from "~/contenus/legal/confidentialite-compte-pro";
import { sectionConnexionAppleGoogle } from "~/contenus/legal/confidentialite-connexion-externe";
import { sectionConnexionQr } from "~/contenus/legal/confidentialite-connexion-qr";
import { editeur, hebergeur, prestataires, site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;
const lienPolitiqueCloudflare = "[politique de confidentialité](https://www.cloudflare.com/privacypolicy/)";

export const documentConfidentialite: DocumentLegal = {
  titre: "Politique de confidentialité",
  description:
    "Ce que SOS Miam fait de tes données : journaux du serveur, statistiques de visite sans cookie, Cloudflare, e-mails, newsletter, candidatures, signalements de faille, comptes ambassadeur et pro, app mobile, ta bande, ta messagerie, les Miamis et Miam Safe. Aucun cookie de pistage, zéro revente, et tes droits en clair.",
  miseAJour: "28 octobre 2026",
  introduction: [
    "Tes données, c'est comme la recette secrète d'un resto de quartier : on en prend soin et on ne la vend à personne. Ici, on t'explique sans jargon ce que SOS Miam collecte aujourd'hui (spoiler : pas grand-chose), pourquoi, combien de temps, et comment tu gardes la main dessus.",
    `Cette politique s'applique au site ${site.adresse} et à ses sous-domaines, à l'app SOS Miam (iPhone et Android), ainsi qu'aux e-mails que tu envoies à ${lienEmail}. Elle est rédigée en application du Règlement général sur la protection des données (RGPD, règlement (UE) 2016/679) et de la loi Informatique et Libertés (loi n° 78-17 du 6 janvier 1978).`,
    "Un seul compte SOS Miam, dès 18 ans, sert dans l'app (y compris pour ta bande, ta messagerie, les Miamis et Miam Safe), dans l'espace ambassadeur et dans l'espace pro (pour gérer la fiche d'un lieu). Il n'y a pas de pub pour l'instant. Cette page décrit ce qui se passe **aujourd'hui**, et elle sera mise à jour **avant** chaque nouveauté.",
  ],
  enBref: [
    {
      liste: [
        "**Aucun cookie de suivi, aucun pistage, aucune pub.** Seules exceptions possibles, strictement nécessaires : les cookies de sécurité de Cloudflare, le cookie qui te garde connecté (à « Mon compte », à ton espace ambassadeur ou pro), deux cookies de 10 minutes pendant une connexion avec Apple ou Google, un cookie de 2 minutes pendant une connexion par QR code, celui qui retient ton refus d'être compté dans les statistiques, si tu le demandes, celui qui retient la langue que tu choisis, et, sur le site, la position où tu étais sur la page, gardée dans ton navigateur le temps de ta visite (détails plus bas).",
        "**Les journaux du serveur** gardent une trace technique de tes visites (adresse IP, page demandée…) pendant **15 jours au plus**, pour la sécurité, puis s'effacent tout seuls.",
        "**Des statistiques de visite, sans cookie** : notre serveur compte les pages vues et les visiteurs, sans jamais garder ton adresse IP ni rien qui permette de te reconnaître. Tu peux refuser d'être compté en un clic, sur la page [Tes visites et nos statistiques](/statistiques).",
        "**Cloudflare**, une entreprise américaine, protège le site : tout le trafic passe par ses serveurs, et des données peuvent être traitées hors de l'Union européenne, notamment aux États-Unis, avec les garanties prévues par le RGPD.",
        "**La carte des lieux** : son fond de carte vient d'OpenFreeMap (données OpenStreetMap), mais il passe toujours par notre serveur : OpenFreeMap ne voit jamais ta visite. Ta position n'est jamais envoyée ; seulement, si tu touches « Près de moi », une position arrondie qui sert à trouver ta commune, comme pour le bouton 📍.",
        "**La newsletter** : on te prévient du lancement près de chez toi, puis on continue de te donner des nouvelles tant que tu ne te désinscris pas (un clic sur « Me désinscrire » en bas de chaque newsletter, ou un simple mail, même juste « STOP »). Quand tu crées un compte, dans l'app ou dans l'espace ambassadeur, c'est toi qui choisis à l'inscription (une case cochée d'avance, que tu peux décocher) : dans l'app, tu es inscrit tout de suite ; comme ambassadeur, une fois ta candidature validée. Si tu la décoches, on retient ton « non », pour ne jamais t'inscrire par erreur.",
        "**Le formulaire « Préviens-moi »** du site enregistre ton adresse e-mail, ta ville ou ta région, ton téléphone (iPhone ou Android) si tu le dis et tes réponses aux cases bêta et ambassadeur, sur notre serveur en France, pour te prévenir du lancement puis t'envoyer la newsletter. Si tu demandes la bêta, ton adresse est transmise à Google ou à Apple pour t'inviter. Si tu touches le bouton 📍, ta position arrondie sert seulement à trouver ta commune ; notre serveur ne la garde pas. Ton adresse IP sert seulement à freiner les robots : elle n'est jamais enregistrée avec ton inscription.",
        "**Le formulaire « J'inscris mon lieu »** : les informations de ton lieu servent à créer sa fiche si on accepte la demande ; ton nom, ton e-mail et ton téléphone servent seulement à te répondre, et ne sont jamais publiés.",
        "**Ta candidature** (page « On recrute ») : ton nom, ton e-mail, ton message et, si tu les donnes, un lien et ton CV en PDF. Tout est gardé **chiffré**, seul l'éditeur le lit, aucun tiers ne le reçoit, et tout est effacé **6 mois** après l'envoi.",
        "**Ton signalement de faille** (page « Chasse aux bugs ») : ton nom ou ton pseudo, ton e-mail, ta description de la faille et, si tu les donnes, un lien et des captures. Il est gardé **chiffré**, seul l'éditeur le lit, et il est effacé **2 ans** après sa clôture. Ton nom ne s'affiche au tableau d'honneur que si tu le demandes (voir « [Ton signalement de faille](#chasse-aux-bugs) »).",
        "**Si tu nous écris** (lieu à inscrire, souci avec ton compte, question), on garde ton message le temps d'y donner suite, et **3 ans au maximum** après ton dernier contact. Une candidature envoyée par mail suit la règle des candidatures : **6 mois** après l'envoi, puis on l'efface (voir « [Ta candidature](#candidatures) »).",
        "**Ton compte ambassadeur** (dès 18 ans) : ton e-mail, ton prénom ou surnom, ta ville et ce que tu fais dans ton espace, pour faire vivre le programme. Ton mot de passe n'est jamais gardé tel quel. Ta date de naissance, donnée avec ton e-mail et un mot de passe sur le site, sert seulement à vérifier ton âge : on ne la garde pas (dans l'app, ou avec Apple ou Google, elle est gardée chiffrée). Après 1 an sans aucune connexion à ton compte (app comprise), ton rôle d'ambassadeur est retiré ; après 2 ans sans connexion, ton compte est effacé (on te prévient par mail un mois avant) ; et tu peux le supprimer toi-même à tout moment.",
        "**Ton espace pro** (dès 18 ans, pour gérer la fiche d'un lieu) : avec le même compte, ta demande pour gérer un lieu et ce qui prouve qu'il est à toi ne sont vus que par l'équipe de SOS Miam ; ce que tu changes sur la fiche est public, mais sans ton nom. Une demande refusée ou un rattachement retiré est effacé 1 an après.",
        "**L'app SOS Miam** : sans compte, tu regardes, et rien de toi n'est gardé. Avec un compte, notre serveur garde ton profil (sans tes régimes, qui restent sur ton téléphone), ton activité, tes visites, ta fidélité, tes réservations, tes avis et, si tu les acceptes, de quoi t'envoyer des notifications. Ta position, seulement quand tu le demandes, sert à trouver ta ville, les lieux autour de toi ou à vérifier que tu es dans le lieu quand tu valides une visite, et n'est jamais gardée. Tout est résumé dans [un tableau](#donnees-app).",
        "**Ta bande et ta messagerie** : le texte de tes messages, tes photos, tes notes vocales et le titre de tes groupes sont **chiffrés** par notre serveur ; l'équipe ne lit un message que s'il lui est signalé. Les photos et les notes vocales ne s'ouvrent plus au bout de **90 jours**, et une conversation est effacée après **1 an** sans message. L'aperçu d'un message dans une notification voyage **chiffré pour ton seul téléphone** (Apple et Google ne peuvent pas le lire), et tu peux le couper, comme le « Vu ».",
        "**Les Miamis** (des sorties ouvertes à des Miamis que tu ne connais pas encore, « Qui est là ? » et la boîte à idées) : ton **genre**, facultatif, est **chiffré** et montré à personne ; il sert seulement aux sorties réservées. « Qui est là ? » ne montre de toi que ton pseudo et ton avatar, aux Miamis de ta ville, seulement si tu le choisis et pour **3 heures**. Une sortie des Miamis ne se voit que de son public et s'efface **1 an** après sa date ; tes idées, tes votes et tes commentaires d'idée se voient de tous les Miamis. « Mes envies » restent sur ton téléphone. Détails dans [Les Miamis](#communaute).",
        "**« Prévenir un pote »** (Miam Safe) : seulement si tu le déclenches, le pote que tu choisis dans ta bande voit ta position pendant **1 heure** au plus ; elle est gardée chiffrée, puis effacée dès la fin du partage.",
        "**On ne vend jamais tes données**, et on ne les loue pas.",
        `**Tu gardes la main** : un mail à ${lienEmail} suffit pour consulter, corriger ou effacer tes données, ou t'opposer à leur utilisation. Ton compte ambassadeur, lui, se corrige et se supprime aussi directement dans ton espace.`,
      ],
    },
  ],
  sections: [
    {
      id: "responsable",
      titre: "Qui s'occupe de tes données",
      blocs: [
        `Le responsable du traitement, c'est-à-dire la personne qui décide de ce qu'on fait de tes données et qui en répond, est **${editeur.nom}**, qui édite SOS Miam en tant que ${editeur.statut}. SOS Miam n'est pas une entreprise : tout y est gratuit et rien n'y est vendu.`,
        `Pour toute question sur tes données, écris à ${lienEmail}.`,
        "Il n'y a pas de délégué à la protection des données (DPO) : la loi ne l'impose pas pour une activité comme celle-ci. C'est l'éditeur lui-même qui te répond.",
        "Les coordonnées de l'hébergeur et les autres informations sur l'éditeur sont dans les [mentions légales](/mentions-legales).",
      ],
    },
    {
      id: "journaux",
      titre: "Les journaux du serveur",
      blocs: [
        "Comme presque tous les sites, notre serveur note chaque page qu'il envoie dans un journal (les « logs »), dès sa porte d'entrée : le logiciel qui reçoit toutes les demandes avant de les passer au site. C'est automatique dès que tu ouvres une page.",
        {
          liste: [
            "**Ce qui est enregistré** : ton adresse IP (transmise par Cloudflare, voir plus bas), la date et l'heure, la page demandée, le code de réponse du serveur, l'adresse de la page d'où tu arrives (le « referer ») et la signature de ton navigateur (le « user-agent » : type de navigateur, système, version). Pour la page demandée comme pour celle d'où tu arrives, seul le **chemin** est noté, **sans** ce qui suit le « ? » : ni un lien de désinscription, ni une recherche, ni un code. En cas d'erreur, un journal d'erreurs garde aussi ton adresse IP et la page demandée, pour la même durée.",
            "**Le journal du programme du site** : le programme qui fabrique les pages tient en plus son propre journal, bien plus court : le type de demande, le **chemin** de la page, **sans** ce qui suit le « ? » (ni le code d'un QR de connexion, ni le pseudo d'une invitation), le code de réponse et le temps de réponse. Ni ton adresse IP, ni ton navigateur, ni la page d'où tu arrives.",
            "**Pourquoi** : repérer et bloquer les attaques ou les abus, et comprendre une panne quand quelque chose casse. Ces journaux ne servent ni à te suivre, ni à faire des statistiques de visite (celles-ci sont comptées à part, sans garder ton adresse IP : voir la section suivante).",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : assurer la sécurité et le bon fonctionnement du site.",
            `**Où et qui** : sur notre serveur, loué à ${hebergeur.nom} et situé en France. ${hebergeur.nom} agit comme sous-traitant : il héberge le serveur pour notre compte, et seul l'éditeur consulte ces journaux.`,
            "**Combien de temps** : **15 jours au plus**, pour chacun de ces journaux. Un nouveau journal démarre chaque jour ; on garde les 14 précédents, et le plus ancien est effacé automatiquement.",
            "**Obligatoire ?** Tu n'as rien à fournir : ces informations sont envoyées par ton navigateur dès qu'il demande une page.",
          ],
        },
      ],
    },
    {
      id: "statistiques",
      titre: "Les statistiques de visite",
      blocs: [
        "Pour savoir si SOS Miam intéresse du monde (combien de visites, quelles pages, d'où viennent les visiteurs), notre serveur compte lui-même les pages qu'il envoie. Pas de cookie de mesure, pas de script dans ta page, pas de service extérieur comme Google Analytics : tout se passe sur notre serveur.",
        {
          liste: [
            "**Ce qui est regardé, au moment où tu ouvres une page** : la page demandée (sans ce qui suit le « ? », sauf le nom d'une campagne : « ?utm_… » ou « ?ref= »), le nom du site d'où tu arrives (par exemple « google.com », jamais l'adresse complète de la page), le nom de la campagne si le lien en porte une (« ?utm_campaign=… », par exemple une vidéo TikTok), la grande famille de ton appareil, de ton navigateur et de ton système (« Mobile, Safari, iOS »), la langue de ton navigateur, le pays et, si Cloudflare les fournit, la région et la ville approximatives qu'il déduit de ton adresse IP, l'heure de ta visite, le temps que met le serveur à répondre, ton adresse IP et la signature de ton navigateur.",
            "**Ce qui est gardé** : uniquement des **totaux** : nombre de pages vues, de visites et de visiteurs par jour, semaine, mois et année ; pages les plus vues, pages d'arrivée et de sortie ; durée moyenne des visites et part des visites d'une seule page ; sites et campagnes d'où l'on arrive ; types d'appareils, navigateurs, systèmes, langues, pays, régions et villes ; jours et heures de visite ; clics sur les boutons de la page [Liens](/liens) ; temps de réponse du serveur ; pages introuvables demandées. **Jamais ton adresse IP**, jamais d'identifiant, jamais l'historique de ta navigation.",
            "**Compter sans reconnaître** : pour savoir combien de personnes différentes sont venues, ton adresse IP et la signature de ton navigateur sont brouillées avec un code secret tiré au hasard (un par jour, un par semaine, un par mois et un par année). L'empreinte obtenue n'est jamais enregistrée : elle fait seulement évoluer un compteur statistique (une « esquisse HyperLogLog ») qui estime le nombre de visiteurs sans garder de liste. Chaque code secret est effacé à la fin de sa période, avec son compteur ; une copie peut encore dormir dans nos sauvegardes chiffrées, **30 jours au plus**, puis elle disparaît aussi : après, plus personne ne peut refaire le calcul. Pour regrouper les pages d'une même visite, l'empreinte du jour et le parcours de la visite (page d'arrivée, nombre de pages, dernière page, heure de début) restent en mémoire 30 minutes au plus après ta dernière page, sans jamais être écrits sur le disque ; ensuite, seuls des totaux sont ajoutés (une visite de plus, sa durée, sa page de sortie).",
            "**Pourquoi** : savoir ce qui plaît et améliorer le site. Ces statistiques servent uniquement à SOS Miam : elles ne sont ni vendues, ni transmises, ni croisées avec d'autres données (ton inscription à la newsletter, par exemple), et ne suivent pas ta navigation sur d'autres sites.",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : mesurer l'audience du site pour l'améliorer. Cette mesure respecte les conditions fixées par la CNIL pour se passer de ton accord : usage réservé à l'éditeur, statistiques anonymes uniquement, aucun croisement ni transmission, codes secrets qui vivent un an au plus (et 30 jours de plus, au plus, dans nos sauvegardes chiffrées).",
            "**Combien de temps** : les codes secrets et les compteurs de visiteurs disparaissent à la fin de chaque période (le jour, la semaine, le mois ou l'année), et de nos sauvegardes chiffrées 30 jours après au plus ; le détail par jour (pages, provenances, appareils, pays…) est effacé au bout de **25 mois**. Seuls restent les totaux de vues, de visites et de visiteurs par période, anonymes.",
            `**Ton choix** : tu peux refuser d'être compté, en un clic, sur la page [Tes visites et nos statistiques](/statistiques). Un petit cookie retient alors ton refus pendant 13 mois, et sert uniquement à ça. Si ton navigateur envoie le signal « Global Privacy Control » ou « Do Not Track », tu n'es pas compté du tout, sans rien faire. Comme on ne garde rien qui permette de te reconnaître, on ne peut pas retrouver ni retirer tes visites passées des totaux.`,
            "**Pas comptés comme visiteurs** : les robots et les outils automatiques (on compte seulement leurs passages, par leur nom : « Google », « Bing »…), les pages préchargées par ton navigateur sans que tu les ouvres, et la version du site en préparation.",
            `**Où et qui** : sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur consulte ces statistiques.`,
          ],
        },
      ],
    },
    {
      id: "cloudflare",
      titre: "Cloudflare, qui protège le site",
      blocs: [
        `Tout le trafic de ${site.adresse} passe par **${prestataires.reseau.nom}**, une entreprise américaine (${prestataires.reseau.adresse}). Il diffuse le site et le protège : concrètement, il se place entre ton navigateur et notre serveur pour livrer les pages rapidement et arrêter les attaques avant qu'elles n'arrivent jusqu'à nous. Pour faire ce travail, il déchiffre au passage ce qui circule, puis le chiffre à nouveau jusqu'à notre serveur.`,
        {
          liste: [
            "**Ce qui est traité** : ton adresse IP et les données de chaque requête (page demandée, date et heure, informations envoyées par ton navigateur, et ce que tu envoies, par exemple dans un formulaire).",
            "**Pourquoi** : afficher le site rapidement et le protéger, notamment contre les attaques par déni de service et les robots malveillants.",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : garder le site disponible, rapide et sûr pour tout le monde.",
            `**Qui** : ${prestataires.reseau.nom} agit comme sous-traitant : il traite ces données pour notre compte, dans le cadre de son contrat de traitement des données, sauf pour l'usage décrit juste en dessous.`,
            `**Pour son propre compte** : d'après sa ${lienPolitiqueCloudflare}, Cloudflare tire aussi du trafic qu'il achemine des analyses et des statistiques qui l'aident à repérer et bloquer les activités malveillantes sur son réseau. Pour cet usage, il agit comme responsable distinct, et c'est sa propre politique qui s'applique.`,
            `**Hors de l'Union européenne** : Cloudflare a des serveurs dans le monde entier, et des données peuvent être traitées hors de l'Union européenne, notamment aux États-Unis. Vers les États-Unis, le transfert est encadré par le **Data Privacy Framework UE–États-Unis**, reconnu par une décision d'adéquation de la Commission européenne du 10 juillet 2023 et auquel Cloudflare a adhéré (certification vérifiable sur [dataprivacyframework.gov](https://www.dataprivacyframework.gov/)). Vers les autres pays, ce sont les **clauses contractuelles types** de la Commission européenne, prévues dans son [contrat de traitement des données](https://www.cloudflare.com/cloudflare-customer-dpa/). Tu peux aussi obtenir une copie de ces clauses en nous écrivant à ${lienEmail}.`,
            `**Combien de temps** : pour notre compte, Cloudflare garde ces données le temps nécessaire pour livrer les pages et protéger le site, et au plus jusqu'à la fin de notre contrat avec lui ; son contrat de traitement des données l'oblige ensuite à les effacer ou à nous les rendre. Pour l'usage qu'il fait pour son propre compte, ce sont les durées prévues par sa ${lienPolitiqueCloudflare}.`,
            "**Obligatoire ?** C'est automatique : c'est le chemin par lequel le site arrive jusqu'à toi.",
          ],
        },
        "**Et les cookies ?** Cloudflare dépose un cookie de sécurité strictement nécessaire, « cf_clearance », qui retient que ton navigateur a passé sa vérification anti-robots (durée relevée : 1 an) ; dans certains cas, il peut aussi déposer « __cf_bm », qui aide à distinguer les humains des robots et expire au bout d'environ 30 minutes. Ces cookies indispensables ne nécessitent pas ton accord : tous les détails sont sur la page [Cookies](/cookies#liste-des-cookies).",
      ],
    },
    sectionCarteDesLieux,
    sectionSignalerImage,
    {
      id: "newsletter",
      titre: "La newsletter",
      blocs: [
        `Tu peux t'inscrire de deux façons : avec le formulaire « Préviens-moi » du site (détails dans la section suivante), ou en nous écrivant à ${lienEmail}, par exemple avec l'objet « Inscription à la newsletter SOS Miam ». Ce qui suit vaut pour les deux.`,
        "Et deux cas où c'est à l'inscription que ça se joue. **Si tu crées un compte dans l'app**, une case te propose de recevoir la newsletter : tu peux la décocher, et dans ce cas on ne t'inscrit pas. Laissée cochée, tu es inscrit tout de suite si tu passes par Apple ou Google (ils ont déjà vérifié ton adresse) ; avec ton e-mail et un mot de passe, seulement après un clic sur le lien de confirmation qu'on t'envoie (voir « La confirmation » plus bas). **Si tu t'inscris comme ambassadeur**, la même case t'attend dans le formulaire : cochée, tu es inscrit une fois ta candidature validée, pour suivre la vie du programme ; décochée, on ne t'inscrit pas. Si tu la décoches, dans l'app comme chez les ambassadeurs, ton adresse e-mail rejoint la liste des désinscrits (voir « La liste des inscrits » plus bas, **3 ans**), pour qu'on ne t'inscrive jamais par erreur. Dans les deux cas, on reprend seulement ton adresse e-mail et ta ville, et tu peux te désinscrire en un clic à tout moment (voir « Te désinscrire » plus bas) ; ton compte n'en dépend pas.",
        {
          liste: [
            "**Ce qu'on reçoit** : par le formulaire, ce qui est décrit dans la section suivante ; par mail, ton adresse e-mail, le nom affiché par ta messagerie, la ville que tu indiques et ce que tu choisis d'ajouter au message.",
            "**Pourquoi** : te prévenir quand SOS Miam se lance près de chez toi, puis te donner des nouvelles (nouveaux lieux, nouvelles villes, BIG SOS…) par la newsletter.",
            "**Base légale** : ton consentement (article 6.1.a du RGPD), que tu donnes en envoyant le mail, ou en confirmant le formulaire avec le lien qu'on t'envoie, et que tu peux retirer à tout moment. Pour les comptes de l'app et les ambassadeurs : notre intérêt légitime (article 6.1.f du RGPD) à te donner des nouvelles de SOS Miam, dont tu utilises déjà le service, dans le cadre prévu par l'article L. 34-5 du Code des postes et des communications électroniques : tu peux refuser dès l'inscription, puis à chaque newsletter, sans frais.",
            `**Où et qui** : si tu t'inscris par mail, ton mail arrive dans la boîte ${site.emailContact}, fournie par ${prestataires.messagerie.nom} ; il est reçu par un serveur de messagerie situé en Suisse (voir « Qui voit tes données, et où elles sont »). Seul l'éditeur consulte cette boîte.`,
            `**La liste des inscrits** : pour t'envoyer la newsletter, les inscriptions du formulaire et celles reçues par mail sont réunies dans une liste (ton adresse e-mail, ta ville, ton téléphone et ton choix pour la bêta si tu les as donnés dans le formulaire, la langue de ta demande, pour t'écrire en français ou en anglais, la date de ton inscription et celle de ton dernier message), gardée sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur y a accès, et elle suit les mêmes règles de durée : si tu te désinscris, ta ligne est retirée de la liste et effacée de notre base avant tout nouvel envoi, ville comprise. Seuls ton adresse e-mail et la date de ta désinscription restent, pendant **3 ans**, dans une liste à part : elle sert uniquement à ne jamais te réinscrire par erreur (par exemple si ton adresse revient dans un import). Ton adresse y entre aussi, avec la date, si tu décoches la case de la newsletter en créant ton compte.`,
            "**Combien de temps** : tant que tu restes inscrit, tu continues de recevoir la newsletter, même après le lancement. Si on n'a plus aucun message de ta part pendant 3 ans, on te demande si tu veux continuer ; sans réponse, on efface ton adresse. Ton mail d'inscription ou de désinscription reste dans notre boîte comme preuve de ton choix, 3 ans au plus.",
            "**Obligatoire ?** Non, rien ne l'est. Sans adresse e-mail, on ne peut simplement pas te prévenir ; la ville nous aide à le faire au bon moment.",
            `**L'envoi** : la newsletter part de notre boîte ${site.emailContact}, chez ${prestataires.messagerie.nom}, sans autre prestataire, et c'est l'éditeur qui la lance à la main. Juste avant chaque envoi, les désinscriptions reçues sont retirées de la liste. Le journal des envois (ton adresse, la date et le résultat de l'envoi) est effacé au bout de **90 jours** ; le texte de la newsletter, le même pour tout le monde, est gardé sans aucune adresse.`,
            `**Te désinscrire** : en un clic, avec le lien « Me désinscrire » en bas de chaque newsletter, ou le bouton de désinscription que ta messagerie affiche. Ce lien t'est propre : il contient ton adresse e-mail (encodée, pas chiffrée) et une signature qui empêche quelqu'un d'autre de te désinscrire, rien de plus. Comme toute adresse visitée, il passe dans le journal de la porte d'entrée du serveur (15 jours au plus) ; le journal du programme du site, lui, n'en note que « /desinscription ». Tu peux aussi écrire à ${lienEmail} ou répondre « STOP » à une newsletter, sans avoir à te justifier.`,
          ],
        },
      ],
    },
    {
      id: "formulaire",
      titre: "Le formulaire « Préviens-moi »",
      blocs: [
        "En bas de l'accueil du site, le formulaire « Préviens-moi » te demande ton adresse e-mail et ta ville ou ta région (que tu écris toi-même, avec des suggestions). Il te propose aussi, sans obligation, de dire si tu as un iPhone ou un Android, de tester l'app avant sa sortie (bêta) et de devenir ambassadeur (dès 18 ans).",
        {
          liste: [
            "**Ce qu'on enregistre** : ton adresse e-mail, ta ville ou ta région, ton téléphone (iPhone ou Android) si tu l'indiques, tes choix pour les cases bêta et ambassadeur, la date de ta première et de ta dernière inscription, et le fait que l'inscription vient du site. Si tu remplis le formulaire plusieurs fois, on garde une seule ligne, mise à jour quand tu confirmes avec le lien reçu.",
            "**La confirmation** : envoyer le formulaire ne suffit pas. On t'envoie d'abord un mail avec un lien de confirmation, valable **7 jours** et une seule fois : tant que tu n'as pas cliqué, tu n'es pas inscrit et tu ne reçois aucune newsletter. En attendant, ta demande (ce que tu as saisi, et l'empreinte du lien, jamais le lien lui-même) est gardée à part, sur notre serveur ; sans clic, elle est effacée dans la nuit qui suit la fin des 7 jours. Pour ne pas remplir la boîte de quelqu'un qui n'a rien demandé, un nouveau lien part au plus une fois par heure, et 3 fois au plus pour une même demande. Le message affiché après l'envoi est le même pour tout le monde : il ne dit jamais si une adresse est déjà inscrite.",
            "**Pourquoi** : te prévenir du lancement dans ta ville, puis t'envoyer la newsletter ; savoir sur quel store (App Store d'Apple ou Play Store de Google) publier l'app en premier ; si tu as coché les cases, t'inviter à tester la bêta et à créer ton compte dans l'espace ambassadeur.",
            "**Base légale** : ton consentement (article 6.1.a du RGPD), que tu peux retirer à tout moment.",
            `**Où et qui** : dans une base de données sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur y a accès.`,
            "**Combien de temps** : comme pour la newsletter, tant que tu restes inscrit ; si tu te désinscris, ta ligne est effacée avant tout nouvel envoi ; après 3 ans sans aucun message de ta part, on te demande si tu veux continuer, sinon on efface.",
            "**Ton adresse IP** : le site la transmet à notre serveur pour limiter le nombre d'envois (5 toutes les 10 minutes), contre les robots. Elle reste seulement en mémoire, une dizaine de minutes, et n'est jamais enregistrée avec ton inscription.",
            "**Ta position, si tu touches le bouton 📍** : ton navigateur te demande d'abord ton accord. Ta position, arrondie à environ 100 mètres, est envoyée à notre serveur, qui demande au service public de l'État geo.api.gouv.fr (géré par la direction interministérielle du numérique) la commune qui s'y trouve, avec son département et sa région ; ta propre adresse IP ne lui est pas transmise. Notre serveur ne garde ni ta position ni la réponse : la commune trouvée remplit juste le champ, et tu peux la changer avant d'envoyer. geo.api.gouv.fr peut, de son côté, garder une trace technique de la demande (la position arrondie, venue de notre serveur), selon ses propres conditions. Pour freiner les abus, ton adresse IP sert aussi à limiter le nombre de recherches (20 toutes les 10 minutes), comme pour le formulaire, sans être enregistrée. Base légale : ton consentement, que tu donnes en touchant le bouton.",
            "**Pour la bêta** : au moment de t'inviter, et seulement si tu as coché la case, on transmet ton adresse e-mail à Apple (TestFlight, si tu es sur iPhone), qui t'envoie l'invitation, ou à Google (liste des testeurs de la Play Console, si tu es sur Android), et on t'envoie alors nous-mêmes le lien pour rejoindre le test. Google et Apple gèrent ensuite l'accès à la version de test, selon leurs propres règles de confidentialité. Sur Android, Google a besoin de l'adresse de ton compte Google. Les cases bêta et ambassadeur, une fois cochées, le restent même si tu renvoies le formulaire sans elles : tu ne veux plus tester, ou plus être ambassadeur ? Un mail suffit, on te retire de la liste.",
            "**Obligatoire ?** Seul l'e-mail est indispensable pour te prévenir. Ta ville ou ta région (qui nous dit quand te prévenir), ton téléphone et les cases bêta et ambassadeur sont facultatifs. Pour la bêta, on a juste besoin de savoir si tu as un iPhone ou un Android.",
          ],
        },
        "Comme toute visite, l'envoi du formulaire passe par Cloudflare et apparaît dans les journaux du serveur. Les journaux notent la page appelée, pas ce que tu as saisi. Cloudflare, lui, voit passer ce que tu envoies, comme pour toute requête.",
      ],
    },
    {
      id: "demande-lieu",
      titre: "Le formulaire « J'inscris mon lieu »",
      blocs: [
        "Sur la page [J'inscris mon lieu](/inscrire-mon-lieu), un lieu peut demander à être sur SOS Miam. La demande arrive dans notre logiciel de gestion, où l'éditeur l'accepte ou la refuse.",
        {
          liste: [
            "**Ce qu'on reçoit sur le lieu** : son nom et sa ville, sa description, et si tu les donnes son type, son adresse, son plat phare, ses horaires, son site web et son compte Instagram. Si la demande est acceptée, ces informations servent à créer la fiche du lieu, qui sera publique.",
            "**Ce qu'on reçoit sur toi** : ton nom, ton e-mail et, si tu le donnes, ton téléphone. Ils ne sont jamais publiés.",
            "**Pourquoi** : étudier la demande, créer la fiche du lieu et te répondre.",
            "**Base légale** : les mesures précontractuelles prises à ta demande (article 6.1.b du RGPD) : tu nous demandes d'inscrire ton lieu, et ces informations sont nécessaires pour le faire.",
            `**Où et qui** : dans une base de données sur notre serveur, loué à ${hebergeur.nom} et situé en France. Seul l'éditeur y a accès.`,
            "**Combien de temps** : tes coordonnées sont effacées quand on n'en a plus besoin pour ta demande ; la demande entière, coordonnées comprises, est effacée automatiquement **3 ans après notre décision** (ou 3 ans après son envoi, si elle n'a jamais été tranchée). Si elle est acceptée, les informations du lieu deviennent sa fiche, que tu peux faire modifier ou retirer à tout moment par un simple mail.",
            "**Ton adresse IP** : comme pour le formulaire « Préviens-moi », elle sert seulement à limiter le nombre d'envois (3 toutes les 30 minutes) et n'est jamais enregistrée avec ta demande.",
            "**Obligatoire ?** Le nom du lieu, sa ville, sa description, ton nom et ton e-mail : sans eux, on ne peut ni étudier la demande ni te répondre. Le reste est facultatif.",
          ],
        },
      ],
    },
    sectionCandidatures,
    sectionChasseAuxBugs,
    {
      id: "messages",
      titre: "Tes messages : lieu, ambassadeur, questions",
      blocs: [
        `Tu peux aussi nous écrire à ${lienEmail} pour inscrire ton lieu (le formulaire [J'inscris mon lieu](/inscrire-mon-lieu) est le plus simple), pour un souci avec ton compte ambassadeur (si « Mot de passe oublié » ne marche pas, par exemple) ou simplement pour poser une question.`,
        {
          liste: [
            "**Ce qu'on reçoit** : ton adresse e-mail, le nom affiché par ta messagerie et le contenu de ton message. Pour un lieu : son nom, sa ville et son type (resto, pâtisserie, bar, sortie…).",
            "**Pourquoi** : te répondre, examiner la demande d'inscription de ton lieu, t'aider avec ton compte, et en reparler avec toi.",
            "**Base légale** : l'intérêt légitime (article 6.1.f du RGPD). L'intérêt poursuivi : donner suite aux messages qu'on reçoit et faire connaître des lieux indépendants. Pour un souci avec ton compte ambassadeur, c'est l'exécution des conditions d'utilisation (article 6.1.b du RGPD).",
            `**Où et qui** : dans la boîte ${site.emailContact}, fournie par ${prestataires.messagerie.nom} ; les mails sont reçus par un serveur de messagerie situé en Suisse (voir « Qui voit tes données, et où elles sont »). Seul l'éditeur consulte cette boîte.`,
            "**Combien de temps** : pour une demande de lieu ou une candidature, au plus 3 ans après ton dernier contact. Pour une question ou un souci avec ton compte, le temps de te répondre, puis au plus 3 ans.",
            "**Obligatoire ?** Non. Sans adresse e-mail, on ne peut simplement pas te répondre.",
          ],
        },
        "Pas besoin de nous envoyer d'informations sensibles (santé, opinions, coordonnées bancaires…) : on n'en a pas l'usage.",
      ],
    },
    sectionCompteAmbassadeur,
    sectionComptePro,
    sectionConnexionAppleGoogle,
    sectionConnexionQr,
    sectionApp,
    sectionAppComptes,
    sectionDonneesApp,
    sectionPotes,
    sectionMessagerie,
    sectionCommunaute,
    sectionSortiesMiamis,
    sectionBoiteAIdees,
    sectionActus,
    sectionSignalementsSociaux,
    sectionMiamSafe,
    sectionPrevenirUnPote,
    {
      id: "ce-qu-on-ne-fait-pas",
      titre: "Ce qu'on ne fait pas",
      blocs: [
        {
          liste: [
            "**On ne vend jamais tes données**, on ne les loue pas, et on ne les confie qu'aux prestataires techniques présentés plus bas, pour notre compte (sauf obligation légale).",
            "**Aucun cookie de suivi** : à ce jour, nos pages n'en déposent aucun. Seules exceptions possibles : les cookies de sécurité de Cloudflare présentés plus haut, le cookie qui retient ton refus d'être compté dans les statistiques, si tu le demandes, celui qui te garde connecté (à « Mon compte », à ton espace ambassadeur ou pro) et, le temps d'une connexion avec Apple ou Google, deux cookies de 10 minutes (ou, pour une connexion par QR code, un cookie de 2 minutes), et celui qui retient la langue que tu choisis, si tu en choisis une. La liste complète est sur la page [Cookies](/cookies#liste-des-cookies).",
            "**Presque rien dans ton navigateur** : le site garde seulement, dans le stockage de session de ton navigateur, la position où tu étais sur chaque page, pour t'y ramener quand tu reviens en arrière, et parfois le numéro de version du site après une mise à jour. Aucun identifiant, aucune donnée personnelle, et tout s'efface quand tu fermes l'onglet : c'est strictement nécessaire à la navigation, donc sans demande d'accord.",
            "**Aucun outil de mesure d'audience extérieur** (ni Google Analytics, ni pixel de réseau social) : nos statistiques de visite sont comptées par notre serveur, sans cookie (voir « Les statistiques de visite »). Et **aucune publicité** pour l'instant.",
            "**Aucun contenu tiers intégré** : pas de vidéo, de carte ou de bouton de réseau social qui préviendrait un autre service de ta visite. Même nos polices de caractères sont hébergées avec le site, sur notre serveur chez notre hébergeur.",
            `**Aucune décision automatisée au sens de l'article 22 du RGPD** : aucune décision produisant des effets juridiques te concernant, ou t'affectant de manière significative, n'est prise sur le seul fondement d'un traitement automatisé. Seul le filtrage de sécurité de Cloudflare peut, automatiquement, te demander une vérification ou bloquer une requête jugée malveillante ; après plusieurs mots de passe faux, notre serveur te fait patienter un peu avant un nouvel essai ; et il refuse tout seul une inscription avant 18 ans (dans l'app, l'espace ambassadeur ou l'espace pro), d'après la date de naissance que tu indiques (une inscription refusée ne laisse rien sur notre serveur). Dans l'app, le filtre de mots refuse tout seul un texte qui contient une insulte courante, et un signalement pour violence ou contenu sexuel peut masquer un contenu tout de suite, en attendant qu'une personne de l'équipe décide (voir les [conditions d'utilisation](/cgu#moderation)). Si tu es bloqué à tort, écris-nous à ${lienEmail}. Toutes les autres inscriptions d'ambassadeur, et chaque demande pour gérer un lieu, sont regardées par une personne.`,
          ],
        },
      ],
    },
    {
      id: "destinataires",
      titre: "Qui voit tes données, et où elles sont",
      blocs: [
        "Tes données ne sont consultées que par l'éditeur de SOS Miam. Les prestataires techniques ci-dessous les traitent pour son compte, dans le cadre de leur contrat (ce sont des « sous-traitants » au sens du RGPD) :",
        {
          liste: [
            `**${hebergeur.nom}** (${hebergeur.adresse}) : hébergement du serveur du site, en France.`,
            `**${prestataires.messagerie.nom}** : ${prestataires.messagerie.role} ; les mails sont reçus par un serveur de messagerie situé en Suisse, et c'est aussi par cette boîte que partent nos mails (la newsletter, et les mails de ton compte ambassadeur : confirmation de ton adresse e-mail, bienvenue, nouvelles du programme, alertes avant le retrait du rôle ou l'effacement, lien pour un nouveau mot de passe que tu as demandé). Notre serveur garde un journal de ces envois (adresse, type et objet du mail, date, résultat) pendant 90 jours, même si le compte est supprimé entre-temps. Une copie de chaque mail qu'on t'envoie à toi (automatique, ou écrit par l'équipe) est rangée dans le dossier « Envoyés » de notre boîte, avec les liens personnels masqués (comme celui d'un nouveau mot de passe), et effacée automatiquement au bout de **90 jours** ; pour la newsletter, une seule copie de chaque envoi est rangée, sans aucune adresse.`,
            `**${prestataires.reseau.nom}** (${prestataires.reseau.adresse}) : ${prestataires.reseau.role}. Pour la sécurité de son propre réseau, il utilise aussi certaines données pour son propre compte (voir « Cloudflare, qui protège le site »).`,
          ],
        },
        "Ces prestataires peuvent eux-mêmes faire appel à d'autres prestataires techniques (des « sous-traitants ultérieurs »), qui doivent respecter les mêmes obligations de protection de tes données.",
        "Seulement si tu as demandé à tester la bêta, ton adresse e-mail est transmise à **Google** (liste de testeurs de la Play Console, pour Android) ou à **Apple** (TestFlight, pour iPhone) au moment de t'inviter. Et seulement si tu touches le bouton 📍 du formulaire ou « Près de moi » sur la page des lieux, ta position arrondie est envoyée par notre serveur au service public **geo.api.gouv.fr** pour trouver ta commune : notre serveur n'en garde rien. Le fond de la carte des lieux vient d'**OpenFreeMap**, mais c'est notre serveur qui le lui demande : OpenFreeMap ne reçoit rien de toi (voir « [La carte des lieux](#carte-des-lieux) »). Enfin, si un lieu que tu as proposé depuis ton espace ambassadeur rejoint SOS Miam, ton prénom peut s'afficher sur sa fiche, visible par tous (« Déniché par ») ; et si tu deviens ambassadeur certifié, le badge « Ambassadeur certifié ✓ » s'affiche avec ton prénom et, si tu en as indiqué une, le nom de ta structure, sur les fiches des lieux que tu as aidés. Il n'y a pas de liste publique des ambassadeurs certifiés.",
        "Dans l'app, et seulement quand tu le demandes, ta position est envoyée au service de ton téléphone (celui d'**Apple** sur iPhone, celui de **Google** sur Android) pour trouver le nom de ta ville ; sur iPhone, la carte d'Explorer est dessinée par **Plans d'Apple**, qui reçoit la zone que tu regardes. Les notifications passent par le service d'**Apple** (APNs) ou de **Google** (Firebase Cloud Messaging), qui reçoit leur titre et leur texte pour les livrer à ton téléphone : pour la messagerie et les Miamis, le prénom de la personne et, selon le cas, le titre d'un groupe ou d'une sortie et le nom de son lieu, et la sorte de message ; l'aperçu d'un message, lui, voyage **chiffré pour ton seul téléphone**, qu'ils ne peuvent pas lire (voir « Ta messagerie »). Quand un GIF s'affiche, son image vient directement de **GIPHY** (GIPHY, Inc., aux États-Unis), qui voit alors l'adresse IP de ton téléphone ; ta recherche, elle, passe par notre serveur, sans ton compte ni ton adresse IP. Ce sont alors leurs propres règles de confidentialité qui s'appliquent (voir « L'app SOS Miam : sur ton téléphone »).",
        "Et bien sûr, ce que tu partages dans l'app va aux personnes que tu choisis : tes messages aux membres de la conversation, ta position de « Prévenir un pote » au seul pote choisi, ton profil et tes listes selon tes réglages (voir « Ta bande, tes abonnés et ton profil »), une sortie des Miamis à son seul public, ta présence dans « Qui est là ? » aux Miamis de ta ville, et tes idées et tes commentaires d'idée à tous les Miamis (voir [Les Miamis](#communaute)).",
        "Si la loi l'impose, certaines données peuvent être communiquées à une autorité qui les demande dans un cadre légal, par exemple sur décision d'un juge. Personne d'autre ne les reçoit.",
        `**Transferts hors de l'Union européenne** : le serveur du site est en France. Les e-mails envoyés à ${site.emailContact} sont reçus par un serveur situé en Suisse : la Suisse bénéficie d'une décision d'adéquation de la Commission européenne (décision 2000/518/CE du 26 juillet 2000), qui reconnaît que tes données y sont aussi bien protégées que dans l'Union européenne. Cloudflare peut traiter des données hors de l'Union européenne, notamment aux États-Unis, avec les garanties décrites dans la partie « Cloudflare, qui protège le site ». Enfin, si tu demandes la bêta, Google ou Apple peuvent traiter ton adresse aux États-Unis : pour Google, le transfert est encadré par le **Data Privacy Framework UE–États-Unis**, auquel Google LLC a adhéré (certification vérifiable sur [dataprivacyframework.gov](https://www.dataprivacyframework.gov/)) ; pour Apple, par les **clauses contractuelles types** de la Commission européenne, comme l'indique sa [politique de confidentialité](https://www.apple.com/fr/legal/privacy/fr-ww/).`,
      ],
    },
    {
      id: "securite",
      titre: "Comment on protège tes données",
      blocs: [
        {
          liste: [
            "**Connexion chiffrée** : tout le site passe en HTTPS. La connexion est chiffrée de ton navigateur jusqu'à Cloudflare, puis de Cloudflare jusqu'à notre serveur ; Cloudflare déchiffre le trafic au passage pour le protéger.",
            "**Un seul administrateur** : l'éditeur est le seul à administrer le serveur et à consulter les journaux, la boîte mail et les comptes ambassadeurs (depuis un logiciel protégé par un mot de passe et un code à 6 chiffres).",
            "**Tes messages chiffrés** : le texte de tes messages, les lieux que tu envoies, tes photos, tes notes vocales, le titre de tes groupes, ton code d'invitation, ton genre (si tu le donnes), la position de « Prévenir un pote » et la copie d'un contenu signalé sont chiffrés par notre serveur (AES-256-GCM), avec des clés tirées d'une clé gardée hors de la base de données. Ce n'est pas un chiffrement « de bout en bout » : notre serveur les déchiffre pour te les montrer, mais une copie volée de la base ou d'une sauvegarde ne les dévoilerait pas. Notre serveur n'écrit jamais le contenu d'un message dans ses journaux.",
            "**Mots de passe protégés** : on ne garde jamais ton mot de passe, seulement une empreinte calculée avec scrypt, un procédé fait exprès pour être long à attaquer ; tes clés de connexion sont, elles aussi, gardées en empreinte. Et celui qui essaie de deviner un mot de passe est vite freiné (voir « Ton compte ambassadeur »).",
            "**Protection contre les attaques** : Cloudflare filtre le trafic malveillant avant qu'il n'atteigne le serveur.",
            "**Le moins possible, le moins longtemps possible** : on collecte le strict nécessaire, et les journaux s'effacent d'eux-mêmes au bout de 15 jours au plus. Ce qu'on n'a pas ne peut pas fuiter.",
            "**Des sauvegardes chiffrées** : pour ne rien perdre en cas de panne, une copie chiffrée de notre base de données est faite chaque nuit sur notre serveur, en France, et on garde les 30 dernières. Une copie chiffrée peut aussi être gardée sur l'ordinateur de l'éditeur, avec la même règle. Quand une donnée est effacée de la base, elle disparaît des sauvegardes au plus tard 30 jours après.",
            "**Des exports, seulement quand il le faut** : l'équipe peut exporter une liste (les inscrits à la newsletter, les ambassadeurs, ou les données d'un compte quand tu nous demandes une copie) sur l'ordinateur de l'éditeur, qui est protégé, et la supprime dès qu'elle a servi.",
          ],
        },
        "Si un incident de sécurité touchait tes données, on le signalerait à la CNIL dans les 72 heures quand la loi l'exige, et on te préviendrait directement si le risque pour toi était élevé.",
      ],
    },
    {
      id: "droits",
      titre: "Tes droits",
      blocs: [
        "Sur les données qui te concernent, tu as le droit de :",
        {
          liste: [
            "**Accès** : savoir si on a des données sur toi, et en recevoir une copie.",
            "**Rectification** : faire corriger ce qui est faux ou incomplet (pour ton compte ambassadeur, tu peux aussi le faire toi-même dans « Mon compte »).",
            "**Effacement** : faire effacer tes données, par exemple quand tu retires ton consentement ou qu'elles ne sont plus nécessaires (ton compte ambassadeur se supprime aussi en ligne, dans « Mon compte »).",
            "**Limitation** : faire geler l'utilisation de tes données pendant un temps, par exemple le temps de vérifier une contestation.",
            "**Opposition** : t'opposer à un traitement fondé sur notre intérêt légitime (voir juste en dessous).",
            "**Portabilité** : recevoir les données que tu nous as fournies avec ton consentement ou pour ton compte (newsletter, formulaire, candidature, compte ambassadeur, compte de l'app) dans un format lisible par une machine, ou les faire transmettre à un autre service quand c'est techniquement possible. Pour tes données sociales (bande, listes, messages…), tu les télécharges toi-même dans l'app (voir « Comment exercer tes droits »).",
            "**Retrait du consentement** : à tout moment, aussi simplement que tu l'as donné. Ce qui a été fait avant reste valable.",
            "**Directives après ton décès** : nous dire ce que doivent devenir tes données après ta mort (conservation, effacement, communication) et désigner une personne chargée de les faire appliquer, comme le prévoit la loi Informatique et Libertés.",
          ],
        },
        `**Ton droit d'opposition** : pour les journaux du serveur, les statistiques de visite, Cloudflare, tes messages, la note de l'équipe et les limites d'essais de ton compte ambassadeur, fondés sur notre intérêt légitime, tu peux t'opposer à tout moment au traitement de tes données pour des raisons tenant à ta situation particulière (article 21 du RGPD). On arrête alors, sauf motif légitime et impérieux qui l'emporte, comme la sécurité du site, ou si ces données sont nécessaires pour faire valoir ou défendre des droits en justice. Écris à ${lienEmail}. Pour les statistiques de visite, c'est encore plus simple : un clic sur la page [Tes visites et nos statistiques](/statistiques).`,
      ],
    },
    {
      id: "exercer-tes-droits",
      titre: "Comment exercer tes droits",
      blocs: [
        {
          liste: [
            "**Tes données sociales, sans nous écrire** : dans l'app, « Télécharger mes données sociales » (Profil › ⚙️ Paramètres › Tes données, **2 fois par 24 heures** au plus) te donne un fichier (au format JSON) avec ta bande, tes demandes, tes blocages, tes abonnements et tes abonnés, tes conversations avec **tes** messages, tes réactions, tes groupes et tes sorties, tes listes, tes commentaires, ta cloche, tes signalements (ce que tu as écrit, et où ils en sont), ce que tu as masqué et les limitations de ton compte (la règle, l'explication, les dates et ta contestation, sans aucun nom de l'équipe). Jamais les messages des autres, ni ce qu'ils ne t'ont pas montré, ni ton code d'invitation ; les photos et les notes vocales n'y sont pas jointes (seulement leur date, leur type et leur taille). Le fichier ne reste sur ton téléphone que le temps de l'enregistrer ou de le partager où tu veux. La copie que l'équipe peut te faire sur demande contient aussi tes données sociales mais, pour tes conversations, seulement ce qui les entoure (avec qui, quand), **jamais leur contenu**. Les données des Miamis (ton genre, tes sorties des Miamis et tes places, tes idées, tes votes, tes commentaires d'idée et tes coucous) n'y sont **pas encore** : elles arrivent **bientôt** dans ce fichier ; en attendant, écris-nous pour en avoir une copie.",
            `**Écris-nous** à ${lienEmail} en précisant le droit que tu veux exercer. Pour les journaux du serveur, indique aussi ton adresse IP et le moment de ta visite : sans ça, impossible de retrouver les lignes qui te concernent (et elles disparaissent de toute façon au bout de 15 jours au plus).`,
            "**Pour les journaux, une précaution** : une adresse IP pouvant être partagée par plusieurs personnes (box familiale, Wi-Fi public, réseau mobile), on pourra te demander de quoi vérifier qu'elle était bien la tienne à ce moment-là, et on ne te communiquera pas les lignes qui pourraient concerner quelqu'un d'autre.",
            "**On te répond dans un délai d'un mois** au plus. Si ta demande est complexe, ce délai peut être prolongé de deux mois : on te prévient alors dans le premier mois, en t'expliquant pourquoi.",
            "**On ne te demande de prouver ton identité qu'en cas de doute raisonnable**, par exemple si la demande ne vient pas de l'adresse e-mail concernée. Pas de copie de pièce d'identité par principe.",
            "**C'est gratuit.**",
          ],
        },
      ],
    },
    {
      id: "cnil",
      titre: "Réclamation auprès de la CNIL",
      blocs: [
        "Si tu estimes que tes droits ne sont pas respectés, tu peux adresser une réclamation à la CNIL (Commission nationale de l'informatique et des libertés), l'autorité française de protection des données, directement [en ligne](https://www.cnil.fr/fr/plaintes).",
        `Tu peux aussi nous écrire d'abord à ${lienEmail} : on aimerait bien avoir une chance d'arranger les choses.`,
      ],
    },
    {
      id: "mineurs",
      titre: "Les mineurs",
      blocs: [
        "Un compte SOS Miam (dans l'app, l'espace ambassadeur ou l'espace pro) est réservé aux personnes majeures : **18 ans** en France. Sans compte, le site se visite à tout âge.",
        "La newsletter et le formulaire « Préviens-moi » restent ouverts à tous. En France, la loi Informatique et Libertés permet de consentir seul au traitement de ses données à partir de **15 ans** : si tu as moins de 15 ans, il faut l'accord de tes parents (ou de la personne qui a l'autorité parentale), en plus du tien, avant de t'y inscrire.",
        `Si on apprend qu'un enfant de moins de 15 ans s'est inscrit sans cet accord, on efface ses données. Un parent peut nous le signaler à ${lienEmail}.`,
        "Ta date de naissance sert à vérifier que tu as 18 ans : si tu crées ton compte sur le site avec ton e-mail et un mot de passe (espace ambassadeur ou pro), elle n'est pas gardée ; dans l'app, ou avec Apple ou Google, elle est gardée chiffrée (voir « L'app SOS Miam : ton compte »). Si on apprend qu'un compte appartient à quelqu'un de moins de 18 ans, ou si un parent nous le signale, on le supprime avec ses données.",
      ],
    },
    {
      id: "a-venir",
      titre: "Ce qui arrivera plus tard",
      blocs: [
        "SOS Miam va grandir. Voici ce qui est prévu, **mais ne fonctionne pas aujourd'hui** :",
        {
          liste: [
            "**La publicité**, toujours signalée comme telle, et les **vidéos intégrées** : ce qui n'est pas indispensable ne sera activé qu'avec ton accord, recueilli par un bandeau conforme aux règles de la CNIL, et ton choix sera gardé 6 mois.",
            "**Des SMS**, peut-être un jour : ceux qui font de la pub ne partiront qu'avec ton accord explicite (une case non cochée d'avance), et « STOP » suffira pour arrêter.",
            "**Un suivi des plantages de l'app**, pour corriger les bugs plus vite : s'il arrive, cette page dira avant quel service le fait et ce qu'il reçoit.",
            "**Les bons solidaires**, pour payer à l'avance dans un lieu pendant son BIG SOS. La façon de payer n'est pas encore décidée.",
          ],
        },
        "Avant que chacune de ces nouveautés démarre, cette politique (et la page [Cookies](/cookies) si besoin) sera mise à jour pour dire ce qui est collecté, pourquoi, sur quelle base légale, combien de temps et par quel prestataire.",
      ],
    },
    {
      id: "mises-a-jour",
      titre: "Les mises à jour de cette politique",
      blocs: [
        "Cette politique décrit ce qui se passe à la date indiquée en haut de la page. On la met à jour à chaque changement, et toujours **avant** qu'un nouveau traitement démarre.",
        "Si un changement touche à des données que tu nous as déjà confiées, on te prévient, et on te redemande ton accord quand il le faut.",
      ],
    },
  ],
  chapitres: [
    { id: "qui-on-est", titre: "Qui on est", sections: ["responsable"] },
    { id: "quand-tu-visites", titre: "Quand tu visites le site", sections: ["journaux", "statistiques", "cloudflare", "carte-des-lieux", "signaler-image"] },
    { id: "quand-tu-nous-ecris", titre: "Quand tu t'inscris ou nous écris", sections: ["newsletter", "formulaire", "demande-lieu", "candidatures", "chasse-aux-bugs", "messages"] },
    {
      id: "ton-compte-et-l-app",
      titre: "Ton compte et l'app",
      sections: ["compte-ambassadeur", "compte-pro", "connexion-apple-google", "connexion-qr", "app", "app-comptes", "donnees-app"],
    },
    {
      id: "ta-bande-et-tes-messages",
      titre: "Communauté : ta bande, tes messages et les Miamis",
      sections: ["potes", "messagerie", "communaute", "sorties-miamis", "boite-a-idees", "actus", "signalements-sociaux"],
    },
    { id: "en-securite", titre: "Miam Safe", sections: ["miam-safe", "prevenir-un-pote"] },
    { id: "jamais", titre: "Ce qu'on ne fait pas", sections: ["ce-qu-on-ne-fait-pas"] },
    { id: "avec-qui", titre: "Avec qui, où, et comment c'est protégé", sections: ["destinataires", "securite"] },
    { id: "tes-droits", titre: "Tes droits, et comment les exercer", sections: ["droits", "exercer-tes-droits", "cnil"] },
    { id: "moins-de-18-ans", titre: "Les mineurs", sections: ["mineurs"] },
    { id: "la-suite", titre: "Ce qui va changer", sections: ["a-venir", "mises-a-jour"] },
  ],
};
