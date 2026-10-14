import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { LIBELLES_MOTIFS_MODERATION } from "~/contenus/motifs-moderation";
import type { Publication } from "~/contenus/type-publication";
import type { NotificationDecrite } from "~/fonctions/notifications/decrire-notification-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { NotificationCloche } from "~/hooks/utiliser-notifications";

type Sources = {
  trouverPote: (id: string) => Pote | null;
  publications: readonly Publication[];
  lieux: readonly Lieu[];
};

/**
 * La phrase d'une notification de la cloche du serveur (bande, sorties, groupes, listes, commentaires, modération), prête à
 * afficher. Une personne qui a quitté SOS Miam devient « Quelqu'un ». Les trois types de la modération n'ouvrent rien pour
 * l'instant (« Décisions de la modération » arrive avec l'export des données, lot L7).
 */
export function decrireNotificationCloche(n: NotificationCloche, { trouverPote, publications, lieux }: Sources): NotificationDecrite | null {
  const qui = n.acteur ? (trouverPote(n.acteur.id)?.prenom ?? n.acteur.prenom) : "Quelqu'un";
  const titre = n.detail ? ` « ${n.detail} »` : "";
  const id = n.cible?.id ?? "";
  const profil = n.acteur ? ({ pathname: "/potes/profil/[id]", params: { id: n.acteur.id } } as const) : null;
  const sortie = n.cible?.type === "sortie" ? ({ pathname: "/potes/sortie/[id]", params: { id } } as const) : null;
  const decrire = (emoji: string, texte: string, ouvrir: NotificationDecrite["ouvrir"], indice?: string): NotificationDecrite => ({
    emoji,
    texte: lierPonctuation(texte),
    ouvrir,
    ...(ouvrir && indice ? { indice } : {}),
  });

  switch (n.sorte) {
    case "bande-ajout":
      return decrire("🤝", `${qui} a rejoint ta bande 🤝`, profil, "Ouvre son profil");
    case "bande-acceptee":
      return decrire("🤝", `${qui} a accepté ta demande : vous voilà dans la même bande 🎉`, profil, "Ouvre son profil");
    case "lien-renouvele":
      return decrire("🔗", "Ton lien a beaucoup tourné : on l'a changé par sécurité. Tes potes déjà dans ta bande y restent.", "/potes/ajouter", "Ouvre ton nouveau lien");
    case "invitation-sortie":
      return decrire("🎉", `${qui} t'invite à une sortie${n.detail ? ` : ${n.detail}` : ""}`, sortie, "Ouvre la sortie");
    case "sortie-lieu-choisi":
      return decrire("🗳️", n.detail ? `C'est voté ! Rendez-vous chez ${n.detail}` : "C'est voté ! Le lieu de la sortie est choisi", sortie, "Ouvre la sortie");
    case "sortie-annulee":
      // La sortie n'est plus là : rien à ouvrir
      return decrire("🙅", n.acteur ? `${qui} a annulé${titre || " une sortie"}` : `La sortie${titre} est annulée`, null);
    case "invitation-groupe":
      return decrire("💬", `${qui} t'invite dans un groupe : à toi de dire oui !`, "/potes/messages", "Ouvre tes messages");
    case "liste-coauteur":
      return decrire("📝", `${qui} t'invite à remplir sa liste${titre}`, n.cible?.type === "liste" ? { pathname: "/potes/liste/[id]", params: { id } } : null, "Ouvre la liste");
    case "mention":
    case "reponse-commentaire": {
      // Le commentaire est sous une publication du fil : on ouvre la fiche de son lieu, s'il est encore là
      const publication = n.cible?.type === "publication" ? publications.find((p) => p.id === id) : undefined;
      const lieu = publication ? lieux.find((l) => l.id === publication.lieuId) : undefined;
      const fiche = lieu ? ({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } } as const) : null;
      if (n.sorte === "mention") return decrire("💬", `${qui} t'a cité dans un commentaire`, fiche, "Ouvre la fiche du lieu");
      if (n.acteur) return decrire("💬", `${qui} a répondu à ton commentaire`, fiche, "Ouvre la fiche du lieu");
      return decrire(lieu?.emoji ?? "💬", `${lieu?.nom ?? "Le lieu"} a répondu à ton commentaire`, fiche, "Ouvre la fiche du lieu");
    }
    case "contenu-masque":
      return decrire(
        "🙈",
        n.detail === "masque-par-le-lieu" ? "Le lieu a masqué ton commentaire le temps qu'on vérifie." : "Un de tes contenus est masqué le temps qu'on vérifie : quelqu'un l'a trouvé choquant.",
        null,
      );
    case "contenu-retire": {
      const motif = n.detail ? LIBELLES_MOTIFS_MODERATION[n.detail] : undefined;
      return decrire("🧹", motif ? `Un de tes contenus a été retiré par la modération (motif : ${motif}).` : "Un de tes contenus a été retiré : il ne respectait pas les règles de SOS Miam.", null);
    }
    case "signalement-decide":
      if (n.detail === "retenu") return decrire("🛡️", "On a examiné ton signalement : le contenu est retiré. Merci de veiller au grain !", null);
      if (n.detail === "rejete") return decrire("🛡️", "On a examiné ton signalement : le contenu respecte nos règles, il reste en ligne. Merci quand même !", null);
      return decrire("🛡️", "On a examiné ton signalement : merci !", null);
    default:
      return null;
  }
}
