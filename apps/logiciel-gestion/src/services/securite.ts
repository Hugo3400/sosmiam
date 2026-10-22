import type { ChangementsSignalementSecurite, EntreeTableauHonneur, SignalementSecuriteGestion, StatutSignalementSecurite } from "../../../../packages/commun/src/types/securite.ts";
import { appeler, parametres } from "./client-gestion.ts";

export type EntreeTableauGestion = EntreeTableauHonneur & { id: string; signalementId: string | null };

export const listerSignalementsSecurite = (statut: StatutSignalementSecurite | "") => appeler<{ signalements: SignalementSecuriteGestion[] }>("GET", `/securite/signalements${parametres({ statut })}`);
export const changerSignalementSecurite = (id: string, changements: ChangementsSignalementSecurite) =>
  appeler<{ ok: true; signalement: SignalementSecuriteGestion }>("PUT", `/securite/signalements/${id}`, { corps: changements });
export const lireCaptureSecurite = (id: string, numero: number) => appeler<Blob>("GET", `/securite/signalements/${id}/images/${numero}`, { reponse: "blob" });
export const donnerBadgeSecurite = (id: string) => appeler<{ ok: true; nouveau: boolean }>("POST", `/securite/signalements/${id}/badge`, { corps: {} });
export const supprimerSignalementSecurite = (id: string) => appeler<{ ok: true }>("DELETE", `/securite/signalements/${id}`);
export const listerTableauHonneur = () => appeler<{ entrees: EntreeTableauGestion[] }>("GET", "/securite/tableau-honneur");
export const retirerDuTableauHonneur = (id: string) => appeler<{ ok: true }>("DELETE", `/securite/tableau-honneur/${id}`);
