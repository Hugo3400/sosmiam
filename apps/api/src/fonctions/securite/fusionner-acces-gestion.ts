import type { AccesGestion, PosteAutorise } from "../../services/gestion/acces.ts";
import type { FichierPostesDistance } from "../../services/gestion/postes-distance.ts";

export function fusionnerAccesGestion(acces: AccesGestion | null, distance: FichierPostesDistance | null, maintenant: number): AccesGestion | null {
  if (!acces || !distance) return null;
  const coupes = new Set(distance.coupes);
  const serveur = acces.postes.filter((poste) => !coupes.has(poste.id));
  const connus = new Set(serveur.map((poste) => poste.id));
  const ajoutes: PosteAutorise[] = [];
  for (const poste of distance.postes) {
    const expireLe = poste.expireLe === null ? null : Date.parse(poste.expireLe);
    if (coupes.has(poste.id) || connus.has(poste.id) || (expireLe !== null && expireLe <= maintenant)) continue;
    const clePublique = new Uint8Array(Buffer.from(poste.clePublique, "base64url"));
    if (clePublique.length !== 32) continue;
    connus.add(poste.id);
    ajoutes.push({ id: poste.id, nom: poste.nom, clePublique, origine: "distance", ajouteLe: poste.ajouteLe, expireLe });
  }
  return { ...acces, postes: [...serveur, ...ajoutes] };
}
