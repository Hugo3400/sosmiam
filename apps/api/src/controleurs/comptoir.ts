// Le comptoir de l'équipe d'un lieu (voir routes/comptoir.ts) : lecture de la demande et réponse ; les points du client
// sont posés une fois la visite décidée. Le rôle est vérifié par les services, sur la ressource.
import type { Request, Response } from "express";

import { PERSONNES_PRESENTATION_MAX } from "../../../../packages/commun/src/regles/visites.ts";
import type { ReglageFidelite } from "../../../../packages/commun/src/types/fidelite.ts";
import { validerReglementVisite } from "../../../../packages/commun/src/validation/valider-reglement-visite.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { creerComptoir } from "../services/comptoir.ts";
import type { EchecVisite } from "../services/visites-outils.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { champInvalide, lireMotif, poserPoints, repondreEchec, type DependancesVisites } from "./visites.ts";

type Comptoir = ReturnType<typeof creerComptoir>;

export function creerControleursComptoir(comptoir: Comptoir, ajouterPoints: DependancesVisites["ajouterPoints"]) {
  const rendre = async (reponse: Response, r: ({ ok: true } & Record<string, unknown>) | EchecVisite) => {
    if (!r.ok) return repondreEchec(reponse, r);
    const { pointsAPoser, ...corps } = r;
    await poserPoints(ajouterPoints, pointsAPoser as Parameters<typeof poserPoints>[1]);
    return reponse.json(corps);
  };
  /** L'identifiant de l'adresse (:id, :visiteId, :demandeId), ou null après avoir répondu 400 */
  const lire = (requete: Request, reponse: Response, nom: string) => {
    const id = lireIdentifiant(requete.params[nom]);
    if (id === null) champInvalide(reponse, nom);
    return id;
  };

  return {
    async listerLieux(_q: Request, reponse: Response) {
      await rendre(reponse, await comptoir.listerLieux(lireCompteId(reponse)));
    },

    async lire(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId !== null) await rendre(reponse, await comptoir.lireComptoir(lireCompteId(reponse), lieuId));
    },

    async montrerQr(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId === null) return;
      const corps = lireCorps(requete);
      const personnes = corps.personnes ?? 1;
      if (typeof personnes !== "number" || !Number.isInteger(personnes) || personnes < 1 || personnes > PERSONNES_PRESENTATION_MAX) return champInvalide(reponse, "personnes");
      const reglement = validerReglementVisite(corps.reglement);
      if (!reglement) return reponse.status(400).json({ ok: false, erreur: "reglement-invalide" });
      await rendre(reponse, await comptoir.montrerQr(lireCompteId(reponse), lieuId, personnes, reglement));
    },

    async cacherQr(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId !== null) await rendre(reponse, await comptoir.cacherQr(lireCompteId(reponse), lieuId));
    },

    async marquerReglee(requete: Request, reponse: Response) {
      const visiteId = lire(requete, reponse, "visiteId");
      if (visiteId === null) return;
      const corps = lireCorps(requete);
      const code = corps.code ?? null;
      if (code !== null && (typeof code !== "string" || code.length > 10)) return champInvalide(reponse, "code");
      const reglement = validerReglementVisite(corps.reglement);
      if (!reglement) return reponse.status(400).json({ ok: false, erreur: "reglement-invalide" });
      await rendre(reponse, await comptoir.marquerReglee(lireCompteId(reponse), visiteId, code, reglement));
    },

    async refuser(requete: Request, reponse: Response) {
      const visiteId = lire(requete, reponse, "visiteId");
      if (visiteId === null) return;
      const motif = lireMotif(lireCorps(requete).motif);
      if (!motif) return champInvalide(reponse, "motif");
      await rendre(reponse, await comptoir.refuser(lireCompteId(reponse), visiteId, motif));
    },

    async annulerValidation(requete: Request, reponse: Response) {
      const visiteId = lire(requete, reponse, "visiteId");
      if (visiteId === null) return;
      const motif = lireMotif(lireCorps(requete).motif);
      if (!motif) return champInvalide(reponse, "motif");
      await rendre(reponse, await comptoir.annulerValidation(lireCompteId(reponse), visiteId, motif));
    },

    async offrirRecompense(requete: Request, reponse: Response) {
      const demandeId = lire(requete, reponse, "demandeId");
      if (demandeId !== null) await rendre(reponse, await comptoir.offrirRecompense(lireCompteId(reponse), demandeId));
    },

    async lireProgramme(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId !== null) await rendre(reponse, await comptoir.lireProgramme(lireCompteId(reponse), lieuId));
    },

    async reglerProgramme(requete: Request, reponse: Response) {
      const lieuId = lire(requete, reponse, "id");
      if (lieuId === null) return;
      // validerReglageFidelite revérifie chaque champ (forme comprise)
      const reglage = lireCorps(requete) as unknown as ReglageFidelite;
      await rendre(reponse, await comptoir.reglerProgramme(lireCompteId(reponse), lieuId, reglage));
    },
  };
}
