import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { IdeeMiamis } from "@sos-miam/commun/types/idees";
import type { PersonneResume } from "@sos-miam/commun/types/social";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_IDEES_PAR_LANGUE } from "~/contenus/textes-idees";

const VISAGES_MAX = 4;

export function decrireVotantsIdee(idee: IdeeMiamis, monId: string, idsBloques: ReadonlySet<string>, langue: Langue): { visages: PersonneResume[]; texte: string } {
  const autres = idee.votants.filter((p) => p.id !== monId && !idsBloques.has(p.id));
  const moi: PersonneResume[] = idee.aVote && monId !== "" ? [{ id: monId, pseudo: "", prenom: choisirTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE, langue).toi, avatar: null }] : [];
  const prenoms = autres.map((p) => p.prenom || `@${p.pseudo}`);
  const montres = Math.min(3, prenoms.length + (idee.aVote ? 1 : 0));
  return { visages: [...moi, ...autres].slice(0, VISAGES_MAX), texte: choisirTextes(TEXTES_IDEES_PAR_LANGUE, langue).votants(prenoms, Math.max(0, idee.votes - montres), idee.aVote) };
}
