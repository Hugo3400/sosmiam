import type { Ecran } from "../../contenus/menu.ts";
import type { Alertes } from "../../services/alertes.ts";

export type Pastille = { nombre: number; libelle: string; urgent?: boolean };

/** Les pastilles du menu : ce qui attend dans chaque écran, en rouge quand c'est urgent. */
export function calculerPastilles(alertes: Alertes | null, problemesServeur: number): Partial<Record<Ecran, Pastille>> {
  const pastilles: Partial<Record<Ecran, Pastille>> = {
    maintenance: { nombre: problemesServeur, libelle: `${problemesServeur} problème(s) sur le serveur`, urgent: true },
  };
  if (!alertes) return pastilles;
  const { moderation, demandes, ambassadeurs, bigSos, lieux } = alertes;
  const certifications = ambassadeurs.certifications ?? 0;
  pastilles.moderation = {
    nombre: moderation.aTraiter + moderation.contestes,
    libelle: `${moderation.aTraiter} à traiter, ${moderation.contestes} contestée(s)${moderation.urgents ? `, dont ${moderation.urgents} urgente(s)` : ""}`,
    urgent: moderation.urgents > 0,
  };
  pastilles.demandes = {
    nombre: demandes.aTraiter + (demandes.rattachements ?? 0),
    libelle: `${demandes.aTraiter} demande(s) de lieu et ${demandes.rattachements ?? 0} demande(s) de compte pro à traiter`,
  };
  pastilles.ambassadeurs = {
    nombre: ambassadeurs.enAttente + ambassadeurs.candidatures + certifications,
    libelle: `${ambassadeurs.enAttente} inscription(s), ${ambassadeurs.candidatures} candidature(s) fondateur et ${certifications} « certifié » à décider`,
  };
  if (alertes.miamSafe) {
    const { aTraiter, enRetard, sansReponse } = alertes.miamSafe;
    pastilles["miam-safe"] = {
      nombre: aTraiter + sansReponse,
      libelle: `${aTraiter} signalement(s) à lire${enRetard ? ` dont ${enRetard} en retard` : ""}, ${sansReponse} alerte(s) sans réponse`,
      urgent: enRetard > 0 || sansReponse > 0,
    };
  }
  if (alertes.securite?.nouveaux) {
    pastilles["chasse-aux-bugs"] = { nombre: alertes.securite.nouveaux, libelle: `${alertes.securite.nouveaux} faille(s) signalée(s) à lire`, urgent: true };
  }
  if (alertes.carriere?.nouvelles) {
    pastilles.carriere = { nombre: alertes.carriere.nouvelles, libelle: `${alertes.carriere.nouvelles} candidature(s) à lire` };
  }
  if (alertes.communaute?.ideesARelire) {
    pastilles.communaute = { nombre: alertes.communaute.ideesARelire, libelle: `${alertes.communaute.ideesARelire} idée(s) en relecture` };
  }
  if (alertes.avis) {
    const { aRelire, reponses } = alertes.avis;
    pastilles.avis = { nombre: aRelire + reponses, libelle: `${aRelire} avis et ${reponses} réponse(s) de lieu à relire` };
  }
  if (lieux) pastilles.lieux = { nombre: lieux.suggestions, libelle: `${lieux.suggestions} modification(s) de fiche proposée(s)` };
  if (alertes.boite?.nonLus) pastilles.boite = { nombre: alertes.boite.nonLus, libelle: `${alertes.boite.nonLus} mail(s) pas encore lu(s)` };
  if (alertes.surveillance) {
    const { comptes, lieux: refusants, contestations } = alertes.surveillance;
    const limitations = alertes.limitations?.contestees ?? 0;
    pastilles.utilisateurs = {
      nombre: comptes + refusants + contestations + limitations,
      libelle: `${comptes} compte(s) et ${refusants} lieu(x) à regarder, ${contestations} contestation(s) à relire${limitations ? `, ${limitations} limitation(s) contestée(s)` : ""}`,
    };
  }
  pastilles["big-sos"] = { nombre: bigSos.aTraiter + bigSos.aCloturer, libelle: `${bigSos.aTraiter} à étudier, ${bigSos.aCloturer} bilan(s) à écrire` };
  return pastilles;
}
