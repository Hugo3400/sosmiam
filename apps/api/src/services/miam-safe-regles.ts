// Miam Safe côté serveur : formes et contrat des services (Prisma : miam-safe.ts ; double en mémoire : miam-safe-en-memoire.ts).
// Les règles produit (phrase, délais, seuil du repère, endroits, raisons) viennent de packages/commun/src/regles/miam-safe.ts.
import {
  DELAI_RELANCE_ALERTE_SECONDES, ENDROITS_ALERTE, RAISONS_SIGNALEMENT_MIAM_SAFE, type EndroitAlerte, type RaisonSignalementMiamSafe,
} from "../../../../packages/commun/src/regles/miam-safe.ts";

export { DELAI_RELANCE_ALERTE_SECONDES, ENDROITS_ALERTE, RAISONS_SIGNALEMENT_MIAM_SAFE, type EndroitAlerte, type RaisonSignalementMiamSafe };

/** Une alerte silencieuse s'efface 30 jours après son envoi */
export const DUREE_GARDE_ALERTES_MS = 30 * 24 * 3600_000;
/** Ce que l'équipe du lieu voit au comptoir : les alertes des 2 dernières heures */
export const FENETRE_ALERTES_COMPTOIR_MS = 2 * 3600_000;

/** Ce que la fiche d'un lieu montre de Miam Safe */
export type MiamSafeLieu = { engage: boolean; repere: boolean };

/** « envoyee » (en attente), « en-route » (« On arrive » de l'équipe), « sans-reponse » (2 minutes passées sans réponse) */
export type StatutAlerte = "envoyee" | "en-route" | "sans-reponse";

/** Une alerte telle que la personne qui l'a envoyée la suit */
export type AlerteSuivie = { id: number; statut: StatutAlerte; creeLe: string; repondueLe: string | null };

/** Une alerte telle que l'équipe du lieu la voit : le prénom, jamais le nom ni la photo */
export type AlerteComptoir = { id: number; prenom: string; endroit: EndroitAlerte; detail: string; statut: StatutAlerte; creeLe: string };

export type NouvelleAlerte = { lieuId: number; compteId: number; prenom: string; endroit: EndroitAlerte; detail: string };

export type CharteVue = { signee: boolean; signeeLe: string | null; retireeParEquipe: boolean };

export interface ServicesMiamSafe {
  /** null : lieu inconnu ou pas publié */
  lireLieu(lieuId: number): Promise<MiamSafeLieu | null>;
  /** Le lieu doit avoir une charte active ; efface au passage les alertes de plus de 30 jours */
  creerAlerte(alerte: NouvelleAlerte, maintenant: Date): Promise<{ ok: true; id: number } | { ok: false; erreur: "lieu-inconnu" | "pas-miam-safe" }>;
  /** Seulement une alerte de ce compte (null sinon) */
  lireAlerte(id: number, compteId: number, maintenant: Date): Promise<AlerteSuivie | null>;
  /** false : lieu inconnu ou pas publié */
  enregistrerSignalement(s: { lieuId: number; compteId: number; raison: RaisonSignalementMiamSafe; explication: string }): Promise<boolean>;
  /** La dernière réponse compte ; false : lieu inconnu ou pas publié */
  repondreSentiBien(r: { lieuId: number; compteId: number; oui: boolean }): Promise<boolean>;
  /** Comptoir : les alertes récentes du lieu, les plus récentes d'abord */
  listerAlertesLieu(lieuId: number, maintenant: Date): Promise<AlerteComptoir[]>;
  /** « On arrive » : false si l'alerte n'est pas à ce lieu (ou déjà trop ancienne) ; une alerte déjà répondue reste répondue */
  repondreAlerte(lieuId: number, alerteId: number, compteId: number, maintenant: Date): Promise<boolean>;
  lireCharte(lieuId: number): Promise<CharteVue>;
  /** Le gérant signe ; refusé si l'équipe SOS Miam l'a retirée (seule elle peut la rendre) */
  signerCharte(lieuId: number, compteId: number, maintenant: Date): Promise<{ ok: true } | { ok: false; erreur: "charte-retiree" }>;
  /** Le gérant retire sa signature */
  quitterCharte(lieuId: number, maintenant: Date): Promise<void>;
}

/** Le statut d'une alerte, à un moment donné */
export function calculerStatutAlerte(creeLe: Date, repondueLe: Date | null, maintenant: Date): StatutAlerte {
  if (repondueLe) return "en-route";
  return maintenant.getTime() - creeLe.getTime() >= DELAI_RELANCE_ALERTE_SECONDES * 1000 ? "sans-reponse" : "envoyee";
}

/** Le repère « Les Miamis s'y sentent bien » (90 % de oui sur au moins 20 réponses) */
export { calculerRepereSentiBien } from "../../../../packages/commun/src/fonctions/miam-safe/calculer-repere-senti-bien.ts";
