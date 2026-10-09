// Les visites côté client (voir routes/visites.ts) : infos de validation d'un lieu, addition demandée, QR du comptoir
// scanné, suivi, annulation, contestation, « Mes visites ». Mêmes règles que la démo de l'app (packages/commun), mais
// sur les vraies données : position comparée ici, jamais gardée ; QR signé par l'API ; e-mail vérifié obligatoire.
import { choisirRecompenseAffichee } from "../../../../packages/commun/src/fonctions/fidelite/choisir-recompense-affichee.ts";
import { estRecompenseAlcool } from "../../../../packages/commun/src/fonctions/fidelite/est-recompense-alcool.ts";
import { lireCodeScanne } from "../../../../packages/commun/src/fonctions/qr/lire-code-scanne.ts";
import { verifierJetonComptoir } from "../../../../packages/commun/src/fonctions/qr/verifier-jeton-comptoir.ts";
import { calculerEffetsValidation } from "../../../../packages/commun/src/fonctions/visites/calculer-effets-validation.ts";
import { calculerPointsVisite } from "../../../../packages/commun/src/fonctions/visites/calculer-points-visite.ts";
import { choisirCodeAddition } from "../../../../packages/commun/src/fonctions/visites/choisir-code-addition.ts";
import { DELAI_ANNULATION_LIEU_MS, DUREE_DEMANDE_ADDITION_MS } from "../../../../packages/commun/src/regles/visites.ts";
import type { LecturePosition } from "../../../../packages/commun/src/types/position.ts";
import type { InfosVisiteLieu, ReglementVisite, ResultatValidation, Visite } from "../../../../packages/commun/src/types/visite.ts";
import { presenterCarteFidelite } from "../fonctions/fidelite/presenter-carte-fidelite.ts";
import type { PointsVisite } from "../fonctions/visites/appliquer-effets-visite.ts";
import { appliquerEffetsVisite } from "../fonctions/visites/appliquer-effets-visite.ts";
import { deciderVisite } from "../fonctions/visites/decider-visite.ts";
import { presenterVisite } from "../fonctions/visites/presenter-visite.ts";
import { MOT_CONTESTATION_MAX, VISITES_RENDUES, type LigneVisite, type TablesVisites } from "./visites-regles.ts";
import { creerOutilsVisites, type ContexteVisites, type EchecVisite } from "./visites-outils.ts";

/** Points à donner après coup (ajouterPoints), au compte de la visite */
export type PointsAPoser = { compteId: number; points: PointsVisite[] };
type Reponse<T> = ({ ok: true } & T) | EchecVisite;

/** Sans précision : payée */
const payee = (): ReglementVisite => ({ type: "paye", reductionPourcent: null, avantages: [] });

