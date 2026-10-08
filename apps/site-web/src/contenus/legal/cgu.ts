// Conditions d'utilisation du site sosmiam.fr et de l'app SOS Miam (l'app y renvoie à la création du compte).
// Tout est gratuit, rien n'est vendu : pas de CGV. À mettre à jour AVANT l'arrivée de la messagerie et de la pub.
// Pas de clause abusive (Code de la consommation, L212-1 et R212-1 ; Code civil, 1171) : pas d'exclusion totale de
// responsabilité, pas de modification sans information, pas de démarche amiable obligatoire, pas de tribunal imposé.
// Propriété intellectuelle : le nom « SOS Miam » n'est pas revendiqué tant qu'aucune marque n'est déposée à l'INPI.
// Publications : licence gratuite, non exclusive, limitée à l'app et au site ; ailleurs (nos réseaux), seulement avec accord.
// Modération : règlement européen sur les services numériques (DSA, art. 14, 16 et 17) : règles claires, signalement
// ouvert à tous, décision expliquée. Apple (règle 1.2) : « tolérance zéro » écrite noir sur blanc.
// Âge et règles de modération : docs/decisions.md ; page dédiée à l'âge : src/contenus/legal/age.ts.
import { editeur, site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentCgu: DocumentLegal = {
  titre: "Conditions d'utilisation",
  description:
    "Les règles du site et de l'app SOS Miam : gratuits, l'app à partir de 15 ans, ce que tu peux publier, comment on modère, et comment nous joindre.",
  miseAJour: "8 octobre 2026",
  introduction: [
    "Bienvenue sur SOS Miam ! Ces conditions d'utilisation, ce sont les règles du jeu du site et de l'app : ce que tu peux y faire, ce qu'on fait de notre côté, et comment on règle les choses si un souci arrive. On les a écrites le plus simplement possible.",
    "En bref : tout est **gratuit** et il n'y a **rien à acheter**. Le site s'utilise **sans compte** ; l'app demande un **compte gratuit, à partir de 15 ans**. Ce que tu publies **reste à toi**, et on ne vend jamais tes données.",
  ],
  sections: [
    {
      id: "objet",
      titre: "À quoi servent ces conditions",
      blocs: [
        `Les présentes conditions d'utilisation (ci-après « les conditions ») encadrent l'accès et l'utilisation du site ${site.nom}, accessible à l'adresse ${site.adresse} et sur ses sous-domaines (ci-après « le site »), et de l'application mobile ${site.nom} pour iPhone et Android (ci-après « l'app »).`,
        `Le site et l'app sont édités par ${editeur.nom}, ${editeur.statut} (ci-après « l'éditeur »). Dans ces conditions, « SOS Miam », « on » et « nous » désignent l'éditeur ; « tu » désigne toute personne qui utilise le site ou l'app, ou qui nous écrit. Les informations sur l'éditeur et l'hébergeur sont dans les [mentions légales](/mentions-legales).`,
        "Le site te permet de découvrir le projet SOS Miam et de nous écrire. L'app te fait découvrir des lieux indépendants près de chez toi, valider tes visites, donner ton avis et garder tes lieux préférés. Rien n'y est vendu : il n'y a ni paiement, ni abonnement, ni achat dans l'app, ni conditions générales de vente.",
      ],
    },
    {
      id: "acceptation",
      titre: "Acceptation des conditions",
      blocs: [
        "En utilisant le site, tu acceptes ces conditions, dans leur version en ligne au moment de ta visite. Pour l'app, tu les acceptes en créant ton compte. Tu peux les relire à tout moment sur cette page, et les enregistrer ou les imprimer.",
        "Si tu n'es pas d'accord avec elles, tu es libre de ne pas utiliser SOS Miam, et de supprimer ton compte à tout moment.",
        "Si tu télécharges l'app sur l'App Store ou sur Google Play, leurs propres conditions s'appliquent aussi, pour le téléchargement et la licence de l'app.",
      ],
    },
    {
      id: "acces",
      titre: "Un accès gratuit, aussi souvent que possible",
      blocs: [
        "Le site et l'app sont **gratuits**. Le site est ouvert à tous, sans inscription ; l'app demande un compte (voir plus bas). Seuls ton matériel et ta connexion à internet (box, forfait mobile) restent à ta charge.",
        "On fait de notre mieux pour que SOS Miam soit accessible 24 h/24 et 7 j/7, sans pouvoir le garantir. Le site ou l'app peuvent être interrompus ou ralentis, notamment :",
        {
          liste: [
            "pour une maintenance ou une mise à jour ;",
            "en cas de panne ou d'incident chez l'hébergeur ou chez le prestataire réseau ;",
            "en cas d'attaque informatique ou de force majeure.",
          ],
        },
        "On s'efforce de limiter ces interruptions et de les rendre aussi courtes que possible. On peut aussi faire évoluer le contenu et les fonctionnalités, par exemple pour ouvrir de nouvelles villes.",
      ],
    },
    {
      id: "contenu",
      titre: "Ce que tu trouves sur SOS Miam",
      blocs: [
        "**SOS Miam** est **gratuit pour toi comme pour les lieux**. Il te fait découvrir les restos, pâtisseries, bars, bowlings et sorties indépendants qui ont besoin de monde, y compris ceux qui traversent une vraie difficulté (les BIG SOS), en commençant par Montpellier et l'Hérault.",
        "L'app est encore en développement : les fonctionnalités décrites sont celles prévues aujourd'hui, elles peuvent changer d'ici le lancement, et aucune date de sortie n'est garantie.",
        "Les lieux montrés sur le site et dans les versions de démonstration de l'app sont des **exemples imaginés** pour illustrer le principe. Ils ne désignent pas de vrais établissements : toute ressemblance avec un lieu existant serait une coïncidence. Les vidéos et photos qui les illustrent viennent de banques d'images libres de droits, et l'app les signale comme « d'illustration ».",
        "Les informations sur les vrais lieux (horaires, prix, menus, SOS…) viennent le plus souvent des lieux eux-mêmes, qui en sont responsables. L'ordre dans lequel on te les montre dépend notamment des envies que tu as choisies, et les lieux en BIG SOS passent à la une pendant 7 jours. **Aucun lieu ne peut payer pour être mieux placé.**",
        "Il n'y a **aucune publicité** aujourd'hui, ni sur le site ni dans l'app. Quand elle arrivera pour financer SOS Miam, elle sera **toujours signalée comme telle** et n'aura **aucun effet sur le classement des lieux**. Ces conditions seront mises à jour avant son arrivée.",
        `On fait attention à ce que les informations soient justes et à jour. Si tu repères une erreur, écris-nous à ${lienContact} : on la corrige dès que possible.`,
      ],
    },
    {
      id: "age",
      titre: "À partir de 15 ans",
      blocs: [
        "Pour créer un compte dans l'app, il faut avoir **au moins 15 ans** : c'est l'âge à partir duquel la loi française permet d'accepter seul l'utilisation de ses données. Le site, lui, reste ouvert à tous.",
        "Ta date de naissance doit être exacte : elle sert à vérifier ton âge et à adapter l'app. **Entre 15 et 17 ans**, les bars et tout ce qui touche à l'alcool sont masqués.",
        "Mentir sur ton âge est interdit. Si on apprend qu'un compte appartient à quelqu'un de moins de 15 ans, on le supprime avec ses données.",
        "Tous les détails, pour les ados comme pour les parents, sont sur la page [SOS Miam et l'âge](/age).",
      ],
    },
    {
      id: "compte",
      titre: "Ton compte",
      blocs: [
        "Tu peux créer ton compte avec Apple, Google ou une adresse e-mail. Il est gratuit et personnel : **un seul compte par personne**, et tu gardes tes accès pour toi.",
        `Tu es responsable de ce qui se fait depuis ton compte. Si tu penses que quelqu'un l'utilise à ta place, préviens-nous vite à ${lienContact}.`,
        "Tu peux **supprimer ton compte à tout moment**, depuis l'app ou en nous écrivant. On efface alors vraiment tes données, sauf ce que la loi nous oblige à garder.",
        "Si tu ne respectes pas ces conditions, on peut, selon la gravité : masquer ou retirer une publication, t'empêcher de publier pendant un temps, suspendre ton compte ou le supprimer. Dans tous les cas, on te dit pourquoi (voir « Signalements et modération »).",
      ],
    },
    {
      id: "rescousses",
      titre: "Rescousses, visites et badges",
      blocs: [
        "Chaque semaine, tu as **3 rescousses**, qui se rechargent le lundi. Tu valides tes visites dans l'app, par exemple en scannant un **QR code**.",
        "Tes visites te rapportent des points, des paliers et des badges (le programme Ambassadeurs). Ils n'ont **aucune valeur en argent** : ils ne s'achètent pas, ne se vendent pas et ne s'échangent pas.",
        "Tricher fausse le jeu pour tout le monde, et surtout pour les lieux : les points gagnés en trichant (faux scans, comptes multiples…) peuvent être retirés.",
      ],
    },
    {
      id: "publications",
      titre: "Ce que tu publies dans l'app",
      blocs: [
        "Dans l'app, tu peux publier des contenus : avis, photos, vidéos et, si tu représentes un lieu, sa fiche, ses SOS ou son histoire de BIG SOS (ci-après « tes publications »).",
        "**Tes publications restent à toi.** Pour qu'on puisse les montrer, tu nous autorises, gratuitement et sans exclusivité, à les héberger, à les adapter au format de l'app (recadrage, compression…) et à les afficher dans l'app et sur le site, tant qu'elles sont en ligne. Tu restes libre de les publier ailleurs.",
        "Si tu supprimes une publication, ou ton compte, on arrête de la montrer. Pour toute autre utilisation, par exemple sur nos réseaux sociaux (TikTok, Instagram…), **on te demande d'abord ton accord**.",
        "En publiant, tu garantis :",
        {
          liste: [
            "que tu as le droit de le faire : c'est ta création, ou tu as l'accord de son auteur (musique comprise) ;",
            "que les personnes qu'on reconnaît sur tes photos et vidéos sont d'accord (et leurs parents, pour un mineur) ;",
            "que ce que tu racontes est vrai : un avis raconte une vraie visite ;",
            "que tu indiques clairement un partenariat commercial, avec la mention « Publicité » ou « Collaboration commerciale », comme la loi l'exige ;",
            "que ta publication respecte les règles de la communauté, juste en dessous.",
          ],
        },
        "Tu es responsable de ce que tu publies.",
      ],
    },
    {
      id: "regles-communaute",
      titre: "Les règles de la communauté",
      blocs: [
        "SOS Miam, c'est un endroit pour se donner envie de sortir et s'entraider. On y est bienveillant, et pour les contenus choquants et les comportements abusifs, c'est **tolérance zéro**. Dans tout ce que tu partages dans l'app, il est interdit de publier ou de faire :",
        {
          liste: [
            "de **fausses infos** : un lieu inventé ou fermé, un faux SOS, des prix ou des horaires trompeurs, un avis sans visite, payé ou écrit pour nuire à un concurrent ;",
            "de la **pub cachée** ou du spam ;",
            "des **arnaques** : demande d'argent ou de coordonnées bancaires, faux jeu concours, lien douteux ;",
            "de la **haine ou du harcèlement** : insultes, moqueries, discrimination, menaces ;",
            "de la **violence**, de la nudité ou du contenu sexuel ;",
            "ce qui **met en danger** : drogue, alcool proposé à des mineurs, défi dangereux, arme ;",
            "ce qui porte atteinte à la **vie privée** : filmer ou montrer quelqu'un sans son accord, publier ses infos personnelles ;",
            "le **contenu des autres** (vidéo, photo, musique, texte) sans leur accord ;",
            "**tricher**, ou signaler exprès des publications qui respectent les règles, par exemple pour nuire à un concurrent ;",
            "te faire passer pour quelqu'un d'autre, ou pour un lieu que tu ne représentes pas ;",
            "et plus largement, tout ce qui est illégal.",
          ],
        },
        "Les lieux en BIG SOS traversent une vraie difficulté et ont eu le courage de le dire : on en parle avec respect, jamais pour s'en moquer.",
      ],
    },
    {
      id: "moderation",
      titre: "Signalements et modération",
      blocs: [
        `**Tout le monde peut signaler un contenu** : dans l'app, avec le menu « ⋯ » d'une publication puis « Signaler » ; sans l'app, en nous écrivant à ${lienContact}, avec le lien ou la description du contenu et ce qui ne va pas.`,
        "Ce qui se passe ensuite :",
        {
          liste: [
            "une publication signalée pour **violence ou contenu sexuel** est **masquée pour tout le monde dès le premier signalement** ;",
            "pour les autres raisons, elle est masquée **pour la personne qui signale**, en attendant qu'on la regarde ;",
            "un membre de l'équipe examine chaque signalement **à la main** : aucun algorithme ne décide à notre place ;",
            "si le signalement est retenu, la publication est retirée pour de bon ; sinon, elle est remise en ligne.",
          ],
        },
        `Si tu as signalé un contenu, on te dit ce qu'on a décidé. Si c'est ta publication qui est masquée ou retirée, ou ton compte qui est limité, **on te prévient et on te dit pourquoi**. Si tu n'es pas d'accord, réponds-nous ou écris à ${lienContact} : on réexamine la décision. Tu gardes aussi la possibilité de saisir la justice.`,
        "Pour un contenu grave, préviens aussi les autorités : le **17** ou le **112** en cas d'urgence, et [Pharos](https://www.internet-signalement.gouv.fr) pour signaler un contenu illégal. De notre côté, on retire rapidement un contenu illégal qui nous est signalé, et on le transmet aux autorités quand la loi le demande.",
      ],
    },
    {
      id: "propriete-intellectuelle",
      titre: "Propriété intellectuelle",
      blocs: [
        "Le logo, la mascotte (la bouée), les textes, les illustrations, la mise en page et le code du site et de l'app sont protégés par le droit d'auteur. Sauf mention contraire, ils appartiennent à l'éditeur ; certains éléments, comme les polices de caractères ou les vidéos d'illustration, sont utilisés selon la licence de leurs auteurs. Les publications appartiennent à leurs auteurs (voir « Ce que tu publies dans l'app »).",
        "Tu as le droit :",
        {
          liste: [
            "d'utiliser le site et l'app pour ton usage personnel, d'imprimer les pages du site ou d'en garder une copie ;",
            "de partager des liens vers le site et l'app, sur les réseaux sociaux ou ailleurs (c'est même encouragé) ;",
            "d'en citer de courts extraits, en indiquant qu'ils viennent de SOS Miam.",
          ],
        },
        "En dehors de ces cas et des exceptions prévues par la loi (article L122-5 du Code de la propriété intellectuelle), il est interdit, sans notre accord écrit, de reproduire, modifier, diffuser ou exploiter tout ou partie du site ou de l'app.",
        `Il est notamment interdit d'utiliser le logo ou la mascotte à des fins commerciales, ou d'utiliser le nom SOS Miam d'une façon qui laisserait croire à un lien avec nous qui n'existe pas. Pour toute demande, écris-nous à ${lienContact}.`,
      ],
    },
    {
      id: "bon-usage",
      titre: "Bon usage du site et de l'app",
      blocs: [
        "Tu t'engages à utiliser SOS Miam de façon loyale et conforme à la loi. Il est notamment interdit :",
        {
          liste: [
            "de tenter d'accéder sans autorisation au serveur, aux comptes des autres ou à des parties non publiques du site ou de l'app ;",
            "de perturber leur fonctionnement, par exemple en les surchargeant de requêtes ou en y introduisant un virus ;",
            "d'extraire leur contenu de façon automatisée et massive, en dehors de l'indexation du site par les moteurs de recherche ;",
            "de modifier ou de décompiler l'app, en dehors des cas permis par la loi ;",
            "d'utiliser notre adresse de contact pour envoyer des messages indésirables (spam), injurieux ou illicites.",
          ],
        },
        `Si tu découvres une faille de sécurité, merci de nous la signaler à ${lienContact} plutôt que de l'exploiter.`,
      ],
    },
    {
      id: "contributions",
      titre: "Ce que tu nous envoies par e-mail ou par le site",
      blocs: [
        `Pour t'inscrire à la newsletter, utilise le formulaire « Préviens-moi » en bas de l'accueil, ou écris-nous à ${lienContact}. Pour inscrire ton lieu, utilise le formulaire [J'inscris mon lieu](/inscrire-mon-lieu) (ou écris-nous). Pour proposer ta candidature comme ambassadeur fondateur ou simplement nous poser une question, écris-nous aussi à cette adresse.`,
        "Quand tu nous envoies des informations, tu garantis :",
        {
          liste: [
            "qu'elles sont exactes et à jour ;",
            "si tu inscris un lieu, que tu en es responsable ou que tu as l'accord de ses responsables ;",
            "que tu as le droit de nous transmettre ce que tu envoies (textes, photos…) et que ça ne porte atteinte ni aux droits ni à la vie privée de quelqu'un d'autre ;",
            "que ton message ne contient rien d'illicite, d'injurieux ou de discriminatoire.",
          ],
        },
        "On lit tout avec attention, mais on reste libre de donner suite ou non. En particulier :",
        {
          liste: [
            "une demande d'inscription de lieu ne nous oblige pas à publier ce lieu, ni maintenant ni au lancement ;",
            "une candidature d'ambassadeur fondateur peut ne pas être retenue, par exemple quand toutes les places sont prises ;",
            "une demande peut être refusée, notamment si elle ne correspond pas à l'esprit de SOS Miam (des lieux indépendants) ou si les informations sont inexactes.",
          ],
        },
        "Envoyer une demande ou une candidature est gratuit et ne crée d'engagement ni pour toi ni pour nous.",
        "Tu restes titulaire de tes droits sur ce que tu nous envoies. On s'en sert uniquement pour ce pour quoi tu nous l'as envoyé : te prévenir du lancement près de chez toi si tu t'es inscrit à la newsletter, étudier ta demande ou ta candidature, et te répondre. On ne publie pas tes messages.",
        "Pour te désinscrire de la newsletter, un simple e-mail suffit. Ce qu'on fait de tes données est détaillé dans la [politique de confidentialité](/confidentialite).",
      ],
    },
    {
      id: "liens",
      titre: "Liens vers d'autres sites",
      blocs: [
        `Le site et l'app peuvent contenir des liens vers d'autres sites. On ne contrôle pas leur contenu, qui relève de la responsabilité de leurs éditeurs, et ce sont leurs propres conditions qui s'appliquent. Si un lien mène vers un contenu illicite, signale-le-nous à ${lienContact} : on le retirera rapidement.`,
        "Tu peux librement créer un lien vers le site, sans demander d'autorisation, à condition de ne pas afficher le site à l'intérieur d'un autre site (dans un cadre) d'une façon qui masquerait son adresse, de ne pas laisser croire à un partenariat qui n'existe pas, et de ne pas placer ce lien sur un site illicite.",
      ],
    },
    {
      id: "responsabilite",
      titre: "Responsabilités",
      blocs: [
        "**De notre côté**, on est responsable, dans les conditions prévues par la loi, des dommages causés par un manquement à nos obligations ou par une faute de notre part.",
        "Pour les publications des utilisateurs et des lieux, on est **hébergeur** au sens de la loi : on ne les vérifie pas toutes avant leur mise en ligne, mais on agit vite dès qu'un contenu illicite nous est signalé.",
        "On ne peut en revanche pas être tenu responsable des dommages qui viennent :",
        {
          liste: [
            "d'un usage du site ou de l'app contraire à ces conditions ou à la loi ;",
            "d'une interruption qui ne résulte pas d'un manquement ou d'une faute de notre part (panne chez un prestataire, attaque informatique, force majeure…) ;",
            "de ce qui se passe dans un lieu (accueil, repas, prix, sécurité), qui relève de la responsabilité du lieu ;",
            "du contenu des sites extérieurs vers lesquels le site ou l'app renvoient ;",
            "de ton propre matériel ou de ta connexion à internet (virus présent sur ton appareil, réseau défaillant…).",
          ],
        },
        "Ces limites ne s'appliquent jamais en cas de manquement ou de faute de notre part, et ne te privent d'aucun des droits que la loi te reconnaît.",
        "**De ton côté**, tu es responsable de l'usage que tu fais de SOS Miam, de ce que tu publies et de ce que tu nous envoies.",
      ],
    },
    {
      id: "donnees-cookies",
      titre: "Données personnelles et cookies",
      blocs: [
        "On ne collecte que ce qui est utile pour faire tourner et protéger SOS Miam, te répondre, étudier tes demandes et, si tu l'as demandé, te prévenir du lancement. On ne vend jamais tes données, et on ne les loue pas non plus.",
        "Dans l'app, ta date de naissance et ton nom sont chiffrés, et ton régime particulier (végétarien, sans gluten, allergies…) reste sur ton téléphone tant que tu n'as pas donné ton accord pour l'envoyer.",
        "La [politique de confidentialité](/confidentialite) explique quelles données, pourquoi, combien de temps, et comment exercer tes droits. Elle sera complétée pour l'app avant sa sortie.",
        "Sur le site, aucun **cookie de suivi** aujourd'hui : pas de pub, et des statistiques de visite comptées par notre serveur, sans cookie (tu peux refuser d'être compté sur la page [statistiques](/statistiques)). Seules exceptions possibles, strictement nécessaires : des cookies de sécurité de notre prestataire Cloudflare, et le cookie qui retient ton refus des statistiques. Si ça change, rien de facultatif ne sera déposé sans ton accord. Le détail est sur la [page cookies](/cookies).",
      ],
    },
    {
      id: "modifications",
      titre: "Modification des conditions",
      blocs: [
        "Ces conditions peuvent évoluer, par exemple à l'arrivée de la messagerie ou de la publicité : elles seront mises à jour **avant** que ces nouveautés démarrent.",
        "La date de la dernière mise à jour est indiquée en haut de cette page. Toute modification importante est annoncée sur le site et dans l'app avant de s'appliquer. Si elle change ce qu'on fait de ce que tu nous as envoyé ou publié, on te prévient aussi par e-mail ou dans l'app.",
        "La version qui s'applique est celle en ligne au moment où tu utilises SOS Miam. Si une nouvelle version ne te convient pas, tu peux arrêter de l'utiliser à tout moment, supprimer ton compte et nous demander d'effacer ce que tu nous as envoyé.",
      ],
    },
    {
      id: "droit-applicable",
      titre: "Droit applicable et litiges",
      blocs: [
        "Ces conditions sont soumises au **droit français**. Si tu vis dans un autre pays, ce choix ne te prive pas de la protection des règles impératives de ton pays de résidence.",
        `En cas de désaccord, le plus simple est de nous écrire à ${lienContact} : on cherchera ensemble une solution à l'amiable. La plupart des soucis se règlent bien mieux autour d'un échange que devant un juge.`,
        "Cette démarche est **facultative** : elle ne t'empêche pas de faire appel à un conciliateur de justice (c'est gratuit) ni de porter le litige devant les tribunaux français compétents, selon les règles de droit commun. Aucun tribunal particulier ne t'est imposé.",
        "Si une clause de ces conditions était jugée invalide, les autres resteraient applicables.",
      ],
    },
    {
      id: "contact",
      titre: "Nous contacter",
      blocs: [
        `Une question sur ces conditions, un contenu à signaler, une idée ? Écris-nous à ${lienContact}. On lit tous les messages.`,
      ],
    },
  ],
};
