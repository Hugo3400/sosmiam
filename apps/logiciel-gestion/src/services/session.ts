import { appeler, definirSession } from "./client-gestion.ts";

export type SessionOuverte = { session: string; poste: string; inactiviteMax: number };

/** Ouvre une session avec le code à 6 chiffres de l'application d'authentification. */
export async function ouvrirSession(code: string): Promise<SessionOuverte> {
  const ouverte = await appeler<SessionOuverte>("POST", "/session", { corps: { code } });
  definirSession(ouverte.session);
  return ouverte;
}

export async function fermerSession(): Promise<void> {
  try {
    await appeler("DELETE", "/session");
  } finally {
    definirSession(null);
  }
}
