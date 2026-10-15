import type { ServiceComptoir } from "@sos-miam/commun/client-api/contrat-comptoir";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";
import { peutAgirAuComptoir } from "@sos-miam/commun/fonctions/roles/peut-agir-au-comptoir";
import { MOTIFS_REFUS_RESERVATION } from "@sos-miam/commun/regles/reservations";
import type { EvenementReservation, ReservationPro } from "@sos-miam/commun/types/reservation";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { calculerFenetreArrivees } from "~/fonctions/reservations/calculer-fenetre-arrivees";

import { deciderReservationDemo } from "./decider-reservation-demo";
import { lireDelaiAvisDemo } from "./lire-delai-avis-demo";
import { presenterReservationProDemo } from "./presenter-reservation-pro-demo";
import { trouverClientDemo } from "./trouver-client-demo";
import type { ContexteDemo } from "./types-demo";

export type ReservationsProDemo = Pick<ServiceComptoir, "listerReservations" | "repondreReservation" | "marquerArrivee">;

type Echec = Extract<ReponseApi, { ok: false }>;
type ReponseGeste = ReponseApi<{ reservation: ReservationPro }>;

const RESERVATIONS_AU_COMPTOIR = 300;
const INTROUVABLE: Echec = { ok: false, erreur: "introuvable" };
const ROLE_REQUIS: Echec = { ok: false, erreur: "role-requis" };

export function creerReservationsProDemo(ctx: ContexteDemo): ReservationsProDemo {
  const peutAgir = (lieuId: number) => peutAgirAuComptoir(ctx.lireRoles(), lieuId);

  const agir = (id: number, evenement: EvenementReservation): Promise<ReponseGeste> =>
    ctx.magasin.modifier((m, maintenantMs): ReponseGeste => {
      const r = m.reservations.find((x) => x.id === id);
      if (!r) return INTROUVABLE;
      if (!peutAgir(r.lieuId)) return ROLE_REQUIS;
      if (r.statut === "expiree") return { ok: false, erreur: "delai-depasse" };
      const moi = ctx.lireClient();
      const decision = deciderReservationDemo(m, r, evenement, {
        maintenantMs,
        client: r.client === "moi" ? moi : trouverClientDemo(m, r.client, moi),
        delaiAvisMs: lireDelaiAvisDemo(ctx.lireReglages()),
      });
      if (!decision.ok) return { ok: false, erreur: decision.erreur };
      return { ok: true, reservation: presenterReservationProDemo(m, r, moi) };
    });

  return {
    async listerReservations(lieuId) {
      if (!lieuxExemples.some((l) => l.id === lieuId)) return INTROUVABLE;
      if (!peutAgir(lieuId)) return ROLE_REQUIS;
      return ctx.magasin.lire((m, maintenantMs) => {
        const { depuisMs } = calculerFenetreArrivees(maintenantMs);
        const moi = ctx.lireClient();
        const reservations = m.reservations
          .filter((r) => r.lieuId === lieuId && Date.parse(r.creneau) >= depuisMs)
          .sort((a, b) => Date.parse(a.creneau) - Date.parse(b.creneau) || a.id - b.id)
          .slice(0, RESERVATIONS_AU_COMPTOIR)
          .map((r) => presenterReservationProDemo(m, r, moi));
        return { ok: true, reservations };
      });
    },

    async repondreReservation(id, reponse) {
      if (reponse.accepter) return agir(id, { type: "accepter" });
      if (!MOTIFS_REFUS_RESERVATION.includes(reponse.motif)) return { ok: false, erreur: "champ-invalide", champ: "motif" };
      return agir(id, { type: "refuser", motif: reponse.motif });
    },

    async marquerArrivee(id, venu) {
      return agir(id, venu ? { type: "venu" } : { type: "absent" });
    },
  };
}
