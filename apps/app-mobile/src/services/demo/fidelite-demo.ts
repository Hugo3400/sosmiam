// Le service de fidélité joué sur le téléphone (démo) : tes cartes, et demander (ou annuler) ta récompense. La
// récompense est remise par l'équipe depuis « Récompenses à donner » (comptoir, lot 2), jamais par le client seul.
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import type { ServiceFidelite } from "@sos-miam/commun/client-api/contrat-fidelite";
import { choisirCodeAddition } from "@sos-miam/commun/fonctions/visites/choisir-code-addition";
import { DUREE_DEMANDE_RECOMPENSE_MS, JOURS_HONNEUR_RECOMPENSES } from "@sos-miam/commun/regles/fidelite";
import type { CarteFidelite, ProgrammeFidelite } from "@sos-miam/commun/types/fidelite";

import { convertirCarteDemo } from "~/fonctions/demo/convertir-carte-demo";
import { tirerNombre } from "~/fonctions/demo/tirer-nombre";

import { listerCodesPrisDemo } from "./lister-codes-pris-demo";
import type { ContexteDemo } from "./types-demo";

type ReponseCarte = ReponseApi<{ carte: CarteFidelite }>;

const JOUR_MS = 24 * 60 * 60_000;

/** Un programme coupé honore encore les récompenses prêtes pendant 30 jours */
function honoreLesRecompenses(programme: ProgrammeFidelite, maintenantMs: number): boolean {
  if (programme.actif) return true;
  const coupeLe = Date.parse(programme.modifieLe);
  return !Number.isNaN(coupeLe) && maintenantMs - coupeLe <= JOURS_HONNEUR_RECOMPENSES * JOUR_MS;
}

/** Le service de fidélité de la démo. */
export function creerFideliteDemo(ctx: ContexteDemo): ServiceFidelite {
  return {
    async listerCartes() {
      const client = ctx.lireClient();
      if (!client) return { ok: true, cartes: [] };
      return ctx.magasin.lire((m) => {
        const cartes = m.cartes
          .filter((c) => c.client === "moi")
          .map((c) => convertirCarteDemo(m, c.lieuId, client))
          .filter((c): c is CarteFidelite => c !== null);
        return { ok: true, cartes };
      });
    },

    async demanderRecompense(lieuId) {
      const client = ctx.lireClient();
      if (!client) return { ok: false, erreur: "connexion-requise" };
      return ctx.magasin.modifier((m, maintenantMs): ReponseCarte => {
        const carte = m.cartes.find((c) => c.lieuId === lieuId && c.client === "moi");
        const programme = m.programmes.find((p) => p.lieuId === lieuId);
        if (!carte || !programme || carte.pretes.length === 0 || !honoreLesRecompenses(programme, maintenantMs)) {
          return { ok: false, erreur: "pas-de-recompense" };
        }
        // Une demande encore valable est rendue telle quelle (même code), sinon on en crée une
        if (!carte.demande || Date.parse(carte.demande.expireLe) <= maintenantMs) {
          carte.demande = {
            id: m.prochainId,
            recompenseId: carte.pretes[0].id,
            code: choisirCodeAddition(listerCodesPrisDemo(m, lieuId), tirerNombre),
            creeLe: new Date(maintenantMs).toISOString(),
            expireLe: new Date(maintenantMs + DUREE_DEMANDE_RECOMPENSE_MS).toISOString(),
          };
          m.prochainId += 1;
        }
        const vue = convertirCarteDemo(m, lieuId, client);
        return vue ? { ok: true, carte: vue } : { ok: false, erreur: "pas-de-recompense" };
      });
    },

    async annulerDemandeRecompense(lieuId) {
      const client = ctx.lireClient();
      if (!client) return { ok: false, erreur: "connexion-requise" };
      return ctx.magasin.modifier((m): ReponseCarte => {
        const carte = m.cartes.find((c) => c.lieuId === lieuId && c.client === "moi");
        if (!carte) return { ok: false, erreur: "introuvable" };
        carte.demande = null;
        const vue = convertirCarteDemo(m, lieuId, client);
        return vue ? { ok: true, carte: vue } : { ok: false, erreur: "introuvable" };
      });
    },
  };
}
