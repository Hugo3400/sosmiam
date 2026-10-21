import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserVisites } from "~/hooks/utiliser-visites";

type EtatLectureListe = "chargement" | "ratee" | "prete";

export function utiliserLectureListe(liste: "visites" | "cartes"): EtatLectureListe {
  const { pret, lectureVisites, lectureCartes } = utiliserVisites();
  const inscrit = utiliserProfil().profil !== null;
  const lecture = liste === "visites" ? lectureVisites : lectureCartes;
  if (!pret || (inscrit && lecture === "attente")) return "chargement";
  return lecture === "ratee" ? "ratee" : "prete";
}
