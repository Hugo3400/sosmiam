// Le contenu de l'app, version API (routes /app/lieux, /app/publications ; contrat dans apps/api/src/routes/contenu-app.ts).
// Lectures publiques : jamais de jeton (elles peuvent être mises en cache).

import type { CarteLieu } from "../../types/carte.ts";
import type { EvenementLieuPublic } from "../../types/evenement.ts";
import type { LieuApi } from "../../types/lieu.ts";
import type { PublicationApi } from "../../types/publication.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceContenu } from "../contrat-contenu.ts";

const PUBLIQUE = { session: false } as const;

export function creerContenuApi(client: ClientHttp): ServiceContenu {
  return {
    listerLieux: (zone) =>
      client.demander<{ lieux: LieuApi[] }>("GET", zone ? `/app/lieux?nord=${zone.nord}&sud=${zone.sud}&ouest=${zone.ouest}&est=${zone.est}` : "/app/lieux", PUBLIQUE),
    lireLieu: (id) => client.demander<{ lieu: LieuApi }>("GET", `/app/lieux/${id}`, PUBLIQUE),
    lireCarte: (id) => client.demander<{ carte: CarteLieu | null; majLe: string | null }>("GET", `/app/lieux/${id}/carte`, PUBLIQUE),
    trouverParCode: (code) => client.demander<{ lieuId: number }>("GET", `/app/lieux/code/${encodeURIComponent(code)}`, PUBLIQUE),
    listerPublications: (apres, limite) => {
      const parametres = [apres ? `apres=${encodeURIComponent(apres)}` : null, limite ? `limite=${limite}` : null].filter(Boolean).join("&");
      return client.demander<{ publications: PublicationApi[]; suite: string | null }>("GET", `/app/publications${parametres ? `?${parametres}` : ""}`, PUBLIQUE);
    },
    listerEvenements: (o = {}) => {
      const parametres = [
        ...(o.zone ? [`nord=${o.zone.nord}`, `sud=${o.zone.sud}`, `ouest=${o.zone.ouest}`, `est=${o.zone.est}`] : []),
        o.du ? `du=${encodeURIComponent(o.du)}` : null,
        o.au ? `au=${encodeURIComponent(o.au)}` : null,
      ].filter(Boolean).join("&");
      return client.demander<{ evenements: EvenementLieuPublic[] }>("GET", `/app/evenements${parametres ? `?${parametres}` : ""}`, PUBLIQUE);
    },
    listerEvenementsDuLieu: (lieuId) => client.demander<{ evenements: EvenementLieuPublic[] }>("GET", `/app/evenements/lieux/${lieuId}`, PUBLIQUE),
    async compterVue(lieuId) {
      await client.demander("POST", `/app/lieux/${lieuId}/vue`, PUBLIQUE);
    },
  };
}
