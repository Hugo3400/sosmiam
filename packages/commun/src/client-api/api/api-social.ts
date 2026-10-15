// Le service social, version API (routes /app/social, /app/personnes et /app/masques ; contrat dans contrat-social.ts).
// Le début d'un pseudo cherché part dans le corps : rien de personnel dans les adresses (gardées par les journaux de nginx).

import type { ExportSocialApi } from "../../types/export-social.ts";
import type { ListeResumeApi } from "../../types/listes.ts";
import type { MoiSocial, PoulsSocial, ProfilCommunautaireApi, SuggestionPersonneApi } from "../../types/social.ts";
import type { PageLiensSuiviApi } from "../../types/suivis.ts";
import type { ClientHttp } from "../client-http.ts";
import type { MasqueSocial, ResultatRecherchePersonne, ServiceSocial } from "../contrat-social.ts";

/** L'export rassemble et déchiffre tous tes messages : il peut prendre bien plus que les 15 s d'une demande ordinaire */
const DELAI_EXPORT_MS = 60_000;

/** « ?apres=<suite> » : la suite de la page d'avant, opaque, renvoyée telle quelle ; rien pour la première page */
const ecrireApres = (suite?: string) => (suite ? `?apres=${encodeURIComponent(suite)}` : "");

export function creerSocialApi(client: ClientHttp): ServiceSocial {
  /** Adresse d'une personne, par son identifiant public */
  const personne = (id: string) => `/app/personnes/${encodeURIComponent(id)}`;
  return {
    lireMoi: () => client.demander<{ moi: MoiSocial | null }>("GET", "/app/social/moi"),
    ouvrirProfil: () => client.demander<{ moi: MoiSocial }>("POST", "/app/social/moi"),
    modifierReglages: (r) => client.demander<{ moi: MoiSocial }>("PATCH", "/app/social/moi", { corps: r }),
    lirePouls: () => client.demander<{ pouls: PoulsSocial }>("GET", "/app/social/pouls"),
    chercher: (debut) => client.demander<{ resultats: ResultatRecherchePersonne[] }>("POST", "/app/personnes/recherche", { corps: { debut } }),
    suggerer: () => client.demander<{ suggestions: SuggestionPersonneApi[] }>("GET", "/app/personnes/suggestions"),
    exporter: () => client.demander<{ export: ExportSocialApi }>("GET", "/app/social/export", { delaiMs: DELAI_EXPORT_MS }),
    lireProfil: (id) => client.demander<{ profil: ProfilCommunautaireApi }>("GET", personne(id)),
    listerLiensDe: (id, sens, apres) => client.demander<PageLiensSuiviApi>("GET", `${personne(id)}/${sens}${ecrireApres(apres)}`),
    listerListesDe: (id) => client.demander<{ listes: ListeResumeApi[] }>("GET", `${personne(id)}/listes`),
    listerMasques: (cible) => client.demander<{ masques: MasqueSocial[] }>("GET", cible ? `/app/masques?cible=${encodeURIComponent(cible)}` : "/app/masques"),
    masquer: (cible, cibleId, masque) =>
      client.demander(masque ? "PUT" : "DELETE", `/app/masques/${encodeURIComponent(cible)}/${encodeURIComponent(cibleId)}`),
  };
}
