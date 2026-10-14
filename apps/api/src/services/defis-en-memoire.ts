// Double en mémoire des défis et des badges automatiques, pour les tests (aucune base de données). Mêmes décisions que la
// base (evaluerDefisCompte, preparerModificationDefi, validerDefi) ; les faits de chaque compte sont posés par le test.
import type { FaitsDefi } from "../../../../packages/commun/src/types/defi.ts";
import { validerDefi } from "../../../../packages/commun/src/validation/valider-defi.ts";
import { evaluerDefisCompte } from "../fonctions/defis/evaluer-defis-compte.ts";
import { preparerModificationDefi } from "../fonctions/defis/preparer-modification-defi.ts";
import { presenterDefiGestion } from "../fonctions/defis/presenter-defi-gestion.ts";
import type { DefiEnBase, DependancesServicesDefis, ReussiteEnBase, ServicesDefis } from "./defis-regles.ts";

type DefiGarde = DefiEnBase & { creeLe: Date; modifieLe: Date };

const fabriquerFaits = (): FaitsDefi => ({ rescousses: [], premiersSauvetages: [], visites: [], avis: [] });

export function creerDefisEnMemoire({ ajouterPoints, donnerBadge }: DependancesServicesDefis) {
  const defis = new Map<number, DefiGarde>();
  const reussites: (ReussiteEnBase & { compteId: number })[] = [];
  const faits = new Map<number, FaitsDefi>();
  const badges = new Map<number, Set<string>>();
  let prochainId = 0;

  /** Les faits d'un compte, à remplir par le test (créés vides au premier appel) */
  function faitsDe(compteId: number): FaitsDefi {
    if (!faits.has(compteId)) faits.set(compteId, fabriquerFaits());
    return faits.get(compteId)!;
  }
  const compterReussites = (defiId: number) => reussites.filter((r) => r.defiId === defiId).length;
  const trier = (a: DefiGarde, b: DefiGarde) => a.ordre - b.ordre || a.debut.localeCompare(b.debut) || a.id - b.id;

  async function evaluer(compteId: number, maintenant: Date) {
    const publies = [...defis.values()].filter((d) => d.publie).sort(trier);
    const e = evaluerDefisCompte({
      defis: publies, reussites: reussites.filter((r) => r.compteId === compteId), faits: faitsDe(compteId), badges: [...(badges.get(compteId) ?? [])], maintenant,
    });
    // Comme sous le verrou de la base : réussites écrites d'un coup, avant la première attente, puis points et badges (la
    // base, elle, pose aussi les points dans la même transaction que les réussites)
    for (const c of e.aCrediter) reussites.push({ compteId, defiId: c.defiId, points: c.points, reussiLe: maintenant });
    for (const r of e.aReprendre) reussites.splice(reussites.findIndex((x) => x.compteId === compteId && x.defiId === r.defiId), 1);
    if (!badges.has(compteId)) badges.set(compteId, new Set());
    for (const badge of e.badges) badges.get(compteId)!.add(badge);
    for (const c of e.aCrediter) await ajouterPoints(compteId, c.points, "defi", `defi:${c.defiId}`);
    for (const r of e.aReprendre) await ajouterPoints(compteId, -r.points, "defi", `defi:${r.defiId} retiré`);
    for (const badge of e.badges) await donnerBadge(compteId, badge);
    return e;
  }

  const services: ServicesDefis = {
    async listerPourCompte(compteId, maintenant) {
      return (await evaluer(compteId, maintenant)).defis;
    },

    async reevaluer(compteId, maintenant) {
      const e = await evaluer(compteId, maintenant);
      return { reussis: e.aCrediter.map((c) => c.defiId), repris: e.aReprendre.map((r) => r.defiId), badges: e.badges };
    },

    async listerGestion() {
      return [...defis.values()].sort(trier).map((d) => presenterDefiGestion(d, compterReussites(d.id)));
    },

    async creer(brut) {
      const r = validerDefi(brut);
      if (!r.ok) return r;
      const maintenant = new Date();
      const defi: DefiGarde = { ...r.defi, id: ++prochainId, creeLe: maintenant, modifieLe: maintenant };
      defis.set(defi.id, defi);
      return { ok: true, defi: presenterDefiGestion(defi, 0) };
    },

    async modifier(id, brut) {
      const garde = defis.get(id);
      if (!garde) return { ok: false, erreur: "defi-inconnu" };
      const n = compterReussites(id);
      const r = preparerModificationDefi(presenterDefiGestion(garde, n), n, brut);
      if (!r.ok) return r;
      const defi: DefiGarde = { ...garde, ...r.defi, modifieLe: new Date() };
      defis.set(id, defi);
      return { ok: true, defi: presenterDefiGestion(defi, n) };
    },

    async supprimer(id) {
      if (!defis.has(id)) return { ok: false, erreur: "defi-inconnu" };
      if (compterReussites(id) > 0) return { ok: false, erreur: "defi-deja-reussi" };
      defis.delete(id);
      return { ok: true };
    },
  };

  return { services, defis, reussites, faits, faitsDe, badges };
}
