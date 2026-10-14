// Contrôleurs de l'Espace presse : la liste des kits et visuels, et le téléchargement d'un fichier listé (jamais un chemin
// libre). Rien au journal : ce sont des documents publics de SOS Miam.
import type { Request, Response } from "express";

import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";

export function creerControleursPresse(s: ServicesGestion) {
  return {
    /** GET /presse */
    liste: async (_requete: Request, reponse: Response) => reponse.json(await s.listerPresse()),
    /** GET /presse/fichiers/:id : le fichier, en téléchargement, jamais interprété */
    fichier: async (requete: Request, reponse: Response) => {
      const id = typeof requete.params.id === "string" && /^[\w-]{16}$/.test(requete.params.id) ? requete.params.id : "";
      const fichier = id ? await s.trouverFichierPresse(id) : null;
      if (!fichier) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      reponse
        .set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fichier.nom)}`)
        .set("X-Content-Type-Options", "nosniff")
        .set("Content-Security-Policy", "default-src 'none'; sandbox")
        .type(fichier.type)
        .sendFile(fichier.chemin);
    },
  };
}
