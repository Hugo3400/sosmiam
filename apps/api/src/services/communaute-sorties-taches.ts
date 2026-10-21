import { JOURS_RECURRENCE_SORTIE_MIAMIS } from "../../../../packages/commun/src/regles/communaute.ts";
import { DELAI_MIN_SORTIE_MINUTES } from "../../../../packages/commun/src/regles/potes.ts";
import { PRESENCE_OUVERTE_MINUTES_APRES } from "../../../../packages/commun/src/regles/sorties-miamis.ts";
import { calculerRappelVeille } from "../../../../packages/commun/src/fonctions/sorties-miamis/calculer-rappel-veille.ts";
import { annoncerTout, type AnnonceCommunaute } from "./communaute-effets.ts";
import type { ContexteCommunaute, LigneSortieMiamis, ServicesSortiesMiamis, TablesCommunaute } from "./communaute-regles.ts";
import { avecStatut } from "./communaute-sorties-outils.ts";
import type { EffetSocial } from "./effets-sociaux-regles.ts";

const SORTIES_PAR_PASSAGE = 200;
const HEURES_AVANT_RAPPEL = 36;
const SEMAINE_MS = JOURS_RECURRENCE_SORTIE_MIAMIS * 24 * 3_600_000;

function calculerProchaineDate(quand: Date, maintenant: Date): Date {
  let prochaine = quand.getTime() + SEMAINE_MS;
  while (prochaine < maintenant.getTime() + DELAI_MIN_SORTIE_MINUTES * 60_000) prochaine += SEMAINE_MS;
  return new Date(prochaine);
}

export function creerTachesSortiesMiamis(c: ContexteCommunaute): Pick<ServicesSortiesMiamis, "passerTaches"> {
  async function rappeler(t: TablesCommunaute, id: number, maintenant: Date): Promise<AnnonceCommunaute[] | null> {
    const ligne = await t.verrouillerSortie(id);
    if (!ligne || ligne.annuleeLe !== null || ligne.retireeLe !== null || ligne.rappelEnvoyeLe !== null || ligne.quand <= maintenant) return null;
    const moment = calculerRappelVeille(ligne.quand.getTime());
    if (moment > maintenant.getTime()) return null;
    await t.changerSortie(id, { rappelEnvoyeLe: maintenant }, maintenant);
    if (ligne.creeLe.getTime() >= moment) return [];
    const participations = await t.lireParticipations([id]);
    const lieu = (await t.lireLieux([ligne.lieuId])).get(ligne.lieuId);
    return [{
      type: "rappel-sortie-miamis", acteurId: null, cible: { type: "miamis", id }, detail: ligne.titre, destinataires: avecStatut(participations, "organise", "accepte"),
      push: () => ({ quoi: "rappel", titre: ligne.titre, lieu: lieu?.nom ?? "le lieu prévu", sortieId: id }),
    }];
  }

  async function continuer(t: TablesCommunaute, listee: LigneSortieMiamis, limite: boolean, maintenant: Date): Promise<AnnonceCommunaute[] | null> {
    await t.verrouillerComptes([listee.organisateurId]);
    const ligne = await t.verrouillerSortie(listee.id);
    if (!ligne || ligne.annuleeLe !== null || ligne.retireeLe !== null || ligne.suiteTraiteeLe !== null || !ligne.recurrente) return null;
    await t.changerSortie(ligne.id, { suiteTraiteeLe: maintenant }, maintenant);
    const lieu = (await t.lireLieux([ligne.lieuId])).get(ligne.lieuId);
    if (!lieu?.publie || limite) return [];
    return creerLaSuite(t, ligne, maintenant);
  }

  async function creerLaSuite(t: TablesCommunaute, ligne: LigneSortieMiamis, maintenant: Date): Promise<AnnonceCommunaute[]> {
    const organisateur = ligne.organisateurId;
    const conversationId = await t.creerConversation(organisateur, maintenant);
    const id = await t.creerSortie({
      ...ligne, conversationId, quand: calculerProchaineDate(ligne.quand, maintenant), serieId: ligne.serieId ?? ligne.id,
    }, maintenant);
    await t.ecrireParticipation({ sortieId: id, compteId: organisateur, statut: "organise", habitue: false, creeLe: maintenant, decideLe: maintenant });
    const habitues: number[] = [];
    for (const compteId of avecStatut(await t.lireParticipations([ligne.id]), "accepte")) {
      if (await t.bloqueEntre(organisateur, compteId)) continue;
      await t.ecrireParticipation({ sortieId: id, compteId, statut: "invite", habitue: true, creeLe: maintenant, decideLe: null });
      habitues.push(compteId);
    }
    return [{
      type: "invitation-habitue", acteurId: organisateur, cible: { type: "miamis", id }, detail: ligne.titre, destinataires: habitues,
      push: (prenom) => ({ quoi: "habitue", prenom, titre: ligne.titre, sortieId: id }),
    }];
  }

  async function passer(lignes: readonly LigneSortieMiamis[], geste: (t: TablesCommunaute, ligne: LigneSortieMiamis) => Promise<AnnonceCommunaute[] | null>) {
    const bilan = { faites: 0, echecs: 0, effets: [] as EffetSocial[] };
    for (const ligne of lignes) {
      try {
        const annonces = await c.depot.ecrire((t) => geste(t, ligne));
        if (annonces === null) continue;
        bilan.faites += 1;
        bilan.effets.push(...(await annoncerTout(c.relations, annonces)));
      } catch {
        bilan.echecs += 1;
      }
    }
    return bilan;
  }

  return {
    async passerTaches(maintenant) {
      const jusqua = new Date(maintenant.getTime() + HEURES_AVANT_RAPPEL * 3_600_000);
      const avant = new Date(maintenant.getTime() - PRESENCE_OUVERTE_MINUTES_APRES * 60_000);
      const [aRappeler, aContinuer] = await c.depot.lire((t) => Promise.all([
        t.listerSortiesARappeler(maintenant, jusqua, SORTIES_PAR_PASSAGE),
        t.listerSortiesAContinuer(avant, SORTIES_PAR_PASSAGE),
      ]));
      const limites = new Set<number>();
      for (const l of aContinuer) if (c.estLimite && (await c.estLimite(l.organisateurId, maintenant))) limites.add(l.organisateurId);
      const rappels = await passer(aRappeler, (t, l) => rappeler(t, l.id, maintenant));
      const suites = await passer(aContinuer, (t, l) => continuer(t, l, limites.has(l.organisateurId), maintenant));
      return { rappels: rappels.faites, suites: suites.faites, echecs: rappels.echecs + suites.echecs, effets: [...rappels.effets, ...suites.effets] };
    },
  };
}
