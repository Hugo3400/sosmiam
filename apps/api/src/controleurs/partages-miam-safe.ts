// « Prévenir un pote » (Miam Safe) : prévenir un pote de sa bande, lui montrer sa position pendant 1 heure, arrêter.
// Contrat : routes/miam-safe.ts. La bande est relue à chaque fois : un pote retiré ou bloqué ne voit plus rien. Aucune
// position n'est jamais écrite dans un journal.
import type { Request, Response } from "express";

import type { PersonneResume } from "../../../../packages/commun/src/types/social.ts";
import type { PartagePositionMiamSafe } from "../../../../packages/commun/src/types/miam-safe.ts";
import { ecrireMessagePote } from "../fonctions/miam-safe/ecrire-message-pote.ts";
import type { CompteSession } from "../middlewares/proteger-comptes.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { MessagePush } from "../services/notifications/expedier-push.ts";
import { estPartageActif, type LignePartage, type PositionMiamSafe, type ServicesPartagesMiamSafe } from "../services/partages-miam-safe-regles.ts";
import { lireCorps } from "./comptes-champs.ts";
import { ChampInvalide } from "./gestion/lire-champs.ts";

/** Ce que Miam Safe lit de la bande (lot L3 de la partie sociale : socialApp.bande et socialApp.relations) */
export type PotesMiamSafe = {
  /** L'identifiant public d'un pote → son compte (null : inconnu, sans profil social, ou il a bloqué `pour`) */
  trouverCompte(idPublic: string, pour: number): Promise<number | null>;
  /** Faux si l'un a retiré ou bloqué l'autre */
  estPote(a: number, b: number): Promise<boolean>;
  presenter(compteIds: readonly number[]): Promise<Map<number, PersonneResume>>;
};

export type DependancesPartagesMiamSafe = {
  services: ServicesPartagesMiamSafe;
  potes: PotesMiamSafe;
  /** prevenirCompte (services/notifications) : rend sur combien de téléphones (session encore ouverte) la notification est partie */
  prevenirCompte: (compteId: number, message: MessagePush) => Promise<number>;
};

function lireNombre(objet: Record<string, unknown>, champ: string, minimum: number, maximum: number): number {
  const valeur = objet[champ];
  if (typeof valeur !== "number" || !Number.isFinite(valeur) || valeur < minimum || valeur > maximum) throw new ChampInvalide(champ);
  return valeur;
}

/** { latitude, longitude, precisionM? } : la précision est arrondie au mètre (null si absente) */
function lirePosition(valeur: unknown): PositionMiamSafe {
  if (typeof valeur !== "object" || valeur === null || Array.isArray(valeur)) throw new ChampInvalide("position");
  const objet = valeur as Record<string, unknown>;
  const precision = objet.precisionM === undefined || objet.precisionM === null ? null : Math.round(lireNombre(objet, "precisionM", 0, 100_000));
  return { latitude: lireNombre(objet, "latitude", -90, 90), longitude: lireNombre(objet, "longitude", -180, 180), precisionM: precision };
}

function lireLieuId(corps: Record<string, unknown>): number {
  const valeur = corps.lieuId;
  if (typeof valeur !== "number" || !Number.isInteger(valeur) || valeur < 1 || valeur > 999_999_999) throw new ChampInvalide("lieuId");
  return valeur;
}

/** L'identifiant public d'une personne (10 caractères) */
function lireIdPublic(valeur: unknown): string {
  if (typeof valeur !== "string" || !/^[a-z0-9]{6,20}$/i.test(valeur)) throw new ChampInvalide("pote");
  return valeur;
}

/** Ce que l'app voit d'un partage : la position seulement tant qu'il est en cours */
function presenterPartage(ligne: LignePartage, moi: number, personne: PersonneResume, maintenant: Date): PartagePositionMiamSafe {
  const actif = estPartageActif(ligne, maintenant);
  return {
    id: ligne.id,
    sens: ligne.compteId === moi ? "envoye" : "recu",
    personne,
    lieu: ligne.lieu,
    position: actif && ligne.position ? { ...ligne.position, le: ligne.position.le.toISOString() } : null,
    creeLe: ligne.creeLe.toISOString(),
    expireLe: ligne.expireLe.toISOString(),
    actif,
  };
}

