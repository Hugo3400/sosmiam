// Comptes de l'espace ambassadeur : appels à l'API, côté serveur uniquement (l'API n'écoute qu'en local, 127.0.0.1:5192).
// Le jeton de session voyage dans l'en-tête X-Session-Compte, jamais dans une adresse ; l'IP du visiteur (X-IP-Visiteur)
// ne sert qu'à limiter les essais. Contrat des adresses : apps/api/src/routes/comptes.ts.
import type { CandidatureFondateur, CompteConnecte, NouvelleCandidature, PropositionLieu } from "~/types/compte";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";

/** Codes d'erreur de l'API des comptes ; tout le reste (panne, délai dépassé) devient « erreur ». */
export type ErreurCompte =
  | "champ-invalide" | "email-deja-utilise" | "age-minimum" | "identifiants" | "session-expiree" | "ambassadeur-non-actif"
  | "candidature-existante" | "jeton-invalide" | "mot-de-passe-incorrect" | "trop-de-demandes"
  | "compte-rendu-trop-court" | "introuvable" | "erreur";

const CODES = new Set<string>([
  "champ-invalide", "email-deja-utilise", "age-minimum", "identifiants", "session-expiree", "ambassadeur-non-actif",
  "candidature-existante", "jeton-invalide", "mot-de-passe-incorrect", "trop-de-demandes",
  // Missions de l'espace (services/espace-ambassadeur.server.ts)
  "compte-rendu-trop-court", "introuvable",
]);

/** Réponse de l'API : les données demandées, ou un code d'erreur (avec le champ en faute, ou l'attente en secondes). */
export type ReponseComptes<T extends object> = ({ ok: true } & T) | { ok: false; erreur: ErreurCompte; champ?: string; attente?: number };

type OptionsAppel = { methode?: "GET" | "POST" | "PATCH" | "DELETE"; jeton?: string | null; ip?: string | null; corps?: unknown };

/** Appelle l'API des comptes et lit sa réponse JSON. */
export async function appelerApiComptes<T extends object>(chemin: string, { methode = "GET", jeton, ip, corps }: OptionsAppel = {}): Promise<ReponseComptes<T>> {
  try {
    const reponse = await fetch(`${ADRESSE_API}${chemin}`, {
      method: methode,
      headers: {
        ...(corps === undefined ? {} : { "Content-Type": "application/json" }),
        ...(jeton ? { "X-Session-Compte": jeton } : {}),
        ...(ip ? { "X-IP-Visiteur": ip } : {}),
      },
      body: corps === undefined ? undefined : JSON.stringify(corps),
      signal: AbortSignal.timeout(8000),
    });
    const lu: unknown = await reponse.json().catch(() => null);
    if (typeof lu !== "object" || lu === null) return { ok: false, erreur: "erreur" };
    const donnees = lu as { ok?: unknown; erreur?: unknown; champ?: unknown; attente?: unknown };
    if (donnees.ok === true && reponse.ok) return lu as { ok: true } & T;
    return {
      ok: false,
      erreur: typeof donnees.erreur === "string" && CODES.has(donnees.erreur) ? (donnees.erreur as ErreurCompte) : "erreur",
      ...(typeof donnees.champ === "string" ? { champ: donnees.champ } : {}),
      ...(typeof donnees.attente === "number" ? { attente: donnees.attente } : {}),
    };
  } catch {
    return { ok: false, erreur: "erreur" };
  }
}

/** Le compte de la personne connectée, d'après son jeton de session. */
export function lireSession(jeton: string, ip: string | null) {
  return appelerApiComptes<{ compte: CompteConnecte }>("/comptes/session", { jeton, ip });
}

// ─── Sans session : inscription, connexion, nouveau mot de passe ───

/** Ce que l'API rend après une inscription ou une connexion : le jeton de session (donné une seule fois) et le compte. */
type SessionOuverte = { session: string; compte: CompteConnecte };

