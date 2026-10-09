// Vues des fiches dans la base : un compteur par lieu et par jour de Paris (vues_lieux). Une seule requête vérifie que le lieu
// est publié et ajoute la vue (INSERT … SELECT … ON CONFLICT) : deux premières vues du jour arrivées en même temps ne se
// marchent jamais dessus, et un lieu dépublié entre-temps ne reçoit rien.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import type { ServicesVuesLieux } from "./vues-lieux-regles.ts";

export function creerVuesLieux(): ServicesVuesLieux {
  return {
    async ajouterVue(lieuId, jour) {
      const lignes = await baseDeDonnees.$executeRaw`
        INSERT INTO vues_lieux (lieu_id, jour, nombre)
        SELECT id, ${jour}::date, 1 FROM lieux WHERE id = ${lieuId} AND statut = 'publie'
        ON CONFLICT (lieu_id, jour) DO UPDATE SET nombre = vues_lieux.nombre + 1`;
      return lignes > 0;
    },
  };
}
