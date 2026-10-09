// La fidélité côté client (voir routes/fidelite.ts) : ses cartes, et demander (ou annuler) sa récompense. La récompense
// est remise par l'équipe depuis son comptoir (comptoir.ts), jamais par le client seul.
import { choisirCodeAddition } from "../../../../packages/commun/src/fonctions/visites/choisir-code-addition.ts";
import { DUREE_DEMANDE_RECOMPENSE_MS, JOURS_HONNEUR_RECOMPENSES } from "../../../../packages/commun/src/regles/fidelite.ts";
import type { CarteFidelite } from "../../../../packages/commun/src/types/fidelite.ts";
import { presenterCarteFidelite } from "../fonctions/fidelite/presenter-carte-fidelite.ts";
import type { LigneProgramme, TablesVisites } from "./visites-regles.ts";
import { creerOutilsVisites, type ContexteVisites, type EchecVisite } from "./visites-outils.ts";

type ReponseCarte = { ok: true; carte: CarteFidelite } | EchecVisite;

const JOUR_MS = 24 * 3600_000;

/** Un programme en pause honore encore les récompenses prêtes pendant 30 jours */
function honoreLesRecompenses(programme: LigneProgramme, maintenant: Date): boolean {
  return programme.actif || maintenant.getTime() - programme.modifieLe.getTime() <= JOURS_HONNEUR_RECOMPENSES * JOUR_MS;
}

export function creerFideliteClient(c: ContexteVisites) {
  const o = creerOutilsVisites(c);

  /** La carte du compte chez ce lieu, telle qu'il la voit (null : rien à lui montrer) */
  async function presenter(t: TablesVisites, compteId: number, lieuId: number, majeur: boolean): Promise<CarteFidelite | null> {
    const [carte, programme, lieux] = await Promise.all([t.lireCarte(compteId, lieuId, o.maintenant()), t.lireProgramme(lieuId), t.resumerLieux([lieuId])]);
    const lieu = lieux.get(lieuId);
    return carte && lieu ? presenterCarteFidelite(carte, programme, lieu, majeur) : null;
  }

  return {
    /** GET /app/fidelite/cartes : celles dont la récompense est prête d'abord, puis les plus remplies */
    listerCartes(compteId: number): Promise<{ ok: true; cartes: CarteFidelite[] }> {
      return c.depot.lire(async (t) => {
        const { majeur } = await o.lireVisiteur(t, compteId);
        const lignes = await t.listerCartes({ compteId }, o.maintenant());
        const ids = lignes.map((l) => l.lieuId);
        const [lieux, programmes] = await Promise.all([t.resumerLieux(ids), Promise.all(ids.map((id) => t.lireProgramme(id)))]);
        const cartes = lignes
          .map((l, i) => {
            const lieu = lieux.get(l.lieuId);
            return lieu ? presenterCarteFidelite(l, programmes[i] ?? null, lieu, majeur) : null;
          })
          .filter((carte): carte is CarteFidelite => carte !== null)
          .sort((a, b) => b.pretes.length - a.pretes.length || b.tampons / b.sur - a.tampons / a.sur);
        return { ok: true, cartes };
      });
    },

    /** POST /app/fidelite/cartes/:lieuId/demande : un code de 4 chiffres valable 15 min (la même demande tant qu'elle vaut) */
    demanderRecompense(compteId: number, lieuId: number): Promise<ReponseCarte> {
      return c.depot.ecrire(async (t) => {
        const maintenant = o.maintenant();
        await t.verrouillerCompte(compteId);
        const { majeur } = await o.lireVisiteur(t, compteId);
        const [carte, programme] = await Promise.all([t.lireCarte(compteId, lieuId, maintenant), t.lireProgramme(lieuId)]);
        if (!carte || !programme || carte.pretes.length === 0 || !honoreLesRecompenses(programme, maintenant)) return o.echec("pas-de-recompense");
        if (!carte.demande) {
          await t.verrouillerLieu(lieuId);
          const code = choisirCodeAddition(await t.listerCodesPris(lieuId, maintenant), c.tirer);
          await t.supprimerDemandes(carte.id);
          // La plus ancienne récompense d'abord
          await t.creerDemande(carte.id, { recompenseId: carte.pretes[0].id, code, creeLe: maintenant, expireLe: new Date(maintenant.getTime() + DUREE_DEMANDE_RECOMPENSE_MS) });
        }
        const vue = await presenter(t, compteId, lieuId, majeur);
        return vue ? { ok: true, carte: vue } : o.echec("pas-de-recompense");
      });
    },

    /** DELETE /app/fidelite/cartes/:lieuId/demande */
    annulerDemandeRecompense(compteId: number, lieuId: number): Promise<ReponseCarte> {
      return c.depot.ecrire(async (t) => {
        await t.verrouillerCompte(compteId);
        const carte = await t.lireCarte(compteId, lieuId, o.maintenant());
        if (!carte) return o.echec("introuvable");
        await t.supprimerDemandes(carte.id);
        const { majeur } = await o.lireVisiteur(t, compteId);
        const vue = await presenter(t, compteId, lieuId, majeur);
        return vue ? { ok: true, carte: vue } : o.echec("introuvable");
      });
    },
  };
}
