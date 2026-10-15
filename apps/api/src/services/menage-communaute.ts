import { HEURES_CONSERVATION_COUCOU, HEURES_INVITATION_HABITUES, JOURS_CONSERVATION_SORTIES_MIAMIS } from "../../../../packages/commun/src/regles/communaute.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { creerChiffrementGenre } from "./chiffrement-communaute.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";

export type BilanMenageCommunaute = {
  presences: number;
  coucous: number;
  sorties: number;
  invitations: number;
  demandes: number;
  genresRechiffres: number;
  genresIllisibles: number;
};

const HEURE = 3_600_000;
const PAQUET = 500;

async function rechiffrerGenres(chiffrement: ChiffrementDonnees | null, base: typeof baseDeDonnees): Promise<{ rechiffres: number; illisibles: number }> {
  const bilan = { rechiffres: 0, illisibles: 0 };
  const genre = creerChiffrementGenre(chiffrement);
  if (!genre || !chiffrement || chiffrement.versionsAnciennes.length === 0) return bilan;
  let apres = 0;
  for (;;) {
    const lignes = await base.profilCommunaute.findMany({ where: { compteId: { gt: apres }, genreChiffre: { not: null } }, select: { compteId: true, genreChiffre: true }, orderBy: { compteId: "asc" }, take: PAQUET });
    if (lignes.length === 0) return bilan;
    apres = lignes.at(-1)!.compteId;
    for (const l of lignes) {
      if (!l.genreChiffre || !genre.estAncien(l.genreChiffre)) continue;
      try {
        const clair = genre.dechiffrer(l.genreChiffre, l.compteId);
        await base.profilCommunaute.updateMany({ where: { compteId: l.compteId, genreChiffre: l.genreChiffre }, data: { genreChiffre: genre.chiffrer(clair, l.compteId) } });
        bilan.rechiffres += 1;
      } catch {
        bilan.illisibles += 1;
      }
    }
  }
}

export async function faireLeMenageCommunaute(o: { chiffrement: ChiffrementDonnees | null; maintenant?: Date }, base = baseDeDonnees): Promise<BilanMenageCommunaute> {
  const maintenant = o.maintenant ?? new Date();
  const il = (heures: number) => new Date(maintenant.getTime() - heures * HEURE);
  const presences = await base.presenceQuiEstLa.deleteMany({ where: { jusqua: { lt: maintenant } } });
  const coucous = await base.coucouMiami.deleteMany({ where: { creeLe: { lt: il(HEURES_CONSERVATION_COUCOU) } } });
  const invitations = await base.participationSortieDesMiamis.deleteMany({ where: { statut: "invite", creeLe: { lt: il(HEURES_INVITATION_HABITUES) } } });
  const demandes = await base.participationSortieDesMiamis.deleteMany({
    where: { statut: { in: ["demande", "attente", "refuse", "renonce", "invite"] }, sortie: { quand: { lt: maintenant } } },
  });
  const sorties = await base.sortieDesMiamis.deleteMany({ where: { quand: { lt: il(JOURS_CONSERVATION_SORTIES_MIAMIS * 24) } } });
  const genres = await rechiffrerGenres(o.chiffrement, base);
  return {
    presences: presences.count, coucous: coucous.count, sorties: sorties.count, invitations: invitations.count, demandes: demandes.count,
    genresRechiffres: genres.rechiffres, genresIllisibles: genres.illisibles,
  };
}
