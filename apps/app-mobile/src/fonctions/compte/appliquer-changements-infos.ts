import type { Profil } from "@sos-miam/commun/types/profil";
import type { ChangementsInfos } from "~/hooks/utiliser-profil";

/** Le profil avec les changements de Mes infos (seulement ceux donnés ; nom "" : plus de nom), le reste tel quel */
export function appliquerChangementsInfos(local: Profil, c: ChangementsInfos): Profil {
  const { nom: nomActuel, pseudo: pseudoActuel, ...reste } = local;
  const nom = c.nom !== undefined ? c.nom.trim() : nomActuel;
  const pseudo = c.pseudo ?? pseudoActuel;
  return {
    ...reste,
    ...(c.prenom !== undefined ? { prenom: c.prenom } : {}),
    ...(c.ville !== undefined ? { ville: c.ville } : {}),
    ...(nom ? { nom } : {}),
    ...(pseudo ? { pseudo } : {}),
  };
}
