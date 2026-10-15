// « Ton compte est limité » : la limitation de la personne connectée (en cours ou à venir) et sa contestation, une fois,
// pendant la limitation (décision de Hugo du 15 octobre 2026). Contrat : routes/comptes.ts. Jamais le texte d'une
// contestation au journal.
import type { Request, Response } from "express";

import { presenterLimitation } from "../fonctions/comptes/presenter-limitation.ts";
import { LONGUEUR_MAX_TEXTE_LIMITATION, LONGUEUR_MIN_TEXTE_LIMITATION, type ServicesLimitations } from "../services/limitations-comptes-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

export function creerControleursLimitation(
  limitations: Pick<ServicesLimitations, "lireLimitationDuCompte" | "contesterLimitation"> | undefined, horloge: () => number,
) {
  return {
    /** GET /comptes/moi/limitation → { ok, limitation: LimitationVue | null } (null aussi sans service branché) */
    async lire(_requete: Request, reponse: Response) {
      const maintenant = new Date(horloge());
      const limitation = limitations ? await limitations.lireLimitationDuCompte(lireCompteId(reponse), maintenant) : null;
      reponse.json({ ok: true, limitation: limitation ? presenterLimitation(limitation, maintenant) : null });
    },

    /** POST /comptes/moi/limitation/contestation { texte } → { ok, limitation } */
    async contester(requete: Request, reponse: Response) {
      const brut = lireCorps(requete).texte;
      const texte = typeof brut === "string" ? brut.trim() : "";
      if (texte.length < LONGUEUR_MIN_TEXTE_LIMITATION || texte.length > LONGUEUR_MAX_TEXTE_LIMITATION) throw new ChampInvalide("texte");
      if (!limitations) return reponse.status(404).json({ ok: false, erreur: "aucune-limitation" });
      const maintenant = new Date(horloge());
      const resultat = await limitations.contesterLimitation(lireCompteId(reponse), texte, maintenant);
      if (!resultat.ok) return reponse.status(resultat.erreur === "deja-conteste" ? 409 : 404).json({ ok: false, erreur: resultat.erreur });
      reponse.json({ ok: true, limitation: presenterLimitation(resultat.limitation, maintenant) });
    },
  };
}
