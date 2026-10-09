// Le comptoir de l'équipe d'un lieu (voir routes/comptoir.ts) : additions et récompenses en attente, QR montré à la
// demande, addition réglée (code à saisir dès 2 en attente), refus, validation annulée (15 min), récompense offerte,
// programme de fidélité. Le lieu est toujours relu sur la ressource (visite, demande), jamais pris dans la demande, et
// le rôle est revérifié à chaque geste (rattachement validé, 18 ans et plus).
import { DEMANDES_AVANT_SAISIE_CODE, DUREE_PRESENTATION_QR_MS, PERSONNES_PRESENTATION_MAX } from "../../../../packages/commun/src/regles/visites.ts";
import type { DemandeComptoir, EtatComptoir, ValidationRecente } from "../../../../packages/commun/src/types/comptoir.ts";
import type { ProgrammeFidelite, ReglageFidelite } from "../../../../packages/commun/src/types/fidelite.ts";
import type { LieuGere } from "../../../../packages/commun/src/types/roles.ts";
import type { EvenementVisite, MotifRefusVisite, ReglementVisite } from "../../../../packages/commun/src/types/visite.ts";
import { validerReglageFidelite } from "../../../../packages/commun/src/validation/valider-reglage-fidelite.ts";
import { construireQrAffiche } from "../fonctions/visites/construire-qr-affiche.ts";
import { deciderVisite } from "../fonctions/visites/decider-visite.ts";
import { lireInitialeNom } from "../fonctions/visites/lire-initiale-nom.ts";
import type { RoleRattachement } from "./pro-regles.ts";
import type { PointsAPoser } from "./visites-client.ts";
import { VALIDEES_AU_COMPTOIR, type LigneProgramme, type LigneVisite, type TablesVisites } from "./visites-regles.ts";
import { creerOutilsVisites, type ContexteVisites, type EchecVisite } from "./visites-outils.ts";

export type ContexteComptoir = ContexteVisites & {
  /** lireRole de services/pro.ts : le rattachement VALIDÉ du compte à ce lieu */
  lireRole: (compteId: number, lieuId: number) => Promise<RoleRattachement | null>;
};

type ReponseComptoir = ({ ok: true; etat: EtatComptoir } | EchecVisite) & { pointsAPoser?: PointsAPoser };

const presenterProgramme = (p: LigneProgramme): ProgrammeFidelite => ({ ...p, modifieLe: p.modifieLe.toISOString() });

