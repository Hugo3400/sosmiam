// Comptes de l'espace ambassadeur : appels à l'API, côté serveur uniquement (l'API n'écoute qu'en local, 127.0.0.1:5192).
// Le jeton de session voyage dans l'en-tête X-Session-Compte, jamais dans une adresse ; l'IP du visiteur (X-IP-Visiteur)
// ne sert qu'à limiter les essais. Contrat des adresses : apps/api/src/routes/comptes.ts.
import type { CompteConnecte } from "~/types/compte";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";

/** Codes d'erreur de l'API des comptes ; tout le reste (panne, délai dépassé) devient « erreur ». */
export type ErreurCompte =
  | "champ-invalide" | "email-deja-utilise" | "age-minimum" | "identifiants" | "session-expiree" | "ambassadeur-non-actif"
  | "candidature-existante" | "jeton-invalide" | "mot-de-passe-incorrect" | "trop-de-demandes" | "erreur";

const CODES = new Set<string>([
  "champ-invalide", "email-deja-utilise", "age-minimum", "identifiants", "session-expiree", "ambassadeur-non-actif",
  "candidature-existante", "jeton-invalide", "mot-de-passe-incorrect", "trop-de-demandes",
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
