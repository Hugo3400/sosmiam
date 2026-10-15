// Limitations des comptes en mémoire (tests et API de démonstration) : mêmes règles que limitations-comptes.ts
// (limitations-comptes-regles.ts) ; rien n'est écrit nulle part.
import {
  calculerLimiteConservation, choisirLimitationEnVigueur, estIdentifiant, estLimitationActive, estLimitationAEffacer, resumerLimitationActive,
  validerNouvelleLimitation, type LimitationLue, type ServicesLimitations,
} from "./limitations-comptes-regles.ts";

/**
 * `compteExiste` : vrai si ce compte existe (par défaut, tout identifiant valable) ; `horloge` : le « maintenant » par défaut.
 */
export function creerLimitationsEnMemoire(horloge: () => number = Date.now, compteExiste: (compteId: number) => boolean = () => true) {
  const limitations = new Map<number, LimitationLue>();
  let prochainId = 0;
  const maintenantPar = (maintenant?: Date) => maintenant ?? new Date(horloge());
  const pasTerminee = (l: LimitationLue, maintenant: Date) => l.leveeLe === null && (l.fin === null || l.fin.getTime() > maintenant.getTime());
  const enVigueur = (compteId: number, maintenant: Date) => [...limitations.values()].filter((l) => l.compteId === compteId && pasTerminee(l, maintenant));
  const copie = (l: LimitationLue): LimitationLue => ({ ...l });

  const services: ServicesLimitations = {
    async estLimite(compteId, maintenant) {
      const m = maintenantPar(maintenant);
      const active = choisirLimitationEnVigueur(enVigueur(compteId, m), m);
      return active && estLimitationActive(active, m) ? resumerLimitationActive(active) : null;
    },

    async lireLimitationDuCompte(compteId, maintenant) {
      const m = maintenantPar(maintenant);
      const limitation = choisirLimitationEnVigueur(enVigueur(compteId, m), m);
      return limitation ? copie(limitation) : null;
    },

    async contesterLimitation(compteId, texte, maintenant) {
      const m = maintenantPar(maintenant);
      const limitation = choisirLimitationEnVigueur(enVigueur(compteId, m), m);
      if (!limitation || !estLimitationActive(limitation, m)) return { ok: false, erreur: "aucune-limitation" };
      if (limitation.contestation !== null) return { ok: false, erreur: "deja-conteste" };
      limitation.contestation = texte;
      limitation.contesteLe = m;
      return { ok: true, limitation: copie(limitation) };
    },

    async limiterCompte(nouvelle, maintenant) {
      const m = maintenantPar(maintenant);
      const verifiee = validerNouvelleLimitation(nouvelle, m);
      if (!verifiee.ok) return verifiee;
      if (!estIdentifiant(nouvelle.compteId) || !compteExiste(nouvelle.compteId)) return { ok: false, erreur: "compte-inconnu" };
      if (enVigueur(nouvelle.compteId, m).length > 0) return { ok: false, erreur: "deja-limite" };
      const id = ++prochainId;
      const limitation: LimitationLue = {
        id, ...verifiee.ligne, leveeLe: null, contestation: null, contesteLe: null, reexamineLe: null, creeLe: m,
      };
      limitations.set(id, limitation);
      return { ok: true, limitation: copie(limitation) };
    },

    async leverLimitation(id, maintenant) {
      const limitation = limitations.get(id);
      if (!limitation) return { ok: false, erreur: "introuvable" };
      if (!pasTerminee(limitation, maintenant)) return { ok: false, erreur: "deja-terminee" };
      limitation.leveeLe = maintenant;
      return { ok: true, limitation: copie(limitation) };
    },

    async reexaminerLimitation(id, maintenant, { lever = false } = {}) {
      const limitation = limitations.get(id);
      if (!limitation) return { ok: false, erreur: "introuvable" };
      if (limitation.contestation === null) return { ok: false, erreur: "sans-contestation" };
      if (limitation.reexamineLe !== null) return { ok: false, erreur: "deja-reexaminee" };
      if (lever && pasTerminee(limitation, maintenant)) limitation.leveeLe = maintenant;
      limitation.reexamineLe = maintenant;
      return { ok: true, limitation: copie(limitation) };
    },

    async listerLimitationsDuCompte(compteId) {
      return [...limitations.values()].filter((l) => l.compteId === compteId)
        .sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime() || b.id - a.id).map(copie);
    },

    async listerContestationsAReexaminer() {
      return [...limitations.values()].filter((l) => l.contestation !== null && l.reexamineLe === null)
        .sort((a, b) => (a.contesteLe?.getTime() ?? 0) - (b.contesteLe?.getTime() ?? 0) || a.id - b.id).map(copie);
    },

    async effacerLimitationsAnciennes(maintenant) {
      const limite = calculerLimiteConservation(maintenant);
      let effacees = 0;
      for (const [id, limitation] of limitations) {
        if (estLimitationAEffacer(limitation, limite)) {
          limitations.delete(id);
          effacees += 1;
        }
      }
      return effacees;
    },
  };

  return {
    /** Les lignes elles-mêmes, que les tests peuvent lire ou retoucher */
    limitations,
    services,
    /** Compte supprimé : ses limitations partent avec lui (ON DELETE CASCADE) */
    oublierCompte(compteId: number) {
      for (const [id, limitation] of limitations) if (limitation.compteId === compteId) limitations.delete(id);
    },
  };
}

export type LimitationsEnMemoire = ReturnType<typeof creerLimitationsEnMemoire>;
