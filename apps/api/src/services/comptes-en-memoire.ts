// Comptes en mémoire, pour les tests et l'API de démonstration (essais du site sans toucher à la vraie base) : mêmes
// règles que les services Prisma (comptes.ts, comptes-espace.ts) ; rien n'est écrit nulle part, tout s'efface à l'arrêt.
import type { ServicesComptes } from "../controleurs/comptes.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../fonctions/securite/creer-jeton.ts";
import { creerStockageSessionsComptesEnMemoire } from "../middlewares/proteger-comptes.ts";
import type { CompteConnecte, PalierCompte, StatutAmbassadeur } from "./comptes.ts";
import type { NouvelleCandidature, NouvelleProposition, PropositionVue, StatutCandidature } from "./comptes-espace.ts";

export type CompteEnMemoire = {
  id: number;
  email: string;
  /** L'empreinte, comme dans la base */
  motDePasse: string;
  prenom: string;
  points: number;
  palier: PalierCompte;
  badges: string[];
  cguVersion: string;
  creeLe: number;
  derniereConnexion: number;
  /** null : un compte sans fiche d'ambassadeur */
  statutAmbassadeur: StatutAmbassadeur | null;
  ville: string;
  quartier: string | null;
  decideLe: number | null;
  /** Lien de réinitialisation préparé par l'équipe (empreinte du jeton) */
  reinitialisation: { empreinte: string; expireLe: number } | null;
};

export type CandidatureEnMemoire = NouvelleCandidature & {
  id: number; compteId: number; statut: StatutCandidature; numero: number | null; creeLe: number; reponduLe: number | null;
};
export type PropositionEnMemoire = NouvelleProposition & { id: number; compteId: number | null; statut: PropositionVue["statut"]; creeLe: number };

const iso = (moment: number) => new Date(moment).toISOString();
const DUREE_REINITIALISATION = 24 * 3600_000;
/** Nombre de fondateurs (numéros 1 à 10), comme services/gestion/ambassadeurs.ts (ce double n'importe rien qui touche à la base) */
const FONDATEURS_MAX = 10;

