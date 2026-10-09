// Événements d'un lieu, publiés par son équipe (voir routes/comptoir.ts, /pro/comptoir/lieux/:id/evenements) : le gérant et
// l'équipe (rattachement validé, 18 ans) publient, modifient et annulent ; 10 à venir par lieu, 3 mois à l'avance au plus.
// Le lieu d'un événement est relu sur l'événement, jamais pris dans la demande : un événement d'un autre lieu → 404.
import type { Request, Response } from "express";

import { calculerProchaineOccurrence } from "../../../../packages/commun/src/fonctions/evenements/calculer-prochaine-occurrence.ts";
import { listerOccurrencesEvenement } from "../../../../packages/commun/src/fonctions/evenements/lister-occurrences-evenement.ts";
import { EVENEMENTS_A_VENIR_MAX, HORIZON_EVENEMENT_MS, JOUR_MS, JOURS_EVENEMENTS_PASSES_EQUIPE } from "../../../../packages/commun/src/regles/evenements.ts";
import type { ReglageEvenement } from "../../../../packages/commun/src/types/evenement.ts";
import type { TypeLieu } from "../../../../packages/commun/src/types/lieu.ts";
import { validerEvenement } from "../../../../packages/commun/src/validation/valider-evenement.ts";
import { presenterEvenementPro } from "../fonctions/evenements/presenter-evenement-pro.ts";
import { lireIdentifiant } from "../middlewares/proteger-pro.ts";
import type { ChampsEvenement, EvenementEquipe, ServicesEvenements } from "../services/evenements-regles.ts";
import type { RoleRattachement } from "../services/pro-regles.ts";
import { lireCompteId, lireCorps } from "./comptes-champs.ts";
import { champInvalide } from "./visites.ts";

/** Le réglage vérifié, avec de vraies dates, pour les données */
const versChamps = (r: ReglageEvenement): ChampsEvenement => ({
  ...r, debut: new Date(r.debut), fin: r.fin === null ? null : new Date(r.fin), hebdoJusqua: r.hebdoJusqua === null ? null : new Date(r.hebdoJusqua),
});

const echec = (reponse: Response, statut: number, erreur: string) => reponse.status(statut).json({ ok: false, erreur });

