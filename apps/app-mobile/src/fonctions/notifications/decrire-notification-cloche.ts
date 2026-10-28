import { DETAILS_MOTIFS_MODERATION_PAR_LANGUE } from "@sos-miam/commun/contenus/motifs-moderation";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { TEXTES_CLOCHE_PAR_LANGUE } from "~/contenus/textes-cloche";
import type { Publication } from "~/contenus/type-publication";
import { decrireNotificationClocheActus } from "~/fonctions/notifications/decrire-notification-cloche-actus";
import { decrireNotificationClocheCommunaute } from "~/fonctions/notifications/decrire-notification-cloche-communaute";
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
 * afficher. Une personne qui a quitté SOS Miam devient « Quelqu'un ». Les quatre types de la modération (contenu masqué,
 * retiré, signalement examiné, compte limité) ouvrent Réglages › Décisions de la modération.
 */
export function decrireNotificationCloche(n: NotificationCloche, { trouverPote, publications, lieux }: Sources, langue: Langue): NotificationDecrite | null {
  const T = choisirTextes(TEXTES_CLOCHE_PAR_LANGUE, langue);
  const motifs = choisirTextes(DETAILS_MOTIFS_MODERATION_PAR_LANGUE, langue) as Readonly<Record<string, { enClair: string } | undefined>>;
  const qui = n.acteur ? (trouverPote(n.acteur.id)?.prenom ?? n.acteur.prenom) : T.quelquUn;
  const titre = n.detail ? ` ${citer(n.detail, langue)}` : "";
  const id = n.cible?.id ?? "";
  const profil = n.acteur ? ({ pathname: "/potes/profil/[id]", params: { id: n.acteur.id } } as const) : null;
  const sortie = n.cible?.type === "sortie" ? ({ pathname: "/potes/sortie/[id]", params: { id } } as const) : null;
  const moderation = ["/reglages/decisions-moderation", T.indiceModeration] as const;
  const decrire = (emoji: string, texte: string, ouvrir: NotificationDecrite["ouvrir"], indice?: string): NotificationDecrite => ({
    emoji,
    texte: lierPonctuation(texte),
    ouvrir,
    ...(ouvrir && indice ? { indice } : {}),
  });

  switch (n.sorte) {
    case "bande-ajout":
      return decrire("🤝", T.bandeAjout(qui), profil, T.indiceProfil);
    case "bande-acceptee":
      return decrire("🤝", T.bandeAcceptee(qui), profil, T.indiceProfil);
    case "lien-renouvele":
      return decrire("🔗", T.lienRenouvele, "/potes/ajouter", T.indiceNouveauLien);
    case "invitation-sortie":
      return decrire("🎉", T.invitationSortie(qui, n.detail), sortie, T.indiceSortie);
    case "sortie-lieu-choisi":
      return decrire("🗳️", T.lieuChoisi(n.detail), sortie, T.indiceSortie);
    case "sortie-annulee":
      // La sortie n'est plus là : rien à ouvrir
      return decrire("🙅", n.acteur ? T.sortieAnnuleePar(qui, titre) : T.sortieAnnulee(titre), null);
    case "invitation-groupe":
      return decrire("💬", T.invitationGroupe(qui), "/potes/messages", T.indiceMessages);
    case "liste-coauteur":
      return decrire("📝", T.listeCoauteur(qui, titre), n.cible?.type === "liste" ? { pathname: "/potes/liste/[id]", params: { id } } : null, T.indiceListe);
    case "mention":
    case "reponse-commentaire": {
      // Le commentaire est sous une publication du fil : on ouvre la fiche de son lieu, s'il est encore là
      const publication = n.cible?.type === "publication" ? publications.find((p) => p.id === id) : undefined;
      const lieu = publication ? lieux.find((l) => l.id === publication.lieuId) : undefined;
      const fiche = lieu ? ({ pathname: "/lieu/[id]", params: { id: String(lieu.id) } } as const) : null;
      if (n.sorte === "mention") return decrire("💬", T.mention(qui), fiche, T.indiceFiche);
      if (n.acteur) return decrire("💬", T.reponse(qui), fiche, T.indiceFiche);
      return decrire(lieu?.emoji ?? "💬", T.reponseLieu(lieu?.nom ?? null), fiche, T.indiceFiche);
    }
    case "contenu-masque":
      return decrire(
        "🙈",
        n.detail === "masque-par-le-lieu" ? T.masqueParLieu : T.masque,
        ...moderation,
      );
    case "contenu-retire": {
      // Un code que cette version de l'app ne connaît pas encore : la phrase générale
      const motif = n.detail ? (motifs[n.detail]?.enClair ?? null) : null;
      return decrire("🧹", T.retire(motif), ...moderation);
    }
    case "compte-limite": {
      // detail : le code du motif ; un code que cette version de l'app ne connaît pas encore : la phrase générale
      const motif = n.detail ? (motifs[n.detail]?.enClair ?? null) : null;
      return decrire("⏸️", T.compteLimite(motif), "/reglages/decisions-moderation", T.indiceCompteLimite);
    }
    case "signalement-decide":
      if (n.detail === "retenu") return decrire("🛡️", T.signalementRetenu, ...moderation);
      if (n.detail === "rejete") return decrire("🛡️", T.signalementRejete, ...moderation);
      return decrire("🛡️", T.signalementExamine, ...moderation);
    case "actu-publiee":
    case "actu-a-retoucher":
    case "actu-refusee":
    case "actu-lieu-cite":
    case "actu-reponse-publiee":
    case "actu-reponse-refusee":
      return decrireNotificationClocheActus(n, langue);
    default:
      return decrireNotificationClocheCommunaute(n, qui, langue);
  }
}