export function creerComptesEnMemoire(horloge: () => number = Date.now) {
  const comptes = new Map<number, CompteEnMemoire>();
  const candidatures: CandidatureEnMemoire[] = [];
  const propositions: PropositionEnMemoire[] = [];
  const sessions = creerStockageSessionsComptesEnMemoire(comptes);
  const compteurs = { comptes: 0, candidatures: 0, propositions: 0 };
  const trouverParEmail = (email: string) => [...comptes.values()].find((compte) => compte.email === email);

  const services: ServicesComptes = {
    async creerCompte({ email, motDePasse, prenom, ville, quartier, cguVersion }) {
      if (trouverParEmail(email)) return null;
      const id = ++compteurs.comptes;
      const maintenant = horloge();
      comptes.set(id, {
        id, email, motDePasse, prenom, points: 0, palier: "curieux", badges: [], cguVersion, creeLe: maintenant, derniereConnexion: maintenant,
        statutAmbassadeur: "en-attente", ville, quartier, decideLe: null, reinitialisation: null,
      });
      return id;
    },
    async trouverCompteParEmail(email) {
      const compte = trouverParEmail(email);
      return compte ? { id: compte.id, motDePasse: compte.motDePasse } : null;
    },
    async lireCompte(id) {
      const compte = comptes.get(id);
      if (!compte) return null;
      const vu: CompteConnecte = {
        prenom: compte.prenom, email: compte.email, points: compte.points, palier: compte.palier, badges: [...compte.badges], creeLe: iso(compte.creeLe),
        ambassadeur: compte.statutAmbassadeur
          ? { statut: compte.statutAmbassadeur, ville: compte.ville, quartier: compte.quartier, decideLe: compte.decideLe === null ? null : iso(compte.decideLe) }
          : null,
      };
      return vu;
    },
    async lireIdentifiants(id) {
      const compte = comptes.get(id);
      return compte ? { email: compte.email, motDePasse: compte.motDePasse } : null;
    },
    async modifierCompte(id, { prenom, ville, quartier }) {
      const compte = comptes.get(id);
      if (!compte) return;
      if (prenom !== undefined) compte.prenom = prenom;
      if (ville !== undefined) compte.ville = ville;
      if (quartier !== undefined) compte.quartier = quartier;
    },
    async changerMotDePasse(id, empreinte) {
      const compte = comptes.get(id);
      if (compte) Object.assign(compte, { motDePasse: empreinte, reinitialisation: null });
    },
    async effacerCompte(id) {
      comptes.delete(id);
      await sessions.supprimerDuCompte(id);
      for (let i = candidatures.length - 1; i >= 0; i--) if (candidatures[i]?.compteId === id) candidatures.splice(i, 1);
      for (const proposition of propositions) if (proposition.compteId === id) proposition.compteId = null;
    },
    async trouverCompteParJeton(empreinteJeton, maintenant) {
      const compte = [...comptes.values()].find(({ reinitialisation }) =>
        reinitialisation?.empreinte === empreinteJeton && reinitialisation.expireLe > maintenant.getTime());
      return compte ? { id: compte.id, email: compte.email } : null;
    },
    async reinitialiserMotDePasse(id, empreinteJeton, empreinte, maintenant) {
      const compte = comptes.get(id);
      const lien = compte?.reinitialisation;
      if (!compte || !lien || lien.empreinte !== empreinteJeton || lien.expireLe <= maintenant.getTime()) return false;
      Object.assign(compte, { motDePasse: empreinte, reinitialisation: null });
      return true;
    },
    async lireCandidature(compteId) {
      const derniere = candidatures.filter((candidature) => candidature.compteId === compteId).at(-1);
      if (!derniere) return null;
      return { statut: derniere.statut, numero: derniere.numero, creeLe: iso(derniere.creeLe), reponduLe: derniere.reponduLe === null ? null : iso(derniere.reponduLe) };
    },
    async creerCandidature(compteId, candidature) {
      if (candidatures.some((c) => c.compteId === compteId && c.statut !== "refusee")) return false;
      candidatures.push({
        ...candidature, envies: [...candidature.envies], id: ++compteurs.candidatures, compteId, statut: "en-attente", numero: null, creeLe: horloge(), reponduLe: null,
      });
      return true;
    },
    async compterPlacesFondateur() {
      const donnes = new Set(candidatures.map(({ numero }) => numero).filter((numero) => numero !== null && numero >= 1 && numero <= FONDATEURS_MAX));
      return Math.max(0, FONDATEURS_MAX - donnes.size);
    },
    async listerPropositions(compteId) {
      return propositions
        .filter((proposition) => proposition.compteId === compteId)
        .reverse()
        .map(({ id, nom, ville, statut, creeLe }) => ({ id, nom, ville, statut, creeLe: iso(creeLe) }));
    },
    async creerProposition(compteId, proposition) {
      propositions.push({ ...proposition, id: ++compteurs.propositions, compteId, statut: "a-traiter", creeLe: horloge() });
    },
  };

  return {
    services,
    sessions,
    /** Les données elles-mêmes, que les tests et la démonstration peuvent lire ou retoucher */
    comptes,
    candidatures,
    propositions,
    /**
     * Décision de l'équipe, comme deciderAmbassadeur (logiciel de gestion) : les sessions restent ouvertes, le statut est
     * relu à chaque demande (§9 : un refus ou une suspension compte tout de suite, sans déconnecter).
     */
    async decider(compteId: number, statut: StatutAmbassadeur) {
      const compte = comptes.get(compteId);
      if (!compte) return;
      Object.assign(compte, { statutAmbassadeur: statut, decideLe: horloge() });
    },
    /** Lien de réinitialisation, comme le prépare le logiciel de gestion (24 h, usage unique) : renvoie le jeton. */
    preparerReinitialisation(compteId: number): string {
      const jeton = creerJeton();
      const compte = comptes.get(compteId);
      if (compte) compte.reinitialisation = { empreinte: calculerEmpreinteJeton(jeton), expireLe: horloge() + DUREE_REINITIALISATION };
      return jeton;
    },
    /** Réponse de l'équipe à la dernière candidature fondateur du compte. */
    repondreCandidature(compteId: number, statut: "acceptee" | "refusee", numero: number | null = null) {
      const candidature = candidatures.filter((c) => c.compteId === compteId).at(-1);
      if (candidature) Object.assign(candidature, { statut, numero: statut === "acceptee" ? numero : null, reponduLe: horloge() });
    },
  };
}

export type ComptesEnMemoire = ReturnType<typeof creerComptesEnMemoire>;
