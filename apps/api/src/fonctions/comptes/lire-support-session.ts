import type { SupportSession } from "./est-session-expiree.ts";

/** Le support d'une session tel que la base le garde (« site » ou « app ») ; toute autre valeur compte comme « site ». */
export function lireSupportSession(valeur: unknown): SupportSession {
  return valeur === "app" ? "app" : "site";
}
