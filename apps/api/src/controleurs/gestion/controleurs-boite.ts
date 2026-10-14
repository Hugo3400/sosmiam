// Contrôleurs de la boîte mail (bonjour@sosmiam.fr) : mails reçus, envoyés et indésirables, lecture d'un mail, ses pièces
// jointes et images, réponse.
// Journal : seulement « réponse envoyée », jamais l'adresse ni le texte.
import type { Request, Response } from "express";

import { verifierEmail } from "../../fonctions/texte/verifier-email.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import { DOSSIERS_BOITE, type DossierBoite } from "../../services/gestion/dossiers-boite.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireId, lireParametre, lireTexte } from "./lire-champs.ts";

/** Boîte pas réglée ou injoignable : 503 ; mail introuvable : 404 ; envoi refusé : 502 */
const statutDe = (erreur: string) => (erreur === "introuvable" ? 404 : erreur === "piece-trop-lourde" ? 413 : erreur.startsWith("boite-") ? 503 : 502);
const dossierDe = (requete: Request): DossierBoite => {
  const dossier = lireParametre(requete.query.dossier, 20);
  return (DOSSIERS_BOITE as readonly string[]).includes(dossier) ? (dossier as DossierBoite) : "recus";
};

export function creerControleursBoite(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);
  const uid = (requete: Request) => lireId(requete.params.uid) ?? 0;

  return {
    liste: async (requete: Request, reponse: Response) => {
      const adresse = lireParametre(requete.query.adresse, 254).toLowerCase();
      const resultat = await s.listerMessagesRecus(50, adresse && verifierEmail(adresse) ? adresse : null, dossierDe(requete));
      if (!resultat.ok) return reponse.status(statutDe(resultat.erreur)).json(resultat);
      reponse.json(resultat.messages);
    },
    message: async (requete: Request, reponse: Response) => {
      const resultat = await s.lireMessageRecu(uid(requete), dossierDe(requete));
      if (!resultat.ok) return reponse.status(statutDe(resultat.erreur)).json(resultat);
      reponse.json(resultat.message);
    },
    /** GET /boite/:uid/pieces/:numero?dossier= : le fichier tel quel, toujours en téléchargement (jamais interprété) */
    piece: async (requete: Request, reponse: Response) => {
      const resultat = await s.lirePieceMessage(uid(requete), lireId(requete.params.numero) ?? -1, dossierDe(requete));
      if (!resultat.ok) return reponse.status(statutDe(resultat.erreur)).json(resultat);
      reponse
        .set("Content-Type", /^[\w.+-]+\/[\w.+-]+$/.test(resultat.type) ? resultat.type : "application/octet-stream")
        .set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(resultat.nom)}`)
        .set("X-Content-Type-Options", "nosniff")
        .set("Content-Security-Policy", "default-src 'none'; sandbox")
        .send(resultat.contenu);
    },
    repondre: async (requete: Request, reponse: Response) => {
      let texte: string;
      try {
        texte = lireTexte((requete.body ?? {}) as Record<string, unknown>, "texte", 10_000, true);
      } catch (erreur) {
        if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
        throw erreur;
      }
      const resultat = await s.repondreMessageRecu(uid(requete), texte);
      if (!resultat.ok) return reponse.status(statutDe(resultat.erreur)).json(resultat);
      await noter(reponse, "Réponse à un mail reçu", `message n° ${uid(requete)}`);
      reponse.json({ ok: true });
    },
  };
}
