import type { Request, Response } from "express";

import type { StatutIdee } from "../../../../../packages/commun/src/types/idees.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { NouvelleNotificationCloche } from "../../services/effets-sociaux-regles.ts";
import type { ModerationSociale } from "../../services/gestion/cibles-moderation.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireChoix, lireId, lireTexte } from "./lire-champs.ts";

const STATUTS: readonly StatutIdee[] = ["en-relecture", "proposee", "a-l-etude", "prevue", "faite"];
const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

type Resultat = { ok: true; notifications: NouvelleNotificationCloche[] } | { ok: false; erreur: "introuvable" | "champ-invalide" };

export function creerControleursCommunaute(s: ServicesGestion, social?: ModerationSociale) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const verifier = (controleur: (requete: Request, reponse: Response) => Promise<unknown>) => async (requete: Request, reponse: Response) => {
    try {
      await controleur(requete, reponse);
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  async function conclure(reponse: Response, resultat: Resultat, action: string, detail: string) {
    if (!resultat.ok) return reponse.status(resultat.erreur === "introuvable" ? 404 : 400).json({ ok: false, erreur: resultat.erreur });
    await noter(reponse, action, detail);
    if (resultat.notifications.length && social) {
      await social.cloche.noter(resultat.notifications, new Date()).catch((erreur: unknown) => console.error("Communauté : cloche non écrite :", (erreur as Error).message));
    }
    reponse.json({ ok: true });
  }

  return {
    idees: verifier(async (requete, reponse) => {
      const statut = typeof requete.query.statut === "string" && (STATUTS as readonly string[]).includes(requete.query.statut) ? (requete.query.statut as StatutIdee) : undefined;
      reponse.json({ idees: await s.listerIdeesGestion({ statut }) });
    }),
    commentaires: async (requete: Request, reponse: Response) => {
      reponse.json({ commentaires: await s.listerCommentairesIdeeGestion(id(requete)) });
    },
    statut: verifier(async (requete, reponse) => {
      const statut = lireChoix(corpsDe(requete), "statut", STATUTS);
      await conclure(reponse, await s.changerStatutIdee(id(requete), statut, new Date()), "Statut d'une idée changé", `idée n° ${id(requete)} → ${statut}`);
    }),
    reponse: verifier(async (requete, reponse) => {
      const texte = lireTexte(corpsDe(requete), "texte", 1000);
      await conclure(reponse, await s.repondreIdee(id(requete), texte, new Date()), texte ? "Réponse de la Brigade à une idée" : "Réponse de la Brigade retirée", `idée n° ${id(requete)}`);
    }),
    ideeDuMois: verifier(async (requete, reponse) => {
      const mois = lireTexte(corpsDe(requete), "mois", 7, true);
      if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(mois)) throw new ChampInvalide("mois");
      await conclure(reponse, await s.choisirIdeeDuMois(id(requete), mois, new Date()), "Idée du mois choisie", `idée n° ${id(requete)}, ${mois}`);
    }),
    supprimer: async (requete: Request, reponse: Response) => {
      await conclure(reponse, await s.supprimerIdee(id(requete)), "Idée supprimée", `idée n° ${id(requete)}`);
    },
    masquerCommentaire: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      if (typeof corps.masque !== "boolean") throw new ChampInvalide("masque");
      await conclure(reponse, await s.masquerCommentaireIdee(id(requete), corps.masque, new Date()), corps.masque ? "Commentaire d'idée masqué" : "Commentaire d'idée remis", `commentaire n° ${id(requete)}`);
    }),
    etiquettes: async (requete: Request, reponse: Response) => {
      reponse.json({ etiquettes: await s.listerEtiquettesLibres({ avecRetirees: requete.query.retirees === "oui" }) });
    },
    retirerEtiquette: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const sortieId = typeof corps.sortieId === "number" && Number.isSafeInteger(corps.sortieId) && corps.sortieId > 0 ? corps.sortieId : null;
      if (!sortieId) throw new ChampInvalide("sortieId");
      const nom = lireTexte(corps, "nom", 32, true);
      await conclure(reponse, await s.retirerEtiquetteLibre(sortieId, nom, new Date()), "Étiquette libre retirée", `sortie des Miamis n° ${sortieId}`);
    }),
    retirerSortie: async (requete: Request, reponse: Response) => {
      await conclure(reponse, await s.retirerSortieMiamis(id(requete), new Date(), social?.medias), "Sortie des Miamis retirée", `sortie des Miamis n° ${id(requete)}`);
    },
  };
}
