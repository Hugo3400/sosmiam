import type { ClientHttp } from "@sos-miam/commun/client-api/client-http";
import type { ReponseApi } from "@sos-miam/commun/client-api/reponse-api";

/**
 * Le même client HTTP, qui prévient `surLimite` à chaque réponse « compte-limite » de l'API (403, details.jusqua : la fin en
 * ISO, ou null jusqu'à nouvel ordre). Les réponses passent telles quelles : les écrans qui disent déjà leurs refus ne
 * changent pas. Une erreur dans `surLimite` ne remonte jamais jusqu'à l'écran.
 */
export function observerCompteLimite(client: ClientHttp, surLimite: (jusqua: string | null) => void): ClientHttp {
  const prevenir = (jusqua: unknown) => {
    try {
      surLimite(typeof jusqua === "string" ? jusqua : null);
    } catch {
      // L'annonce n'est qu'un plus : la réponse arrive quand même
    }
  };
  function verifier<T extends object>(reponse: ReponseApi<T>): ReponseApi<T> {
    if (reponse.ok === false && reponse.erreur === "compte-limite") prevenir(reponse.details?.jusqua);
    return reponse;
  }

  return {
    async demander<T extends object>(...args: Parameters<ClientHttp["demander"]>) {
      return verifier(await client.demander<T>(...args));
    },
    async demanderBrut(...args: Parameters<ClientHttp["demanderBrut"]>) {
      const reponse = await client.demanderBrut(...args);
      if (reponse?.corps.erreur === "compte-limite") {
        const details = reponse.corps.details;
        prevenir(typeof details === "object" && details !== null ? (details as Record<string, unknown>).jusqua : null);
      }
      return reponse;
    },
    async envoyerOctets<T extends object>(...args: Parameters<ClientHttp["envoyerOctets"]>) {
      return verifier(await client.envoyerOctets<T>(...args));
    },
    preparerTelechargement: (chemin) => client.preparerTelechargement(chemin),
  };
}
