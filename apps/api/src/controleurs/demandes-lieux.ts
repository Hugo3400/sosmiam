import type { Request, Response } from "express";

import { verifierEmail } from "../fonctions/texte/verifier-email.ts";
import type { NouvelleDemandeLieu } from "../services/demandes-lieux.ts";
import { ChampInvalide, lireTexte } from "./gestion/lire-champs.ts";

const TYPES = ["resto", "patisserie", "bar", "sortie", "autre"];

/**
 * POST /demandes-lieux : un lieu demande à être sur SOS Miam (formulaire « J'inscris mon lieu » du site, côté serveur).
 * Champ piège « piege » : rempli seulement par les robots, qui reçoivent « ok » sans que rien soit gardé.
 */
export function creerControleurDemandeLieu(enregistrer: (demande: NouvelleDemandeLieu) => Promise<void>) {
  return async (requete: Request, reponse: Response) => {
    const corps = typeof requete.body === "object" && requete.body !== null ? (requete.body as Record<string, unknown>) : {};
    if (typeof corps.piege === "string" && corps.piege.trim() !== "") return reponse.status(201).json({ ok: true });
    try {
      const description = lireTexte(corps, "description", 1000, true);
      if (description.length < 20) throw new ChampInvalide("description");
      const contactEmail = lireTexte(corps, "contactEmail", 254, true).toLowerCase();
      if (!verifierEmail(contactEmail)) throw new ChampInvalide("contactEmail");
      const siteWeb = lireTexte(corps, "siteWeb", 200);
      if (siteWeb && !/^https?:\/\/\S+$/.test(siteWeb)) throw new ChampInvalide("siteWeb");
      const type = typeof corps.type === "string" && TYPES.includes(corps.type) ? corps.type : null;
      await enregistrer({
        origine: "lieu",
        nom: lireTexte(corps, "nom", 80, true),
        type,
        ville: lireTexte(corps, "ville", 80, true),
        adresse: lireTexte(corps, "adresse", 160),
        description,
        plat: lireTexte(corps, "plat", 80),
        horaires: lireTexte(corps, "horaires", 160),
        siteWeb,
        instagram: lireTexte(corps, "instagram", 60)?.replace(/^@/, "") ?? null,
        contactNom: lireTexte(corps, "contactNom", 80, true),
        contactEmail,
        contactTelephone: lireTexte(corps, "contactTelephone", 30),
        lienDiscord: null,
      });
      reponse.status(201).json({ ok: true });
    } catch (erreur) {
      if (erreur instanceof ChampInvalide) return reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ: erreur.champ });
      throw erreur;
    }
  };
}
