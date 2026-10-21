// La bande, son lien d'invitation, les demandes, les blocages, « Quoi de neuf » et le classement du compte connecté (voir
// routes/bande.ts). Une personne est toujours désignée par son identifiant public ; une personne qui t'a bloqué est
// « inconnue » (404), sauf pour /app/blocages, qui la trouve quand même et répond toujours 200 (jamais un indice). Le code
// d'invitation n'est jamais écrit dans un journal.
import type { Request, Response } from "express";

import { creerLienInvitation } from "../../../../packages/commun/src/fonctions/potes/creer-lien-invitation.ts";
import { MAX_BANDE } from "../../../../packages/commun/src/regles/potes.ts";
import { estPseudoValide } from "../../../../packages/commun/src/validation/est-pseudo-valide.ts";
import { lireIdentifiantPublic } from "../fonctions/social/lire-identifiant-public.ts";
import { lireProfilSocialPose } from "../middlewares/profil-social.ts";
import type { DependancesSocialApp } from "../routes/social-app.ts";
import { ecrireMoisParis, FORME_CODE_INVITATION, type InvitationLue } from "../services/bande-regles.ts";
import type { AppliquerEffetsSociaux } from "../services/effets-sociaux-regles.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";
import { lirePersonne, refuserSocial } from "./social-champs.ts";

/** Statut HTTP des refus métier de ce contrôleur (spécification sociale D.0, D.3) */
const ERREURS: Readonly<Record<string, number>> = {
  "personne-inconnue": 404,
  "invitation-invalide": 404,
  "invitation-inconnue": 404,
  "demande-inconnue": 404,
  "bande-pleine": 409,
  "trop-de-demandes-en-attente": 409,
  "demandes-fermees": 409,
  "trop-de-blocages": 409,
};

/** L'invitation telle que l'app la reçoit : le lien porte le code dans son fragment (« #c= »), jamais envoyé à un serveur */
const presenterInvitation = (i: InvitationLue) => ({ pseudo: i.pseudo, code: i.code, lien: creerLienInvitation(i.pseudo, i.code), creeLe: i.creeLe.toISOString() });

