import type { MiamiPresent } from "@sos-miam/commun/types/qui-est-la";
import { MIAMIS_EXEMPLES as M } from "~/contenus/miamis/personnes-miamis-exemples";

export type MiamiPresentExemple = Omit<MiamiPresent, "enviesEnCommun"> & { envies: string[] };

const present = (personne: MiamiPresent["personne"], details: Partial<Omit<MiamiPresentExemple, "personne">> = {}): MiamiPresentExemple => ({
  personne,
  dansTaBande: false,
  ambassadeur: false,
  nouveauDansLaVille: false,
  rescousses: 0,
  titreBadge: null,
  organise: null,
  coucou: "aucun",
  envies: [],
  ...details,
});

export const PRESENTS_MIAMIS_EXEMPLES: MiamiPresentExemple[] = [
  present(M.sam, { titreBadge: "Dénicheur", rescousses: 15, coucou: "recu", envies: ["Végétarien", "Calme", "Street food"] }),
  present(M.nina, { rescousses: 8, envies: ["Végétarien", "Jeux de société"] }),
  present(M.zoe, { ambassadeur: true, rescousses: 30, organise: { sortieId: "miamis-pique-nique", titre: "Pique-nique des Miamis" }, envies: ["Vegan", "Fait maison"] }),
  present(M.lea, { dansTaBande: true, rescousses: 12, envies: ["Végétarien", "Brunch"] }),
  present(M.yanis, { nouveauDansLaVille: true, envies: ["Petit budget", "Festif"] }),
  present(M.alex, { rescousses: 9, envies: ["Calme", "Fait maison"] }),
  present(M.theo, { titreBadge: "Fidèle du comptoir", rescousses: 5, envies: ["Street food", "Épicé"] }),
  present(M.rose, { nouveauDansLaVille: true, envies: ["Sans alcool", "Timides bienvenus"] }),
  present(M.lou, { rescousses: 3, envies: ["Sucré"] }),
];
