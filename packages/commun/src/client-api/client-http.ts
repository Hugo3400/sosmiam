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

export type OptionsDemande = {
  corps?: unknown;
  session?: boolean;
  /** En-têtes en plus (« Idempotency-Key » d'une création de groupe, de sortie ou de liste) ; Accept, Content-Type,
   * Authorization, X-Session-Compte et Cookie restent toujours ceux du client (ENTETES_RESERVES) */
  entetes?: Readonly<Record<string, string>>;
  /** Un autre délai pour cette demande seulement (l'export des données sociales, plus long à préparer) ; sinon celui du client */
  delaiMs?: number;
};

export type ClientHttp = {
  /** `session: false` : la demande part sans jeton (lectures publiques) */
  demander<T extends object = Record<never, never>>(methode: MethodeHttp, chemin: string, options?: OptionsDemande): Promise<ReponseApi<T>>;
  /**
   * La réponse telle quelle (statut et corps JSON), pour les rares erreurs qui portent des données (« profil-a-completer »
   * d'Apple et Google) ; null : pas de réponse lisible (hors ligne, trop long, pas du JSON).
   */
  demanderBrut(methode: MethodeHttp, chemin: string, options?: OptionsDemande): Promise<{ statut: number; corps: Record<string, unknown> } | null>;
  /**
   * Un corps brut (photo, note vocale du chat) en POST, avec son type (« image/jpeg », « audio/mp4 ») ; délai de 60 s ; même
   * lecture de la réponse que demander. entetes : « Idempotency-Key » (l'idClient de l'envoi), sans jamais remplacer la session
   */
  envoyerOctets<T extends object = Record<never, never>>(chemin: string, corps: Blob | ArrayBuffer | Uint8Array, typeMime: string, entetes?: Readonly<Record<string, string>>): Promise<ReponseApi<T>>;
  /**
   * L'adresse complète et les en-têtes (session comprise) pour télécharger un fichier privé avec l'outil du téléphone
   * (File.downloadFileAsync d'expo-file-system). Le jeton n'est JAMAIS mis dans l'adresse : les journaux la gardent
   */
  preparerTelechargement(chemin: string): Promise<{ url: string; entetes: Record<string, string> }>;
};

const DELAI_DEFAUT_MS = 15_000;
/** Une photo de 5 Mo sur un réseau mobile moyen : plus long qu'une demande JSON */
const DELAI_OCTETS_MS = 60_000;

/** Ce que reçoit envoyer en plus d'une demande JSON : un corps brut et son type */
type OptionsEnvoi = OptionsDemande & { brut?: { corps: Blob | ArrayBuffer | Uint8Array; type: string } };

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
  "compte-rendu-trop-court": "compte-rendu-invalide",
};

/**
 * Les en-têtes que le client pose lui-même, ou qui porteraient une autre session : ceux d'un appelant ne passent jamais (en
 * minuscules). L'API lit X-Session-Compte AVANT Authorization (proteger-comptes.ts) : il remplacerait la session sans bruit.
 */
const ENTETES_RESERVES = new Set(["accept", "content-type", "authorization", "x-session-compte", "cookie"]);

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

  /** Envoie la demande (session comprise) ; null : pas de réponse (pas de réseau, serveur injoignable, ou trop long) */
  async function envoyer(methode: MethodeHttp, chemin: string, options: OptionsEnvoi): Promise<Response | null> {
    const entetes: Record<string, string> = {};
    for (const [nom, valeur] of Object.entries(options.entetes ?? {})) if (!ENTETES_RESERVES.has(nom.toLowerCase())) entetes[nom] = valeur;
    entetes.Accept = "application/json";
    if (options.brut) entetes["Content-Type"] = options.brut.type;
    else if (options.corps !== undefined) entetes["Content-Type"] = "application/json";
    if (options.session !== false) {
      const jeton = await o.lireJeton();
      if (jeton) entetes.Authorization = `Bearer ${jeton}`;
    }
    const arret = new AbortController();
    const minuterie = setTimeout(() => arret.abort(), options.delaiMs ?? o.delaiMs ?? DELAI_DEFAUT_MS);
    try {
      return await chercher(`${adresse}${chemin}`, {
        method: methode,
        headers: entetes,
        body: options.brut ? (options.brut.corps as RequestInit["body"]) : options.corps === undefined ? undefined : JSON.stringify(options.corps),
        signal: arret.signal,
      });
    } catch {
      return null;
    } finally {
      clearTimeout(minuterie);
    }
  }

  /** Le corps JSON d'une réponse ; null s'il ne se lit pas */
  async function lire(reponse: Response): Promise<Record<string, unknown> | null> {
    try {
      const corps: unknown = await reponse.json();
      return typeof corps === "object" && corps !== null ? (corps as Record<string, unknown>) : null;
    } catch {
      return null;
    }
  }

  /** La réponse de l'API en ReponseApi : { ok, … } tel quel, ou l'erreur traduite pour l'app */
  async function traduire<T extends object>(reponse: Response | null): Promise<ReponseApi<T>> {
    if (!reponse) return { ok: false, erreur: "hors-ligne" };
    if (reponse.status === 429) {
      const attente = Number(reponse.headers.get("Retry-After"));
      return { ok: false, erreur: "trop-de-demandes", ...(Number.isFinite(attente) && attente > 0 ? { details: { attenteS: Math.ceil(attente) } } : {}) };
    }
    const corps = await lire(reponse);
    if (!corps) return { ok: false, erreur: "erreur-serveur" };
    if (reponse.ok && corps.ok === true) return corps as ReponseApi<T>;

    const code = typeof corps.erreur === "string" ? corps.erreur : "";
    if (code === "session-expiree") o.surSessionExpiree?.();
    // Un code que l'app ne connaît pas (serveur en panne…) : c'est de notre côté, jamais de la faute de la personne
    const erreur: ErreurService = EQUIVALENTS[code] ?? (CONNUS.has(code) ? (code as ErreurService) : reponse.status === 401 ? "connexion-requise" : "erreur-serveur");
    const details = lireDetails(corps);
    // Le champ refusé d'un formulaire (« pseudo », « dateNaissance »…), pour le montrer à côté de la bonne case
    const champ = typeof corps.champ === "string" ? corps.champ : undefined;
    return { ok: false, erreur, ...(details ? { details } : {}), ...(champ ? { champ } : {}) };
  }

  return {
    async demander<T extends object>(methode: MethodeHttp, chemin: string, options: OptionsDemande = {}): Promise<ReponseApi<T>> {
      return traduire<T>(await envoyer(methode, chemin, options));
    },

    async demanderBrut(methode: MethodeHttp, chemin: string, options: OptionsDemande = {}) {
      const reponse = await envoyer(methode, chemin, options);
      const corps = reponse ? await lire(reponse) : null;
      if (!reponse || !corps) return null;
      if (corps.erreur === "session-expiree") o.surSessionExpiree?.();
      return { statut: reponse.status, corps };
    },

    async envoyerOctets<T extends object>(chemin: string, corps: Blob | ArrayBuffer | Uint8Array, typeMime: string, entetes?: Readonly<Record<string, string>>): Promise<ReponseApi<T>> {
      return traduire<T>(await envoyer("POST", chemin, { entetes, brut: { corps, type: typeMime }, delaiMs: DELAI_OCTETS_MS }));
    },

    async preparerTelechargement(chemin: string) {
      const jeton = await o.lireJeton();
      const entetes: Record<string, string> = jeton ? { Authorization: `Bearer ${jeton}` } : {};
      return { url: `${adresse}${chemin}`, entetes };
    },
  };
}
