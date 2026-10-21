import { createContext, useContext } from "react";

import type { Pote } from "@sos-miam/commun/types/potes";
import type { ProfilCommunautaireApi } from "@sos-miam/commun/types/social";
import type { Confidentialite, VerdictSuivi, VisibiliteProfil } from "@sos-miam/commun/types/suivis";
import type { SurRefusGeste } from "~/hooks/utiliser-communaute";
import type { SourceSociale } from "~/hooks/utiliser-source-sociale";
import type { LectureListe } from "~/hooks/utiliser-visites";

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

/** Une personne liée à toi, et depuis quand (ISO) */
export type PersonneLiee = { pote: Pote; depuis: string };

/** Les deux listes d'une personne */
export type SensSuivi = "abonnes" | "abonnements";

export type EtatSuivisPersonnes = {
  /** D'où viennent les suivis : le téléphone (démo, visite) ou le serveur (compte connecté) */
  source: SourceSociale;
  /** Faux tant que le stockage, la communauté et le profil ne sont pas relus (et toujours pendant la visite sans compte) : rien à afficher (ni bouton ni compteur) */
  pret: boolean;
  lectureSuivis: LectureListe;
  confidentialite: Confidentialite;
  /** Ce qui s'applique (estComptePrive) */
  comptePrive: boolean;
  /**
   * « public » accepte les demandes en attente encore valables (acceptees : combien). L'interrupteur bouge tout de suite ;
   * null : le serveur n'a pas pu l'enregistrer (réseau), rien n'a changé
   */
  changerConfidentialite: (choix: Confidentialite) => Promise<{ acceptees: number } | null>;
  /** Déjà filtrés (bloqués, inconnus), du plus récent au plus ancien. Compte connecté : les pages lues (50 par page) */
  abonnes: PersonneLiee[];
  abonnements: PersonneLiee[];
  /** Combien de personnes tu suis (abonnements acceptés), même au-delà des pages lues */
  nombreAbonnements: number;
  /** Compte connecté : il reste des pages à lire (chargerSuite lit la suivante) ; toujours faux sur le téléphone */
  suites: Record<SensSuivi, boolean>;
  chargerSuite: (sens: SensSuivi) => void;
  /** Compte connecté : le profil d'une personne lu sur le serveur (relation, compte privé ou non, compteurs, niveau), pour relationAvec et compteursDe */
  noterProfil: (profil: ProfilCommunautaireApi) => void;
  demandesRecues: PersonneLiee[];
  demandesEnvoyees: PersonneLiee[];
  /** null : personne inconnue, ou pas encore prêt */
  relationAvec: (id: string) => RelationPersonne | null;
  /** Compte connecté : affiché tout de suite ; si le serveur refuse (compte limité…), c'est défait et surRefus dit pourquoi */
  suivre: (id: string, surRefus?: SurRefusGeste) => ResultatSuivre;
  /** Sans effet si tu ne la suis pas (idem pour les suivantes : appeler deux fois ne casse rien) */
  nePlusSuivre: (id: string) => void;
  annulerDemande: (id: string) => void;
  /** Revérifie peutSuivre (elle → toi) et le blocage ; false : la demande n'était plus valable (elle est retirée) */
  accepterDemande: (id: string) => boolean;
  /** En silence : rien n'est envoyé à l'autre */
  refuserDemande: (id: string) => void;
  retirerAbonne: (id: string) => void;
  /** null si l'écran ne doit pas montrer de compteurs (personne inconnue ou bloquée, pas encore prêt). Pour « moi » : abonnements = personnes + lieux et créateurs suivis encore affichables */
  compteursDe: (id: string) => { abonnes: number; abonnements: number } | null;
  /**
   * « ferme » si la visibilité n'est pas « complet » ou si compteursDe vaut null. Pour « moi » : personnes seulement (les pages
   * sont dans utiliserActivite). Compte connecté, pour quelqu'un d'autre : [] quand ses listes te sont ouvertes (sa bande), à
   * lire avec utiliserLiensDe
   */
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