export function creerComptoir(c: ContexteComptoir) {
  const o = creerOutilsVisites(c);

  /** Le rôle du compte chez ce lieu, s'il a 18 ans ou plus (null sinon : pas de rôle pro sous 18 ans) */
  async function lireRoleComptoir(t: TablesVisites, compteId: number, lieuId: number): Promise<RoleRattachement | null> {
    const role = await c.lireRole(compteId, lieuId);
    return role && (await o.lireVisiteur(t, compteId)).majeur ? role : null;
  }

  /** L'écran du comptoir à cet instant (lecture seule) */
  async function lireEtat(t: TablesVisites, lieuId: number): Promise<EtatComptoir> {
    const maintenant = o.maintenant();
    await t.expirerDemandes(maintenant);
    const [lieu, resumes, presentation, enAttente, cartes, validees] = await Promise.all([
      t.lireLieu(lieuId, maintenant),
      t.resumerLieux([lieuId]),
      t.lirePresentationAffichee(lieuId, maintenant),
      t.listerVisites({ lieuId, statuts: ["demandee"] }),
      t.listerCartes({ lieuId, avecDemande: true }, maintenant),
      t.listerVisites({ lieuId, statuts: ["validee"], limite: 50 }),
    ]);
    const additions = enAttente.filter((v) => v.code && v.expireLe && v.expireLe > maintenant);
    const recentes = validees
      .filter((v) => v.valideLe && v.annulableJusqua && v.annulableJusqua > maintenant)
      .sort((a, b) => (b.valideLe?.getTime() ?? 0) - (a.valideLe?.getTime() ?? 0))
      .slice(0, VALIDEES_AU_COMPTOIR);
    const ids = [...new Set([...additions, ...recentes].map((v) => v.compteId).concat(cartes.map((carte) => carte.compteId)))];
    const comptes = await t.lireComptes(ids);
    // Le lieu voit seulement le prénom, l'initiale, l'emoji, le code et les tampons chez lui
    const client = (id: number) => {
      const compte = comptes.get(id);
      return { prenom: compte?.prenom ?? "Quelqu'un", initialeNom: lireInitialeNom(compte?.nomChiffre ?? null, c.chiffrement), avatar: compte?.avatar ?? "🙂" };
    };
    const tamponsAdditions = await Promise.all(additions.map((v) => t.lireCarte(v.compteId, lieuId, maintenant)));

    const demandes: DemandeComptoir[] = [
      ...additions.map((v, i): DemandeComptoir => ({
        id: v.id, type: "addition", code: v.code ?? "", ...client(v.compteId), depuis: v.creeLe.toISOString(), recompense: null, tamponsIci: tamponsAdditions[i]?.tampons ?? 0,
      })),
      ...cartes.flatMap((carte): DemandeComptoir[] => {
        const demande = carte.demande;
        if (!demande) return [];
        const recompense = carte.pretes.find((r) => r.id === demande.recompenseId)?.libelle ?? null;
        return [{ id: demande.id, type: "recompense", code: demande.code, ...client(carte.compteId), depuis: demande.creeLe.toISOString(), recompense, tamponsIci: carte.tampons }];
      }),
    ];
    const valideesVues: ValidationRecente[] = recentes.map((v) => ({
      visiteId: v.id, mode: v.mode, ...client(v.compteId),
      valideLe: (v.valideLe ?? v.creeLe).toISOString(), annulableJusqua: (v.annulableJusqua ?? v.creeLe).toISOString(), reglement: v.reglement,
    }));

    return {
      lieu: resumes.get(lieuId) ?? o.lieuDisparu(lieuId),
      validationActive: lieu?.validationActive ?? false,
      codePublic: lieu?.codePublic ?? "",
      qr: presentation ? construireQrAffiche(presentation, maintenant.getTime(), c.signerQr) : null,
      // Les plus anciennes d'abord : c'est l'ordre du passage en caisse
      demandes: demandes.sort((a, b) => a.depuis.localeCompare(b.depuis)),
      arrivees: [],
      reservationsARepondre: 0,
      validees: valideesVues,
      genereLe: maintenant.toISOString(),
    };
  }

  /** Un geste sur le lieu :lieuId, réservé à son équipe ; rend l'écran du comptoir à jour */
  function surLeLieu(compteId: number, lieuId: number, geste?: (t: TablesVisites) => Promise<EchecVisite | null>): Promise<ReponseComptoir> {
    return c.depot.ecrire(async (t) => {
      if (!(await lireRoleComptoir(t, compteId, lieuId))) return o.echec("role-requis");
      const refus = geste ? await geste(t) : null;
      return refus ?? { ok: true, etat: await lireEtat(t, lieuId) };
    });
  }

  /** Décide une addition ou une validation au nom de l'équipe du lieu de la visite */
  function decider(compteId: number, visiteId: number, evenement: EvenementVisite, verifier?: (t: TablesVisites, v: LigneVisite) => Promise<EchecVisite | null>): Promise<ReponseComptoir> {
    return c.depot.ecrire(async (t) => {
      const avant = await t.lireVisite(visiteId);
      if (!avant) return o.echec("introuvable");
      if (!(await lireRoleComptoir(t, compteId, avant.lieuId))) return o.echec("role-requis");
      await t.verrouillerCompte(avant.compteId);
      const v = await t.lireVisite(visiteId);
      if (!v) return o.echec("introuvable");
      const refus = verifier ? await verifier(t, v) : null;
      if (refus) return refus;
      const { majeur } = await o.lireVisiteur(t, v.compteId);
      const decision = await deciderVisite(t, v, evenement, o.maintenant(), majeur, compteId);
      if (!decision.ok) return o.echec(decision.erreur);
      return { ok: true, etat: await lireEtat(t, v.lieuId), pointsAPoser: { compteId: v.compteId, points: decision.points } };
    });
  }

  return {
    /** GET /pro/comptoir/lieux : les lieux où le compte a un rattachement validé */
    listerLieux(compteId: number): Promise<{ ok: true; lieux: LieuGere[] }> {
      return c.depot.lire(async (t) => {
        const visiteur = await o.lireVisiteur(t, compteId);
        if (!visiteur.majeur) return { ok: true, lieux: [] };
        const resumes = await t.resumerLieux(visiteur.rattachements.map((r) => r.lieuId));
        const lieux = visiteur.rattachements.flatMap((r): LieuGere[] => {
          const lieu = resumes.get(r.lieuId);
          return lieu ? [{ id: lieu.id, nom: lieu.nom, emoji: lieu.emoji, role: r.role }] : [];
        });
        return { ok: true, lieux };
      });
    },

    /** GET /pro/comptoir/lieux/:id */
    lireComptoir(compteId: number, lieuId: number): Promise<ReponseComptoir> {
      return c.depot.lire(async (t) => {
        if (!(await lireRoleComptoir(t, compteId, lieuId))) return o.echec("role-requis");
        return { ok: true, etat: await lireEtat(t, lieuId) };
      });
    },

    /** POST /pro/comptoir/lieux/:id/qr : 1 à 12 personnes, 2 minutes ; le QR précédent s'éteint */
    montrerQr(compteId: number, lieuId: number, personnes: number, reglement: ReglementVisite): Promise<ReponseComptoir> {
      return surLeLieu(compteId, lieuId, async (t) => {
        const maintenant = o.maintenant();
        const lieu = await t.lireLieu(lieuId, maintenant);
        if (!lieu?.validationActive) return o.echec("lieu-sans-validation");
        const nombre = Math.min(PERSONNES_PRESENTATION_MAX, Math.max(1, personnes));
        await t.verrouillerLieu(lieuId);
        await t.cacherPresentations(lieuId, maintenant);
        await t.creerPresentation({
          lieuId, montreParId: compteId, personnes: nombre, restantes: nombre, reglement, creeLe: maintenant,
          expireLe: new Date(maintenant.getTime() + DUREE_PRESENTATION_QR_MS), cacheeLe: null,
        });
        return null;
      });
    },

    /** DELETE /pro/comptoir/lieux/:id/qr */
    cacherQr(compteId: number, lieuId: number): Promise<ReponseComptoir> {
      return surLeLieu(compteId, lieuId, async (t) => {
        await t.cacherPresentations(lieuId, o.maintenant());
        return null;
      });
    },

    /** POST /pro/comptoir/visites/:visiteId/reglee : dès 2 additions en attente, le code que montre le client */
    marquerReglee(compteId: number, visiteId: number, codeSaisi: string | null, reglement: ReglementVisite): Promise<ReponseComptoir> {
      return decider(compteId, visiteId, { type: "regler", reglement }, async (t, v) => {
        if (v.statut !== "demandee") return null;
        const maintenant = o.maintenant();
        const enAttente = (await t.listerVisites({ lieuId: v.lieuId, statuts: ["demandee"] })).filter((x) => !x.expireLe || x.expireLe > maintenant);
        // Coup de feu : on tape le code que montre le client, jamais « tout valider » d'un geste
        return enAttente.length >= DEMANDES_AVANT_SAISIE_CODE && codeSaisi?.trim() !== v.code ? o.echec("code-faux") : null;
      });
    },

    /** POST /pro/comptoir/visites/:visiteId/refuser { motif } */
    refuser(compteId: number, visiteId: number, motif: MotifRefusVisite): Promise<ReponseComptoir> {
      return decider(compteId, visiteId, { type: "refuser", motif });
    },

    /** POST /pro/comptoir/visites/:visiteId/annuler { motif } : une validation faite par erreur, 15 minutes au plus */
    annulerValidation(compteId: number, visiteId: number, motif: MotifRefusVisite): Promise<ReponseComptoir> {
      return decider(compteId, visiteId, { type: "annuler-lieu", motif });
    },

    /** POST /pro/comptoir/recompenses/:demandeId/offrir */
    offrirRecompense(compteId: number, demandeId: number): Promise<ReponseComptoir> {
      return c.depot.ecrire(async (t) => {
        const maintenant = o.maintenant();
        const demande = await t.lireDemande(demandeId);
        if (!demande) return o.echec("introuvable");
        if (!(await lireRoleComptoir(t, compteId, demande.lieuId))) return o.echec("role-requis");
        if (demande.expireLe <= maintenant) return o.echec("delai-depasse");
        await t.verrouillerCompte(demande.compteId);
        if (!(await t.offrirRecompense(demande.recompenseId, compteId, maintenant))) return o.echec("introuvable");
        await t.supprimerDemandes(demande.carteId);
        return { ok: true, etat: await lireEtat(t, demande.lieuId) };
      });
    },

    /** GET /pro/comptoir/lieux/:id/programme */
    lireProgramme(compteId: number, lieuId: number): Promise<{ ok: true; programme: ProgrammeFidelite | null } | EchecVisite> {
      return c.depot.lire(async (t) => {
        if (!(await lireRoleComptoir(t, compteId, lieuId))) return o.echec("role-requis");
        const programme = await t.lireProgramme(lieuId);
        return { ok: true, programme: programme ? presenterProgramme(programme) : null };
      });
    },

    /** PUT /pro/comptoir/lieux/:id/programme (gérant) : réglage revérifié par validerReglageFidelite */
    reglerProgramme(compteId: number, lieuId: number, reglage: ReglageFidelite): Promise<{ ok: true; programme: ProgrammeFidelite } | EchecVisite> {
      return c.depot.ecrire(async (t) => {
        if ((await lireRoleComptoir(t, compteId, lieuId)) !== "gerant") return o.echec("role-requis");
        const valide = validerReglageFidelite(reglage);
        if (!valide.ok) return { ok: false, erreur: valide.erreur, champ: valide.champ };
        const programme: LigneProgramme = { ...valide.reglage, lieuId, modifieLe: o.maintenant() };
        await t.ecrireProgramme(programme);
        return { ok: true, programme: presenterProgramme(programme) };
      });
    },
  };
}