export type DemandeInscription = {
  email: string;
  motDePasse: string;
  prenom: string;
  ville: string;
  quartier?: string;
  /** AAAA-MM-JJ : l'API vérifie les 18 ans, puis l'oublie (jamais gardée) */
  dateNaissance: string;
  cgu: true;
  /** Champ piège du formulaire : rempli seulement par les robots */
  piege?: string;
};

/**
 * Crée le compte et sa demande d'ambassadeur (« en-attente ») et ouvre une session. Sans session dans la réponse : le champ
 * piège était rempli, rien n'a été créé.
 */
export function inscrireAmbassadeur(demande: DemandeInscription, ip: string | null) {
  return appelerApiComptes<Partial<SessionOuverte>>("/comptes", { methode: "POST", ip, corps: demande });
}

/** Connexion : un nouveau jeton à chaque fois. */
export function connecterCompte(email: string, motDePasse: string, ip: string | null) {
  return appelerApiComptes<SessionOuverte>("/comptes/session", { methode: "POST", ip, corps: { email, motDePasse } });
}

/** Nouveau mot de passe avec le jeton du lien préparé par l'équipe (24 h, une seule fois) ; ferme toutes les sessions. */
export function reinitialiserMotDePasse(jetonReinitialisation: string, motDePasse: string, ip: string | null) {
  return appelerApiComptes<object>("/comptes/nouveau-mot-de-passe", { methode: "POST", ip, corps: { jeton: jetonReinitialisation, motDePasse } });
}

// ─── Avec session : le compte connecté ───

/** Déconnexion : la session est effacée côté API. */
export function deconnecterCompte(jeton: string, ip: string | null) {
  return appelerApiComptes<object>("/comptes/session", { methode: "DELETE", jeton, ip });
}

/** Change le prénom, la ville ou le quartier (quartier "" : l'effacer). L'e-mail ne se change pas en ligne. */
export function modifierCompte(jeton: string, ip: string | null, changements: { prenom?: string; ville?: string; quartier?: string }) {
  return appelerApiComptes<{ compte: CompteConnecte }>("/comptes/moi", { methode: "PATCH", jeton, ip, corps: changements });
}

/** Change le mot de passe (l'actuel est demandé) ; les autres sessions du compte sont fermées. */
export function changerMotDePasse(jeton: string, ip: string | null, actuel: string, nouveau: string) {
  return appelerApiComptes<object>("/comptes/moi/mot-de-passe", { methode: "POST", jeton, ip, corps: { actuel, nouveau } });
}

/** Supprime le compte et tout ce qui va avec (mot de passe demandé). */
export function supprimerCompte(jeton: string, ip: string | null, motDePasse: string) {
  return appelerApiComptes<object>("/comptes/moi", { methode: "DELETE", jeton, ip, corps: { motDePasse } });
}

/** La candidature « fondateur » du compte, ou null (ambassadeurs validés seulement). */
export function lireCandidature(jeton: string, ip: string | null) {
  return appelerApiComptes<{ candidature: CandidatureFondateur | null }>("/comptes/moi/candidature", { jeton, ip });
}

/** Envoie la candidature « fondateur » (refusée s'il y en a déjà une en attente ou acceptée). */
export function envoyerCandidature(jeton: string, ip: string | null, candidature: NouvelleCandidature) {
  return appelerApiComptes<object>("/comptes/moi/candidature", { methode: "POST", jeton, ip, corps: candidature });
}

/** Les lieux proposés par le compte, avec leur statut (« a-traiter », « acceptee », « refusee »). */
export function listerPropositions(jeton: string, ip: string | null) {
  return appelerApiComptes<{ propositions: PropositionLieu[] }>("/comptes/moi/propositions", { jeton, ip });
}

/** Propose un lieu (mêmes champs que « J'inscris mon lieu », sans la partie contact ; champs vides absents). */
export function proposerLieu(jeton: string, ip: string | null, lieu: Record<string, string>) {
  return appelerApiComptes<object>("/comptes/moi/propositions", { methode: "POST", jeton, ip, corps: lieu });
}
