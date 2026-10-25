import type { SignalementImageLieu } from "@sos-miam/commun/types/signalement";

import { clientApiSignalements } from "~/services/client-api-signalements";

export async function envoyerSignalementImageLieu(signalement: SignalementImageLieu): Promise<boolean> {
  const r = await clientApiSignalements.demander("POST", "/signalements", { corps: signalement });
  return r.ok;
}
