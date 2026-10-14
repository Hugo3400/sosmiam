// Profil social, personnes et masques du compte connecté (voir routes/social.ts). Le profil social n'est créé que par
// exigerProfilSocial (POST et PATCH /app/social/moi) ; toutes les autres routes d'ici le lisent sans jamais le créer.
import type { Request, Response } from "express";

import { CIBLES_MASQUE } from "../../../../packages/commun/src/regles/potes.ts";
import type { CibleMasque, ReglagesSociaux } from "../../../../packages/commun/src/types/social.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import { FORME_CIBLE_ID_MASQUE, FORME_DEBUT_PSEUDO } from "../services/social-regles.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireCurseurPersonne } from "../fonctions/social/lire-curseur-personne.ts";
import { lireCurseurApres, lirePersonne, refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de ce contrôleur (spécification sociale D.0, D.3) */
const ERREURS: Readonly<Record<string, number>> = { "pseudo-requis": 409, "personne-inconnue": 404, "profil-prive": 403, "trop-de-masques": 409 };

const REGLAGES = ["trouvable", "suggerable", "activitePartagee", "pushSocial"] as const satisfies readonly (keyof ReglagesSociaux)[];
const estCibleMasque = (brut: unknown): brut is CibleMasque => typeof brut === "string" && (CIBLES_MASQUE as readonly string[]).includes(brut);

export function creerControleursSocial(d: DependancesSocialApp, horloge: () => number) {
  const maintenant = () => new Date(horloge());
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;

  return {
    /** GET /app/social/moi */
    async lireMoi(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, moi: await d.social.lireMoi(moi(reponse)) });
    },

    /** POST /app/social/moi : exigerProfilSocial vient de le créer (201), ou il existait (200) */
    async ouvrirProfil(_requete: Request, reponse: Response) {
      const pose = lireProfilSocialPose(reponse);
      const profil = await d.social.lireMoi(pose.compteId);
      if (!profil) throw refuserSocial("pseudo-requis", ERREURS);
      reponse.status(pose.cree ? 201 : 200).json({ ok: true, moi: profil });
    },

    /** PATCH /app/social/moi { trouvable?, suggerable?, activitePartagee?, pushSocial? } */
    async modifierReglages(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const reglages: Partial<ReglagesSociaux> = {};
      for (const champ of REGLAGES) {
        const valeur = corps[champ];
        if (valeur === undefined) continue;
        if (typeof valeur !== "boolean") throw new ChampInvalide(champ);
        reglages[champ] = valeur;
      }
      reponse.json({ ok: true, moi: await d.social.modifierReglages(moi(reponse), reglages) });
    },

    /** GET /app/social/pouls */
    async lirePouls(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, pouls: await d.social.lirePouls(moi(reponse), maintenant()) });
    },

    /** POST /app/personnes/recherche { debut } : « @ » retiré, en minuscules, 2 à 20 caractères */
    async chercher(requete: Request, reponse: Response) {
      const brut = lireCorps(requete).debut;
      if (typeof brut !== "string") throw new ChampInvalide("debut");
      const debut = brut.trim().replace(/^@/, "").toLowerCase();
      if (debut.length < 2 || debut.length > 20) throw new ChampInvalide("debut");
      // Un caractère qu'aucun pseudo ne porte : personne à trouver (pas une erreur, l'app cherche pendant la frappe)
      if (!FORME_DEBUT_PSEUDO.test(debut)) return reponse.json({ ok: true, resultats: [] });
      reponse.json({ ok: true, resultats: await d.social.chercher(moi(reponse), debut) });
    },

    /** GET /app/personnes/suggestions */
    async suggerer(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, suggestions: await d.social.suggerer(moi(reponse)) });
    },

    /** GET /app/personnes/:personne */
    async lireProfil(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const cible = await lirePersonne(requete, d.relations, compteId);
      const profil = await d.social.lireProfil(compteId, cible, maintenant());
      if (!profil) throw refuserSocial("personne-inconnue", ERREURS);
      reponse.json({ ok: true, profil });
    },

    /** GET /app/personnes/:personne/abonnes et /abonnements[?apres=] : 404 avant 403 */
    listerLiens(sens: "abonnes" | "abonnements") {
      return async (requete: Request, reponse: Response) => {
        const compteId = moi(reponse);
        const cible = await lirePersonne(requete, d.relations, compteId);
        const page = await d.social.listerLiens(compteId, cible, sens, lireCurseurApres(requete, lireCurseurPersonne));
        if (page === "ferme") throw refuserSocial("profil-prive", ERREURS);
        reponse.json({ ok: true, ...page });
      };
    },

    /** GET /app/personnes/:personne/listes */
    async listerListes(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const cible = await lirePersonne(requete, d.relations, compteId);
      reponse.json({ ok: true, listes: await d.social.listerListesDe(compteId, cible) });
    },

    /** GET /app/masques[?cible=] */
    async listerMasques(requete: Request, reponse: Response) {
      const brut = requete.query.cible;
      if (brut !== undefined && !estCibleMasque(brut)) throw new ChampInvalide("cible");
      reponse.json({ ok: true, masques: await d.social.listerMasques(moi(reponse), brut ?? null) });
    },

    /** PUT (oui) ou DELETE (non, « Annuler ») /app/masques/:cible/:cibleId */
    masquer(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const { cible, cibleId } = requete.params;
        if (!estCibleMasque(cible)) throw new ChampInvalide("cible");
        if (typeof cibleId !== "string" || !FORME_CIBLE_ID_MASQUE.test(cibleId)) throw new ChampInvalide("cibleId");
        const r = await d.social.masquer(moi(reponse), cible, cibleId, oui);
        if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
        reponse.json({ ok: true });
      };
    },
  };
}
