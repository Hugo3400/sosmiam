import { lireTablesCommunauteEnMemoire } from "./communaute-en-memoire.ts";
import type { CibleCommunaute, VoirSortieMiamis } from "./instantanes-communaute.ts";
import type { RelationsSociales } from "./relations-sociales-regles.ts";
import type { ContenuLu } from "./signalements-sociaux-regles.ts";
import type { TablesSociales } from "./tables-sociales-en-memoire.ts";

const vide = { lieuId: null, fichierMedia: null };

export async function lireContenuCommunauteEnMemoire(
  social: TablesSociales, d: { relations: Pick<RelationsSociales, "bloqueEntre">; voitLaSortieMiamis?: VoirSortieMiamis }, compteId: number, cible: CibleCommunaute, id: number, maintenant: Date,
): Promise<ContenuLu | null> {
  const t = lireTablesCommunauteEnMemoire(social);
  const auteur = (compteId: number | null) => {
    const compte = compteId === null ? undefined : social.comptes.get(compteId);
    return compte ? { pseudo: compte.pseudo, prenom: compte.prenom } : null;
  };
  const bloque = async (autre: number | null) => autre !== null && autre !== compteId && (await d.relations.bloqueEntre(compteId, autre));
  const publiee = (ideeId: number) => {
    const i = t.idees.get(ideeId);
    return i && i.statut !== "en-relecture" && i.suspendueLe === null && i.retireeLe === null ? i : null;
  };
  if (cible === "idee") {
    const i = publiee(id);
    if (!i || (await bloque(i.auteurId))) return null;
    return { contenu: { cible, titre: i.titre, detail: i.detail, statut: i.statut, auteur: auteur(i.auteurId), date: i.creeLe }, auteurContenuId: i.auteurId, ...vide };
  }
  if (cible === "comment-idee") {
    const c = t.commentaires.get(id);
    const i = c ? publiee(c.ideeId) : null;
    if (!c || !i || c.masqueLe || c.suspenduLe || c.retireLe || (await bloque(c.auteurId)) || (await bloque(i.auteurId))) return null;
    return { contenu: { cible, texte: c.texte, ideeId: c.ideeId, reponseA: c.reponseAId, auteur: auteur(c.auteurId), date: c.creeLe }, auteurContenuId: c.auteurId, ...vide };
  }
  const s = t.sorties.get(id);
  if (!s || s.annuleeLe || s.retireeLe || (await bloque(s.organisateurId))) return null;
  const participe = t.participations.some((p) => p.sortieId === id && p.compteId === compteId);
  if (!(s.organisateurId === compteId || participe || (d.voitLaSortieMiamis && (await d.voitLaSortieMiamis(compteId, id, maintenant))))) return null;
  return {
    contenu: {
      cible, titre: s.titre, description: s.description, quand: s.quand, lieuId: s.lieuId,
      etiquettesLibres: s.etiquettes.filter((e) => !e.officielle && e.retireeLe === null).map((e) => e.nom).sort(), organisateur: auteur(s.organisateurId),
    },
    auteurContenuId: s.organisateurId, lieuId: s.lieuId, fichierMedia: null,
  };
}

export function masquerCommunauteEnMemoire(social: TablesSociales, cible: string, id: number, maintenant: Date): void {
  const t = lireTablesCommunauteEnMemoire(social);
  if (cible === "idee") {
    const i = t.idees.get(id);
    if (i && !i.suspendueLe) i.suspendueLe = maintenant;
  } else if (cible === "comment-idee") {
    const c = t.commentaires.get(id);
    if (c && !c.suspenduLe) c.suspenduLe = maintenant;
  }
}

export function estMasqueCommunauteEnMemoire(social: TablesSociales, cible: string, id: number): boolean {
  const t = lireTablesCommunauteEnMemoire(social);
  if (cible === "idee") return !!t.idees.get(id)?.suspendueLe;
  if (cible === "comment-idee") return !!t.commentaires.get(id)?.suspenduLe;
  return false;
}
