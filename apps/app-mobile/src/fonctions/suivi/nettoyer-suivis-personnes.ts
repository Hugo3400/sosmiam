import { filtrerLiensPermis, type ContexteLiensSuivi } from "~/fonctions/suivi/filtrer-liens-permis";
import type { SuivisPersonnesLocaux } from "~/stockage/suivis-personnes-locaux";

/**
 * Le ménage des suivis entre personnes : personnes bloquées ou disparues retirées des 4 listes, demandes en attente que l'âge
 * ne permet plus retirées sans bruit (les abonnements acceptés, eux, restent à 18 ans), et une demande déjà devenue abonnement
 * retirée des demandes. Rend le même objet si rien ne change (pas de nouveau rendu ni d'enregistrement).
 */
export function nettoyerSuivisPersonnes(etat: SuivisPersonnesLocaux, contexte: ContexteLiensSuivi): SuivisPersonnesLocaux {
  const abonnements = filtrerLiensPermis(etat.abonnements, "vers-elle", "accepte", contexte);
  const abonnes = filtrerLiensPermis(etat.abonnes, "vers-moi", "accepte", contexte);
  const envoyees = filtrerLiensPermis(etat.demandesEnvoyees, "vers-elle", "en-attente", contexte);
  const recues = filtrerLiensPermis(etat.demandesRecues, "vers-moi", "en-attente", contexte);
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
