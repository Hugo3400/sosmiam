// Page /age : à partir de quel âge on utilise SOS Miam, et ce que les parents doivent savoir.
// C'est l'« URL d'adéquation à l'âge » de la fiche App Store. Règles d'âge : packages/commun/src/regles/ages.ts.
// Décidé par Hugo le 14 octobre 2026 : SOS Miam n'est ouvert qu'à partir de la majorité, 18 ans en France (seul pays
// ouvert ; ailleurs, ce sera l'âge de la majorité du pays). Plus aucune règle « 15-17 ans ».
// La classification affichée par les stores reste à choisir par Hugo : cette page n'en cite aucune tant qu'elle n'est pas
// décidée. À mettre à jour AVANT l'arrivée de la messagerie et de la pub.
import { adresseEspaceAmbassadeur } from "~/contenus/ambassadeurs";
import { site } from "~/contenus/legal/informations-legales";
import type { DocumentLegal } from "~/contenus/legal/type-legal";

const lienContact = `[${site.emailContact}](mailto:${site.emailContact})`;

export const documentAge: DocumentLegal = {
  titre: "SOS Miam et l'âge",
  description:
    "SOS Miam est réservé aux 18 ans et plus : pourquoi, ce qu'on vérifie à l'inscription, et ce que les parents doivent savoir.",
  miseAJour: "14 octobre 2026",
  introduction: [
    "SOS Miam, c'est l'app pour sortir découvrir les restos, pâtisseries, bars et sorties indépendants qui ont besoin de monde. Cette page explique à partir de quel âge on peut l'utiliser, ce qu'on y trouve et ce qu'on fait si quelqu'un de plus jeune passe par là. Elle sert aussi de repère aux parents.",
  ],
  enBref: [
    "Pour créer un compte, il faut avoir **18 ans ou plus**, dans l'app comme sur le site. Sans compte, l'app se visite en mode **tout public**, sans bars ni alcool. Et il n'y a **rien à acheter**.",
  ],
  sections: [
    {
      id: "dix-huit-ans",
      titre: "À partir de 18 ans",
      blocs: [
        "Pour créer un compte SOS Miam, il faut être **majeur** : **18 ans** en France. Pour l'instant, SOS Miam n'est ouvert qu'en France ; s'il s'ouvre un jour ailleurs, ce sera l'âge de la majorité du pays.",
        "C'est la même règle partout : dans l'app, dans l'espace ambassadeur et dans l'espace pro. On y trouve des bars, on y sort, on y croise d'autres Miamis : on a préféré garder SOS Miam pour les grands.",
        "À l'inscription, l'app demande ta date de naissance. Si tu n'as pas encore 18 ans, elle te le dit gentiment et ne crée pas de compte. Elle retient seulement, sur ton téléphone, le jour de tes 18 ans, pour garder l'inscription fermée jusque-là : ta date de naissance, elle, n'est pas gardée. On t'attend avec une part de gâteau !",
        `Sur le site, l'espace ambassadeur ([${adresseEspaceAmbassadeur.replace("https://", "")}](${adresseEspaceAmbassadeur})) et l'espace pro demandent aussi ta date de naissance : elle sert seulement à vérifier que tu as 18 ans, et n'est pas gardée.`,
        "On ne demande pas de pièce d'identité : on te fait confiance. Mentir sur son âge est interdit par nos [conditions d'utilisation](/cgu), et si on apprend qu'un compte a été créé en mentant sur l'âge, on le supprime avec ses données.",
      ],
    },
    {
      id: "sans-compte",
      titre: "Sans compte : tout public",
      blocs: [
        "Tu peux jeter un œil à l'app sans créer de compte. Comme on ne connaît pas ton âge, elle reste alors **tout public** :",
        {
          liste: [
            "les **bars n'apparaissent pas** ;",
            "rien de ce qui touche à l'**alcool** n'est montré.",
          ],
        },
        "Les restos, pâtisseries, bowlings, salles et sorties restent là, évidemment. Pour aimer, garder, suivre ou valider une visite, il faut un compte, donc 18 ans.",
      ],
    },
    {
      id: "contenus",
      titre: "Ce qu'on trouve dans l'app",
      blocs: [
        {
          liste: [
            "Des **lieux indépendants** près de chez toi, partout en France, dont certains en vraie difficulté (les BIG SOS).",
            "Des **vidéos et des photos** publiées par les lieux et par des créateurs, et des **avis** de personnes qui y sont vraiment allées.",
            "Des **points, des paliers et des badges** (Curieux, Dénicheur…) : ils récompensent tes visites, sans hasard ni argent en jeu.",
            "Des **bars** : tout ce qui touche à l'alcool y est accompagné du message sanitaire, et rien n'y pousse à boire.",
          ],
        },
        "**Tout est gratuit** : il n'y a rien à acheter dans l'app, ni abonnement, ni achat intégré, ni coffre à surprises.",
        "Il n'y a pas encore de messagerie ni de publicité. Elles arriveront plus tard : la pub sera toujours signalée comme telle, et cette page sera mise à jour **avant** leur arrivée.",
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
        "SOS Miam n'est pas fait pour les moins de 18 ans. Quelques repères :",
        {
          liste: [
            "sur iPhone, **Temps d'écran** et le **Partage familial** permettent de choisir quelles apps peuvent être téléchargées ; sur Android, **Family Link** fait de même ;",
            "sans compte, l'app reste tout public : ni bars, ni alcool ;",
            "la date de naissance sert uniquement à vérifier l'âge ; on ne vend jamais les données de personne ;",
            "si ton enfant a moins de 18 ans et a quand même créé un compte, écris-nous : on le supprime avec ses données.",
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
  chapitres: [
    { id: "qui-peut-utiliser", titre: "Qui peut utiliser SOS Miam", sections: ["dix-huit-ans", "sans-compte"] },
    { id: "dans-l-app", titre: "Ce qu'on trouve dans l'app", sections: ["contenus", "securite"] },
    { id: "reperes-parents", titre: "Pour les parents", sections: ["parents"] },
    { id: "nous-ecrire", titre: "Nous contacter", sections: ["contact"] },
  ],
};
