// Outils réservés à la démo : simuler un scan, montrer un QR comme l'équipe, répondre comme le lieu, tout remettre à zéro.
import { peutAgirAuComptoir } from "@sos-miam/commun/fonctions/roles/peut-agir-au-comptoir";
import type { EvenementVisite } from "@sos-miam/commun/types/visite";

import { construireQrDemo } from "./construire-qr-demo";
import { creerPresentationDemo } from "./creer-presentation-demo";
import { deciderVisiteDemo } from "./decider-visite-demo";
import { lireDelaiAvisDemo } from "./lire-delai-avis-demo";
import type { ContexteDemo, OutilsDemo } from "./types-demo";

/** Les outils de la démo (null hors démo : voir choisirServices). */
export function creerOutilsDemo(ctx: ContexteDemo): OutilsDemo {
  return {
    texteQrActif() {
      return ctx.magasin.lire((m, maintenantMs) => {
        const allumees = m.presentations.filter((p) => !p.cachee && p.restantes > 0 && Date.parse(p.expireLe) > maintenantMs);
        const derniere = allumees[allumees.length - 1];
        return derniere ? { texte: construireQrDemo(derniere, maintenantMs).texte, lieuId: derniere.lieuId } : null;
      });
    },

    montrerQrPour(lieuId, personnes = 1) {
      return ctx.magasin.modifier((m, maintenantMs) => construireQrDemo(creerPresentationDemo(m, lieuId, personnes, maintenantMs), maintenantMs).texte);
    },

    async repondreCommeLeLieu(visiteId, reponse) {
      const evenement: EvenementVisite = reponse.regler ? { type: "regler" } : { type: "refuser", motif: reponse.motif };
      // Déjà décidée (expirée, annulée…) : l'écran se met à jour tout seul, rien d'autre à faire
      await ctx.magasin.modifier((m, maintenantMs) => {
        deciderVisiteDemo(m, visiteId, evenement, maintenantMs, lireDelaiAvisDemo(ctx.lireReglages()), ctx.lireClient());
      });
    },

    lieuJoueParMoi(lieuId) {
      return peutAgirAuComptoir(ctx.lireRoles(), lieuId);
    },

    remettreAZero() {
      return ctx.magasin.remettreAZero();
    },
  };
}
