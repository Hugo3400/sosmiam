// Suivre des personnes, pour le compte connecté (voir routes/suivis-personnes.ts). On ne prévient jamais l'autre d'un refus,
// d'un retrait ni d'un « ne plus suivre ». Aussi creerApresPassageEnPublic, pour PATCH /comptes/moi/profil { prive: false }
// (session Site) : les deux chemins vers « public » acceptent les demandes en attente, avec la même cloche.
import type { Request, Response } from "express";

import { lireCurseurPersonne } from "../fonctions/social/lire-curseur-personne.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";
import { lireCorps } from "./comptes-champs.ts";
import { creerAppliquerEffetsSociaux } from "./effets-sociaux.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lireCurseurApres, lirePersonne, refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de ce contrôleur (spécification sociale D.0, D.3) */
const ERREURS: Readonly<Record<string, number>> = { "personne-inconnue": 404, "demande-inconnue": 404, "trop-d-abonnements": 409 };

export function creerControleursSuivisPersonnes(d: Pick<DependancesSocialApp, "suivis" | "relations">, appliquer: AppliquerEffetsSociaux, horloge: () => number) {
  const maintenant = () => new Date(horloge());
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;

  return {
    /** GET /app/suivis-personnes */
    async lireResume(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, suivis: await d.suivis.lireResume(moi(reponse), maintenant()) });
    },

    /** GET /app/suivis-personnes/abonnes et /abonnements[?apres=] */
    lister(sens: "abonnes" | "abonnements") {
      return async (requete: Request, reponse: Response) => {
        const apres = lireCurseurApres(requete, lireCurseurPersonne);
        const page = sens === "abonnes" ? await d.suivis.listerAbonnes(moi(reponse), apres) : await d.suivis.listerAbonnements(moi(reponse), apres);
        reponse.json({ ok: true, ...page });
      };
    },

    /** PUT (oui) ou DELETE (non : ne plus suivre, ou annuler la demande) /app/suivis-personnes/abonnements/:personne */
    suivre(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const compteId = moi(reponse);
        const cible = await lirePersonne(requete, d.relations, compteId);
        if (!oui) {
          await d.suivis.nePlusSuivre(compteId, cible);
          return reponse.json({ ok: true });
        }
        const r = await d.suivis.suivre(compteId, cible, maintenant());
        if (!r.ok) throw r.erreur === "soi-meme" ? new ChampInvalide("personne") : refuserSocial(r.erreur, ERREURS);
        await appliquer(r.effets);
        reponse.status(r.deja ? 200 : 201).json({ ok: true, etat: r.etat, deja: r.deja });
      };
    },

    /** POST /app/suivis-personnes/demandes/:personne/accepter (marche aussi sur une demande que j'avais refusée) */
    async accepterDemande(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const r = await d.suivis.accepter(compteId, await lirePersonne(requete, d.relations, compteId), maintenant());
      if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
      await appliquer(r.effets);
      reponse.json({ ok: true, lien: r.lien });
    },

    /** DELETE /app/suivis-personnes/demandes/:personne : refusée, sans prévenir */
    async refuserDemande(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      await d.suivis.refuser(compteId, await lirePersonne(requete, d.relations, compteId));
      reponse.json({ ok: true });
    },

    /** DELETE /app/suivis-personnes/abonnes/:personne */
    async retirerAbonne(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      await d.suivis.retirerAbonne(compteId, await lirePersonne(requete, d.relations, compteId));
      reponse.json({ ok: true });
    },

    /** PUT /app/suivis-personnes/confidentialite { prive } : repasser en public accepte les demandes en attente */
    async changerConfidentialite(requete: Request, reponse: Response) {
      const prive = lireCorps(requete).prive;
      if (typeof prive !== "boolean") throw new ChampInvalide("prive");
      const r = await d.suivis.changerConfidentialite(moi(reponse), prive, maintenant());
      await appliquer(r.effets);
      reponse.json({ ok: true, prive: r.prive, acceptees: r.acceptees });
    },
  };
}

/**
 * La dépendance facultative `apresPassageEnPublic` de PATCH /comptes/moi/profil (spécification sociale F.1, point 5) :
 * un compte qui repasse en public par son profil accepte ses demandes de suivi en attente, comme par
 * PUT /app/suivis-personnes/confidentialite (« demande-acceptee » dans la cloche de chacun). À brancher par la session Site
 * (routes/comptes.ts, controleurs/comptes.ts, comptes-profil.ts et demarrer.ts sont à elle) : pas encore branchée.
 */
export function creerApresPassageEnPublic(d: Pick<DependancesSocialApp, "suivis" | "cloche" | "prevenirCompte" | "relations">, horloge: () => number) {
  const appliquer = creerAppliquerEffetsSociaux({ cloche: d.cloche, prevenirCompte: d.prevenirCompte, lirePushSocial: (ids) => d.relations.lirePushSocial(ids), horloge });
  return async (compteId: number): Promise<void> => {
    await appliquer(await d.suivis.accepterDemandesEnAttente(compteId, new Date(horloge())));
  };
}
