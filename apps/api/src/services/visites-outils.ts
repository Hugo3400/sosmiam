// Ce que partagent les visites côté client, la fidélité et le comptoir : le contexte (données, horloge, clé des QR,
// chiffrement), les refus et les contrôles du compte et de la position.
import type { DetailsErreur } from "../../../../packages/commun/src/client-api/reponse-api.ts";
import { evaluerPosition } from "../../../../packages/commun/src/fonctions/visites/evaluer-position.ts";
import { traduireResultatPosition } from "../../../../packages/commun/src/fonctions/visites/traduire-resultat-position.ts";
import { verifierDroitValidation } from "../../../../packages/commun/src/fonctions/visites/verifier-droit-validation.ts";
import { RAYON_VALIDATION_M } from "../../../../packages/commun/src/regles/visites.ts";
import type { ErreurService } from "../../../../packages/commun/src/types/erreurs-service.ts";
import type { LieuResume } from "../../../../packages/commun/src/types/lieu-resume.ts";
import type { LecturePosition } from "../../../../packages/commun/src/types/position.ts";
import type { ChiffrementDonnees } from "./chiffrement-donnees.ts";
import type { CompteVisiteur, DepotVisites, LieuVisite, NouvelleVisite, TablesVisites } from "./visites-regles.ts";

export type ContexteVisites = {
  depot: DepotVisites;
  /** Pour l'initiale du nom montrée au comptoir ; null : clé absente (prénom seul) */
  chiffrement: ChiffrementDonnees | null;
  /** Signature des QR du comptoir (fonctions/securite/creer-signature-qr.ts) */
  signerQr: (message: string) => string;
  /** Un entier de 0 à max − 1 (crypto.randomInt) : codes à 4 chiffres */
  tirer: (max: number) => number;
  horloge: () => number;
};

export type EchecVisite = { ok: false; erreur: ErreurService; details?: DetailsErreur; champ?: string };
export type Visiteur = CompteVisiteur;

export function creerOutilsVisites(c: ContexteVisites) {
  const maintenant = () => new Date(c.horloge());
  const echec = (erreur: ErreurService, details?: DetailsErreur): EchecVisite => (details ? { ok: false, erreur, details } : { ok: false, erreur });

  return {
    maintenant,
    echec,

    /** Le compte connecté ; un compte effacé entre-temps est traité avec prudence (e-mail non vérifié, aucun rattachement) */
    async lireVisiteur(t: TablesVisites, compteId: number): Promise<Visiteur> {
      const compte = (await t.lireComptes([compteId])).get(compteId);
      return compte ?? { id: compteId, prenom: "", avatar: null, nomChiffre: null, emailVerifie: false, rattachements: [] };
    },

    /** Ce compte peut-il faire valider une visite ici (règles de packages/commun) ? null si oui */
    verifierDroits(lieu: LieuVisite, v: Visiteur): EchecVisite | null {
      const droit = verifierDroitValidation({
        lieu: { id: lieu.id, validationActive: lieu.validationActive },
        compte: { limiteJusqua: null, lieuxMembre: v.rattachements.map((r) => r.lieuId) },
        maintenantMs: c.horloge(),
      });
      if (droit.ok) return null;
      return droit.erreur === "lieu-sans-validation" ? echec(droit.erreur, { lieu: lieu.nom }) : echec(droit.erreur);
    },

    /** E-mail vérifié obligatoire pour valider (décidé le 9 octobre 2026) ; une connexion Apple ou Google compte */
    verifierEmail(v: Visiteur): EchecVisite | null {
      return v.emailVerifie ? null : echec("email-non-verifie");
    },

    /** La lecture du téléphone comparée au lieu : null si on est sur place. La distance, arrondie à 100 m, ne sert qu'au message */
    verifierPosition(position: LecturePosition, lieu: LieuVisite): EchecVisite | null {
      if (!lieu.position) return echec("lieu-sans-validation", { lieu: lieu.nom });
      const { resultat, distanceM } = evaluerPosition(position, lieu.position, lieu.rayonM ?? RAYON_VALIDATION_M);
      const erreur = traduireResultatPosition(resultat);
      if (erreur === null) return null;
      if (erreur === "hors-zone") return echec(erreur, { distanceM: Math.round(distanceM / 100) * 100, lieu: lieu.nom });
      if (erreur === "position-imprecise" && position.precision !== null) return echec(erreur, { precisionM: Math.round(position.precision) });
      return echec(erreur);
    },

    resumer(lieu: LieuVisite): LieuResume {
      return { id: lieu.id, nom: lieu.nom, emoji: lieu.emoji, type: lieu.type, ville: lieu.ville };
    },

    /** Un lieu effacé depuis (ses visites partent avec lui ; seulement par prudence) */
    lieuDisparu(id: number): LieuResume {
      return { id, nom: "Lieu disparu", emoji: "📍", type: "resto", ville: "" };
    },

    /** Une visite à compléter : tout ce qui n'est pas dit vaut « rien encore » */
    visiteVide(compteId: number, lieuId: number, le: Date): Omit<NouvelleVisite, "mode" | "statut"> {
      return {
        compteId, lieuId, code: null, creeLe: le, expireLe: null, valideLe: null, decideLe: null, decideParId: null, pendantSos: false,
        points: 0, tampon: false, resultatPosition: null, motifRefus: null, contestee: false, contestation: null, avisOuvertLe: null,
        avisFermeLe: null, avisDonne: false, presentationId: null, reservationId: null, annulableJusqua: null, reglement: null,
      };
    },
  };
}
