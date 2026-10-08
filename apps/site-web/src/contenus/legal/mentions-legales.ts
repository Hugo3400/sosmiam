// Mentions légales (LCEN, éditeur non professionnel). Coordonnées : voir informations-legales.ts.
// Activité professionnelle dès que de la pub rémunérée est mise en place (contrat avec une régie, réseau publicitaire activé),
// pas quand l'argent arrive : compléter l'éditeur AVANT ce démarrage (structure, adresse, SIRET…).
import { editeur, hebergeur, prestataires, site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienEmail = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentMentionsLegales: DocumentLegal = {
  titre: "Mentions légales",
  description:
    "Qui édite SOS Miam, qui l'héberge, comment nous écrire ou signaler un contenu illicite : toutes les mentions légales du site sosmiam.fr.",
  miseAJour: "8 octobre 2026",
  introduction: [
    "Qui se cache derrière SOS Miam, qui héberge le site et comment nous joindre : c'est la page la plus sérieuse du site, mais on a fait en sorte qu'elle reste digeste.",
    `Ces mentions s'appliquent au site **${site.adresse}** et à ses sous-domaines.`,
  ],
  sections: [
    {
      id: "editeur",
      titre: "Éditeur du site",
      blocs: [
        `Le site ${site.adresse} est édité par :`,
        {
          liste: [
            `**Nom** : ${editeur.nom}`,
            `**Statut** : ${editeur.statut}`,
            `**Adresse e-mail** : ${lienEmail}`,
          ],
        },
        `${site.nom} n'est pas une entreprise : c'est un projet personnel, mené sans activité commerciale et sans revenus.`,
        "Comme la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN) le permet aux personnes qui éditent un site à titre non professionnel, l'adresse postale et le numéro de téléphone de l'éditeur ne sont pas publiés. Ses éléments d'identification personnelle ont été communiqués à l'hébergeur du site (voir plus bas), qui les détient.",
      ],
    },
    {
      id: "directeur-publication",
      titre: "Directeur de la publication",
      blocs: [
        `Le directeur de la publication est **${editeur.nom}**. Tu peux lui écrire à ${lienEmail}.`,
      ],
    },
    {
      id: "hebergeur",
      titre: "Hébergeur",
      blocs: [
        "Le site est hébergé en France par :",
        {
          liste: [
            `**Nom** : ${hebergeur.nom}`,
            `**Adresse** : ${hebergeur.adresse}`,
            `**Téléphone** : ${hebergeur.telephone}`,
          ],
        },
      ],
    },
    {
      id: "prestataires",
      titre: "Autres prestataires techniques",
      blocs: [
        "Pour fonctionner, le site fait aussi appel à :",
        {
          liste: [
            `**${prestataires.reseau.nom}** (${prestataires.reseau.adresse}) : ${prestataires.reseau.role}.`,
            `**${prestataires.messagerie.nom}** : ${prestataires.messagerie.role}.`,
          ],
        },
        "Ce que ces prestataires voient passer, et comment tes données sont protégées, est détaillé dans la [politique de confidentialité](/confidentialite).",
      ],
    },
    {
      id: "objet",
      titre: "À quoi sert le site",
      blocs: [
        `${site.nom} veut te faire découvrir les lieux indépendants (restos, pâtisseries, bars, bowlings, salles d'événements, sorties) qui ont besoin de monde, y compris ceux qui traversent une vraie période difficile. Le lancement est prévu à Montpellier et dans l'Hérault, puis ville par ville.`,
        "Le projet est en cours de développement : pour l'instant, le site présente SOS Miam et te permet de demander à être prévenu du lancement, de demander l'inscription de ton lieu ou de proposer ta candidature comme ambassadeur fondateur.",
        "**Tout est gratuit**, pour toi comme pour les lieux : pas d'abonnement, pas d'offre payante, aucune commission. Rien n'est vendu sur le site, c'est pourquoi il n'y a pas de conditions générales de vente. Les règles d'utilisation du site se trouvent dans les [conditions d'utilisation](/cgu).",
        "À terme, SOS Miam prévoit de se financer grâce à de la publicité, toujours signalée comme telle et sans aucun effet sur le classement des lieux. Il n'y a aucune publicité aujourd'hui.",
      ],
    },
    {
      id: "propriete-intellectuelle",
      titre: "Propriété intellectuelle",
      blocs: [
        "Les textes, le logo, la mascotte (la bouée qui sourit), les illustrations et les éléments graphiques du site sont la propriété de l'éditeur et sont protégés par le Code de la propriété intellectuelle. Les polices de caractères restent la propriété de leurs auteurs (voir « Crédits » ci-dessous).",
        "Sauf accord écrit de l'éditeur, il est interdit de reproduire, de modifier ou de réutiliser ces éléments, en tout ou en partie, en dehors des cas prévus par la loi, comme une courte citation qui mentionne sa source.",
        `Tu peux bien sûr partager un lien vers le site sans rien demander. Pour toute autre utilisation (article, présentation, partenariat…), écris-nous à ${lienEmail}.`,
        "Les lieux présentés en exemple sur le site (noms, descriptions, chiffres et alertes) sont **fictifs** : ils servent seulement à montrer le principe avant le lancement. Toute ressemblance avec un établissement existant serait une pure coïncidence. Les villes et les quartiers cités, eux, existent bien.",
      ],
    },
    {
      id: "credits",
      titre: "Crédits",
      blocs: [
        `Conception, textes, logo, mascotte et illustrations : ${editeur.nom}, éditeur du site.`,
        "Polices de caractères :",
        {
          liste: [
            "**Inter**, © 2016 The Inter Project Authors ([github.com/rsms/inter](https://github.com/rsms/inter)), pour les textes ;",
            "**Bricolage Grotesque**, © 2022 The Bricolage Grotesque Project Authors ([github.com/ateliertriay/bricolage](https://github.com/ateliertriay/bricolage)), pour les titres.",
          ],
        },
        "Ces polices sont distribuées sous licence [SIL Open Font License 1.1](https://openfontlicense.org). Elles sont hébergées avec le site, sur notre serveur chez notre hébergeur : aucun service de polices extérieur (comme Google Fonts) n'est appelé quand tu consultes le site.",
      ],
    },
    {
      id: "signaler-contenu",
      titre: "Signaler un contenu illicite",
      blocs: [
        `Si tu repères sur le site un contenu qui te semble illicite (propos haineux ou diffamatoires, atteinte à la vie privée, contrefaçon…), signale-le à ${lienEmail} en indiquant :`,
        {
          liste: [
            "l'adresse exacte (URL) de la page concernée ;",
            "la description du contenu et, si possible, une capture d'écran ;",
            "les raisons pour lesquelles il te semble illicite ;",
            "ton nom, ton prénom et ton adresse e-mail, pour qu'on puisse te répondre.",
          ],
        },
        "On examine chaque signalement, et tout contenu illicite est corrigé ou retiré. Attention : signaler un contenu comme illicite en sachant que c'est faux, pour obtenir son retrait, peut être sanctionné par la loi.",
        "Pour les contenus les plus graves (apologie du terrorisme, pédocriminalité, incitation à la haine ou à la violence…), tu peux aussi alerter directement les autorités sur la plateforme officielle [Pharos](https://www.internet-signalement.gouv.fr).",
        "Aujourd'hui, le site ne publie aucun contenu proposé par ses visiteurs. Quand SOS Miam permettra d'en publier (avis, photos…), les règles de publication et de modération seront précisées dans les [conditions d'utilisation](/cgu).",
      ],
    },
    {
      id: "donnees-cookies",
      titre: "Données personnelles et cookies",
      blocs: [
        "SOS Miam ne vend ni ne loue jamais tes données. Ce qui est traité aujourd'hui, pourquoi, combien de temps et comment exercer tes droits : tout est expliqué dans la [politique de confidentialité](/confidentialite).",
        `Le site ne dépose aucun cookie de suivi et n'affiche aucune publicité. Ses statistiques de visite sont comptées par notre serveur, sans cookie, et tu peux refuser d'être compté sur la page [statistiques](/statistiques). Seules exceptions possibles : des cookies de sécurité que notre prestataire ${prestataires.reseau.nom} peut déposer pour protéger le site, et le cookie qui retient ton refus des statistiques. Le détail est sur la page [cookies](/cookies).`,
      ],
    },
    {
      id: "evolution",
      titre: "Évolution de ces mentions",
      blocs: [
        "SOS Miam est aujourd'hui un projet personnel, sans activité commerciale. S'il devient une activité professionnelle (par exemple dès que de la publicité rémunérée sera mise en place), ces mentions seront complétées avant ce changement avec toutes les informations exigées des éditeurs professionnels : structure juridique, adresse, numéro d'immatriculation…",
        "Elles seront aussi mises à jour à chaque évolution importante, notamment à la sortie de l'application mobile. La date de dernière mise à jour est indiquée en haut de cette page.",
        "Ces mentions légales sont soumises au droit français.",
      ],
    },
  ],
};
