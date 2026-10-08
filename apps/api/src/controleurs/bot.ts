import type { Request, Response } from "express";

import type { NouvelleDemandeLieu } from "../services/demandes-lieux.ts";
import { lireId } from "./gestion/lire-champs.ts";

const corpsDe = (requete: Request): Record<string, unknown> => (typeof requete.body === "object" && requete.body !== null ? requete.body : {});
const texte = (valeur: unknown, maximum: number) => (typeof valeur === "string" ? valeur.trim().slice(0, maximum) : "");
// Types du bot (apps/bot-discord/src/contenus/types-lieux.ts) → types des lieux
const TYPES: Record<string, string> = { resto: "resto", patisserie: "patisserie", "cafe-bar": "bar", sortie: "sortie", autre: "autre" };

type Dependances = {
  enregistrerDemandeLieu: (demande: NouvelleDemandeLieu) => Promise<void>;
  listerAnnoncesAPublier: () => Promise<{ id: number; titre: string; texte: string }[]>;
  noterPublicationAnnonce: (id: number, resultat: { lien: string } | { erreur: string }) => Promise<boolean>;
};

export function creerControleursBot({ enregistrerDemandeLieu, listerAnnoncesAPublier, noterPublicationAnnonce }: Dependances) {
  return {
    /** POST /bot/propositions : une pépite proposée avec /proposer-lieu. On ne garde pas qui l'a proposée, seulement le lien du message. */
    proposition: async (requete: Request, reponse: Response) => {
      const c = corpsDe(requete);
      const nom = texte(c.nom, 80);
      const ville = texte(c.ville, 80);
      const pourquoi = texte(c.pourquoi, 1000);
      if (!nom || !ville || !pourquoi) return reponse.status(400).json({ ok: false, erreur: "requete-invalide" });
      const lien = texte(c.lien, 300);
      const lienDiscord = texte(c.lienDiscord, 200);
      await enregistrerDemandeLieu({
        origine: "communaute",
        nom,
        type: TYPES[texte(c.type, 20)] ?? null,
        ville,
        adresse: null,
        // Un lien qui n'est pas une adresse web (ou trop long) reste lisible dans la description
        description: /^https?:\/\/\S{1,190}$/.test(lien) || !lien ? pourquoi : `${pourquoi}\n\nLien donné : ${lien}`.slice(0, 1000),
        plat: null,
        horaires: null,
        siteWeb: /^https?:\/\/\S{1,190}$/.test(lien) ? lien : null,
        instagram: null,
        contactNom: null,
        contactEmail: null,
        contactTelephone: null,
        lienDiscord: /^https:\/\/discord\.com\/channels\/[\d/]+$/.test(lienDiscord) ? lienDiscord : null,
      });
      reponse.status(201).json({ ok: true });
    },
    /** GET /bot/annonces : les annonces à publier. */
    annonces: async (_requete: Request, reponse: Response) => {
      reponse.json(await listerAnnoncesAPublier());
    },
    /** POST /bot/annonces/:id : le bot dit si l'annonce est partie (lien) ou non (erreur). */
    noterAnnonce: async (requete: Request, reponse: Response) => {
      const id = lireId(requete.params.id);
      const c = corpsDe(requete);
      const resultat = typeof c.lien === "string" && c.lien ? { lien: c.lien } : { erreur: texte(c.erreur, 300) || "échec inconnu" };
      if (!id || !(await noterPublicationAnnonce(id, resultat))) return reponse.status(404).json({ ok: false, erreur: "introuvable" });
      reponse.json({ ok: true });
    },
  };
}
