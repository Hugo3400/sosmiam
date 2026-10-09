// La relecture des avis par les ambassadeurs (voir routes/avis.ts) : un verdict consultatif (ok, louche avec un motif de la
// liste fermée, ou « je me déporte »), un par ambassadeur et par avis ; l'équipe SOS Miam tranche dans le logiciel. Un
// ambassadeur ne voit jamais l'auteur ni son âge, jamais l'avis d'un 15-17 ans, jamais le sien, jamais un avis d'un lieu
// auquel il est rattaché (ou demande à l'être).
import type { AvisARelire, VerdictRelecture } from "../../../../packages/commun/src/types/avis.ts";
import { presenterAvisARelire } from "../fonctions/avis/presenter-avis-a-relire.ts";
import { echecAvis, lieuDisparu } from "./avis-client.ts";
import { AVIS_A_RELIRE_MAX, VERDICTS_PAR_AVIS, type ContexteAvis, type EchecAvis, type LigneAvis, type TablesAvis } from "./avis-regles.ts";

export function creerAvisRelecture(c: ContexteAvis) {
  /** Les lieux où l'ambassadeur ne relit rien : ceux de ses rattachements validés ou en attente */
  const lieuxExclus = async (t: TablesAvis, ambassadeurId: number) => (await t.lireCompte(ambassadeurId))?.lieuxLies ?? [];

  /** Cet avis peut-il être relu par cet ambassadeur (même règle que listerARelire) ? */
  async function estRelisable(t: TablesAvis, a: LigneAvis, ambassadeurId: number): Promise<boolean> {
    if (a.statut !== "en-relecture" || a.mineur || a.compteId === ambassadeurId) return false;
    const [exclus, lieu] = await Promise.all([lieuxExclus(t, ambassadeurId), t.lireLieu(a.lieuId)]);
    return !exclus.includes(a.lieuId) && (lieu?.publie ?? false);
  }

  return {
    /** GET /app/avis/a-relire : 20 au plus, le plus ancien d'abord */
    listerARelire(ambassadeurId: number): Promise<{ ok: true; avis: AvisARelire[] }> {
      return c.depot.lire(async (t) => {
        const lignes = await t.listerARelire(ambassadeurId, await lieuxExclus(t, ambassadeurId), VERDICTS_PAR_AVIS, AVIS_A_RELIRE_MAX);
        const lieux = await t.resumerLieux([...new Set(lignes.map((a) => a.lieuId))]);
        return { ok: true, avis: lignes.map((a) => presenterAvisARelire(a, lieux.get(a.lieuId) ?? lieuDisparu(a.lieuId))) };
      });
    },

    /** POST /app/avis/:id/relecture : 404 si l'avis n'est pas (ou plus) à relire pour lui, 409 deja-relu */
    relire(ambassadeurId: number, avisId: number, verdict: VerdictRelecture): Promise<{ ok: true } | EchecAvis> {
      return c.depot.lire(async (t) => {
        const avis = await t.lireAvis(avisId);
        if (!avis || !(await estRelisable(t, avis, ambassadeurId))) return echecAvis("introuvable");
        const resultat = await t.ajouterRelecture(avisId, ambassadeurId, verdict, new Date(c.horloge()));
        return resultat === "deja" ? echecAvis("deja-relu") : { ok: true };
      });
    },
  };
}
