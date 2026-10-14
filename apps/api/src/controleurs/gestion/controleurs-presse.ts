// Contrôleurs de l'Espace presse : la liste des kits et visuels, et le téléchargement d'un fichier listé (jamais un chemin
// libre) : signé par le logiciel, ou par un lien de 10 minutes ouvert dans le navigateur pour les gros fichiers (vidéos).
// Rien au journal : ce sont des documents publics de SOS Miam.
import type { Request, Response } from "express";

import type { ServicesGestion } from "../../services/gestion/tous-les-services.ts";

const envoyer = (reponse: Response, fichier: { chemin: string; nom: string; type: string }) =>
  reponse
    .set("Content-Disposition", `attachment; filename*=UTF-8''${encodeURIComponent(fichier.nom)}`)
    .set("X-Content-Type-Options", "nosniff")
    .set("Content-Security-Policy", "default-src 'none'; sandbox")
    .type(fichier.type)
    .sendFile(fichier.chemin);
const idDe = (requete: Request) => (typeof requete.params.id === "string" && /^[\w-]{16}$/.test(requete.params.id) ? requete.params.id : "");
const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "introuvable" });

export function creerControleursPresse(s: ServicesGestion) {
  return {
    /** GET /presse */
    liste: async (_requete: Request, reponse: Response) => reponse.json(await s.listerPresse()),
    /** GET /presse/fichiers/:id : le fichier, en téléchargement, jamais interprété */
    fichier: async (requete: Request, reponse: Response) => {
      const fichier = idDe(requete) ? await s.trouverFichierPresse(idDe(requete)) : null;
      return fichier ? envoyer(reponse, fichier) : introuvable(reponse);
    },
    /** POST /presse/fichiers/:id/lien : un lien de 10 minutes pour le navigateur (gros fichiers) */
    creerLien: async (requete: Request, reponse: Response) => {
      const lien = idDe(requete) ? await s.creerLienPresse(idDe(requete)) : null;
      if (!lien) return introuvable(reponse);
      reponse.json({ ok: true, lien: `https://sosmiam.fr/api-gestion/presse/telecharger/${lien.jeton}`, expireLe: lien.expireLe });
    },
    /** GET /presse/telecharger/:jeton : sans signature (navigateur), seulement avec un jeton encore valable */
    telecharger: async (requete: Request, reponse: Response) => {
      const jeton = typeof requete.params.jeton === "string" && /^[\w-]{32}$/.test(requete.params.jeton) ? requete.params.jeton : "";
      const fichier = jeton ? await s.lireLienPresse(jeton) : null;
      return fichier ? envoyer(reponse, fichier) : reponse.status(404).type("text/plain; charset=utf-8").send("Lien expiré ou inconnu : redemande-le dans le logiciel.");
    },
  };
}
