// La relecture des avis par les ambassadeurs (voir routes/avis.ts) : un verdict consultatif (ok, louche avec un motif de la
// liste fermée, ou « je me déporte »), un par ambassadeur et par avis ; l'équipe SOS Miam tranche dans le logiciel. Un
// ambassadeur ne voit jamais l'auteur, jamais le sien, jamais un avis d'un lieu auquel il est rattaché (ou demande à
// l'être).
import type { AvisARelire, VerdictRelecture } from "../../../../packages/commun/src/types/avis.ts";
import { presenterAvisARelire } from "../fonctions/avis/presenter-avis-a-relire.ts";
import { echecAvis, lieuDisparu } from "./avis-client.ts";
import { AVIS_A_RELIRE_MAX, VERDICTS_PAR_AVIS, type ContexteAvis, type EchecAvis, type LigneAvis, type TablesAvis } from "./avis-regles.ts";

export function creerAvisRelecture(c: ContexteAvis) {
  /** Les lieux où l'ambassadeur ne relit rien : ceux de ses rattachements validés ou en attente */
  const lieuxExclus = async (t: TablesAvis, ambassadeurId: number) => (await t.lireCompte(ambassadeurId))?.lieuxLies ?? [];

  /** Cet avis peut-il être relu par cet ambassadeur (même règle que listerARelire) ? */
  async function estRelisable(t: TablesAvis, a: LigneAvis, ambassadeurId: number): Promise<boolean> {
    if (a.statut !== "en-relecture" || a.compteId === ambassadeurId) return false;
    const [exclus, potes, lieu, verdicts] = await Promise.all([
      lieuxExclus(t, ambassadeurId), t.listerPotes(ambassadeurId), t.lireLieu(a.lieuId), t.compterVerdicts(a.id),
    ]);
    return !exclus.includes(a.lieuId) && !potes.includes(a.compteId) && (lieu?.publie ?? false) && verdicts < VERDICTS_PAR_AVIS;
  }

  return {
    /** GET /app/avis/a-relire : 20 au plus, le plus ancien d'abord */
    listerARelire(ambassadeurId: number): Promise<{ ok: true; avis: AvisARelire[] }> {
      return c.depot.lire(async (t) => {
        const [exclus, potes] = await Promise.all([lieuxExclus(t, ambassadeurId), t.listerPotes(ambassadeurId)]);
        const lignes = await t.listerARelire(ambassadeurId, exclus, potes, VERDICTS_PAR_AVIS, AVIS_A_RELIRE_MAX);
        const lieux = await t.resumerLieux([...new Set(lignes.map((a) => a.lieuId))]);
        return { ok: true, avis: lignes.map((a) => presenterAvisARelire(a, lieux.get(a.lieuId) ?? lieuDisparu(a.lieuId))) };
      });
    },

    /** POST /app/avis/:id/relecture : 404 si l'avis n'est pas (ou plus) à relire pour lui, 409 deja-relu */
    relire(ambassadeurId: number, avisId: number, verdict: VerdictRelecture): Promise<{ ok: true } | EchecAvis> {
      return c.depot.ecrire(async (t) => {
        await t.verrouillerAvis(avisId);
        const avis = await t.lireAvis(avisId);
        if (!avis || !(await estRelisable(t, avis, ambassadeurId))) return echecAvis("introuvable");
        const resultat = await t.ajouterRelecture(avisId, ambassadeurId, verdict, new Date(c.horloge()));
        return resultat === "deja" ? echecAvis("deja-relu") : { ok: true };
      });
    },
  };
}
