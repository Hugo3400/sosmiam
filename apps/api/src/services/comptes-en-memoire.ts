// Comptes en mémoire, pour les tests et l'API de démonstration (essais du site sans toucher à la vraie base) : mêmes
// règles que les services Prisma (comptes.ts, comptes-espace.ts, certification.ts, suggestions-comptes.ts,
// zones-fondateurs.ts) ; rien n'est écrit nulle part, tout s'efface à l'arrêt. Les mails ne partent pas : ils sont notés dans `envois` (lien compris, pour les essais).
import type { CourrielsComptes } from "../controleurs/comptes-liens.ts";
import type { ServicesComptes } from "../controleurs/comptes.ts";
import { reculerDeMois } from "../fonctions/dates/reculer-de-mois.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../fonctions/securite/creer-jeton.ts";
import { creerStockageSessionsComptesEnMemoire } from "../middlewares/proteger-comptes.ts";
import type { NouvelleCandidatureCertification, ProfilCertifie, StatutCandidatureCertification } from "./certification.ts";
import type { CompteConnecte, PalierCompte, StatutAmbassadeur } from "./comptes.ts";
import type { NouvelleCandidature, NouvelleProposition, PropositionVue, StatutCandidature } from "./comptes-espace.ts";
import { creerProEnMemoire } from "./pro-en-memoire.ts";
import { creerSuggestionsEnMemoire } from "./suggestions-comptes-en-memoire.ts";
import { creerZonesEnMemoire } from "./zones-fondateurs-en-memoire.ts";

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
  /** Lien de réinitialisation, préparé par l'équipe ou demandé (empreinte du jeton) */
  reinitialisation: { empreinte: string; expireLe: number } | null;
  /** E-mail confirmé (moment), ou null */
  emailVerifieLe: number | null;
  /** Lien de confirmation de l'e-mail en attente (empreinte du jeton) */
  verification: { empreinte: string; expireLe: number } | null;
  /** Titre d'« ambassadeur certifié » (depuis quand, profil, structure), ou null */
  certification: { certifieLe: number; profil: ProfilCertifie | null; structure: string | null } | null;
};

export type CandidatureEnMemoire = NouvelleCandidature & {
  id: number; compteId: number; statut: StatutCandidature; communeCode: string | null; zoneCode: string | null;
  numeroLocal: number | null; numeroNational: number | null; creeLe: number; reponduLe: number | null;
};
export type CandidatureCertificationEnMemoire = NouvelleCandidatureCertification & {
  id: number; compteId: number; statut: StatutCandidatureCertification; creeLe: number; reponduLe: number | null;
};
/** Décision de l'équipe sur la certification (logiciel de gestion) : accepter ou refuser la candidature en attente, ou
 * retirer le titre */
export type DecisionCertification = "accepter" | "refuser" | "retirer";
/** Un mail qui serait parti : le type de lien, le compte, le lien lui-même (jeton compris) et son échéance */
export type EnvoiEnMemoire = { type: "mot-de-passe" | "verification-email"; compteId: number; lien: string; expireLe: Date };
export type PropositionEnMemoire = NouvelleProposition & { id: number; compteId: number | null; statut: PropositionVue["statut"]; creeLe: number };

const iso = (moment: number) => new Date(moment).toISOString();
/** Mêmes durées que services/comptes.ts (ce double n'importe rien qui touche à la base) : 24 heures et 7 jours */
const DUREE_REINITIALISATION = 24 * 3600_000;
const DUREE_VERIFICATION_EMAIL = 7 * 24 * 3600_000;
/** Comme services/menage-comptes.ts : candidature refusée effacée 3 mois après la réponse */
const MOIS_CANDIDATURE_REFUSEE = 3;

