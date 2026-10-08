import { peutSuivre } from "@sos-miam/commun/regles/peut-suivre";
import type { LienSuivi, NouvelleNotificationSuivi } from "@sos-miam/commun/types/suivis";

import { creerLienSuivi } from "~/fonctions/suivi/creer-lien-suivi";
import { ecrireCleSuivi } from "~/fonctions/suivi/ecrire-cle-suivi";
import type { ContexteLiensSuivi } from "~/fonctions/suivi/filtrer-liens-permis";
import type { SuivisPersonnesLocaux } from "~/stockage/suivis-personnes-locaux";

/** Ce qu'une personne de la démo fait un peu plus tard : accepter ta demande, te suivre en retour, ou demander à te suivre */
export type ReactionDemo = { type: "accepte-ta-demande" | "suit-en-retour" | "demande-a-te-suivre"; id: string };

/**
 * Applique une réaction de la démo au moment où elle arrive, en revérifiant tout : la personne existe et n'est pas bloquée,
 * peutSuivre permet toujours le lien, ta demande est toujours en attente, tu la suis toujours (suivre en retour),
 * ton compte est toujours privé (demande à te suivre). Vers un compte privé, « suivre en retour » devient une demande.
 * Rend le même état et aucune notification quand plus rien ne s'applique.
 */
export function appliquerReactionDemo(
  etat: SuivisPersonnesLocaux,
  reaction: ReactionDemo,
  contexte: ContexteLiensSuivi,
  maintenant: string,
): { etat: SuivisPersonnesLocaux; notification: NouvelleNotificationSuivi | null } {
  const rien = { etat, notification: null };
  const { id } = reaction;
  const cible = contexte.trouverCible(id);
  if (!cible || contexte.bloques.has(id)) return rien;
  const contient = (liens: LienSuivi[]) => liens.some((l) => l.id === id);
  // Ton choix tel qu'il est maintenant, pas celui du moment où la réaction a été programmée
  const moi = { ...contexte.moi, prive: etat.confidentialite === "prive" };
  const cle = ecrireCleSuivi({ type: "personne", id });

  if (reaction.type === "accepte-ta-demande") {
    const verdict = peutSuivre(moi, cible, { bloque: false });
    if (!verdict.permis || !contient(etat.demandesEnvoyees)) return rien;
    const abonnements = contient(etat.abonnements) ? etat.abonnements : [...etat.abonnements, creerLienSuivi(id, maintenant, verdict.surveillance)];
    return { etat: { ...etat, demandesEnvoyees: etat.demandesEnvoyees.filter((l) => l.id !== id), abonnements }, notification: { type: "demande-acceptee", cle } };
  }

  // Elle → toi
  const verdict = peutSuivre(cible, moi, { bloque: false });
  if (!verdict.permis || contient(etat.abonnes) || contient(etat.demandesRecues)) return rien;
  if (reaction.type === "suit-en-retour" && !contient(etat.abonnements)) return rien;
  if (reaction.type === "demande-a-te-suivre" && etat.confidentialite !== "prive") return rien;
  const lien = creerLienSuivi(id, maintenant, verdict.surveillance);
  if (verdict.surDemande) return { etat: { ...etat, demandesRecues: [...etat.demandesRecues, lien] }, notification: null };
  return {
    etat: { ...etat, abonnes: [...etat.abonnes, lien] },
    notification: reaction.type === "suit-en-retour" ? { type: "nouvel-abonne", cle, enRetour: true } : null,
  };
}
