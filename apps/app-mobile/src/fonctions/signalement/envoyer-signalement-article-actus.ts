import type { SignalementArticleActus } from "@sos-miam/commun/types/signalement";

import { clientApiSignalements } from "~/services/client-api-signalements";

export async function envoyerSignalementArticleActus(signalement: SignalementArticleActus): Promise<boolean> {
  const r = await clientApiSignalements.demander("POST", "/signalements", { corps: signalement });
  return r.ok;
}
