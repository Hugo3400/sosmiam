import type { BilanMenageCommunaute } from "../../services/menage-communaute.ts";

const LIBELLES: Readonly<Record<keyof BilanMenageCommunaute, string>> = {
  presences: "« Qui est là ? » : présences finies effacées",
  coucous: "Coucous de plus de 24 h effacés",
  sorties: "Sorties des Miamis effacées (1 an après leur date)",
  invitations: "Invitations d'habitués expirées (48 h) effacées",
  demandes: "Demandes des sorties des Miamis passées effacées",
  retires: "Idées et commentaires retirés depuis 1 an effacés",
  genresRechiffres: "Genres rechiffrés (changement de clé des données)",
  genresIllisibles: "Genres illisibles pendant le rechiffrement",
};

export function decrireBilanMenageCommunaute(bilan: BilanMenageCommunaute): [number, string][] {
  return (Object.keys(LIBELLES) as (keyof BilanMenageCommunaute)[]).filter((cle) => bilan[cle] > 0).map((cle) => [bilan[cle], LIBELLES[cle]]);
}
