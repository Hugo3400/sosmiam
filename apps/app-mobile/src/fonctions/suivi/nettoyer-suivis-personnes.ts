import { filtrerLiensPermis, type ContexteLiensSuivi } from "~/fonctions/suivi/filtrer-liens-permis";
import type { SuivisPersonnesLocaux } from "~/stockage/suivis-personnes-locaux";

/**
 * Le ménage des suivis entre personnes : personnes bloquées ou disparues et doublons retirés des 4 listes, et une demande
 * déjà devenue abonnement retirée des demandes. Rend le même objet si rien ne change (pas de nouveau rendu ni d'enregistrement).
 */
export function nettoyerSuivisPersonnes(etat: SuivisPersonnesLocaux, contexte: ContexteLiensSuivi): SuivisPersonnesLocaux {
  const abonnements = filtrerLiensPermis(etat.abonnements, contexte);
  const abonnes = filtrerLiensPermis(etat.abonnes, contexte);
  const envoyees = filtrerLiensPermis(etat.demandesEnvoyees, contexte);
  const recues = filtrerLiensPermis(etat.demandesRecues, contexte);
  const demandesEnvoyees = envoyees.some((d) => abonnements.some((a) => a.id === d.id)) ? envoyees.filter((d) => !abonnements.some((a) => a.id === d.id)) : envoyees;
  const demandesRecues = recues.some((d) => abonnes.some((a) => a.id === d.id)) ? recues.filter((d) => !abonnes.some((a) => a.id === d.id)) : recues;
  if (
    abonnements === etat.abonnements &&
    abonnes === etat.abonnes &&
    demandesEnvoyees === etat.demandesEnvoyees &&
    demandesRecues === etat.demandesRecues
  ) {
    return etat;
  }
  return { ...etat, abonnements, abonnes, demandesEnvoyees, demandesRecues };
}
