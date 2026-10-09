// Clés publiques d'Apple et de Google (JWKS), gardées en mémoire : rechargées quand leur Cache-Control le dit (1 h sans
// indication, entre 1 min et 24 h), et une fois de plus quand un jeton cite un « kid » inconnu (Apple et Google changent
// de clé de temps en temps), au plus une fois par minute. Délai réseau court ; une panne réseau garde les anciennes clés.
import type { JsonWebKey } from "node:crypto";

/** Les clés ne peuvent pas être lues (réseau, réponse illisible) et aucune n'est en mémoire : 503 « verification-indisponible » */
export class ClesIndisponibles extends Error {
  constructor(raison: string) {
    super(`Clés publiques indisponibles : ${raison}`);
    this.name = "ClesIndisponibles";
  }
}

/** Ce qu'il faut de fetch : une adresse et un signal d'abandon → statut, en-têtes et JSON */
export type ChercherCles = (adresse: string, options: { signal: AbortSignal }) => Promise<{
  ok: boolean; status: number; headers: { get: (nom: string) => string | null }; json: () => Promise<unknown>;
}>;

type OptionsCles = { adresse: string; chercher?: ChercherCles; horloge?: () => number; delai?: number };

const UNE_MINUTE = 60_000;
const UNE_HEURE = 3_600_000;
const UN_JOUR = 86_400_000;

/** Durée de garde d'après Cache-Control (max-age), bornée entre 1 min et 24 h ; 1 h sans indication. */
function lireDureeCache(cacheControl: string | null): number {
  const maxAge = /(?:^|[,\s])max-age=(\d{1,9})/i.exec(cacheControl ?? "")?.[1];
  if (maxAge === undefined || /no-store|no-cache/i.test(cacheControl ?? "")) return UNE_HEURE;
  return Math.min(UN_JOUR, Math.max(UNE_MINUTE, Number(maxAge) * 1000));
}

export function creerCacheCles({ adresse, chercher = fetch as ChercherCles, horloge = Date.now, delai = 3000 }: OptionsCles) {
  let cles = new Map<string, JsonWebKey>();
  let expireLe = 0;
  /** Dernier chargement tenté (réussi ou non) : jamais plus d'un par minute hors expiration */
  let dernierEssai = -Infinity;
  /** Un seul chargement à la fois : les demandes simultanées attendent le même */
  let enCours: Promise<void> | null = null;

  async function charger(): Promise<void> {
    dernierEssai = horloge();
    const reponse = await chercher(adresse, { signal: AbortSignal.timeout(delai) });
    if (!reponse.ok) throw new ClesIndisponibles(`statut ${reponse.status}`);
    const corps = (await reponse.json()) as { keys?: unknown };
    if (!Array.isArray(corps?.keys)) throw new ClesIndisponibles("réponse illisible");
    const nouvelles = new Map<string, JsonWebKey>();
    for (const cle of corps.keys as (JsonWebKey & { kid?: unknown })[]) {
      if (typeof cle === "object" && cle !== null && typeof cle.kid === "string" && cle.kty === "RSA") nouvelles.set(cle.kid, cle);
    }
    if (nouvelles.size === 0) throw new ClesIndisponibles("aucune clé RSA");
    cles = nouvelles;
    expireLe = horloge() + lireDureeCache(reponse.headers.get("cache-control"));
  }

  /** Recharge (un seul chargement à la fois) ; une panne garde les anciennes clés s'il y en a, sinon ClesIndisponibles. */
  async function recharger(): Promise<void> {
    enCours ??= charger().finally(() => (enCours = null));
    try {
      await enCours;
    } catch (erreur) {
      if (cles.size === 0) throw erreur instanceof ClesIndisponibles ? erreur : new ClesIndisponibles(erreur instanceof Error ? erreur.name : "erreur");
    }
  }

  return {
    /** La clé de ce « kid », ou null si elle reste inconnue après un rechargement ; ClesIndisponibles si rien ne se charge. */
    async trouverCle(kid: unknown): Promise<JsonWebKey | null> {
      if (typeof kid !== "string" || kid === "" || kid.length > 200) return null;
      const maintenant = horloge();
      if (maintenant >= expireLe && maintenant - dernierEssai >= 5_000) await recharger();
      else if (!cles.has(kid) && maintenant - dernierEssai >= UNE_MINUTE) await recharger();
      if (cles.size === 0) throw new ClesIndisponibles("aucune clé en mémoire");
      return cles.get(kid) ?? null;
    },
  };
}

export type CacheCles = ReturnType<typeof creerCacheCles>;
