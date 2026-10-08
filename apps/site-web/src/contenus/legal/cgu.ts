// Conditions d'utilisation du site sosmiam.fr.
// Site vitrine gratuit : pas de compte, rien à vendre, donc pas de CGV. À mettre à jour AVANT l'app, les comptes ou la pub.
// Pas de clause abusive (Code de la consommation, L212-1 et R212-1 ; Code civil, 1171) : pas d'exclusion totale de
// responsabilité, pas de modification sans information, pas de démarche amiable obligatoire, pas de tribunal imposé.
// Propriété intellectuelle : le nom « SOS Miam » n'est pas revendiqué tant qu'aucune marque n'est déposée à l'INPI.
import { editeur, site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentCgu: DocumentLegal = {
  titre: "Conditions d'utilisation",
  description:
    "Les règles du site SOS Miam : gratuit, sans compte et sans rien à acheter. Ce que tu peux y faire, ce qu'on s'engage à faire et comment nous joindre.",
  miseAJour: "8 octobre 2026",
  introduction: [
    "Bienvenue sur SOS Miam ! Ces conditions d'utilisation, ce sont les règles du jeu du site : ce que tu peux y faire, ce qu'on fait de notre côté, et comment on règle les choses si un souci arrive. On les a écrites le plus simplement possible.",
    "En bref : le site est **gratuit**, il n'y a **aucun compte à créer** et **rien à acheter**. Et on ne vend jamais tes données.",
  ],
  sections: [
    {
      id: "objet",
      titre: "À quoi servent ces conditions",
      blocs: [
        `Les présentes conditions d'utilisation (ci-après « les conditions ») encadrent l'accès et l'utilisation du site ${site.nom}, accessible à l'adresse ${site.adresse} et sur ses sous-domaines (ci-après « le site »).`,
        `Le site est édité par ${editeur.nom}, ${editeur.statut} (ci-après « l'éditeur »). Dans ces conditions, « SOS Miam », « on » et « nous » désignent l'éditeur ; « tu » désigne toute personne qui consulte le site ou nous écrit. Les informations sur l'éditeur et l'hébergeur sont dans les [mentions légales](/mentions-legales).`,
        "Le site te permet de découvrir le projet SOS Miam et de nous écrire. Rien n'y est vendu : il n'y a ni paiement, ni abonnement, ni conditions générales de vente.",
      ],
    },
    {
      id: "acceptation",
      titre: "Acceptation des conditions",
      blocs: [
        "En utilisant le site, tu acceptes ces conditions, dans leur version en ligne au moment de ta visite. Tu peux les relire à tout moment sur cette page, et les enregistrer ou les imprimer.",
        "Si tu n'es pas d'accord avec elles, tu es libre de ne pas utiliser le site.",
      ],
    },
    {
      id: "acces",
      titre: "Un accès gratuit, aussi souvent que possible",
      blocs: [
        "L'accès au site est **gratuit** et ouvert à tous, sans inscription. Seuls ton matériel et ta connexion à internet (box, forfait mobile) restent à ta charge.",
        "On fait de notre mieux pour que le site soit accessible 24 h/24 et 7 j/7, sans pouvoir le garantir. Il peut être interrompu ou ralenti, notamment :",
        {
          liste: [
            "pour une maintenance ou une mise à jour ;",
            "en cas de panne ou d'incident chez l'hébergeur ou chez le prestataire réseau ;",
            "en cas d'attaque informatique ou de force majeure.",
          ],
        },
        "On s'efforce de limiter ces interruptions et de les rendre aussi courtes que possible. On peut aussi faire évoluer le contenu et les fonctionnalités du site, par exemple pour préparer le lancement de l'app.",
      ],
    },
    {
      id: "contenu",
      titre: "Ce que tu trouves sur le site",
      blocs: [
        "Le site présente **SOS Miam**, une app **gratuite pour toi comme pour les lieux**, encore en développement, qui te fera découvrir les restos, pâtisseries, bars et sorties indépendants qui ont besoin de monde, en commençant par Montpellier et l'Hérault.",
        "Les fonctionnalités décrites sont celles prévues aujourd'hui. Comme l'app n'est pas encore sortie, elles peuvent changer d'ici le lancement, et aucune date de sortie n'est garantie.",
        "Les lieux montrés sur le site, par exemple dans les aperçus de l'app, sont des **exemples imaginés** pour illustrer le principe. Ils ne désignent pas de vrais établissements : toute ressemblance avec un lieu existant serait une coïncidence.",
        "Il n'y a **aucune publicité** sur le site aujourd'hui. Quand elle arrivera pour financer SOS Miam, elle sera **toujours signalée comme telle** et n'aura **aucun effet sur le classement des lieux** : un lieu ne pourra jamais acheter sa place. Ces conditions seront mises à jour avant son arrivée.",
        `On fait attention à ce que les informations du site soient justes et à jour. Si tu repères une erreur, écris-nous à ${lienContact} : on la corrige dès que possible.`,
      ],
    },
    {
      id: "propriete-intellectuelle",
      titre: "Propriété intellectuelle",
      blocs: [
        "Le logo, la mascotte (la bouée), les textes, les illustrations, la mise en page et le code du site sont protégés par le droit d'auteur. Sauf mention contraire, ils appartiennent à l'éditeur ; certains éléments, comme les polices de caractères, sont utilisés selon la licence de leurs auteurs.",
        "Tu as le droit :",
        {
          liste: [
            "de consulter le site, de l'imprimer ou d'en garder une copie pour ton usage personnel ;",
            "de partager des liens vers ses pages, sur les réseaux sociaux ou ailleurs (c'est même encouragé) ;",
            "d'en citer de courts extraits, en indiquant qu'ils viennent de SOS Miam.",
          ],
        },
        "En dehors de ces cas et des exceptions prévues par la loi (article L122-5 du Code de la propriété intellectuelle), il est interdit, sans notre accord écrit, de reproduire, modifier, diffuser ou exploiter tout ou partie du site.",
        `Il est notamment interdit d'utiliser le logo ou la mascotte à des fins commerciales, ou d'utiliser le nom SOS Miam d'une façon qui laisserait croire à un lien avec nous qui n'existe pas. Pour toute demande, écris-nous à ${lienContact}.`,
      ],
    },
    {
      id: "bon-usage",
      titre: "Bon usage du site",
      blocs: [
        "Tu t'engages à utiliser le site de façon loyale et conforme à la loi. Il est notamment interdit :",
        {
          liste: [
            "de tenter d'accéder sans autorisation au serveur ou à des parties non publiques du site ;",
            "de perturber son fonctionnement, par exemple en le surchargeant de requêtes ou en y introduisant un virus ;",
            "d'extraire son contenu de façon automatisée et massive, en dehors de l'indexation par les moteurs de recherche ;",
            "d'utiliser notre adresse de contact pour envoyer des messages indésirables (spam), injurieux ou illicites ;",
            "de te faire passer pour quelqu'un d'autre.",
          ],
        },
        `Si tu découvres une faille de sécurité, merci de nous la signaler à ${lienContact} plutôt que de l'exploiter.`,
      ],
    },
    {
      id: "contributions",
      titre: "Ce que tu nous envoies",
      blocs: [
        `Pour t'inscrire à la newsletter, utilise le formulaire « Préviens-moi » en bas de l'accueil, ou écris-nous à ${lienContact}. Pour inscrire ton lieu, proposer ta candidature comme ambassadeur fondateur ou simplement nous poser une question, écris-nous aussi à cette adresse.`,
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
        `Le site peut contenir des liens vers d'autres sites. On ne contrôle pas leur contenu, qui relève de la responsabilité de leurs éditeurs, et ce sont leurs propres conditions qui s'appliquent. Si un lien mène vers un contenu illicite, signale-le-nous à ${lienContact} : on le retirera rapidement.`,
        "Tu peux librement créer un lien vers le site, sans demander d'autorisation, à condition de ne pas afficher le site à l'intérieur d'un autre site (dans un cadre) d'une façon qui masquerait son adresse, de ne pas laisser croire à un partenariat qui n'existe pas, et de ne pas placer ce lien sur un site illicite.",
      ],
    },
    {
      id: "responsabilite",
      titre: "Responsabilités",
      blocs: [
        "**De notre côté**, on est responsable, dans les conditions prévues par la loi, des dommages causés par un manquement à nos obligations ou par une faute de notre part.",
        "On ne peut en revanche pas être tenu responsable des dommages qui viennent :",
        {
          liste: [
            "d'un usage du site contraire à ces conditions ou à la loi ;",
            "d'une interruption du site qui ne résulte pas d'un manquement ou d'une faute de notre part (panne chez un prestataire, attaque informatique, force majeure…) ;",
            "du contenu des sites extérieurs vers lesquels le site renvoie ;",
            "de ton propre matériel ou de ta connexion à internet (virus présent sur ton appareil, réseau défaillant…).",
          ],
        },
        "Ces limites ne s'appliquent jamais en cas de manquement ou de faute de notre part, et ne te privent d'aucun des droits que la loi te reconnaît.",
        "**De ton côté**, tu es responsable de l'usage que tu fais du site et de ce que tu nous envoies.",
      ],
    },
    {
      id: "donnees-cookies",
      titre: "Données personnelles et cookies",
      blocs: [
        "On ne collecte que ce qui est utile pour faire tourner et protéger le site, te répondre, étudier tes demandes et, si tu l'as demandé, te prévenir du lancement. On ne vend jamais tes données, et on ne les loue pas non plus.",
        "Tout est expliqué dans la [politique de confidentialité](/confidentialite) : quelles données, pourquoi, combien de temps, et comment exercer tes droits.",
        "Aujourd'hui, le site ne dépose **aucun cookie** et n'utilise aucun traceur : pas de pub, pas de mesure d'audience. Seule exception possible : des cookies de sécurité de notre prestataire Cloudflare, strictement nécessaires. Si ça change, rien de facultatif ne sera déposé sans ton accord. Le détail est sur la [page cookies](/cookies).",
      ],
    },
    {
      id: "modifications",
      titre: "Modification des conditions",
      blocs: [
        "Ces conditions peuvent évoluer, par exemple au lancement de l'app ou à l'arrivée de la publicité : elles seront mises à jour **avant** que ces nouveautés démarrent.",
        "La date de la dernière mise à jour est indiquée en haut de cette page. Toute modification importante est annoncée sur le site avant de s'appliquer. Si une modification change ce qu'on fait de ce que tu nous as envoyé, on te prévient aussi par e-mail avant qu'elle s'applique.",
        "La version qui s'applique est celle en ligne au moment de ta visite. Si une nouvelle version ne te convient pas, tu peux arrêter d'utiliser le site à tout moment et nous demander de supprimer les informations que tu nous as envoyées.",
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
        `Une question sur ces conditions, une erreur à signaler, une idée ? Écris-nous à ${lienContact}. On lit tous les messages.`,
      ],
    },
  ],
};
