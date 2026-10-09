// Le comptoir joué sur le téléphone (mode pro de démo) : l'équipe d'un lieu voit les additions et récompenses en attente,
// montre le QR du comptoir, marque une addition réglée (code à saisir dès 2 en attente), refuse, annule une validation
// faite par erreur (15 min) et règle la carte de fidélité. Le lieu est toujours relu sur la ressource, jamais pris dans
// la demande, et les droits sont revérifiés à chaque geste, comme le fera l'API.
import type { ReponseComptoir, ServiceComptoir } from "@sos-miam/commun/client-api/contrat-comptoir";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { peutAgirAuComptoir } from "@sos-miam/commun/fonctions/roles/peut-agir-au-comptoir";
import { peutReglerLieu } from "@sos-miam/commun/fonctions/roles/peut-regler-lieu";
import { DEMANDES_AVANT_SAISIE_CODE } from "@sos-miam/commun/regles/visites";
import type { ProgrammeFidelite } from "@sos-miam/commun/types/fidelite";
import type { InfosPratiques } from "@sos-miam/commun/types/infos-pratiques";
import type { EvenementVisite } from "@sos-miam/commun/types/visite";
import { validerReglageFidelite } from "@sos-miam/commun/validation/valider-reglage-fidelite";
import { validerInfosPratiques } from "@sos-miam/commun/validation/valider-infos-pratiques";
import { validerReglementVisite } from "@sos-miam/commun/validation/valider-reglement-visite";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { validationLieuxExemples } from "~/contenus/validation-lieux-exemples";

import { calculerEtatComptoirDemo } from "./calculer-etat-comptoir-demo";
import { creerPresentationDemo } from "./creer-presentation-demo";
import { deciderVisiteDemo } from "./decider-visite-demo";
import { lireDelaiAvisDemo } from "./lire-delai-avis-demo";
import type { ContexteDemo, MagasinDemo } from "./types-demo";

export type ComptoirDemo = Pick<
  ServiceComptoir,
  | "listerLieux"
  | "lireComptoir"
  | "montrerQr"
  | "cacherQr"
  | "marquerReglee"
  | "refuser"
  | "annulerValidation"
  | "offrirRecompense"
  | "lireProgramme"
  | "reglerProgramme"
  | "lireInfosPratiques"
  | "reglerInfosPratiques"
>;

const trouverLieu = (id: number) => lieuxExemples.find((l) => l.id === id);