export function creerComptesEnMemoire(horloge: () => number = Date.now) {
  const comptes = new Map<number, CompteEnMemoire>();
  const candidatures: CandidatureEnMemoire[] = [];
  const candidaturesCertification: CandidatureCertificationEnMemoire[] = [];
  const propositions: PropositionEnMemoire[] = [];
  const envois: EnvoiEnMemoire[] = [];
  const sessions = creerStockageSessionsComptesEnMemoire(comptes);
  const zones = creerZonesEnMemoire(() => candidatures);
  const suggestions = creerSuggestionsEnMemoire(horloge);
  const pro = creerProEnMemoire(comptes, suggestions, horloge);
  const compteurs = { comptes: 0, candidatures: 0, candidaturesCertification: 0, propositions: 0, numeroNational: 0 };
  const trouverParEmail = (email: string) => [...comptes.values()].find((compte) => compte.email === email);
  const derniereCandidature = (compteId: number) => candidatures.filter((candidature) => candidature.compteId === compteId).at(-1);
  const derniereCertification = (compteId: number) => candidaturesCertification.filter((candidature) => candidature.compteId === compteId).at(-1);
  /** Un jeton rendu une fois ; le compte n'en garde que l'empreinte et l'échéance */
  const preparerJeton = (duree: number) => {
    const jeton = creerJeton();
    const expireLe = horloge() + duree;
    return { jeton, expireLe: new Date(expireLe), garde: { empreinte: calculerEmpreinteJeton(jeton), expireLe } };
  };
  /** Mails : notés, jamais envoyés ; `echecs` à vrai fait échouer les suivants (comme un envoi mal réglé) */
  const reglagesEnvoi = { echecs: false };
  const noterEnvoi = (type: EnvoiEnMemoire["type"]) => async (compteId: number, lien: string, expireLe: Date) => {
    if (reglagesEnvoi.echecs) return { ok: false, erreur: "envoi-desactive" };
    if (!comptes.has(compteId)) return { ok: false, erreur: "introuvable" };
    envois.push({ type, compteId, lien, expireLe });
    return { ok: true };
  };
  const courriels: CourrielsComptes = { envoyerLienMotDePasse: noterEnvoi("mot-de-passe"), envoyerLienVerificationEmail: noterEnvoi("verification-email") };

  const services: ServicesComptes = {
    async creerCompte({ email, motDePasse, prenom, ville, quartier, cguVersion }) {
      if (trouverParEmail(email)) return null;
      const id = ++compteurs.comptes;
      const maintenant = horloge();
      comptes.set(id, {
        id, email, motDePasse, prenom, points: 0, palier: "curieux", badges: [], cguVersion, creeLe: maintenant, derniereConnexion: maintenant,
        statutAmbassadeur: "en-attente", ville, quartier, decideLe: null, reinitialisation: null, emailVerifieLe: null, verification: null,
        certification: null,
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
        emailVerifie: compte.emailVerifieLe !== null,
        ambassadeur: compte.statutAmbassadeur
          ? {
              statut: compte.statutAmbassadeur, ville: compte.ville, quartier: compte.quartier, decideLe: compte.decideLe === null ? null : iso(compte.decideLe),
              certifie: compte.certification
                ? { depuis: iso(compte.certification.certifieLe), profil: compte.certification.profil, structure: compte.certification.structure }
                : null,
            }
          : null,
        pro: { lieux: pro.lieuxDuCompte(id) },
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
      for (let i = candidaturesCertification.length - 1; i >= 0; i--) if (candidaturesCertification[i]?.compteId === id) candidaturesCertification.splice(i, 1);
      for (const proposition of propositions) if (proposition.compteId === id) proposition.compteId = null;
      suggestions.oublierCompte(id);
      pro.oublierCompte(id);
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
    async preparerReinitialisation(id) {
      const { jeton, expireLe, garde } = preparerJeton(DUREE_REINITIALISATION);
      const compte = comptes.get(id);
      if (compte) compte.reinitialisation = garde;
      return { jeton, expireLe };
    },
    async preparerVerificationEmail(id) {
      const { jeton, expireLe, garde } = preparerJeton(DUREE_VERIFICATION_EMAIL);
      const compte = comptes.get(id);
      if (compte) compte.verification = garde;
      return { jeton, expireLe };
    },
    async verifierEmail(empreinteJeton, maintenant) {
      const compte = [...comptes.values()].find(({ verification }) =>
        verification?.empreinte === empreinteJeton && verification.expireLe > maintenant.getTime());
      if (!compte) return false;
      Object.assign(compte, { emailVerifieLe: maintenant.getTime(), verification: null });
      return true;
    },
    async lireCandidature(compteId) {
      const derniere = derniereCandidature(compteId);
      if (!derniere) return null;
      const { statut, numeroLocal, numeroNational, communeCode, zoneCode } = derniere;
      return { statut, numeroLocal, numeroNational, communeCode, zoneCode, creeLe: iso(derniere.creeLe), reponduLe: derniere.reponduLe === null ? null : iso(derniere.reponduLe) };
    },
    async creerCandidature(compteId, candidature) {
      if (candidatures.some((c) => c.compteId === compteId && (c.statut === "en-attente" || c.statut === "acceptee"))) return false;
      candidatures.push({
        ...candidature, envies: [...candidature.envies], id: ++compteurs.candidatures, compteId, statut: "en-attente",
        numeroLocal: null, numeroNational: null, creeLe: horloge(), reponduLe: null,
      });
      return true;
    },
    async changerCommuneCandidature(compteId, { communeCode, zoneCode }) {
      const derniere = derniereCandidature(compteId);
      if (!derniere) return "aucune";
      if (derniere.statut !== "en-attente") return "deja-traitee";
      Object.assign(derniere, { communeCode, zoneCode });
      return "ok";
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
    async lireCandidatureCertification(compteId) {
      const derniere = derniereCertification(compteId);
      if (!derniere) return null;
      const { statut, profil, structure, communeCode, envies } = derniere;
      return { statut, profil, structure, communeCode, envies: [...envies], creeLe: iso(derniere.creeLe), reponduLe: derniere.reponduLe === null ? null : iso(derniere.reponduLe) };
    },
    async creerCandidatureCertification(compteId, candidature) {
      if (comptes.get(compteId)?.certification) return "deja-certifie";
      if (candidaturesCertification.some((c) => c.compteId === compteId && c.statut === "en-attente")) return "candidature-existante";
      candidaturesCertification.push({
        ...candidature, envies: [...candidature.envies], id: ++compteurs.candidaturesCertification, compteId, statut: "en-attente", creeLe: horloge(), reponduLe: null,
      });
      return "ok";
    },
    lireFichePourSuggestion: suggestions.lireFichePourSuggestion,
    creerSuggestionLieu: suggestions.creerSuggestionLieu,
  };

  return {
    services,
    sessions,
    /** Zones des fondateurs (241 zones, 367 places), places prises d'après les candidatures ci-dessous */
    zones: zones.services,
    /** Les mails des liens : notés dans `envois` au lieu de partir */
    courriels,
    reglagesEnvoi,
    /** Les données elles-mêmes, que les tests et la démonstration peuvent lire ou retoucher */
    comptes,
    candidatures,
    candidaturesCertification,
    propositions,
    envois,
    /** Lieux de test (à remplir par les tests : champs proposables et statut) et suggestions reçues */
    lieux: suggestions.lieux,
    suggestions: suggestions.suggestions,
    /** Espace pro : ses services (routes /pro et /comptes/moi/rattachements), les rattachements, la décision de l'équipe
     * sur une demande « gerant » (deciderRattachement) et la fiche publique d'un lieu de test (lireFichePublique) */
    pro: pro.services,
    rattachements: pro.rattachements,
    deciderRattachement: pro.deciderRattachement,
    lireFichePublique: pro.lireFichePublique,
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
      const { jeton, garde } = preparerJeton(DUREE_REINITIALISATION);
      const compte = comptes.get(compteId);
      if (compte) compte.reinitialisation = garde;
      return jeton;
    },
    /**
     * Réponse de l'équipe à la dernière candidature fondateur du compte, comme le logiciel de gestion : « acceptee »
     * donne le numéro suivant de la zone et le numéro national suivant, s'il reste une place (faux sinon, ou sans zone) ;
     * « souvenir » (déménagement) libère la place d'un fondateur en gardant ses numéros. Faux si rien n'a changé.
     */
    repondreCandidature(compteId: number, statut: "acceptee" | "refusee" | "souvenir"): boolean {
      const candidature = derniereCandidature(compteId);
      if (!candidature) return false;
      if (statut === "souvenir") {
        if (candidature.statut !== "acceptee") return false;
        candidature.statut = "souvenir";
        return true;
      }
      if (candidature.statut !== "en-attente") return false;
      if (statut === "acceptee") {
        const { zoneCode } = candidature;
        const prises = candidatures.filter((c) => c.zoneCode === zoneCode && c.statut === "acceptee").length;
        const places = zoneCode ? zones.places(zoneCode) : 0;
        if (!zoneCode || prises >= places) return false;
        Object.assign(candidature, { numeroLocal: zones.prendreNumero(zoneCode), numeroNational: ++compteurs.numeroNational });
      }
      Object.assign(candidature, { statut, reponduLe: horloge() });
      return true;
    },
    /**
     * Décision de l'équipe sur la certification, comme le fera le logiciel de gestion : « accepter » ou « refuser » la
     * dernière candidature si elle est en attente (accepter donne le titre, avec le profil et la structure de la
     * candidature) ; « retirer » enlève le titre (la candidature acceptée reste). Faux si rien n'a changé.
     */
    repondreCertification(compteId: number, decision: DecisionCertification): boolean {
      const compte = comptes.get(compteId);
      if (!compte) return false;
      if (decision === "retirer") {
        if (!compte.certification) return false;
        compte.certification = null;
        return true;
      }
      const candidature = derniereCertification(compteId);
      if (!candidature || candidature.statut !== "en-attente") return false;
      Object.assign(candidature, { statut: decision === "accepter" ? "acceptee" : "refusee", reponduLe: horloge() });
      if (decision === "accepter") compte.certification = { certifieLe: horloge(), profil: candidature.profil, structure: candidature.structure };
      return true;
    },
    /** Ménage de nuit (services/menage-comptes.ts) : candidatures certification refusées depuis plus de 3 mois ; renvoie le nombre effacé. */
    effacerCertificationsRefusees(maintenant = new Date(horloge())): number {
      const limite = reculerDeMois(maintenant, MOIS_CANDIDATURE_REFUSEE).getTime();
      let effacees = 0;
      for (let i = candidaturesCertification.length - 1; i >= 0; i--) {
        const candidature = candidaturesCertification[i];
        if (candidature?.statut === "refusee" && candidature.reponduLe !== null && candidature.reponduLe < limite) {
          candidaturesCertification.splice(i, 1);
          effacees += 1;
        }
      }
      return effacees;
    },
  };
}

export type ComptesEnMemoire = ReturnType<typeof creerComptesEnMemoire>;
