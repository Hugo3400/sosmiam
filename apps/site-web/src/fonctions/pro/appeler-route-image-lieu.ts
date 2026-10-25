import { REGLES_IMAGES_LIEU, type ImageLieu } from "../../../../../packages/commun/src/regles/images-lieu.ts";
import type { ReponseImageLieu } from "../../types/images-lieu.ts";
import { lireImageLieu } from "../lieux/lire-image-lieu.ts";

const ERREUR_PAR_DEFAUT = "erreur-serveur";

function lireJusqua(details: unknown): string | null {
  const jusqua = typeof details === "object" && details !== null ? (details as Record<string, unknown>).jusqua : null;
  return typeof jusqua === "string" && jusqua.length <= 40 && !Number.isNaN(Date.parse(jusqua)) ? jusqua : null;
}

export async function appelerRouteImageLieu(lieuId: number, quelle: ImageLieu, image: Blob | null, appeler: typeof fetch = fetch): Promise<ReponseImageLieu> {
  let reponse: Response;
  try {
    reponse = await appeler(`/lieu/${lieuId}/images/${quelle}`, {
      method: image ? "PUT" : "DELETE",
      headers: { Accept: "application/json", ...(image ? { "Content-Type": REGLES_IMAGES_LIEU[quelle].type } : {}) },
      body: image ?? undefined,
      credentials: "same-origin",
    });
  } catch {
    return { ok: false, erreur: "hors-ligne", jusqua: null };
  }
  const corps: unknown = await reponse.json().catch(() => null);
  const lu = typeof corps === "object" && corps !== null ? (corps as Record<string, unknown>) : {};
  if (reponse.ok && lu.ok === true) return { ok: true, adresse: lireImageLieu(lu.adresse) };
  const erreur = typeof lu.erreur === "string" && /^[a-z-]{1,60}$/.test(lu.erreur) ? lu.erreur : ERREUR_PAR_DEFAUT;
  return { ok: false, erreur, jusqua: lireJusqua(lu.details) };
}
