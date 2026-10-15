import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { TEXTES_IDEES } from "~/contenus/textes-idees";

const VISAGES_MAX = 4;

export function decrireVotantsIdee(idee: IdeeMiamis, monId: string, idsBloques: ReadonlySet<string>): { visages: PersonneResume[]; texte: string } {
  const autres = idee.votants.filter((p) => p.id !== monId && !idsBloques.has(p.id));
  const moi: PersonneResume[] = idee.aVote && monId !== "" ? [{ id: monId, pseudo: "", prenom: "Toi", avatar: null }] : [];
  const prenoms = autres.map((p) => p.prenom || `@${p.pseudo}`);
  const montres = Math.min(3, prenoms.length + (idee.aVote ? 1 : 0));
  return { visages: [...moi, ...autres].slice(0, VISAGES_MAX), texte: TEXTES_IDEES.votants(prenoms, Math.max(0, idee.votes - montres), idee.aVote) };
}
