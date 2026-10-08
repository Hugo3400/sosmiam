// Contrôleurs du logiciel de gestion pour les notifications push : état (Apple, Google, téléphones), liste, estimation
// avant envoi (anti-spam compris), création (tout de suite ou programmée) et annulation.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { CiblePush } from "../../services/notifications/file-push.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireId, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
/** On programme au plus 60 jours à l'avance */
const HORIZON = 60 * 86_400_000;

/** La cible (paramètres de l'adresse ou corps) : une ville ou toutes, iPhone, Android ou les deux. */
function lireCible(source: Record<string, unknown>): CiblePush {
  const ville = typeof source.ville === "string" ? source.ville.trim().slice(0, 80) : "";
  const plateforme = source.plateforme === "ios" || source.plateforme === "android" ? source.plateforme : null;
  return { ville: ville || null, plateforme };
}
const decrireCible = (cible: CiblePush) =>
  [cible.ville ? `À ${cible.ville}` : "Tout le monde", cible.plateforme === "ios" ? "iPhone" : cible.plateforme === "android" ? "Android" : ""].filter(Boolean).join(" · ");

function verifier(controleur: (requete: Request, reponse: Response) => Promise<unknown>) {
  return async (requete: Request, reponse: Response) => {
    try {
      await controleur(requete, reponse);
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
}

export function creerControleursNotifications(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);

  return {
    liste: verifier(async (_requete, reponse) => {
      const [etat, notifications] = await Promise.all([s.lireEtatPush(), s.listerNotifications()]);
      reponse.json({ etat, notifications });
    }),
    estimation: verifier(async (requete, reponse) => reponse.json(await s.estimerPush(lireCible(requete.query as Record<string, unknown>), false))),
    creer: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const lien = typeof corps.lien === "string" && corps.lien.trim() ? corps.lien.trim() : null;
      // Un écran de l'app, jamais une adresse extérieure : « /lieu/12 », « /explorer »…
      if (lien && (lien.length > 200 || !/^\/[a-z0-9/-]*$/.test(lien))) throw new ChampInvalide("lien");
      let programmeeLe = new Date();
      if (typeof corps.programmeeLe === "string" && corps.programmeeLe) {
        const date = new Date(corps.programmeeLe);
        if (Number.isNaN(date.getTime()) || date.getTime() > Date.now() + HORIZON) throw new ChampInvalide("programmeeLe");
        if (date > programmeeLe) programmeeLe = date;
      }
      const cible = lireCible(corps);
      const cree = await s.creerNotification({
        titre: lireTexte(corps, "titre", 60, true), texte: lireTexte(corps, "texte", 180, true), lien, cible, description: decrireCible(cible), programmeeLe,
      });
      await noter(reponse, programmeeLe.getTime() > Date.now() + 60_000 ? "Notification programmée" : "Notification envoyée", `notification n° ${cree.id} · ${decrireCible(cible)}`);
      reponse.status(201).json(cree);
    }),
    annuler: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id) ?? 0;
      if (!(await s.annulerNotification(id))) return reponse.status(409).json({ ok: false, erreur: "deja-partie" });
      await noter(reponse, "Notification annulée", `notification n° ${id}`);
      reponse.json({ ok: true });
    }),
  };
}
