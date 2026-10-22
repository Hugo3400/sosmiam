import type { SondageApi } from "@sos-miam/commun/types/messagerie";
import { lireEtatSondage } from "~/fonctions/chat/lire-etat-sondage";
import { formaterHeure } from "~/fonctions/dates/formater-heure";

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
const heureDe = (date: Date) => formaterHeure(`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`);

function ecrireFin(fin: Date, maintenant: Date): string {
  const ecart = Math.round((debutDuJour(fin) - debutDuJour(maintenant)) / 86_400_000);
  if (ecart <= 0) return `à ${heureDe(fin)}`;
  if (ecart === 1) return `demain à ${heureDe(fin)}`;
  return `${JOURS[fin.getDay()]} à ${heureDe(fin)}`;
}

export function decrireSondage(vote: SondageApi, membres: number, maintenant: Date): { vu: string; lu: string } {
  const { clos, gagnant } = lireEtatSondage(vote, maintenant);
  const total = Math.max(membres, vote.votants);
  const votes = `${vote.votants} vote${vote.votants > 1 ? "s" : ""} sur ${total}`;
  if (clos) {
    const texte = vote.votants === 0 || gagnant === null ? "Vote fini : personne n'a voté" : `Vote fini · ${votes}`;
    return { vu: texte, lu: texte.replace(" · ", ", ") };
  }
  const debut = vote.votants >= total && total > 0 ? "Tout le monde a voté" : votes;
  const fin = `fin du vote ${ecrireFin(new Date(vote.finLe), maintenant)}`;
  return { vu: `${debut} · ${fin}`, lu: `${debut}, ${fin}` };
}