export function creerControleursBande(d: Pick<DependancesSocialApp, "bande" | "relations">, appliquer: AppliquerEffetsSociaux, horloge: () => number) {
  const maintenant = () => new Date(horloge());
  const moi = (reponse: Response) => lireProfilSocialPose(reponse).compteId;
  /** Lectures sans profil social (Potes jamais ouvert) : rien à montrer, rien n'est créé */
  const sansProfil = (reponse: Response) => lireProfilSocialPose(reponse).idPublic === null;
  /** Une personne en petit (elle vient d'entrer dans la bande) */
  const presenter = async (compteId: number) => (await d.relations.presenter([compteId])).get(compteId) ?? null;

  return {
    /** GET /app/bande */
    async lireBande(_requete: Request, reponse: Response) {
      if (sansProfil(reponse)) return reponse.json({ ok: true, bande: { membres: [], demandesRecues: [], demandesEnvoyees: [], max: MAX_BANDE } });
      reponse.json({ ok: true, bande: await d.bande.lireBande(moi(reponse), maintenant()) });
    },

    /** GET /app/bande/invitation 🔐 : le code est créé à la première demande */
    async lireInvitation(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, invitation: presenterInvitation(await d.bande.lireInvitation(moi(reponse), maintenant())) });
    },

    /** POST /app/bande/invitation/renouveler 🔐 : l'ancien lien et l'ancien QR ne marchent plus */
    async renouvelerInvitation(_requete: Request, reponse: Response) {
      reponse.status(201).json({ ok: true, invitation: presenterInvitation(await d.bande.renouvelerInvitation(moi(reponse), maintenant())) });
    },

    /** POST /app/bande/rejoindre 🔐 { pseudo, code, moyen: "lien" | "qr" } */
    async rejoindre(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const pseudo = typeof corps.pseudo === "string" ? corps.pseudo.trim().replace(/^@/, "").toLowerCase() : "";
      if (!estPseudoValide(pseudo)) throw new ChampInvalide("pseudo");
      const code = typeof corps.code === "string" ? corps.code.trim().toLowerCase() : "";
      if (!FORME_CODE_INVITATION.test(code)) throw new ChampInvalide("code");
      if (corps.moyen !== "lien" && corps.moyen !== "qr") throw new ChampInvalide("moyen");
      const r = await d.bande.rejoindre(moi(reponse), pseudo, code, maintenant());
      // Ton propre lien : { champ: "pseudo" }
      if (!r.ok) throw r.erreur === "soi-meme" ? new ChampInvalide("pseudo") : refuserSocial(r.erreur, ERREURS);
      const personne = await presenter(r.poteId);
      await appliquer(r.effets);
      if (!personne) throw refuserSocial("invitation-invalide", ERREURS);
      reponse.status(r.deja ? 200 : 201).json({ ok: true, personne, deja: r.deja });
    },

    /** POST /app/bande/demandes { personne } : par le pseudo, une demande (ou l'ajout, si elle m'avait déjà demandé) */
    async demander(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const idPublic = lireIdentifiantPublic(lireCorps(requete).personne);
      if (!idPublic) throw new ChampInvalide("personne");
      const cible = await d.relations.trouverCompte(idPublic, compteId);
      if (cible === null) throw refuserSocial("personne-inconnue", ERREURS);
      const r = await d.bande.demander(compteId, cible, maintenant());
      if (!r.ok) throw r.erreur === "soi-meme" ? new ChampInvalide("personne") : refuserSocial(r.erreur, ERREURS);
      await appliquer(r.effets);
      if (r.etat === "demande") return reponse.status(201).json({ ok: true, etat: "demande" });
      if (r.etat === "deja") return reponse.json({ ok: true, etat: "deja" });
      reponse.json({ ok: true, etat: "ajoute", personne: await presenter(cible) });
    },

    /** POST /app/bande/demandes/:personne/accepter */
    async accepter(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      const de = await lirePersonne(requete, d.relations, compteId);
      const r = await d.bande.accepter(compteId, de, maintenant());
      if (!r.ok) throw refuserSocial(r.erreur, ERREURS);
      await appliquer(r.effets);
      reponse.json({ ok: true, personne: await presenter(de) });
    },

    /** DELETE /app/bande/demandes/:personne : refuse la sienne (sans prévenir) ou annule la mienne */
    async retirerDemande(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      await d.bande.retirerDemande(compteId, await lirePersonne(requete, d.relations, compteId), maintenant());
      reponse.json({ ok: true });
    },

    /** DELETE /app/bande/:personne : des deux bandes, sans prévenir (pas pote : 200 aussi) */
    async retirer(requete: Request, reponse: Response) {
      const compteId = moi(reponse);
      await d.bande.retirer(compteId, await lirePersonne(requete, d.relations, compteId), maintenant());
      reponse.json({ ok: true });
    },

    /** GET /app/bande/activite : « Quoi de neuf » */
    async lireActivite(_requete: Request, reponse: Response) {
      if (sansProfil(reponse)) return reponse.json({ ok: true, activites: [] });
      reponse.json({ ok: true, activites: await d.bande.lireActivite(moi(reponse), maintenant()) });
    },

    /** GET /app/bande/classement : le mois en cours, à l'heure de Paris */
    async lireClassement(_requete: Request, reponse: Response) {
      if (sansProfil(reponse)) return reponse.json({ ok: true, classement: { mois: ecrireMoisParis(maintenant()), places: [] } });
      reponse.json({ ok: true, classement: await d.bande.lireClassement(moi(reponse), maintenant()) });
    },

    /** GET /app/blocages */
    async listerBloques(_requete: Request, reponse: Response) {
      reponse.json({ ok: true, bloques: await d.bande.listerBloques(moi(reponse)) });
    },

    /**
     * PUT (oui) ou DELETE (non) /app/blocages/:personne : la personne est trouvée même si ELLE t'a bloqué, et la réponse est
     * toujours 200 (déjà bloquée comprise) : ce n'est jamais un indice
     */
    bloquer(oui: boolean) {
      return async (requete: Request, reponse: Response) => {
        const compteId = moi(reponse);
        const idPublic = lireIdentifiantPublic(requete.params.personne);
        if (!idPublic) throw new ChampInvalide("personne");
        const autre = await d.relations.trouverCompte(idPublic, undefined);
        if (autre === null) return reponse.json({ ok: true });
        if (autre === compteId) throw new ChampInvalide("personne");
        if (!oui) {
          await d.bande.debloquer(compteId, autre);
          return reponse.json({ ok: true });
        }
        const r = await d.bande.bloquer(compteId, autre, maintenant());
        if (!r.ok) throw r.erreur === "soi-meme" ? new ChampInvalide("personne") : refuserSocial(r.erreur, ERREURS);
        reponse.json({ ok: true });
      };
    },
  };
}