export function creerVisitesClient(c: ContexteVisites) {
  const o = creerOutilsVisites(c);

  /** Ce que reçoit le client pour une visite : la visite, sa carte chez ce lieu, et si la carte vient de se remplir */
  async function construireResultat(t: TablesVisites, v: LigneVisite, majeur: boolean, recompenseGagnee: boolean | null, dejaValidee = false): Promise<ResultatValidation> {
    const lieu = (await t.resumerLieux([v.lieuId])).get(v.lieuId) ?? o.lieuDisparu(v.lieuId);
    const [ligneCarte, programme] = await Promise.all([t.lireCarte(v.compteId, v.lieuId, o.maintenant()), t.lireProgramme(v.lieuId)]);
    const carte = ligneCarte ? presenterCarteFidelite(ligneCarte, programme, lieu, majeur) : null;
    // Sans indication : une récompense gagnée à l'instant même de la validation
    const retrouvee = v.statut === "validee" && v.tampon && v.valideLe !== null && (ligneCarte?.pretes.some((r) => r.gagneeLe.getTime() === v.valideLe?.getTime()) ?? false);
    return { visite: presenterVisite(v, lieu), carte, recompenseGagnee: recompenseGagnee ?? retrouvee, dejaValidee };
  }

  /** Une visite du client, relue sous le verrou de son compte (null : pas la sienne, ou introuvable) */
  async function lireSaVisite(t: TablesVisites, compteId: number, id: number) {
    const v = await t.lireVisite(id);
    return v && v.compteId === compteId ? v : null;
  }

  return {
    /** GET /app/visites/lieux/:lieuId */
    lireInfosLieu(compteId: number, lieuId: number): Promise<Reponse<{ infos: InfosVisiteLieu }>> {
      return c.depot.lire(async (t) => {
        const maintenant = o.maintenant();
        const lieu = await t.lireLieu(lieuId, maintenant);
        if (!lieu) return o.echec("introuvable");
        const { majeur } = await o.lireVisiteur(t, compteId);
        if (lieu.type === "bar" && !majeur) return o.echec("mineur-bar");
        await t.expirerDemandes(maintenant);
        const [programme, ligneCarte, enCours] = await Promise.all([
          t.lireProgramme(lieuId),
          t.lireCarte(compteId, lieuId, maintenant),
          t.listerVisites({ compteId, lieuId, statuts: ["demandee"], limite: 1 }),
        ]);
        const recompense = programme?.actif ? choisirRecompenseAffichee(programme, majeur) : null;
        const resume = o.resumer(lieu);
        return {
          ok: true,
          infos: {
            lieuId,
            validationActive: lieu.validationActive,
            reservable: lieu.reservable,
            programme: programme && recompense !== null ? { visitesRequises: programme.visitesRequises, recompense, recompenseAlcool: estRecompenseAlcool(programme, majeur) } : null,
            carte: ligneCarte ? presenterCarteFidelite(ligneCarte, programme, resume, majeur) : null,
            enCoursIci: enCours[0] ? presenterVisite(enCours[0], resume) : null,
            // Le lieu remplit sa fiche et sa carte lui-même (espace pro) : celles de /app/lieux/:id font foi
            pratique: null,
            carteDuLieu: null,
          },
        };
      });
    },

    /** GET /app/visites/lieux-qui-valident */
    listerLieuxQuiValident(compteId: number): Promise<Reponse<{ lieux: number[] }>> {
      return c.depot.lire(async (t) => {
        const { majeur } = await o.lireVisiteur(t, compteId);
        const lieux = await t.listerLieuxQuiValident();
        return { ok: true, lieux: lieux.filter((l) => majeur || l.type !== "bar").map((l) => l.id) };
      });
    },

    /** POST /app/visites/addition */
    demanderAddition(compteId: number, lieuId: number, position: LecturePosition): Promise<Reponse<{ visite: Visite }>> {
      return c.depot.ecrire(async (t) => {
        const maintenant = o.maintenant();
        await t.verrouillerCompte(compteId);
        const lieu = await t.lireLieu(lieuId, maintenant);
        if (!lieu) return o.echec("introuvable");
        const visiteur = await o.lireVisiteur(t, compteId);
        const refus = o.verifierDroits(lieu, visiteur) ?? o.verifierEmail(visiteur);
        if (refus) return refus;
        await t.expirerDemandes(maintenant);
        const [enCours] = await t.listerVisites({ compteId, statuts: ["demandee"], limite: 1 });
        if (enCours) {
          const ailleurs = (await t.resumerLieux([enCours.lieuId])).get(enCours.lieuId);
          return o.echec("demande-en-cours", { lieu: ailleurs?.nom, lieuId: enCours.lieuId });
        }
        const refusPosition = o.verifierPosition(position, lieu);
        if (refusPosition) return refusPosition;
        await t.verrouillerLieu(lieuId);
        const code = choisirCodeAddition(await t.listerCodesPris(lieuId, maintenant), c.tirer);
        const visite = await t.creerVisite({
          ...o.visiteVide(compteId, lieuId, maintenant),
          mode: "addition",
          statut: "demandee",
          code,
          expireLe: new Date(maintenant.getTime() + DUREE_DEMANDE_ADDITION_MS),
          pendantSos: lieu.sosEnCours,
          resultatPosition: "dans-rayon",
        });
        return { ok: true, visite: presenterVisite(visite, o.resumer(lieu)) };
      });
    },

    /** POST /app/visites/comptoir : le texte du QR scanné et la position, une seule visite par QR montré */
    async validerComptoir(compteId: number, texte: string, position: LecturePosition): Promise<Reponse<ResultatValidation & { pointsAPoser: PointsAPoser }>> {
      const code = lireCodeScanne(texte);
      if (code.type === "autre") return o.echec("qr-illisible");
      if (code.type === "lieu") {
        // QR de vitrine : il ouvre la fiche, il ne valide jamais (et jamais le nom d'un bar pour un 15-17 ans)
        return c.depot.lire(async (t) => {
          const lieu = await t.trouverLieuParCode(code.codePublic, o.maintenant());
          if (!lieu) return o.echec("introuvable");
          const { majeur } = await o.lireVisiteur(t, compteId);
          if (lieu.type === "bar" && !majeur) return o.echec("mineur-bar");
          return o.echec("qr-vitrine", { lieuId: lieu.id, lieu: lieu.nom });
        });
      }
      const { jeton } = code;
      if (jeton.version === "d") return o.echec("qr-demo");
      const verification = await verifierJetonComptoir(jeton, { maintenantMs: o.maintenant().getTime(), calculerMac: c.signerQr });
      if (!verification.ok) return o.echec(verification.erreur);

      return c.depot.ecrire(async (t) => {
        const maintenant = o.maintenant();
        await t.verrouillerCompte(compteId);
        const lieu = await t.lireLieu(jeton.lieuId, maintenant);
        if (!lieu) return o.echec("qr-invalide");
        const presentation = await t.lirePresentation(jeton.presentationId);
        if (!presentation || presentation.lieuId !== lieu.id || presentation.cacheeLe || presentation.expireLe <= maintenant) return o.echec("qr-expire");
        const visiteur = await o.lireVisiteur(t, compteId);
        const refus = o.verifierDroits(lieu, visiteur) ?? o.verifierEmail(visiteur) ?? o.verifierPosition(position, lieu);
        if (refus) return refus;
        const [deja] = await t.listerVisites({ compteId, presentationId: presentation.id, limite: 1 });
        if (deja) return { ok: true, ...(await construireResultat(t, deja, visiteur.majeur, false, true)), pointsAPoser: { compteId, points: [] } };
        if (!(await t.consommerPresentation(presentation.id))) return o.echec("qr-epuise");

        const reglement = presentation.reglement ?? payee();
        const visite = await t.creerVisite({
          ...o.visiteVide(compteId, lieu.id, maintenant),
          mode: "comptoir",
          statut: "validee",
          valideLe: maintenant,
          decideLe: maintenant,
          // Le membre de l'équipe qui a montré le QR : on sait qui a validé quoi
          decideParId: presentation.montreParId,
          pendantSos: lieu.sosEnCours,
          points: calculerPointsVisite(lieu.sosEnCours, reglement),
          resultatPosition: "dans-rayon",
          presentationId: presentation.id,
          annulableJusqua: new Date(maintenant.getTime() + DELAI_ANNULATION_LIEU_MS),
          reglement,
        });
        const effets = calculerEffetsValidation(lieu.sosEnCours, maintenant.getTime(), undefined, reglement);
        const { champs, points, recompenseGagnee } = await appliquerEffetsVisite(t, visite, effets, maintenant, visiteur.majeur);
        await t.modifierVisite(visite.id, champs);
        const resultat = await construireResultat(t, { ...visite, ...champs }, visiteur.majeur, recompenseGagnee);
        return { ok: true, ...resultat, pointsAPoser: { compteId, points } };
      });
    },

    /** GET /app/visites/:id */
    lireVisite(compteId: number, id: number): Promise<Reponse<ResultatValidation>> {
      return c.depot.lire(async (t) => {
        await t.expirerDemandes(o.maintenant());
        const v = await lireSaVisite(t, compteId, id);
        if (!v) return o.echec("introuvable");
        const { majeur } = await o.lireVisiteur(t, compteId);
        return { ok: true, ...(await construireResultat(t, v, majeur, null)) };
      });
    },

    /** POST /app/visites/:id/annuler : le client annule son addition en attente */
    annulerDemande(compteId: number, id: number): Promise<Reponse<{ visite: Visite }>> {
      return c.depot.ecrire(async (t) => {
        const maintenant = o.maintenant();
        await t.verrouillerCompte(compteId);
        const v = await lireSaVisite(t, compteId, id);
        if (!v) return o.echec("introuvable");
        const { majeur } = await o.lireVisiteur(t, compteId);
        const decision = await deciderVisite(t, v, { type: "annuler-client" }, maintenant, majeur, null);
        if (!decision.ok) return o.echec(decision.erreur);
        return { ok: true, visite: presenterVisite(decision.visite, (await t.resumerLieux([v.lieuId])).get(v.lieuId) ?? o.lieuDisparu(v.lieuId)) };
      });
    },

    /** POST /app/visites/:id/contester { mot } : une visite refusée ou retirée, relue par l'équipe SOS Miam */
    contesterRefus(compteId: number, id: number, mot: string): Promise<Reponse<{ visite: Visite }>> {
      return c.depot.ecrire(async (t) => {
        await t.verrouillerCompte(compteId);
        const v = await lireSaVisite(t, compteId, id);
        if (!v) return o.echec("introuvable");
        if (v.statut !== "refusee" && v.statut !== "retiree") return o.echec("transition-interdite");
        const apres = v.contestee ? v : { ...v, contestee: true, contestation: mot.trim().slice(0, MOT_CONTESTATION_MAX) };
        if (!v.contestee) await t.modifierVisite(v.id, { contestee: true, contestation: apres.contestation });
        return { ok: true, visite: presenterVisite(apres, (await t.resumerLieux([v.lieuId])).get(v.lieuId) ?? o.lieuDisparu(v.lieuId)) };
      });
    },

    /** GET /app/visites : « Mes visites », l'addition en attente à part, et les points des visites validées */
    listerVisites(compteId: number): Promise<Reponse<{ visites: Visite[]; enCours: Visite | null; points: number }>> {
      return c.depot.lire(async (t) => {
        await t.expirerDemandes(o.maintenant());
        const lignes = await t.listerVisites({ compteId, limite: VISITES_RENDUES });
        const lieux = await t.resumerLieux([...new Set(lignes.map((v) => v.lieuId))]);
        let enCours: Visite | null = null;
        const visites: Visite[] = [];
        for (const v of lignes) {
          const vue = presenterVisite(v, lieux.get(v.lieuId) ?? o.lieuDisparu(v.lieuId));
          if (v.statut === "demandee") enCours ??= vue;
          else visites.push(vue);
        }
        const points = lignes.reduce((total, v) => total + (v.statut === "validee" ? v.points : 0), 0);
        return { ok: true, visites, enCours, points };
      });
    },
  };
}
