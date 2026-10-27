import type { ParLangue, Traduction } from "../../../../packages/commun/src/types/traduction.ts";
import { TEXTES_SUPPRESSION_COMPTE_ANGLAIS } from "~/contenus/anglais/suppression-compte";

export const TEXTES_SUPPRESSION_COMPTE = {
  attention: "Attention : c'est définitif.",
  avertissements: {
    // Le prénom recopié « Déniché par » sur la fiche d'un lieu accepté n'est pas lié au compte : il y reste (voir la politique
    // de confidentialité), sauf si la personne demande à l'équipe de le retirer
    ambassadeur: (email: string) =>
      `Ton compte est effacé tout de suite, avec tes points, tes badges, ta candidature, tes missions et tes messages. Les lieux que tu as proposés restent chez nous, mais plus rattachés à ton compte. Si l'un d'eux affiche « Déniché par » et ton prénom, ton prénom y reste : écris-nous à ${email} pour qu'on le retire. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.`,
    // Espace pro : les infos mises sur la fiche d'un lieu appartiennent à la fiche (publiées sans nom), elles y restent ; le lieu
    // n'est plus « Vérifié ✓ » s'il n'a plus aucun rattachement validé
    pro: () =>
      "Ton compte est effacé tout de suite, avec tes rattachements aux lieux (ta place dans leur équipe comprise), tes demandes en cours, tes points et tes badges. Ce que tu as mis sur la fiche d'un lieu y reste, sans ton nom. Si tu étais le seul à tenir un lieu, il perd son « Vérifié ✓ » jusqu'à ce que quelqu'un d'autre le reprenne. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.",
    // Compte sans rôle d'ambassadeur ni lieu (créé dans l'app, par exemple), dans le « Mon compte » de sosmiam.fr
    compte: () =>
      "Ton compte est effacé tout de suite, avec tout ce qui y est rattaché : ton profil, tes points, tes badges et tes connexions, dans l'app comme sur le site. Une copie peut encore dormir 30 jours au plus dans nos sauvegardes chiffrées, puis elle disparaît.",
  },
  bouton: "Supprimer mon compte",
  boutonDefinitif: "Supprimer définitivement mon compte",
  enCours: "Suppression…",
  confirme: (fournisseur: string) => `${fournisseur} a confirmé que c'est bien toi. Dernière étape : le bouton ci-dessous.`,
  reconnecteToi: "Ton compte n'a pas de mot de passe : pour confirmer, reconnecte-toi avec le compte lié.",
  sansCompteLie: (email: string) => `Ton compte n'a pas de mot de passe : choisis-en un avec « Mot de passe oublié ? », ou écris-nous à ${email} pour qu'on l'efface.`,
};

export const TEXTES_SUPPRESSION_COMPTE_PAR_LANGUE: ParLangue<Traduction<typeof TEXTES_SUPPRESSION_COMPTE>> = {
  fr: TEXTES_SUPPRESSION_COMPTE,
  en: TEXTES_SUPPRESSION_COMPTE_ANGLAIS,
};
