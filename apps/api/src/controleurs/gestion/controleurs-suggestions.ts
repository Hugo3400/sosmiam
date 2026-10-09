// Contrôleurs du logiciel de gestion pour les modifications de fiches proposées par un client ou par le lieu : liste,
// détail (avant, maintenant, proposé), décision champ par champ et réponse par mail à l'auteur.
// Journal : numéros seulement (suggestion, lieu), jamais le contenu ni l'auteur.
import type { Request, Response } from "express";

import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import { CHAMPS_SUGGERABLES } from "../../services/gestion/champs-suggerables.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireId, lireParametre, lireTexte } from "./lire-champs.ts";
import { lireChampsSuggeres } from "./lire-lieu.ts";

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

export function creerControleursSuggestions(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const id = (requete: Request) => lireId(requete.params.id) ?? 0;

  return {
    liste: verifier(async (requete, reponse) =>
      reponse.json(await s.listerSuggestions(lireParametre(requete.query.statut, 12), lireId(requete.query.lieu)))),
    fiche: verifier(async (requete, reponse) => {
      const suggestion = await s.lireSuggestion(id(requete));
      return suggestion ? reponse.json(suggestion) : introuvable(reponse);
    }),
    /** { champs: [...] } (vide : refusée), { reponse } facultative, { envoyer: true } pour la mailer à l'auteur */
    decider: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const suggestion = await s.lireSuggestion(id(requete));
      if (!suggestion || suggestion.statut !== "en-attente") return introuvable(reponse);
      const proposition = (suggestion.proposition ?? {}) as Record<string, unknown>;
      const champs = corps.champs;
      if (!Array.isArray(champs) || new Set(champs).size !== champs.length
        || champs.some((champ) => typeof champ !== "string" || !(CHAMPS_SUGGERABLES as readonly string[]).includes(champ) || !(champ in proposition))) {
        throw new ChampInvalide("champs");
      }
      const valeurs = lireChampsSuggeres(proposition, champs as string[]);
      const texteReponse = lireTexte(corps, "reponse", 1000);
      const resultat = await s.deciderSuggestion(id(requete), valeurs, texteReponse);
      if (resultat.etat === "introuvable") return introuvable(reponse);
      let mail: "envoye" | "aucun" | "echec" = "aucun";
      if (corps.envoyer === true && texteReponse && resultat.compteId) {
        const envoi = await s.envoyerCourrielEcrit({ compteId: resultat.compteId }, `Ta suggestion pour ${resultat.nomLieu}`, texteReponse);
        mail = envoi.ok ? "envoye" : "echec";
      }
      await noter(reponse, `Modification de fiche ${resultat.statut}`, `suggestion n° ${id(requete)}, lieu n° ${resultat.lieuId}, ${resultat.champs.length} champ(s)`);
      reponse.json({ ok: true, statut: resultat.statut, champs: resultat.champs, mail });
    }),
  };
}
