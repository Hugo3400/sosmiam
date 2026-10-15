import { calculerJourParis } from "@sos-miam/commun/fonctions/temps/calculer-jour-paris";
import type { AvisPublic } from "@sos-miam/commun/types/avis";
import type { ReglementVisite } from "@sos-miam/commun/types/visite";

import type { AvisDemo } from "~/services/demo/types-demo";

const lireMoisParis = (iso: string) => calculerJourParis(Date.parse(iso)).slice(0, 7);

export function convertirAvisDemo(a: AvisDemo, reglement: ReglementVisite | null): AvisPublic {
  return {
    id: a.id,
    note: a.note,
    texte: a.texte,
    photo: a.photo,
    signature: a.signature,
    preuve: a.preuve,
    mois: lireMoisParis(a.creeLe),
    reponseLieu: a.reponseLieu ? { texte: a.reponseLieu.texte, mois: lireMoisParis(a.reponseLieu.le) } : null,
    verifie: true,
    repasOffert: reglement?.type === "offert",
    avecReduction: reglement?.type === "reduction",
  };
}
