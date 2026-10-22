import { chiffrerApercuPush } from "../../fonctions/notifications/chiffrer-apercu-push.ts";
import { calculerEmpreinteJeton } from "../../fonctions/securite/calculer-empreinte-jeton.ts";
import { CONTEXTES_SOCIAUX, type ChiffrementSocial } from "../chiffrement-social.ts";

export type ApercuPush = { titre: string; texte: string };

export type ApercusPush = {
  garderCle: (cle: Uint8Array, jeton: string) => string;
  chiffrerPour: (apercu: ApercuPush, appareil: { jeton: string; cleApercuChiffree: string }) => string;
};

export function creerApercusPush(social: ChiffrementSocial | null): ApercusPush | null {
  if (!social) return null;
  const contexte = (jeton: string) => CONTEXTES_SOCIAUX.appareil(calculerEmpreinteJeton(jeton));
  return {
    garderCle: (cle, jeton) => {
      if (cle.length !== 32) throw new Error("La clé d'aperçu doit faire 32 octets");
      return social.chiffrerTexte("apercus", contexte(jeton), Buffer.from(cle).toString("base64url"));
    },
    chiffrerPour: (apercu, appareil) => {
      const cle = Buffer.from(social.dechiffrerTexte("apercus", contexte(appareil.jeton), appareil.cleApercuChiffree), "base64url");
      return chiffrerApercuPush(apercu, cle);
    },
  };
}

let apercusBranches: ApercusPush | null = null;

export function brancherApercusPush(apercus: ApercusPush | null): void {
  apercusBranches = apercus;
}

export const lireApercusBranches = (): ApercusPush | null => apercusBranches;
