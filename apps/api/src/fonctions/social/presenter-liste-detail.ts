import type { ListeApi, ListeResumeApi } from "../../../../../packages/commun/src/types/listes.ts";
import type { PersonneResume } from "../../../../../packages/commun/src/types/social.ts";
import { estVisiblePourMoi } from "./est-visible-pour-moi.ts";

/** Le détail d'une liste, autour de son résumé (presenterListeResume) */
export type DetailListe = {
  moi: number;
  auteurId: number;
  /** Les lieux encore publiés, du plus récent au plus ancien (par leur identifiant, jamais leur nom) */
  lieux: number[];
  /** Toutes les lignes des co-auteurs (« invite », « accepte », « refuse »), par ordre d'invitation */
  coAuteurs: { compteId: number; statut: string }[];
  abonne: boolean;
  personnes: ReadonlyMap<number, PersonneResume>;
  /** Les comptes avec qui `moi` a un blocage, dans un sens ou dans l'autre */
  caches: ReadonlySet<number>;
};

/**
 * Une liste en entier (ListeApi), à partir de son résumé : ses lieux, ses co-auteurs (les acceptés pour tous ; une
 * invitation en attente seulement pour l'auteur et l'invité ; un refus jamais ; personne avec qui il y a un blocage) et ce
 * que tu peux en faire (peutRemplir : l'auteur, ou un co-auteur qui a accepté).
 */
export function presenterListeDetail(resume: ListeResumeApi, d: DetailListe): ListeApi {
  const auteur = d.moi === d.auteurId;
  const mienne = d.coAuteurs.find((c) => c.compteId === d.moi && (c.statut === "invite" || c.statut === "accepte"));
  const coAuteur = mienne ? (mienne.statut as "invite" | "accepte") : null;
  const coAuteurs: ListeApi["coAuteurs"] = [];
  for (const c of d.coAuteurs) {
    const personne = d.personnes.get(c.compteId);
    if (!personne || !estVisiblePourMoi(c.compteId, d.caches)) continue;
    if (c.statut === "accepte") coAuteurs.push({ personne, statut: "accepte" });
    else if (c.statut === "invite" && (auteur || c.compteId === d.moi)) coAuteurs.push({ personne, statut: "invite" });
  }
  return {
    ...resume,
    lieux: [...d.lieux],
    coAuteurs,
    moi: { auteur, coAuteur, abonne: d.abonne, peutRemplir: auteur || coAuteur === "accepte" },
  };
}
