import type { Ecran } from "../../contenus/menu.ts";
import type { Alertes } from "../../services/alertes.ts";

export type Pastille = { nombre: number; libelle: string; urgent?: boolean };

/** Les pastilles du menu : ce qui attend dans chaque écran, en rouge quand c'est urgent. */
export function calculerPastilles(alertes: Alertes | null, problemesServeur: number): Partial<Record<Ecran, Pastille>> {
  const pastilles: Partial<Record<Ecran, Pastille>> = {
    maintenance: { nombre: problemesServeur, libelle: `${problemesServeur} problème(s) sur le serveur`, urgent: true },
  };
  if (!alertes) return pastilles;
  const { moderation, demandes, ambassadeurs, bigSos } = alertes;
  pastilles.moderation = {
    nombre: moderation.aTraiter + moderation.contestes,
    libelle: `${moderation.aTraiter} à traiter, ${moderation.contestes} contestée(s)${moderation.urgents ? `, dont ${moderation.urgents} urgente(s)` : ""}`,
    urgent: moderation.urgents > 0,
  };
  pastilles.demandes = { nombre: demandes.aTraiter, libelle: `${demandes.aTraiter} demande(s) à traiter` };
  pastilles.ambassadeurs = { nombre: ambassadeurs.enAttente + ambassadeurs.candidatures, libelle: `${ambassadeurs.enAttente} inscription(s) et ${ambassadeurs.candidatures} candidature(s) à décider` };
  pastilles["big-sos"] = { nombre: bigSos.aTraiter + bigSos.aCloturer, libelle: `${bigSos.aTraiter} à étudier, ${bigSos.aCloturer} bilan(s) à écrire` };
  return pastilles;
}
