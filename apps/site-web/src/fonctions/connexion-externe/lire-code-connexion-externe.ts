import { TEXTES_CONNEXION_EXTERNE, type CodeConnexionExterne } from "../../contenus/connexion-externe.ts";

export function lireCodeConnexionExterne(code: string | null): CodeConnexionExterne | null {
  return code !== null && Object.hasOwn(TEXTES_CONNEXION_EXTERNE.messages, code) ? (code as CodeConnexionExterne) : null;
}
