import { choisirRecompenseAffichee } from "@sos-miam/commun/fonctions/fidelite/choisir-recompense-affichee";
import type { CarteFidelite } from "@sos-miam/commun/types/fidelite";

import { lieuxExemples } from "~/contenus/lieux-exemples";
import { resumerLieu } from "~/fonctions/lieux/resumer-lieu";
import type { ClientDemo, MagasinDemo } from "~/services/demo/types-demo";

/**
 * Carte de fidélité d'un client chez un lieu, telle que l'API la rendra : la récompense est déjà choisie selon l'âge
 * (un 15-17 ans ne voit que la version sans alcool, sans mention de l'autre). null si le client n'a pas de carte ici,
 * si le lieu n'a jamais eu de programme, ou si aucune récompense ne peut lui être montrée.
 */
export function convertirCarteDemo(m: Readonly<MagasinDemo>, lieuId: number, client: ClientDemo): CarteFidelite | null {
  const carte = m.cartes.find((c) => c.lieuId === lieuId && c.client === client.cle);
  const programme = m.programmes.find((p) => p.lieuId === lieuId);
  const lieu = lieuxExemples.find((l) => l.id === lieuId);
  if (!carte || !programme || !lieu) return null;
  if (lieu.type === "bar" && !client.majeur) return null;
  const recompense = choisirRecompenseAffichee(programme, client.majeur);
  if (recompense === null) return null;
  return {
    lieu: resumerLieu(lieu),
    programmeActif: programme.actif,
    tampons: carte.tampons,
    sur: programme.visitesRequises,
    recompense,
    pretes: carte.pretes.map((r) => ({ ...r })),
    demande: carte.demande ? { ...carte.demande } : null,
  };
}
