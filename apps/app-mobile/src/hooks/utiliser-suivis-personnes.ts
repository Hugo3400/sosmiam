import { createContext, useContext } from "react";

import type { Pote } from "@sos-miam/commun/types/potes";
import type { Confidentialite, VerdictSuivi, VisibiliteProfil } from "@sos-miam/commun/types/suivis";

/** Résultat d'un appui sur « Suivre » une personne. « pseudo-manquant » : pas encore de pseudo (voir Réglages › Mes infos). */
export type ResultatSuivre = "suivi" | "demande" | "deja" | "interdit" | "pseudo-manquant";

export type RelationPersonne = {
  jeSuis: "aucun" | "demande" | "suivi";
  /** Elle te suit (abonnement accepté) : « Suivre en retour », pastille « Te suit » */
  meSuit: boolean;
  /** Elle t'a envoyé une demande pas encore traitée */
  demandeRecue: boolean;
  /** Ce que la règle permet ; l'écran n'affiche jamais la raison */
  verdict: VerdictSuivi;
  visibilite: VisibiliteProfil;
};

/** Une personne liée à toi, et depuis quand (ISO). surveillance : lien adulte ↔ créateur de 15-17 ans (pour la future API) */
export type PersonneLiee = { pote: Pote; depuis: string; surveillance?: boolean };

export type EtatSuivisPersonnes = {
  /** Faux tant que le stockage, la communauté et le profil ne sont pas relus (et toujours pendant la visite sans compte) : rien à afficher (ni bouton ni compteur) */
  pret: boolean;
  confidentialite: Confidentialite;
  /** Ce qui s'applique (estComptePrive) : toujours vrai entre 15 et 17 ans */
  comptePrive: boolean;
  /** 15-17 ans (ou âge inconnu) : l'interrupteur ne bouge pas */
  confidentialiteVerrouillee: boolean;
  /** « public » accepte les demandes en attente encore permises (le compte est rendu) ; « verrouille » entre 15 et 17 ans */
  changerConfidentialite: (choix: Confidentialite) => { resultat: "ok" | "verrouille"; acceptees: number };
  /** Déjà filtrés (bloqués, inconnus ; l'âge seulement pour les demandes en attente), du plus récent au plus ancien */
  abonnes: PersonneLiee[];
  abonnements: PersonneLiee[];
  demandesRecues: PersonneLiee[];
  demandesEnvoyees: PersonneLiee[];
  /** null : personne inconnue, ou pas encore prêt */
  relationAvec: (id: string) => RelationPersonne | null;
  suivre: (id: string) => ResultatSuivre;
  /** Sans effet si tu ne la suis pas (idem pour les suivantes : appeler deux fois ne casse rien) */
  nePlusSuivre: (id: string) => void;
  annulerDemande: (id: string) => void;
  /** Revérifie peutSuivre (elle → toi) et le blocage ; false : la demande n'était plus valable (elle est retirée) */
  accepterDemande: (id: string) => boolean;
  /** En silence : rien n'est envoyé à l'autre */
  refuserDemande: (id: string) => void;
  retirerAbonne: (id: string) => void;
  /** null si l'écran ne doit pas montrer de compteurs (« reserve », ou mineur vu par un adulte). Pour « moi » : abonnements = personnes + lieux et créateurs suivis encore affichables */
  compteursDe: (id: string) => { abonnes: number; abonnements: number } | null;
  /** « ferme » si la visibilité n'est pas « complet » ou si compteursDe vaut null. Pour « moi » : personnes seulement (les pages sont dans utiliserActivite) */
  abonnesDe: (id: string) => Pote[] | "ferme";
  abonnementsDe: (id: string) => Pote[] | "ferme";
  suggestionsMasquees: readonly string[];
  masquerSuggestion: (cle: string) => void;
  effacer: () => Promise<void>;
};

export const ContexteSuivisPersonnes = createContext<EtatSuivisPersonnes | null>(null);

/** Abonnés, abonnements et demandes entre personnes (fournis par FournisseurSuivisPersonnes, à la racine). */
export function utiliserSuivisPersonnes(): EtatSuivisPersonnes {
  const etat = useContext(ContexteSuivisPersonnes);
  if (!etat) throw new Error("utiliserSuivisPersonnes doit être appelé sous <FournisseurSuivisPersonnes>.");
  return etat;
}
