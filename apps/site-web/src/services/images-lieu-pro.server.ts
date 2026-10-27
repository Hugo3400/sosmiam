import { IMAGES_LIEU, REGLES_IMAGES_LIEU, type ImageLieu } from "../../../../packages/commun/src/regles/images-lieu.ts";
import { entetesLangue } from "./langue-courante.server.ts";

export const MARGE_CORPS_IMAGE_LIEU = 16 * 1024;

const DELAI_API_MS = 20_000;
const METHODES = new Set(["PUT", "DELETE"]);
const ENTETES = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };

export type DependancesImagesLieuPro = {
  lireJeton: (requete: Request) => Promise<string | null>;
  appeler?: typeof fetch;
  adresseApi?: string;
};

const repondre = (statut: number, corps: object, entetes: Record<string, string> = {}) =>
  Response.json(corps, { status: statut, headers: { ...ENTETES, ...entetes } });

const refuser = (statut: number, erreur: string, entetes: Record<string, string> = {}) => repondre(statut, { ok: false, erreur }, entetes);

const lireQuelle = (texte: string | undefined): ImageLieu | null => IMAGES_LIEU.find((quelle) => quelle === texte) ?? null;

const lireLieuId = (texte: string | undefined): number | null => (texte && /^\d{1,9}$/.test(texte) && Number(texte) > 0 ? Number(texte) : null);

function vientDuSite(requete: Request): boolean {
  const origine = requete.headers.get("origin");
  if (origine === null) return true;
  try {
    return new URL(origine).host === new URL(requete.url).host;
  } catch {
    return false;
  }
}

const lireType = (requete: Request) => (requete.headers.get("content-type") ?? "").split(";")[0]!.trim().toLowerCase();

async function lireCorpsLimite(requete: Request, limite: number): Promise<Uint8Array<ArrayBuffer> | "trop-lourd"> {
  const annonce = Number(requete.headers.get("content-length") ?? Number.NaN);
  if (Number.isFinite(annonce) && annonce > limite) return "trop-lourd";
  if (!requete.body) return new Uint8Array(0);
  const lecteur = requete.body.getReader();
  const morceaux: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await lecteur.read();
    if (done) break;
    total += value.byteLength;
    if (total > limite) {
      await lecteur.cancel().catch(() => undefined);
      return "trop-lourd";
    }
    morceaux.push(value);
  }
  const corps = new Uint8Array(total);
  let position = 0;
  for (const morceau of morceaux) {
    corps.set(morceau, position);
    position += morceau.byteLength;
  }
  return corps;
}

export async function transmettreImageLieu(
  requete: Request,
  idTexte: string | undefined,
  quelleTexte: string | undefined,
  { lireJeton, appeler = fetch, adresseApi = process.env.ADRESSE_API ?? "http://127.0.0.1:5192" }: DependancesImagesLieuPro,
): Promise<Response> {
  const methode = requete.method.toUpperCase();
  if (!METHODES.has(methode)) return refuser(405, "methode-refusee", { Allow: "PUT, DELETE" });
  const lieuId = lireLieuId(idTexte);
  const quelle = lireQuelle(quelleTexte);
  if (lieuId === null || quelle === null) return refuser(404, "lieu-inconnu");
  if (!vientDuSite(requete)) return refuser(403, "origine-refusee");
  const jeton = await lireJeton(requete);
  if (!jeton) return refuser(401, "session-expiree");

  const regle = REGLES_IMAGES_LIEU[quelle];
  let corps: Uint8Array<ArrayBuffer> | null = null;
  if (methode === "PUT") {
    if (lireType(requete) !== regle.type) return refuser(400, "image-lieu-invalide");
    const lu = await lireCorpsLimite(requete, regle.poidsMax + MARGE_CORPS_IMAGE_LIEU).catch(() => null);
    if (lu === "trop-lourd") return refuser(413, "image-lieu-trop-lourde");
    if (!lu || lu.byteLength === 0) return refuser(400, "image-lieu-invalide");
    corps = lu;
  }

  const ip = requete.headers.get("x-real-ip");
  let reponse: Response;
  try {
    reponse = await appeler(`${adresseApi}/pro/lieux/${lieuId}/${quelle}`, {
      method: methode,
      headers: { "X-Session-Compte": jeton, ...entetesLangue(), ...(ip ? { "X-IP-Visiteur": ip } : {}), ...(corps ? { "Content-Type": regle.type } : {}) },
      body: corps ?? undefined,
      signal: AbortSignal.timeout(DELAI_API_MS),
    });
  } catch {
    return refuser(502, "erreur-serveur");
  }
  const lu: unknown = await reponse.json().catch(() => null);
  if (typeof lu !== "object" || lu === null || Array.isArray(lu)) return refuser(502, "erreur-serveur");
  const attente = reponse.headers.get("retry-after");
  return repondre(reponse.status, lu, attente && /^\d{1,7}$/.test(attente) ? { "Retry-After": attente } : {});
}
