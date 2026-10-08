// Contrôleurs du logiciel de gestion pour les mails : état de l'envoi (boîte bonjour@ chez l'hébergement mail),
// essai, newsletter (lancer, suivre, arrêter) et derniers mails partis.
import type { Request, Response } from "express";

import { verifierEmail } from "../../fonctions/texte/verifier-email.ts";
import type { ContexteGestion } from "../../middlewares/proteger-gestion.ts";
import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";
import { ChampInvalide, lireId, lireNombre, lireParametre, lireTexte } from "./lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> =>
  typeof requete.body === "object" && requete.body !== null && !Buffer.isBuffer(requete.body) ? requete.body : {};

/** Le mail rendu par le logiciel : objet, HTML (avec son pied de page de désinscription) et version texte. */
function lireContenu(corps: Record<string, unknown>) {
  const html = typeof corps.html === "string" ? corps.html : "";
  const texte = typeof corps.texte === "string" ? corps.texte : "";
  if (!html.trim() || html.length > 300_000) throw new ChampInvalide("html");
  if (!texte.trim() || texte.length > 60_000) throw new ChampInvalide("texte");
  return { objet: lireTexte(corps, "objet", 150, true), html, texte };
}

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

export function creerControleursCourriels(s: ServicesGestion) {
  const noter = (reponse: Response, action: string, detail?: string) => s.noterAction((reponse.locals.gestion as ContexteGestion).poste.nom, action, detail);

  return {
    etat: verifier(async (_requete, reponse) => reponse.json(await s.lireEtatEnvois())),
    derniers: verifier(async (_requete, reponse) => reponse.json(await s.listerDerniersEnvois())),
    essai: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const adresse = lireTexte(corps, "adresse", 254, true).trim().toLowerCase();
      if (!verifierEmail(adresse)) throw new ChampInvalide("adresse");
      const resultat = await s.envoyerEssaiNewsletter(adresse, lireContenu(corps));
      if (!resultat.ok) return reponse.status(502).json({ ok: false, erreur: resultat.erreur, message: "message" in resultat ? resultat.message : undefined });
      await noter(reponse, "Newsletter : essai envoyé", adresse);
      reponse.json({ ok: true });
    }),
    destinataires: verifier(async (requete, reponse) => {
      const ville = lireParametre(requete.query.ville, 80) || null;
      reponse.json({ total: await s.compterDestinataires(ville) });
    }),
    lancer: verifier(async (requete, reponse) => {
      const corps = corpsDe(requete);
      const ville = typeof corps.ville === "string" && corps.ville.trim() ? lireTexte(corps, "ville", 80, true).trim() : null;
      const resultat = await s.lancerCampagne({ brouillonId: lireNombre(corps, "brouillonId", 1, 1e9), ville, ...lireContenu(corps) });
      if ("erreur" in resultat) {
        const statut = resultat.erreur === "envoi-en-cours" ? 409 : resultat.erreur === "aucun-destinataire" ? 400 : 503;
        return reponse.status(statut).json({ ok: false, erreur: resultat.erreur, message: "message" in resultat ? resultat.message : undefined });
      }
      await noter(reponse, "Newsletter lancée", `${resultat.campagne.total} destinataire(s)${ville ? ` à ${ville}` : ""}`);
      reponse.status(201).json({ ok: true, ...resultat.campagne });
    }),
    campagnes: verifier(async (_requete, reponse) => reponse.json(await s.listerCampagnes())),
    annuler: verifier(async (requete, reponse) => {
      const id = lireId(requete.params.id) ?? 0;
      const annules = await s.annulerCampagne(id);
      await noter(reponse, "Newsletter arrêtée", `${annules} mail(s) annulé(s)`);
      reponse.json({ ok: true, annules });
    }),
  };
}
