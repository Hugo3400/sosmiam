import type { Pote } from "@sos-miam/commun/types/potes";

/** Les membres d'une conversation de groupe, toi à la fin : « Léa, Karim, Tom et toi » (« Toi » si tu es tout seul). */
export function listerPrenomsDiscussion(membres: Pote[]): string {
  const prenoms = membres.map((p) => p.prenom);
  return prenoms.length === 0 ? "Toi" : `${prenoms.join(", ")} et toi`;
}
