import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { nommerJourLangue } from "@sos-miam/commun/fonctions/langue/nommer-jour-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { SondageApi } from "@sos-miam/commun/types/messagerie";
import { TEXTES_CHAT_MOMENTS_PAR_LANGUE } from "~/contenus/textes-chat-moments";
import { lireEtatSondage } from "~/fonctions/chat/lire-etat-sondage";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

function ecrireFin(fin: Date, maintenant: Date, langue: Langue): string {
  const T = choisirTextes(TEXTES_CHAT_MOMENTS_PAR_LANGUE, langue);
  const heure = ecrireHeureLangue(fin, langue);
  const ecart = Math.round((debutDuJour(fin) - debutDuJour(maintenant)) / 86_400_000);
  if (ecart <= 0) return T.finA(heure);
  if (ecart === 1) return T.finDemain(heure);
  return T.finJour(nommerJourLangue(fin.getDay(), langue), heure);
}

export function decrireSondage(vote: SondageApi, membres: number, maintenant: Date, langue: Langue): { vu: string; lu: string } {
  const T = choisirTextes(TEXTES_CHAT_MOMENTS_PAR_LANGUE, langue);
  const { clos, gagnant } = lireEtatSondage(vote, maintenant);
  const total = Math.max(membres, vote.votants);
  const votes = T.votes(vote.votants, total);
  if (clos) {
    const texte = vote.votants === 0 || gagnant === null ? T.voteFiniPersonne : T.voteFini(votes);
    return { vu: texte, lu: texte.replace(" · ", ", ") };
  }
  const debut = vote.votants >= total && total > 0 ? T.toutLeMonde : votes;
  const fin = T.finDuVote(ecrireFin(new Date(vote.finLe), maintenant, langue));
  return { vu: `${debut} · ${fin}`, lu: `${debut}, ${fin}` };
}
