import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { estLienPermis } from "~/fonctions/notifications/est-lien-permis";

export type OptionsLienEntrant = { expoGo: boolean };

const ACCUEIL = "/";
const LONGUEUR_MAX = 2048;
const SCHEMA_QUELCONQUE = /^[a-z][a-z0-9+.-]*:/i;
const SCHEMA_APP = /^sosmiam:/i;
const DEBUT_LIEN_APP = /^sosmiam:\/\//i;
const ORIGINE_SITE = /^https:\/\/(?:www\.)?sosmiam\.fr(?=[/?#]|$)/i;
const SCHEMA_EXPO_GO = /^exps?:\/\//i;
const SEPARATEUR_EXPO_GO = "/--/";
const SEGMENT_PERMIS = /^[a-z0-9@._-]{1,64}$/i;
const POINTS_SEULS = /^\.+$/;
const CODE_INVITATION = /(?:^|&)c=([a-z0-9]{6,64})(?:&|$)/i;
const PAGES_DE_PSEUDO = new Set(["invitation", "createur"]);
const PAGES_A_CODE = [/^\/l\/[a-z2-9]{8}$/, /^\/lieux\/[1-9]\d{0,8}$/, /^\/q\/[a-z2-9]{32}$/];
const ENTREES_DES_ESPACES = new Set(["/ambassadeur", "/pro/comptoir", "/pro/reservations"]);

const commencerParBarre = (reste: string) => (reste.startsWith("/") ? reste : `/${reste}`);

function retirerOrigine(adresse: string, options: OptionsLienEntrant): string | null {
  const lienApp = DEBUT_LIEN_APP.exec(adresse);
  if (lienApp) return commencerParBarre(adresse.slice(lienApp[0].length));
  if (SCHEMA_APP.test(adresse)) return ACCUEIL;
  const site = ORIGINE_SITE.exec(adresse);
  if (site) return commencerParBarre(adresse.slice(site[0].length));
  if (options.expoGo && SCHEMA_EXPO_GO.test(adresse)) {
    const separateur = adresse.indexOf(SEPARATEUR_EXPO_GO);
    return separateur < 0 ? ACCUEIL : adresse.slice(separateur + SEPARATEUR_EXPO_GO.length - 1);
  }
  if (SCHEMA_QUELCONQUE.test(adresse)) return null;
  return adresse.startsWith("/") ? adresse : ACCUEIL;
}

function lireSegments(chemin: string): string[] | null {
  const morceaux = chemin.slice(1).split("/");
  if (morceaux.length > 1 && morceaux.at(-1) === "") morceaux.pop();
  if (morceaux.length === 1 && morceaux[0] === "") return [];
  const segments: string[] = [];
  for (const morceau of morceaux) {
    let segment: string;
    try {
      segment = decodeURIComponent(morceau);
    } catch {
      return null;
    }
    if (!SEGMENT_PERMIS.test(segment) || POINTS_SEULS.test(segment)) return null;
    segments.push(segment);
  }
  return segments;
}

function lirePseudo(segment: string): string | null {
  const pseudo = segment.replace(/^@/, "").toLowerCase();
  return estPseudoValide(pseudo) ? pseudo : null;
}

function lirePageDePseudo(page: string, segment: string, recherche: string): string {
  const pseudo = lirePseudo(segment);
  if (!pseudo) return ACCUEIL;
  const code = page === "invitation" ? CODE_INVITATION.exec(recherche)?.[1] : undefined;
  return `/${page}/${pseudo}${code ? `?c=${code.toLowerCase()}` : ""}`;
}

export function trierLienEntrant(adresse: string, options: OptionsLienEntrant): string | null {
  const reste = retirerOrigine(adresse, options);
  if (reste === null) return null;
  if (adresse.length > LONGUEUR_MAX) return ACCUEIL;
  const sansFragment = reste.split("#")[0];
  const debutRecherche = sansFragment.indexOf("?");
  const chemin = debutRecherche < 0 ? sansFragment : sansFragment.slice(0, debutRecherche);
  const recherche = debutRecherche < 0 ? "" : sansFragment.slice(debutRecherche + 1);
  const segments = lireSegments(chemin);
  if (!segments) return ACCUEIL;
  if (segments.length === 2 && PAGES_DE_PSEUDO.has(segments[0])) return lirePageDePseudo(segments[0], segments[1], recherche);
  const cheminPropre = `/${segments.join("/")}`;
  const prevu = PAGES_A_CODE.some((forme) => forme.test(cheminPropre)) || ENTREES_DES_ESPACES.has(cheminPropre) || estLienPermis(cheminPropre);
  return prevu ? cheminPropre : ACCUEIL;
}
