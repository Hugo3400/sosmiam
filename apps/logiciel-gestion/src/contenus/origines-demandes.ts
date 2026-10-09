// D'où vient une demande de lieu (logiciel, écran Demandes de lieux).
import type { DemandeLieu } from "~/services/demandes.ts";

export const ORIGINES_DEMANDE: Record<DemandeLieu["origine"], { badge: string; note: string }> = {
  lieu: { badge: "Le lieu s'inscrit", note: "inscription du lieu" },
  communaute: { badge: "Proposé sur Discord", note: "proposition Discord" },
  compte: { badge: "Proposé par un utilisateur de l'app", note: "proposition depuis l'app" },
  ambassadeur: { badge: "Proposé par un ambassadeur", note: "proposition d'un ambassadeur" },
};
