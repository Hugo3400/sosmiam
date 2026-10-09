// Les avis, version API (routes /app/avis, contrat dans apps/api/src/routes/avis.ts).

import type { AvisPublic, ResumeAvis } from "../../types/avis.ts";
import type { Visite } from "../../types/visite.ts";
import type { ClientHttp } from "../client-http.ts";
import type { ServiceAvis } from "../contrat-avis.ts";

export function creerAvisApi(client: ClientHttp): ServiceAvis {
  return {
    listerAvisAEcrire: () => client.demander<{ visites: Visite[] }>("GET", "/app/avis/a-ecrire"),
    envoyerAvis: (avis) => client.demander<{ pointsGagnes: number; avis?: AvisPublic }>("POST", "/app/avis", { corps: avis }),
    listerAvisLieu: (lieuId, apres) =>
      client.demander<{ resume: ResumeAvis; avis: AvisPublic[]; suite?: string | null }>(
        "GET",
        `/app/avis/lieux/${lieuId}${apres ? `?apres=${encodeURIComponent(apres)}` : ""}`,
        { session: false },
      ),
    envoyerAvisNonVerifie: (avis) => client.demander<{ pointsGagnes: number; avis?: AvisPublic }>("POST", "/app/avis/non-verifie", { corps: avis }),
  };
}
