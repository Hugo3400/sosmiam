// Le client HTTP des services de l'API (app, puis site) : il ajoute la session (Authorization: Bearer), lit le JSON
// { ok, … } de l'API et traduit chaque échec en ErreurService (le texte vient de contenus/messages-services.ts).
// Aucun secret ici : l'adresse et le jeton sont donnés par l'appelant (l'app les garde dans son coffre-fort).

import { MESSAGES_SERVICE } from "../contenus/messages-services.ts";
import type { ErreurService } from "../types/erreurs-service.ts";
import type { DetailsErreur, ReponseApi } from "./reponse-api.ts";

export type MethodeHttp = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

export type OptionsClientHttp = {
  /** « https://api.sosmiam.fr », sans « / » à la fin */
  adresse: string;
  /** Le jeton de session du compte connecté (null : pas de compte) ; relu à chaque demande */
  lireJeton: () => string | null | Promise<string | null>;
  /** L'API dit que la session n'existe plus (déconnecté partout, compte supprimé) : l'app oublie le jeton */
  surSessionExpiree?: () => void;
  /** Au-delà, la demande est abandonnée et répond « hors-ligne » */
  delaiMs?: number;
  /** Pour les tests : un faux fetch */
  fetch?: typeof fetch;
};

export type ClientHttp = {
  /** `session: false` : la demande part sans jeton (lectures publiques) */
  demander<T extends object = Record<never, never>>(methode: MethodeHttp, chemin: string, options?: { corps?: unknown; session?: boolean }): Promise<ReponseApi<T>>;
};

const DELAI_DEFAUT_MS = 15_000;

/** Les codes de l'API que l'app sait dire tels quels (ceux qui ont un texte) */
const CONNUS = new Set<string>(Object.keys(MESSAGES_SERVICE));

/** Les codes de l'API qui ont un équivalent de l'app sous un autre nom */
const EQUIVALENTS: Readonly<Record<string, ErreurService>> = {
  "session-expiree": "connexion-requise",
  "pas-pro": "role-requis",
  "reserve-au-gerant": "role-requis",
  "media-inconnu": "introuvable",
  "alerte-inconnue": "introuvable",
  "compte-inconnu": "introuvable",
};

/** Ce qui peut servir au texte de l'erreur (distance arrondie, nom du lieu…), rien d'autre */
function lireDetails(corps: Record<string, unknown>): DetailsErreur | undefined {
  const brut = corps.details;
  if (typeof brut !== "object" || brut === null) return undefined;
  const d = brut as Record<string, unknown>;
  const details: DetailsErreur = {};
  if (typeof d.distanceM === "number") details.distanceM = d.distanceM;
  if (typeof d.precisionM === "number") details.precisionM = d.precisionM;
  if (typeof d.jusqua === "string") details.jusqua = d.jusqua;
  if (typeof d.lieu === "string") details.lieu = d.lieu;
  if (typeof d.attenteS === "number") details.attenteS = d.attenteS;
  if (typeof d.lieuId === "number") details.lieuId = d.lieuId;
  return Object.keys(details).length > 0 ? details : undefined;
}

/** Le client HTTP de l'API. */
export function creerClientHttp(o: OptionsClientHttp): ClientHttp {
  const chercher = o.fetch ?? fetch;
  const adresse = o.adresse.replace(/\/+$/, "");

  return {
    async demander<T extends object>(methode: MethodeHttp, chemin: string, options: { corps?: unknown; session?: boolean } = {}): Promise<ReponseApi<T>> {
      const entetes: Record<string, string> = { Accept: "application/json" };
      if (options.corps !== undefined) entetes["Content-Type"] = "application/json";
      if (options.session !== false) {
        const jeton = await o.lireJeton();
        if (jeton) entetes.Authorization = `Bearer ${jeton}`;
      }
      const arret = new AbortController();
      const minuterie = setTimeout(() => arret.abort(), o.delaiMs ?? DELAI_DEFAUT_MS);
      let reponse: Response;
      try {
        reponse = await chercher(`${adresse}${chemin}`, {
          method: methode,
          headers: entetes,
          body: options.corps === undefined ? undefined : JSON.stringify(options.corps),
          signal: arret.signal,
        });
      } catch {
        // Pas de réseau, serveur injoignable, ou trop long
        return { ok: false, erreur: "hors-ligne" };
      } finally {
        clearTimeout(minuterie);
      }

      if (reponse.status === 429) {
        const attente = Number(reponse.headers.get("Retry-After"));
        return { ok: false, erreur: "trop-de-demandes", ...(Number.isFinite(attente) && attente > 0 ? { details: { attenteS: Math.ceil(attente) } } : {}) };
      }
      let corps: Record<string, unknown>;
      try {
        corps = (await reponse.json()) as Record<string, unknown>;
      } catch {
        return { ok: false, erreur: "erreur-serveur" };
      }
      if (reponse.ok && corps.ok === true) return corps as ReponseApi<T>;

      const code = typeof corps.erreur === "string" ? corps.erreur : "";
      if (code === "session-expiree") o.surSessionExpiree?.();
      // Un code que l'app ne connaît pas (champ refusé, serveur en panne…) : c'est de notre côté, jamais de la faute de la personne
      const erreur: ErreurService = EQUIVALENTS[code] ?? (CONNUS.has(code) ? (code as ErreurService) : reponse.status === 401 ? "connexion-requise" : "erreur-serveur");
      const details = lireDetails(corps);
      // Le champ refusé d'un formulaire (« pseudo », « dateNaissance »…), pour le montrer à côté de la bonne case
      const champ = typeof corps.champ === "string" ? corps.champ : undefined;
      return { ok: false, erreur, ...(details ? { details } : {}), ...(champ ? { champ } : {}) };
    },
  };
}