/** Le comptoir de la démo (lot 2) ; réservations et avis du lieu arrivent avec les lots 3 et 4. */
export function creerComptoirDemo(ctx: ContexteDemo): ComptoirDemo {
  const etat = (m: Readonly<MagasinDemo>, lieuId: number, maintenantMs: number): ReponseComptoir => {
    const lieu = trouverLieu(lieuId);
    if (!lieu) return { ok: false, erreur: "introuvable" };
    return { ok: true, etat: calculerEtatComptoirDemo(m, lieu, maintenantMs, ctx.lireClient()) };
  };

  /** Décide une addition (réglée, refusée, annulée) au nom de l'équipe du lieu de la visite */
  const decider = (visiteId: number, evenement: EvenementVisite, verifier?: (m: MagasinDemo, maintenantMs: number) => ReponseComptoir | null) =>
    ctx.magasin.modifier((m, maintenantMs): ReponseComptoir => {
      const visite = m.visites.find((v) => v.id === visiteId);
      if (!visite) return { ok: false, erreur: "introuvable" };
      if (!peutAgirAuComptoir(ctx.lireRoles(), visite.lieuId)) return { ok: false, erreur: "role-requis" };
      const refus = verifier?.(m, maintenantMs);
      if (refus) return refus;
      const decision = deciderVisiteDemo(m, visiteId, evenement, maintenantMs, lireDelaiAvisDemo(ctx.lireReglages()), ctx.lireClient());
      if (!decision.ok) return { ok: false, erreur: decision.erreur };
      return etat(m, visite.lieuId, maintenantMs);
    });

  return {
    async listerLieux() {
      return { ok: true, lieux: ctx.lireRoles().pro };
    },

    async lireComptoir(lieuId) {
      if (!peutAgirAuComptoir(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      return ctx.magasin.lire((m, maintenantMs) => etat(m, lieuId, maintenantMs));
    },

    async montrerQr(lieuId, personnes, reglement) {
      if (!peutAgirAuComptoir(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      if (!validationLieuxExemples[lieuId]?.validationActive) return { ok: false, erreur: "lieu-sans-validation" };
      const valide = validerReglementVisite(reglement);
      if (!valide) return { ok: false, erreur: "reglement-invalide" };
      return ctx.magasin.modifier((m, maintenantMs) => {
        creerPresentationDemo(m, lieuId, personnes, maintenantMs, valide);
        return etat(m, lieuId, maintenantMs);
      });
    },

    async cacherQr(lieuId) {
      if (!peutAgirAuComptoir(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      return ctx.magasin.modifier((m, maintenantMs) => {
        for (const p of m.presentations) if (p.lieuId === lieuId) p.cachee = true;
        return etat(m, lieuId, maintenantMs);
      });
    },

    async marquerReglee(visiteId, codeSaisi, reglement) {
      const valide = validerReglementVisite(reglement);
      if (!valide) return { ok: false, erreur: "reglement-invalide" };
      return decider(visiteId, { type: "regler", reglement: valide }, (m, maintenantMs) => {
        const visite = m.visites.find((v) => v.id === visiteId);
        if (!visite || visite.statut !== "demandee") return null;
        // Coup de feu : dès 2 additions en attente, on tape le code que montre le client (on ne valide pas tout d'un geste)
        const enAttente = m.visites.filter(
          (v) => v.lieuId === visite.lieuId && v.statut === "demandee" && (!v.expireLe || Date.parse(v.expireLe) > maintenantMs),
        ).length;
        if (enAttente >= DEMANDES_AVANT_SAISIE_CODE && codeSaisi?.trim() !== visite.code) return { ok: false, erreur: "code-faux" };
        return null;
      });
    },

    refuser(visiteId, motif) {
      return decider(visiteId, { type: "refuser", motif });
    },

    annulerValidation(visiteId, motif) {
      return decider(visiteId, { type: "annuler-lieu", motif });
    },

    offrirRecompense(demandeId) {
      return ctx.magasin.modifier((m, maintenantMs): ReponseComptoir => {
        const carte = m.cartes.find((c) => c.demande?.id === demandeId);
        if (!carte || !carte.demande) return { ok: false, erreur: "introuvable" };
        if (!peutAgirAuComptoir(ctx.lireRoles(), carte.lieuId)) return { ok: false, erreur: "role-requis" };
        if (Date.parse(carte.demande.expireLe) <= maintenantMs) return { ok: false, erreur: "delai-depasse" };
        const recompenseId = carte.demande.recompenseId;
        carte.pretes = carte.pretes.filter((p) => p.id !== recompenseId);
        carte.demande = null;
        return etat(m, carte.lieuId, maintenantMs);
      });
    },

    async lireProgramme(lieuId) {
      if (!peutAgirAuComptoir(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      return ctx.magasin.lire((m) => ({ ok: true, programme: m.programmes.find((p) => p.lieuId === lieuId) ?? null }));
    },

    async reglerProgramme(lieuId, reglage) {
      if (!peutReglerLieu(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      const valide = validerReglageFidelite(reglage);
      if (!valide.ok) return { ok: false, erreur: valide.erreur };
      return ctx.magasin.modifier((m, maintenantMs): ReponseApi<{ programme: ProgrammeFidelite }> => {
        const programme: ProgrammeFidelite = { ...valide.reglage, lieuId, modifieLe: new Date(maintenantMs).toISOString() };
        m.programmes = [...m.programmes.filter((p) => p.lieuId !== lieuId), programme];
        return { ok: true, programme };
      });
    },

    async lireInfosPratiques(lieuId) {
      if (!peutAgirAuComptoir(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      // Celles du gérant si elles existent, sinon celles de la fiche
      return ctx.magasin.lire((m) => ({ ok: true, infos: m.infosPratiques?.[lieuId] ?? trouverLieu(lieuId)?.pratique ?? null }));
    },

    async reglerInfosPratiques(lieuId, infos) {
      if (!peutReglerLieu(ctx.lireRoles(), lieuId)) return { ok: false, erreur: "role-requis" };
      const valide = validerInfosPratiques(infos);
      if (!valide.ok) return { ok: false, erreur: valide.erreur };
      return ctx.magasin.modifier((m): ReponseApi<{ infos: InfosPratiques }> => {
        m.infosPratiques = { ...(m.infosPratiques ?? {}), [lieuId]: valide.infos };
        return { ok: true, infos: valide.infos };
      });
    },
  };
}
