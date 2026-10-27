import { COURRIELS_ACCES_DISTANCE } from "../../../../../packages/commun/src/contenus/courriels-acces-distance.ts";
import { habillerCourriel } from "../../fonctions/courriels/habiller-courriel.ts";
import type { AlerteAccesDistance } from "../../middlewares/autoriser-poste-distance.ts";
import { envoyerToutDeSuite } from "./file-courriels.ts";

const DATE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" });
const HEURE = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit" });
const PAYS = new Intl.DisplayNames(["fr"], { type: "region" });

const nomDuPays = (code: string | null) => {
  if (!code) return null;
  try {
    return PAYS.of(code) ?? code;
  } catch {
    return code;
  }
};

export async function prevenirAccesDistance(courriel: string, alerte: AlerteAccesDistance) {
  const { pied } = COURRIELS_ACCES_DISTANCE;
  if (alerte.type === "bloque") {
    const textes = COURRIELS_ACCES_DISTANCE.bloque;
    return envoyerToutDeSuite("acces-distance-bloque", courriel, {
      objet: textes.objet,
      ...habillerCourriel({ titre: textes.titre, paragraphes: textes.paragraphes({ jusquA: HEURE.format(alerte.jusquA) }), pied, langue: "fr" }),
      relancer: true,
    });
  }
  const textes = COURRIELS_ACCES_DISTANCE.nouveauPoste;
  const paragraphes = textes.paragraphes({
    nom: alerte.nom,
    le: DATE.format(alerte.le),
    jusquA: alerte.expireLe === null ? null : DATE.format(alerte.expireLe),
    pays: nomDuPays(alerte.pays),
  });
  return envoyerToutDeSuite("acces-distance-poste", courriel, {
    objet: textes.objet(alerte.nom),
    ...habillerCourriel({ titre: textes.titre, paragraphes, pied, langue: "fr" }),
    relancer: true,
  });
}
