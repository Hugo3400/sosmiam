// Visites et fidélité côté client (voir routes/visites.ts) : lecture de la demande, réponse, et les points donnés une fois
// la visite écrite (ajouterPoints de services/comptes.ts).
import type { Request, Response } from "express";

import { MOTIFS_REFUS_VISITE } from "../../../../packages/commun/src/regles/visites.ts";
import type { ErreurService } from "../../../../packages/commun/src/types/erreurs-service.ts";
import type { MotifRefusVisite } from "../../../../packages/commun/src/types/visite.ts";
import { estLecturePositionValide } from "../../../../packages/commun/src/validation/est-lecture-position-valide.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import { creerComptoir, type ContexteComptoir } from "../services/comptoir.ts";
import { creerFideliteClient } from "../services/fidelite-client.ts";
import { creerVisitesClient, type PointsAPoser } from "../services/visites-client.ts";
import type { EchecVisite } from "../services/visites-outils.ts";
import type { ServicesMomentLieu } from "../services/moment-lieu-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";

export type DependancesVisites = Omit<ContexteComptoir, "horloge"> & {
  /** ajouterPoints de services/comptes.ts (négatif : retire) */
  ajouterPoints: (compteId: number, points: number, raison: "visite" | "visite-sos", detail?: string) => Promise<unknown>;
  /** SOS « place ce soir » et message du moment (routes /pro/comptoir/lieux/:id/moment, /sos, /message) */
  moment: ServicesMomentLieu;
};

/** Le statut HTTP de chaque refus (400 pour ce qui n'est pas listé) */
const STATUTS: Partial<Record<ErreurService | "champ-invalide", number>> = {
  introuvable: 404,
  "mineur-bar": 403, "membre-du-lieu": 403, "compte-limite": 403, "email-non-verifie": 403, "role-requis": 403,
  "lieu-sans-validation": 409, "demande-en-cours": 409, "transition-interdite": 409, "delai-depasse": 409, "qr-epuise": 409,
  "qr-vitrine": 409, "code-faux": 409, "pas-de-recompense": 409,
  "qr-expire": 410,
  "hors-zone": 422, "position-imprecise": 422, "position-perimee": 422, "position-simulee": 422,
};

/** Un refus des services, tel quel (avec ses détails : distance arrondie, nom du lieu…) */
export function repondreEchec(reponse: Response, e: EchecVisite) {
  const { ok: _ok, ...corps } = e;
  return reponse.status(STATUTS[e.erreur] ?? 400).json({ ok: false, ...corps });
}

export const champInvalide = (reponse: Response, champ: string) => reponse.status(400).json({ ok: false, erreur: "champ-invalide", champ });

/** Un motif de refus de la liste fermée, ou null */
export const lireMotif = (brut: unknown): MotifRefusVisite | null =>
  typeof brut === "string" && (MOTIFS_REFUS_VISITE as readonly string[]).includes(brut) ? (brut as MotifRefusVisite) : null;

/** Donne (ou retire) les points d'une visite décidée ; un raté est noté au journal, la visite reste écrite */
export async function poserPoints(ajouterPoints: DependancesVisites["ajouterPoints"], a: PointsAPoser | undefined) {
  for (const p of a?.points ?? []) {
    await ajouterPoints(a!.compteId, p.valeur, p.raison, p.detail).catch((erreur: unknown) => {
      console.error("Visites : points non posés :", resumerErreur(erreur));
    });
  }
}

export function creerControleursVisites(d: DependancesVisites, horloge: () => number) {
  const contexte = { ...d, horloge };
  const visites = creerVisitesClient(contexte);
  const fidelite = creerFideliteClient(contexte);
  /** Rend { ok, … } ou le refus, sans les points (déjà posés) */
  const rendre = (reponse: Response, r: ({ ok: true } & Record<string, unknown>) | EchecVisite, statut = 200) => {
    if (!r.ok) return repondreEchec(reponse, r);
    const { pointsAPoser: _points, ...corps } = r;
    return reponse.status(statut).json(corps);
  };

  return {
    /** Le comptoir, pour routes/comptoir.ts (même contexte) */
    comptoir: creerComptoir(contexte),

    async lister(_q: Request, reponse: Response) {
      rendre(reponse, await visites.listerVisites(lireCompteId(reponse)));
    },

    async listerLieuxQuiValident(_q: Request, reponse: Response) {
      rendre(reponse, await visites.listerLieuxQuiValident(lireCompteId(reponse)));
    },

    async lireInfosLieu(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.lieuId);
      if (lieuId === null) return champInvalide(reponse, "lieuId");
      rendre(reponse, await visites.lireInfosLieu(lireCompteId(reponse), lieuId));
    },

    async demanderAddition(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      const lieuId = typeof corps.lieuId === "number" && Number.isInteger(corps.lieuId) && corps.lieuId > 0 && corps.lieuId < 1e9 ? corps.lieuId : null;
      if (lieuId === null) return champInvalide(reponse, "lieuId");
      if (!estLecturePositionValide(corps.position)) return champInvalide(reponse, "position");
      rendre(reponse, await visites.demanderAddition(lireCompteId(reponse), lieuId, corps.position), 201);
    },

    async validerComptoir(requete: Request, reponse: Response) {
      const corps = lireCorps(requete);
      if (typeof corps.texte !== "string" || corps.texte.length > 300) return champInvalide(reponse, "texte");
      if (!estLecturePositionValide(corps.position)) return champInvalide(reponse, "position");
      const r = await visites.validerComptoir(lireCompteId(reponse), corps.texte, corps.position);
      if (r.ok) await poserPoints(d.ajouterPoints, r.pointsAPoser);
      rendre(reponse, r, r.ok && !r.dejaValidee ? 201 : 200);
    },

    async lireVisite(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      if (id === null) return champInvalide(reponse, "id");
      rendre(reponse, await visites.lireVisite(lireCompteId(reponse), id));
    },

    async annulerDemande(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      if (id === null) return champInvalide(reponse, "id");
      rendre(reponse, await visites.annulerDemande(lireCompteId(reponse), id));
    },

    async contesterRefus(requete: Request, reponse: Response) {
      const id = lireIdentifiant(requete.params.id);
      if (id === null) return champInvalide(reponse, "id");
      const mot = lireCorps(requete).mot ?? "";
      if (typeof mot !== "string" || mot.length > 2000) return champInvalide(reponse, "mot");
      rendre(reponse, await visites.contesterRefus(lireCompteId(reponse), id, mot));
    },

    async listerCartes(_q: Request, reponse: Response) {
      rendre(reponse, await fidelite.listerCartes(lireCompteId(reponse)));
    },

    async demanderRecompense(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.lieuId);
      if (lieuId === null) return champInvalide(reponse, "lieuId");
      rendre(reponse, await fidelite.demanderRecompense(lireCompteId(reponse), lieuId));
    },

    async annulerDemandeRecompense(requete: Request, reponse: Response) {
      const lieuId = lireIdentifiant(requete.params.lieuId);
      if (lieuId === null) return champInvalide(reponse, "lieuId");
      rendre(reponse, await fidelite.annulerDemandeRecompense(lireCompteId(reponse), lieuId));
    },
  };
}
