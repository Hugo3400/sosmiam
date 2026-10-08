// Page /age : à partir de quel âge on utilise SOS Miam, et ce qu'on fait pour les plus jeunes.
// C'est l'« URL d'adéquation à l'âge » de la fiche App Store. Règles d'âge : packages/commun/src/regles/ages.ts.
// Classification App Store : 16+ (Apple n'a pas de 15+). À mettre à jour AVANT l'arrivée de la messagerie et de la pub.
import { site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentAge: DocumentLegal = {
  titre: "SOS Miam et l'âge",
  description:
    "À partir de quel âge utiliser l'app SOS Miam, ce qui change entre 15 et 17 ans, et ce que les parents doivent savoir.",
  miseAJour: "8 octobre 2026",
  introduction: [
    "SOS Miam, c'est l'app pour sortir découvrir les restos, pâtisseries, bars et sorties indépendants qui ont besoin de monde. Cette page explique à partir de quel âge on peut l'utiliser, ce qu'on y trouve et comment on protège les plus jeunes. Elle sert aussi de repère aux parents.",
    "En bref : l'app est ouverte **à partir de 15 ans**, elle est classée **16+ sur l'App Store**, les **bars et l'alcool sont masqués avant 18 ans**, et il n'y a **rien à acheter**.",
  ],
  sections: [
    {
      id: "quinze-ans",
      titre: "À partir de 15 ans",
      blocs: [
        "Pour créer un compte, il faut avoir **au moins 15 ans**. En France, c'est l'âge à partir duquel on peut accepter seul que ses données soient utilisées (loi Informatique et Libertés). En dessous, il faudrait l'accord des parents : on a préféré ouvrir l'app à partir de 15 ans seulement.",
        "À l'inscription, l'app demande ta date de naissance. Si tu as moins de 15 ans, elle te le dit gentiment et ne crée pas de compte : reviens nous voir un peu plus tard !",
        "On ne demande pas de pièce d'identité : on te fait confiance. Mentir sur son âge est interdit par nos [conditions d'utilisation](/cgu), et si on apprend qu'un compte appartient à quelqu'un de moins de 15 ans, on le supprime avec ses données.",
      ],
    },
    {
      id: "app-store",
      titre: "Pourquoi 16+ sur l'App Store",
      blocs: [
        "Sur l'App Store, chaque app reçoit une classification par âge. Apple propose 4+, 9+, 13+, 16+ et 18+, mais pas 15+ : on a donc choisi **16+**, la première qui respecte notre minimum de 15 ans.",
        "Conséquence : sur un iPhone avec un compte enfant (Partage familial, Temps d'écran), un ado de 15 ans devra demander l'accord de ses parents pour télécharger l'app. Ça nous va très bien : c'est l'occasion d'en parler ensemble.",
        "La classification tient compte des **références à l'alcool** (on y trouve des bars, et parfois un verre de vin à la table d'un resto) et des **contenus publiés par les utilisateurs**, détaillés plus bas.",
      ],
    },
    {
      id: "quinze-dix-sept",
      titre: "Entre 15 et 17 ans : pas de bars, pas d'alcool",
      blocs: [
        "La vente d'alcool aux mineurs est interdite, et on ne veut pas leur en donner envie. Tant que tu n'as pas 18 ans, d'après ta date de naissance :",
        {
          liste: [
            "les **bars n'apparaissent pas** dans l'app ;",
            "les **envies liées à l'alcool** (bars, caves à vin, cocktails, vins, bières, apéro) ne te sont pas proposées à l'inscription.",
          ],
        },
        "Les restos, pâtisseries, bowlings, salles et sorties restent là, évidemment. Une vidéo de resto peut parfois montrer une bouteille sur une table : on ne peut pas tout filtrer, mais un contenu qui pousse des mineurs à boire est interdit et retiré dès qu'on le voit.",
        "Le jour de tes 18 ans, tout se débloque tout seul, sans rien faire (et joyeux anniversaire au passage !).",
      ],
    },
    {
      id: "contenus",
      titre: "Ce qu'on trouve dans l'app",
      blocs: [
        {
          liste: [
            "Des **lieux indépendants** près de chez toi, en commençant par Montpellier et l'Hérault, dont certains en vraie difficulté (les BIG SOS).",
            "Des **vidéos et des photos** publiées par les lieux et par des créateurs, et des **avis** de personnes qui y sont vraiment allées.",
            "Des **points, des paliers et des badges** (le programme Ambassadeurs) : ils récompensent tes visites, sans hasard ni argent en jeu.",
          ],
        },
        "**Tout est gratuit** : il n'y a rien à acheter dans l'app, ni abonnement, ni achat intégré, ni coffre à surprises.",
        "Il n'y a pas encore de messagerie ni de publicité. Elles arriveront plus tard : la pub sera toujours signalée comme telle, et cette page sera mise à jour **avant** leur arrivée pour expliquer comment les plus jeunes y sont protégés.",
      ],
    },
    {
      id: "securite",
      titre: "Les publications et la sécurité",
      blocs: [
        "Ce que les gens publient doit respecter les règles de la communauté, détaillées dans nos [conditions d'utilisation](/cgu) : pas de haine, pas de harcèlement, pas de violence, pas de contenu sexuel, pas de danger. Là-dessus, c'est **tolérance zéro**.",
        "Sous chaque publication, le menu « ⋯ » permet de la **signaler** en quelques secondes. Une publication signalée pour violence ou contenu sexuel est **masquée pour tout le monde dès le premier signalement**, en attendant qu'un membre de l'équipe la regarde. C'est toujours un humain qui décide, pas un algorithme.",
        "Pour un contenu grave, l'app rappelle aussi les bons réflexes : le **17** ou le **112** en cas d'urgence, et [Pharos](https://www.internet-signalement.gouv.fr) pour signaler un contenu illégal aux autorités.",
      ],
    },
    {
      id: "parents",
      titre: "Pour les parents",
      blocs: [
        "Quelques repères si ton ado utilise SOS Miam :",
        {
          liste: [
            "sur iPhone, **Temps d'écran** et le **Partage familial** permettent de choisir quelles apps peuvent être téléchargées, selon leur classification ;",
            "la date de naissance sert uniquement à vérifier l'âge et à adapter l'app ; elle est chiffrée, et on ne vend jamais les données de personne ;",
            "si ton enfant a moins de 15 ans et a quand même créé un compte, écris-nous : on le supprime avec ses données.",
          ],
        },
        "Ce qu'on fait des données est détaillé dans la [politique de confidentialité](/confidentialite).",
      ],
    },
    {
      id: "contact",
      titre: "Nous contacter",
      blocs: [
        `Une question, un doute, un contenu qui t'inquiète ? Écris-nous à ${lienContact}. On lit tous les messages.`,
      ],
    },
  ],
};
