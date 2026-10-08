import { lireCleSuivi } from "~/fonctions/suivi/lire-cle-suivi";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserSuivisPersonnes, type ResultatSuivre } from "~/hooks/utiliser-suivis-personnes";

export type EtatBoutonSuivi = {
  type: "lieu" | "createur" | "personne" | null;
  /** « interdit » : aucun bouton (clé abîmée, toi, bloqué, âge, personne inconnue, pas encore prêt, visite sans compte pour une personne) */
  etat: "aucun" | "demande" | "suivi" | "interdit";
  /** Compte privé : « Suivre » envoie une demande (et « Ne plus suivre » obligera à redemander) */
  surDemande: boolean;
  /** Elle te suit : « Suivre en retour » */
  meSuit: boolean;
  /** Pour un lieu ou un créateur : basculerSuivi, puis « suivi » (ou « deja »). Ne demande pas de compte : le bouton appelle utiliserCompteRequis avant */
  suivre: () => ResultatSuivre;
  /** Sans effet si tu ne suis pas */
  nePlusSuivre: () => void;
  /** Sans effet s'il n'y a pas de demande en attente (et toujours pour un lieu ou un créateur) */
  annulerDemande: () => void;
};

const rienAFaire = () => {};

const interdit: EtatBoutonSuivi = {
  type: null,
  etat: "interdit",
  surDemande: false,
  meSuit: false,
  suivre: () => "interdit",
  nePlusSuivre: rienAFaire,
  annulerDemande: rienAFaire,
};

/**
 * Façade du bouton « Suivre » : la même chose pour un lieu, un créateur (suivis de l'activité, toujours publics)
 * et une personne (abonnements, demandes et règles d'âge de utiliserSuivisPersonnes).
 * Un abonnement déjà accepté reste « suivi » même quand la règle ne permettrait plus de le refaire (passage à 18 ans) :
 * on peut toujours ne plus suivre.
 */
export function utiliserEtatSuivi(cle: string): EtatBoutonSuivi {
  const activite = utiliserActivite();
  const suivis = utiliserSuivisPersonnes();
  const cible = lireCleSuivi(cle);
  if (!cible) return interdit;

  if (cible.type === "personne") {
    const id = cible.id;
    const relation = suivis.relationAvec(id);
    if (!relation) return { ...interdit, type: "personne" };
    const { verdict, jeSuis } = relation;
    // Toi, ou une personne bloquée : jamais de bouton. L'âge, lui, n'empêche pas de défaire un lien qui existe déjà
    const refusDefinitif = !verdict.permis && verdict.raison !== "age";
    const etat = refusDefinitif ? "interdit" : jeSuis !== "aucun" ? jeSuis : verdict.permis ? "aucun" : "interdit";
    return {
      type: "personne",
      etat,
      // Refusé pour l'âge : c'est un compte de 15-17 ans, donc privé
      surDemande: verdict.permis ? verdict.surDemande : true,
      meSuit: relation.meSuit,
      suivre: () => suivis.suivre(id),
      nePlusSuivre: () => suivis.nePlusSuivre(id),
      annulerDemande: () => suivis.annulerDemande(id),
    };
  }

  const suivi = activite.estSuivi(cle);
  return {
    type: cible.type,
    etat: suivi ? "suivi" : "aucun",
    surDemande: false,
    meSuit: false,
    suivre: () => (activite.estSuivi(cle) ? "deja" : activite.basculerSuivi(cle) ? "suivi" : "deja"),
    nePlusSuivre: () => {
      if (activite.estSuivi(cle)) activite.basculerSuivi(cle);
    },
    annulerDemande: rienAFaire,
  };
}
