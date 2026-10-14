import type { ReglageEvenement } from "@sos-miam/commun/types/evenement";

import type { BrouillonEvenement } from "~/fonctions/pro/creer-brouillon-evenement";

const HEURE_MS = 60 * 60_000;
const SEMAINE_MS = 7 * 24 * HEURE_MS;

/** Le brouillon du formulaire au format envoyé à l'API (vérifié ensuite par validerEvenement, ici puis sur le serveur). */
export function convertirBrouillonEvenement(b: BrouillonEvenement): ReglageEvenement {
  const debut = new Date(b.debut);
  debut.setSeconds(0, 0);
  const prix = Number(b.prix.replace(",", ".").replace(/\s|€/g, ""));
  const places = Number(b.places.trim());
  return {
    titre: b.titre,
    type: b.type,
    description: b.description,
    debut: debut.toISOString(),
    fin: b.dureeHeures === null ? null : new Date(debut.getTime() + b.dureeHeures * HEURE_MS).toISOString(),
    hebdoJusqua: b.semaines === null ? null : new Date(debut.getTime() + b.semaines * SEMAINE_MS).toISOString(),
    tarif: b.tarif,
    // Un prix ou un nombre de places mal tapé devient -1 : la vérification le refuse et montre le bon champ
    prixCentimes: b.tarif === "prix" ? (Number.isFinite(prix) && b.prix.trim() !== "" ? Math.round(prix * 100) : -1) : null,
    places: b.places.trim() === "" ? null : Number.isInteger(places) ? places : -1,
    alcool: b.alcool,
  };
}
