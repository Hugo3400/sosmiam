import { estRecompenseAlcool } from "@sos-miam/commun/fonctions/fidelite/est-recompense-alcool";
import type { CarteFidelite } from "@sos-miam/commun/types/fidelite";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { resumerLieu } from "~/fonctions/lieux/resumer-lieu";
import type { ClientDemo, MagasinDemo } from "~/services/demo/types-demo";

/**
 * Carte de fidélité d'un client chez un lieu, telle que l'API la rend : la récompense principale, avec recompenseAlcool
 * pour le message sanitaire (la fidélité demande un compte, donc 18 ans ou plus). null si le client n'a pas de carte
 * ici ou si le lieu n'a jamais eu de programme.
 */
export function convertirCarteDemo(m: Readonly<MagasinDemo>, lieuId: number, client: ClientDemo): CarteFidelite | null {
  const carte = m.cartes.find((c) => c.lieuId === lieuId && c.client === client.cle);
  const programme = m.programmes.find((p) => p.lieuId === lieuId);
  const lieu = lieuxExemples.find((l) => l.id === lieuId);
  if (!carte || !programme || !lieu) return null;
  return {
    lieu: resumerLieu(lieu),
    programmeActif: programme.actif,
    tampons: carte.tampons,
    sur: programme.visitesRequises,
    recompense: programme.recompense,
    recompenseAlcool: estRecompenseAlcool(programme),
    pretes: carte.pretes.map((r) => ({ ...r })),
    demande: carte.demande ? { ...carte.demande } : null,
  };
}