export function creerControleursEvenementsPro(
  services: ServicesEvenements,
  roleDe: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>,
  horloge: () => number,
) {
  const maintenant = () => new Date(horloge());
  const typeDuLieu = async (lieuId: number): Promise<TypeLieu> => (await services.lireLieu(lieuId))?.type ?? "resto";

  /** Le lieu de l'adresse, si le compte est de son équipe ; sinon répond (400 ou 403) et rend null */
  async function lieuDeLEquipe(requete: Request, reponse: Response): Promise<number | null> {
    const lieuId = lireIdentifiant(requete.params.id);
    if (lieuId === null) return champInvalide(reponse, "id"), null;
    if (!(await roleDe(lireCompteId(reponse), lieuId))) return echec(reponse, 403, "role-requis"), null;
    return lieuId;
  }

  /** L'événement de l'adresse, s'il est bien de ce lieu ; sinon répond (400 ou 404) et rend null */
  async function evenementDuLieu(requete: Request, reponse: Response, lieuId: number): Promise<EvenementEquipe | null> {
    const id = lireIdentifiant(requete.params.evenementId);
    if (id === null) return champInvalide(reponse, "evenementId"), null;
    const evenement = await services.lirePourEquipe(id);
    if (!evenement || evenement.lieuId !== lieuId) return echec(reponse, 404, "evenement-inconnu"), null;
    return evenement;
  }

  /** L'événement relu après le geste */
  async function repondre(reponse: Response, lieuId: number, evenementId: number, statut = 200) {
    const [evenement, typeLieu] = await Promise.all([services.lirePourEquipe(evenementId), typeDuLieu(lieuId)]);
    if (!evenement) return echec(reponse, 404, "evenement-inconnu");
    reponse.status(statut).json({ ok: true, evenement: presenterEvenementPro(evenement, typeLieu, maintenant()) });
  }

  return {
    /** GET /pro/comptoir/lieux/:id/evenements */
    async lister(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId === null) return;
      const instant = maintenant();
      const depuis = new Date(instant.getTime() - JOURS_EVENEMENTS_PASSES_EQUIPE * JOUR_MS);
      const [lignes, typeLieu] = await Promise.all([services.listerPourEquipe(lieuId, depuis), typeDuLieu(lieuId)]);
      // Finis (ou annulés) depuis plus de 30 jours : plus montrés (les données en rendent un peu plus, à 24 h près)
      const auPlusTard = new Date(instant.getTime() + 2 * HORIZON_EVENEMENT_MS);
      const presentes = lignes
        .filter((e) => listerOccurrencesEvenement(e, depuis, auPlusTard).length > 0)
        .map((e) => presenterEvenementPro(e, typeLieu, instant));
      // À venir d'abord (le plus proche en premier), puis les autres (le plus récent en premier)
      const aVenir = presentes.filter((e) => e.statut === "a-venir").sort((a, b) => a.prochaine!.debut.localeCompare(b.prochaine!.debut) || a.id - b.id);
      const autres = presentes.filter((e) => e.statut !== "a-venir").sort((a, b) => (b.hebdoJusqua ?? b.debut).localeCompare(a.hebdoJusqua ?? a.debut) || b.id - a.id);
      reponse.json({ ok: true, evenements: [...aVenir, ...autres] });
    },

    /** POST /pro/comptoir/lieux/:id/evenements (ReglageEvenement) */
    async creer(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId === null) return;
      const instant = maintenant();
      const verifie = validerEvenement(lireCorps(requete), instant);
      if (!verifie.ok) return reponse.status(400).json({ ok: false, erreur: verifie.erreur, champ: verifie.champ });
      const cree = await services.creer(lieuId, lireCompteId(reponse), versChamps(verifie.evenement), instant, EVENEMENTS_A_VENIR_MAX);
      if (!cree.ok) return echec(reponse, 409, cree.erreur);
      await repondre(reponse, lieuId, cree.id, 201);
    },

    /** PUT /pro/comptoir/lieux/:id/evenements/:evenementId (ReglageEvenement, en entier) */
    async modifier(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId === null) return;
      const evenement = await evenementDuLieu(requete, reponse, lieuId);
      if (!evenement) return;
      const instant = maintenant();
      if (evenement.annuleLe !== null) return echec(reponse, 409, "transition-interdite");
      if (!calculerProchaineOccurrence(evenement, instant)) return echec(reponse, 409, "evenement-passe");
      // Le début déjà enregistré reste permis tel quel (événement de chaque semaine déjà commencé, ou en cours)
      const verifie = validerEvenement(lireCorps(requete), instant, evenement.debut.toISOString());
      if (!verifie.ok) return reponse.status(400).json({ ok: false, erreur: verifie.erreur, champ: verifie.champ });
      await services.modifier(evenement.id, versChamps(verifie.evenement));
      await repondre(reponse, lieuId, evenement.id);
    },

    /** DELETE /pro/comptoir/lieux/:id/evenements/:evenementId : annule (déjà annulé : rien ne change) */
    async annuler(requete: Request, reponse: Response) {
      const lieuId = await lieuDeLEquipe(requete, reponse);
      if (lieuId === null) return;
      const evenement = await evenementDuLieu(requete, reponse, lieuId);
      if (!evenement) return;
      const instant = maintenant();
      if (evenement.annuleLe === null) {
        if (!calculerProchaineOccurrence(evenement, instant)) return echec(reponse, 409, "evenement-passe");
        await services.annuler(evenement.id, instant);
      }
      await repondre(reponse, lieuId, evenement.id);
    },
  };
}
