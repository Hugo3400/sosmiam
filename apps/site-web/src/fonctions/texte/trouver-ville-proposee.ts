import { lieuxProposes, type Lieu } from "~/contenus/villes";

/** Retrouve, parmi les villes proposées, celle qui porte ce nom dans cette région (« Saint-Denis » à La Réunion). */
export function trouverVilleProposee(commune: string, region: string): Lieu | undefined {
  return lieuxProposes.find((lieu) => lieu.type === "ville" && lieu.nom === commune && lieu.region === region);
}
