// « Mon équipe » (gérant validé seulement) : la liste, inviter un employé qui a déjà un compte (rattachement « equipe »
// « en-attente », que l'employé accepte lui-même : l'équipe SOS Miam ne s'en mêle pas), retirer un membre.
// Contrat : routes/pro.ts.
import type { Request, Response } from "express";

import type { AccesPro } from "../middlewares/proteger-pro.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { LireMajoriteInvite, ServicesPro } from "../services/pro-regles.ts";
import { lireCompteId, lireCorps, lireEmail } from "./comptes-champs.ts";

/** Par gérant : 30 essais d'invitation par 24 heures, réussis ou non (on ne sonde pas les e-mails des comptes) */
export const ESSAIS_INVITATION_PAR_JOUR = 30;
const UN_JOUR = 24 * 3600_000;
const SUIVIS_MAX = 10_000;
export const MESSAGE_COMPTE_INCONNU =
  "Pas de compte SOS Miam à cette adresse pour l'instant. Propose à cette personne de créer son compte (c'est gratuit), puis invite-la de nouveau.";

/** 409 « compte-mineur » : jamais l'âge exact, seulement que l'espace pro attend ses 18 ans */
export const MESSAGE_COMPTE_MINEUR =
  "Cette personne ne peut pas encore rejoindre une équipe : l'espace pro est réservé aux 18 ans et plus.";

export function creerControleursEquipe(services: ServicesPro, horloge: () => number, lireMajorite: LireMajoriteInvite) {
  /** En mémoire seulement : moments des derniers essais d'invitation, par id du gérant */
  const essais = new Map<number, number[]>();
  function compterEssai(compteId: number): boolean {
    const maintenant = horloge();
    const recents = (essais.get(compteId) ?? []).filter((moment) => maintenant - moment < UN_JOUR);
    if (recents.length >= ESSAIS_INVITATION_PAR_JOUR) return false;
    recents.push(maintenant);
    essais.delete(compteId);
    essais.set(compteId, recents);
    if (essais.size > SUIVIS_MAX) essais.delete(essais.keys().next().value as number);
    return true;
  }

  return {
    /** GET /pro/lieux/:id/equipe */
    async lister(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, equipe: await services.listerEquipe((reponse.locals.pro as AccesPro).lieuId) });
    },

    /** POST /pro/lieux/:id/equipe : { email } */
    async inviter(requete: Request, reponse: Response) {
      const email = lireEmail(lireCorps(requete));
      const compteId = lireCompteId(reponse);
      if (!compterEssai(compteId)) return reponse.status(429).json({ ok: false, erreur: "trop-de-demandes" });
      const resultat = await services.inviterMembre((reponse.locals.pro as AccesPro).lieuId, compteId, email, new Date(horloge()), lireMajorite);
      if (resultat.ok) return reponse.status(201).json({ ok: true });
      if (resultat.erreur === "compte-inconnu") return reponse.status(404).json({ ok: false, erreur: "compte-inconnu", message: MESSAGE_COMPTE_INCONNU });
      if (resultat.erreur === "compte-mineur") return reponse.status(409).json({ ok: false, erreur: "compte-mineur", message: MESSAGE_COMPTE_MINEUR });
      if (resultat.erreur === "chiffrement-indisponible") return reponse.status(503).json({ ok: false, erreur: "chiffrement-indisponible" });
      reponse.status(409).json({ ok: false, erreur: resultat.erreur });
    },

    /** DELETE /pro/lieux/:id/equipe/:compteId */
    async retirer(requete: Request, reponse: Response) {
      const membre = lireIdentifiant(requete.params.compteId);
      const fait = membre !== null && (await services.retirerMembre((reponse.locals.pro as AccesPro).lieuId, membre, new Date(horloge())));
      if (!fait) return reponse.status(404).json({ ok: false, erreur: "membre-inconnu" });
      reponse.json({ ok: true });
    },
  };
}
