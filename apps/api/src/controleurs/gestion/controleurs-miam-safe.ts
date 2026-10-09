// Contrôleurs de Miam Safe dans le logiciel de gestion : signalements (à lire sous 48 h), alertes sans réponse, chartes.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import { ACTIONS_MIAM_SAFE } from "../../services/gestion/actions-miam-safe.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireParametre, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};
const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

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

const LIBELLES_ACTION = {
  aucune: "rien à faire",
  "lieu-contacte": "lieu contacté",
  "charte-retiree": "charte retirée",
  "lieu-masque": "charte retirée et lieu masqué",
} as const;

export function creerControleursMiamSafe(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    /** GET /miam-safe?vue=a-traiter|traite|alertes|chartes */
    liste: verifier(async (requete, reponse) => reponse.json(await s.listerMiamSafe(lireParametre(requete.query.vue, 10) || "a-traiter"))),

    /** POST /miam-safe/signalements/:id/decision : { action, note? } */
    decider: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const action = lireChoix(corps, "action", ACTIONS_MIAM_SAFE);
      const note = lireTexte(corps, "note", 1000);
      // Retirer la charte ou masquer un lieu : on écrit pourquoi (privé)
      if (action !== "aucune" && (note ?? "").length < 10) throw new ChampInvalide("note");
      const resultat = await s.deciderSignalementMiamSafe(id(requete), { action, note });
      if (!resultat) return introuvable(reponse);
      if (resultat === "deja-traite") return reponse.status(409).json({ ok: false, erreur: "deja-traite" });
      await noter(reponse, `Signalement Miam Safe traité : ${LIBELLES_ACTION[action]}`, `n° ${id(requete)}, ${resultat.lieu} (lieu n° ${resultat.lieuId})`);
      reponse.json({ ok: true });
    }),

    /** POST /miam-safe/alertes/:id/vue */
    alerteVue: verifier(async (requete, reponse) => {
      if (!(await s.marquerAlerteMiamSafeVue(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Alerte Miam Safe sans réponse vue", `n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),

    /** POST /miam-safe/chartes/:id/rendre (id du lieu) */
    rendreCharte: verifier(async (requete, reponse) => {
      if (!(await s.rendreCharteMiamSafe(id(requete)))) return introuvable(reponse);
      await noter(reponse, "Charte Miam Safe rendue au lieu", `lieu n° ${id(requete)}`);
      reponse.json({ ok: true });
    }),
  };
}