export function creerControleursPartagesMiamSafe({ services, potes, prevenirCompte }: DependancesPartagesMiamSafe, horloge: () => number) {
  const maintenant = () => new Date(horloge());
  const compte = (reponse: Response) => reponse.locals.compte as CompteSession;
  const introuvable = (reponse: Response) => reponse.status(404).json({ ok: false, erreur: "partage-inconnu" });

  /** Le partage, s'il concerne ce compte : le sien, ou un partage reçu d'une personne toujours dans sa bande */
  async function lireSiVisible(id: number | null, moi: number, quand: Date): Promise<LignePartage | null> {
    const ligne = id === null ? null : await services.lire(id, quand);
    if (!ligne) return null;
    if (ligne.compteId === moi) return ligne;
    if (ligne.poteId === moi && (await potes.estPote(moi, ligne.compteId))) return ligne;
    return null;
  }

  return {
    /** POST /miam-safe/prevenir : { pote, lieuId, position? } */
    async prevenir(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const pote = lireIdPublic(corps.pote);
      const lieuId = lireLieuId(corps);
      const position = corps.position === undefined || corps.position === null ? null : lirePosition(corps.position);
      const moi = compte(reponse);
      const poteId = await potes.trouverCompte(pote, moi.id);
      if (poteId === null || poteId === moi.id || !(await potes.estPote(moi.id, poteId))) {
        return reponse.status(404).json({ ok: false, erreur: "pote-inconnu" });
      }
      const quand = maintenant();
      const resultat = await services.creer({ compteId: moi.id, poteId, lieuId, position }, quand);
      if (!resultat.ok) return reponse.status(404).json({ ok: false, erreur: resultat.erreur });
      const partage = resultat.partage;
      const message = ecrireMessagePote({ id: partage.id, prenom: moi.prenom, nomLieu: partage.lieu?.nom ?? null, avecPosition: partage.position !== null });
      // On attend Apple et Google : l'app doit savoir si le pote a vraiment reçu quelque chose (sinon, elle propose d'appeler)
      const telephones = await prevenirCompte(poteId, message).catch((erreur: unknown) => {
        console.error("Prévenir un pote : notification non transmise :", (erreur as Error)?.name);
        return 0;
      });
      const personne = (await potes.presenter([poteId])).get(poteId) ?? { id: pote, pseudo: "", prenom: "Ton pote", avatar: null };
      reponse.status(201).json({ ok: true, partage: presenterPartage(partage, moi.id, personne, quand), telephones });
    },

    /** PUT /miam-safe/partages/:id/position : { latitude, longitude, precisionM? } (seulement la personne qui partage) */
    async envoyerPosition(requete: Request, reponse: Response) {
      const position = lirePosition(lireCorps(requete));
      const id = lireIdentifiant(requete.params.id);
      const moi = compte(reponse).id;
      const quand = maintenant();
      const ligne = id === null ? null : await services.lire(id, quand);
      if (!ligne || ligne.compteId !== moi) return introuvable(reponse);
      // Plus potes (retiré, bloqué) : le partage s'arrête de lui-même
      if (!(await potes.estPote(moi, ligne.poteId))) {
        await services.arreter(ligne.id, moi, quand);
        return reponse.status(410).json({ ok: false, erreur: "partage-termine" });
      }
      const resultat = await services.envoyerPosition(ligne.id, moi, position, quand);
      if (resultat === "inconnu") return introuvable(reponse);
      if (resultat === "termine") return reponse.status(410).json({ ok: false, erreur: "partage-termine" });
      if (resultat === "indisponible") return reponse.status(503).json({ ok: false, erreur: "chiffrement-indisponible" });
      reponse.json({ ok: true, expireLe: ligne.expireLe.toISOString() });
    },

    /** DELETE /miam-safe/partages/:id (seulement la personne qui partage) */
    async arreter(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      if (id === null || !(await services.arreter(id, compte(reponse).id, maintenant()))) return introuvable(reponse);
      reponse.json({ ok: true });
    },

    /** GET /miam-safe/partages/:id (la personne qui partage, ou son pote) */
    async lire(requete: Request, reponse: Response) {
      const moi = compte(reponse).id;
      const quand = maintenant();
      const ligne = await lireSiVisible(lireIdentifiant(requete.params.id), moi, quand);
      if (!ligne) return introuvable(reponse);
      const autre = ligne.compteId === moi ? ligne.poteId : ligne.compteId;
      const personne = (await potes.presenter([autre])).get(autre);
      if (!personne) return introuvable(reponse);
      reponse.json({ ok: true, partage: presenterPartage(ligne, moi, personne, quand) });
    },

    /** GET /miam-safe/partages : les partages en cours, envoyés et reçus */
    async lister(_requete: Request, reponse: Response) {
      const moi = compte(reponse).id;
      const quand = maintenant();
      const lignes = await services.listerActifs(moi, quand);
      const visibles: LignePartage[] = [];
      for (const ligne of lignes) {
        if (ligne.compteId === moi || (await potes.estPote(moi, ligne.compteId))) visibles.push(ligne);
      }
      const autres = visibles.map((l) => (l.compteId === moi ? l.poteId : l.compteId));
      const personnes = await potes.presenter([...new Set(autres)]);
      const partages = visibles.flatMap((l, i) => {
        const personne = personnes.get(autres[i]);
        return personne ? [presenterPartage(l, moi, personne, quand)] : [];
      });
      reponse.json({ ok: true, partages });
    },
  };
}
