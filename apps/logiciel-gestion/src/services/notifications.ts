import { appeler, parametres } from "./client-gestion.ts";

export type EtatReglagePush = "pret" | "absent" | "mal-protege" | "incomplet";
export type EtatPush = { apple: EtatReglagePush; google: EtatReglagePush; iphone: number; android: number; programmees: number };
export type CiblePush = { ville: string; plateforme: "" | "ios" | "android" };
export type NotificationPush = {
  id: number;
  titre: string;
  texte: string;
  lien: string | null;
  description: string;
  demandee: boolean;
  programmeeLe: string;
  statut: "programmee" | "envoi" | "envoyee" | "annulee";
  total: number;
  envoyees: number;
  echecs: number;
  ignorees: number;
  creeLe: string;
  envoyeeLe: string | null;
};
export type EstimationPush = { total: number; iphone: number; android: number; antiSpam: number };

export const listerNotifications = () => appeler<{ etat: EtatPush; notifications: NotificationPush[] }>("GET", "/notifications");
export const estimerNotification = (cible: CiblePush) => appeler<EstimationPush>("GET", `/notifications/estimation${parametres(cible)}`);
export const creerNotification = (saisie: CiblePush & { titre: string; texte: string; lien: string | null; programmeeLe: string | null }) =>
  appeler<{ id: number }>("POST", "/notifications", { corps: saisie });
export const annulerNotification = (id: number) => appeler<{ ok: true }>("POST", `/notifications/${id}/annuler`, { corps: {} });
