// Miam Safe : ce que l'app envoie (alerte silencieuse, signalement, « Tu t'es senti·e bien ici ? ») et le comptoir du lieu
// (alertes, « On arrive », charte). Contrat : routes/miam-safe.ts.
import type { Request, Response } from "express";

import { nettoyerLigne } from "../fonctions/comptes/nettoyer-ligne.ts";
import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import { lireIdentifiant, type AccesPro } from "../middlewares/proteger-pro.ts";
import {
  ENDROITS_ALERTE, RAISONS_SIGNALEMENT_MIAM_SAFE, type EndroitAlerte, type NouvelleAlerte, type RaisonSignalementMiamSafe, type ServicesMiamSafe,
} from "../services/miam-safe-regles.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

const DETAIL_MAX = 80;
const EXPLICATION_MAX = 500;
const EXPLICATION_MIN_AUTRE = 10;

export type DependancesMiamSafe = {
  services: ServicesMiamSafe;
  /** Prévient l'équipe du lieu (notification push) ; appelé sans attendre, une erreur n'empêche pas l'alerte */
  prevenirEquipe: (alerte: NouvelleAlerte & { id: number }) => Promise<void>;
};

function lireLieuId(corps: Record<string, unknown>): number {
  const valeur = corps.lieuId;
  if (typeof valeur !== "number" || !Number.isInteger(valeur) || valeur < 1 || valeur > 999_999_999) throw new ChampInvalide("lieuId");
  return valeur;
}

function lireChoixParmi<T extends string>(corps: Record<string, unknown>, champ: string, choix: readonly T[]): T {
  const valeur = corps[champ];
  if (typeof valeur !== "string" || !choix.includes(valeur as T)) throw new ChampInvalide(champ);
  return valeur as T;
}

/** Texte facultatif, espaces en trop retirés (les retours à la ligne gardés pour l'explication) */
function lireTexteLibre(corps: Record<string, unknown>, champ: string, maximum: number, uneLigne: boolean): string {
  const valeur = corps[champ];
  if (valeur === undefined || valeur === null) return "";
  if (typeof valeur !== "string") throw new ChampInvalide(champ);
  const propre = uneLigne ? nettoyerLigne(valeur) : valeur.replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (propre.length > maximum) throw new ChampInvalide(champ);
  return propre;
}

export function creerControleursMiamSafe({ services, prevenirEquipe }: DependancesMiamSafe, horloge: () => number) {
  const maintenant = () => new Date(horloge());
  const compte = (reponse: Response) => reponse.locals.compte as CompteSession;
  const pro = (reponse: Response) => reponse.locals.pro as AccesPro;

  return {
    /** GET /miam-safe/lieux/:id (sans session) */
    async lireLieu(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.id);
      const lieu = lieuId === null ? null : await services.lireLieu(lieuId);
      if (!lieu) return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
      reponse.json({ ok: true, ...lieu });
    },

    /** POST /miam-safe/alertes : { lieuId, endroit, detail? } */
    async envoyerAlerte(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const { id: compteId, prenom } = compte(reponse);
      const alerte: NouvelleAlerte = {
        lieuId: lireLieuId(corps), compteId, prenom,
        endroit: lireChoixParmi<EndroitAlerte>(corps, "endroit", ENDROITS_ALERTE),
        detail: lireTexteLibre(corps, "detail", DETAIL_MAX, true),
      };
      const resultat = await services.creerAlerte(alerte, maintenant());
      if (!resultat.ok) return reponse.status(resultat.erreur === "lieu-inconnu" ? 404 : 409).json({ ok: false, erreur: resultat.erreur });
      // Sans attendre Apple et Google : la personne sait tout de suite que c'est parti
      prevenirEquipe({ ...alerte, id: resultat.id }).catch((erreur: unknown) => console.error("Alerte Miam Safe non transmise :", (erreur as Error)?.name));
      reponse.status(201).json({ ok: true, id: resultat.id });
    },

    /** GET /miam-safe/alertes/:id : seulement la sienne */
    async suivreAlerte(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      const alerte = id === null ? null : await services.lireAlerte(id, compte(reponse).id, maintenant());
      if (!alerte) return reponse.status(404).json({ ok: false, erreur: "alerte-inconnue" });
      reponse.json({ ok: true, alerte });
    },

    /** POST /miam-safe/signalements : { lieuId, raison, explication? } */
    async signaler(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const lieuId = lireLieuId(corps);
      const raison = lireChoixParmi<RaisonSignalementMiamSafe>(corps, "raison", RAISONS_SIGNALEMENT_MIAM_SAFE);
      const explication = lireTexteLibre(corps, "explication", EXPLICATION_MAX, false);
      if (raison === "autre" && explication.length < EXPLICATION_MIN_AUTRE) throw new ChampInvalide("explication");
      if (!(await services.enregistrerSignalement({ lieuId, compteId: compte(reponse).id, raison, explication }))) {
        return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
      }
      reponse.status(201).json({ ok: true });
    },

    /** PUT /miam-safe/lieux/:id/senti-bien : { oui } */
    async repondreSentiBien(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.id);
      const oui = lireCorps(requete).oui;
      if (typeof oui !== "boolean") throw new ChampInvalide("oui");
      if (lieuId === null || !(await services.repondreSentiBien({ lieuId, compteId: compte(reponse).id, oui }))) {
        return reponse.status(404).json({ ok: false, erreur: "lieu-inconnu" });
      }
      reponse.json({ ok: true });
    },

    /** GET /miam-safe/pro/lieux/:id/alertes (équipe du lieu) */
    async listerAlertes(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, alertes: await services.listerAlertesLieu(pro(reponse).lieuId, maintenant()) });
    },

    /** POST /miam-safe/pro/lieux/:id/alertes/:alerteId/on-arrive (équipe du lieu) */
    async direOnArrive(requete: Request, reponse: Response) {
      const alerteId = lireIdentifiant(requete.params.alerteId);
      if (alerteId === null || !(await services.repondreAlerte(pro(reponse).lieuId, alerteId, compte(reponse).id, maintenant()))) {
        return reponse.status(404).json({ ok: false, erreur: "alerte-inconnue" });
      }
      reponse.json({ ok: true });
    },

    /** GET /miam-safe/pro/lieux/:id/charte (équipe du lieu) */
    async lireCharte(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, charte: await services.lireCharte(pro(reponse).lieuId) });
    },

    /** PUT /miam-safe/pro/lieux/:id/charte (gérant) : { accepte: true } */
    async signerCharte(requete: Request, reponse: Response) {
      if (lireCorps(requete).accepte !== true) throw new ChampInvalide("accepte");
      const resultat = await services.signerCharte(pro(reponse).lieuId, compte(reponse).id, maintenant());
      if (!resultat.ok) return reponse.status(409).json({ ok: false, erreur: resultat.erreur });
      reponse.json({ ok: true, charte: await services.lireCharte(pro(reponse).lieuId) });
    },

    /** DELETE /miam-safe/pro/lieux/:id/charte (gérant) */
    async quitterCharte(_requete: Request, reponse: Response) {
      await services.quitterCharte(pro(reponse).lieuId, maintenant());
      reponse.json({ ok: true, charte: await services.lireCharte(pro(reponse).lieuId) });
    },
  };
}
