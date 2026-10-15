import { FAMILLES_ETIQUETTES } from "../contenus/etiquettes-officielles.ts";
import { normaliserEtiquette } from "../fonctions/etiquettes/normaliser-etiquette.ts";
import { parleDAlcool } from "../fonctions/prevention/parle-d-alcool.ts";
import { LONGUEUR_MAX_ETIQUETTE_LIBRE, LONGUEUR_MIN_ETIQUETTE_LIBRE } from "../regles/etiquettes.ts";
import type { EtiquetteLibreLue } from "../types/etiquette.ts";
import { nomPublicContientMotInterdit } from "./nom-public-contient-mot-interdit.ts";

const OFFICIELLES = new Map(FAMILLES_ETIQUETTES.flatMap((f) => f.etiquettes).map((nom) => [normaliserEtiquette(nom), nom]));

export function lireEtiquetteLibre(texte: string): EtiquetteLibreLue {
  const nom = texte.replace(/\s+/g, " ").trim();
  if (nom === "") return { ok: false, refus: "vide" };
  const officielle = OFFICIELLES.get(normaliserEtiquette(nom));
  if (officielle) return { ok: true, nom: officielle, officielle: true };
  const longueur = [...nom].length;
  if (longueur < LONGUEUR_MIN_ETIQUETTE_LIBRE) return { ok: false, refus: "trop-courte" };
  if (longueur > LONGUEUR_MAX_ETIQUETTE_LIBRE) return { ok: false, refus: "trop-longue" };
  if (nomPublicContientMotInterdit(nom)) return { ok: false, refus: "mot-interdit" };
  if (parleDAlcool(nom)) return { ok: false, refus: "alcool" };
  return { ok: true, nom: nom.charAt(0).toLocaleUpperCase("fr") + nom.slice(1), officielle: false };
}
