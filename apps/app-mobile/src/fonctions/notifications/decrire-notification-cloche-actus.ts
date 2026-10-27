import { DETAILS_MOTIFS_MODERATION_PAR_LANGUE } from "@sos-miam/commun/contenus/motifs-moderation";
import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { TEXTES_CLOCHE_ACTUS_PAR_LANGUE } from "~/contenus/textes-cloche-actus";
import type { NotificationDecrite } from "~/fonctions/notifications/decrire-notification-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { NotificationCloche } from "~/hooks/utiliser-notifications";
import { lireLangueActuelle } from "~/services/langue-actuelle";


export function decrireNotificationClocheActus(n: NotificationCloche): NotificationDecrite | null {
  const langue = lireLangueActuelle();
  const T = choisirTextes(TEXTES_CLOCHE_ACTUS_PAR_LANGUE, langue);
  const motifs = choisirTextes(DETAILS_MOTIFS_MODERATION_PAR_LANGUE, langue) as Readonly<Record<string, { enClair: string } | undefined>>;
  const lireMotif = (detail: string | null) => (detail ? (motifs[detail]?.enClair ?? null) : null);
  const titre = n.detail && n.sorte !== "actu-refusee" && n.sorte !== "actu-reponse-refusee" ? ` « ${n.detail} »` : "";
  const article = n.cible?.type === "article-actu" ? ({ pathname: "/actus/[id]", params: { id: n.cible.id } } as const) : null;
  const decrire = (emoji: string, texte: string, ouvrir: NotificationDecrite["ouvrir"], indice: string): NotificationDecrite => ({
    emoji,
    texte: lierPonctuation(texte),
    ouvrir,
    ...(ouvrir ? { indice } : {}),
  });

  switch (n.sorte) {
    case "actu-publiee":
      return decrire("📰", T.publiee(titre), article, T.indiceArticle);
    case "actu-a-retoucher":
      return decrire("✏️", T.aRetoucher(titre), "/actus/mes-articles", T.indiceMesArticles);
    case "actu-refusee":
      return decrire("📰", T.refusee(lireMotif(n.detail)), "/reglages/decisions-moderation", T.indiceModeration);
    case "actu-lieu-cite":
      return decrire("📰", T.lieuCite(titre), "/pro/actus", T.indicePro);
    case "actu-reponse-publiee":
      return decrire("💬", T.reponsePubliee, article, T.indiceArticle);
    case "actu-reponse-refusee":
      return decrire("💬", T.reponseRefusee(lireMotif(n.detail)), "/reglages/decisions-moderation", T.indiceModeration);
    default:
      return null;
  }
}
