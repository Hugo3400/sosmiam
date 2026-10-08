import type { Request, Response } from "express";

import { verifierEmail } from "../fonctions/texte/verifier-email.ts";
import type { NouvelleInscription, Telephone } from "../services/inscriptions.ts";

const SOURCES = new Set(["site"]);
const TELEPHONES = new Set<string>(["iphone", "android"] satisfies Telephone[]);

/** Lit et nettoie le formulaire d'inscription, puis le confie au service. */
export function creerControleurInscription(enregistrer: (inscription: NouvelleInscription) => Promise<void>) {
  return async (requete: Request, reponse: Response) => {
    const corps = typeof requete.body === "object" && requete.body !== null ? requete.body : {};
    // Champ piège invisible pour les humains : s'il est rempli, c'est un robot. On répond « ok » sans rien garder.
    if (typeof corps.piege === "string" && corps.piege.trim() !== "") {
      return reponse.status(201).json({ ok: true });
    }
    const email = typeof corps.email === "string" ? corps.email.trim().toLowerCase() : "";
    if (!verifierEmail(email)) {
      return reponse.status(400).json({ ok: false, erreur: "email-invalide" });
    }
    const ville = typeof corps.ville === "string" ? corps.ville.replace(/\s+/g, " ").trim().slice(0, 80) : "";
    const source = typeof corps.source === "string" && SOURCES.has(corps.source) ? corps.source : "site";
    const telephone = typeof corps.telephone === "string" && TELEPHONES.has(corps.telephone) ? (corps.telephone as Telephone) : null;
    await enregistrer({ email, ville: ville || null, ambassadeur: corps.ambassadeur === true, telephone, beta: corps.beta === true, source });
    // Même réponse que l'adresse soit nouvelle ou déjà inscrite : on ne dit pas qui est inscrit
    reponse.status(201).json({ ok: true });
  };
}
