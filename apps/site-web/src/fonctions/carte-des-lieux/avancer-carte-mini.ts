import type { EtatCarte } from "~/composants/carte-des-lieux/MessageCarte";

export type EtatCarteMini = "repos" | "chargement" | "prete" | "abandon";

export type EvenementCarteMini = { type: "approche"; webgl: boolean } | { type: "carte"; etat: EtatCarte };

export function avancerCarteMini(etat: EtatCarteMini, evenement: EvenementCarteMini): EtatCarteMini {
  if (etat === "abandon") return etat;
  if (evenement.type === "approche") {
    if (etat !== "repos") return etat;
    return evenement.webgl ? "chargement" : "abandon";
  }
  if (etat === "repos") return etat;
  if (evenement.etat === "erreur" || evenement.etat === "sans-webgl") return "abandon";
  if (evenement.etat === "prete") return "prete";
  return etat;
}
