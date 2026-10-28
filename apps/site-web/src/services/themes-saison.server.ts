import { ENTETE_LANGUE, LANGUE_PAR_DEFAUT, type Langue } from "../../../../packages/commun/src/regles/langues.ts";
import type { ThemeSaisonApi } from "../../../../packages/commun/src/types/theme-saison.ts";
import { calculerThemeSaisonLocal } from "~/fonctions/themes-saison/calculer-theme-saison-local";
import { lireThemeSaisonApi } from "../../../../packages/commun/src/fonctions/themes-saison/lire-theme-saison-api.ts";

const ADRESSE_API = process.env.ADRESSE_API ?? "http://127.0.0.1:5192";
const DELAI_API = 1500;

type ReponseThemes = { ok: true; theme: ThemeSaisonApi | null } | { ok: false };

async function demanderThemeApi(ip: string | null, langue: Langue): Promise<ReponseThemes> {
  try {
    const reponse = await fetch(`${ADRESSE_API}/app/themes`, {
      headers: { [ENTETE_LANGUE]: langue, ...(ip ? { "X-IP-Visiteur": ip } : {}) },
      signal: AbortSignal.timeout(DELAI_API),
    });
    if (!reponse.ok) return { ok: false };
    const corps: unknown = await reponse.json();
    if (typeof corps !== "object" || corps === null || !("themes" in corps) || !Array.isArray(corps.themes)) return { ok: false };
    if (corps.themes.length === 0) return { ok: true, theme: null };
    const theme = lireThemeSaisonApi(corps.themes[0]);
    return theme ? { ok: true, theme } : { ok: false };
  } catch {
    return { ok: false };
  }
}

export async function lireThemeSaisonAccueil(
  ip: string | null,
  horloge: () => number = Date.now,
  langue: Langue = LANGUE_PAR_DEFAUT,
): Promise<ThemeSaisonApi | null> {
  const reponse = await demanderThemeApi(ip, langue);
  return reponse.ok ? reponse.theme : calculerThemeSaisonLocal(horloge(), langue);
}
