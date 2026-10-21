import { HEURES_DESISTEMENT_TARDIF, MAX_SORTIES_MIAMIS_A_VENIR } from "../../../../packages/commun/src/regles/communaute.ts";
import { peutOrganiserPourPublic } from "../../../../packages/commun/src/fonctions/sorties-miamis/peut-organiser-pour-public.ts";
import { calculerFenetrePresence } from "../fonctions/communaute/calculer-fenetre-presence.ts";
import { ecrirePublicSortie } from "../fonctions/communaute/ecrire-public-sortie.ts";
import { estInvitationHabitueValable } from "../fonctions/communaute/est-invitation-habitue-valable.ts";
import { estSortieVisible } from "../fonctions/communaute/est-sortie-visible.ts";
import { normaliserVilleCle } from "../fonctions/communaute/normaliser-ville-cle.ts";
import { annoncerTout, type AnnonceCommunaute } from "./communaute-effets.ts";
import { lireProfilsVisibilite } from "./communaute-profils.ts";
import { refus, type ContexteCommunaute, type Refus, type ServicesSortiesMiamis } from "./communaute-regles.ts";
import { creerLectureSortiesMiamis } from "./communaute-sorties-lecture.ts";
import { creerGestesOrganisateur } from "./communaute-sorties-organisateur.ts";
import { avecStatut, entrer, ouvrirSortie, remplirDepuisAttente, sortir } from "./communaute-sorties-outils.ts";
import { creerTachesSortiesMiamis } from "./communaute-sorties-taches.ts";

class CleDejaNotee extends Error {}

type Issue = Refus | { annonces: AnnonceCommunaute[]; apres?: () => Promise<void>; selonVisibilite?: boolean };

const rien = (selonVisibilite = false): Issue => ({ annonces: [], selonVisibilite });

export function creerSortiesMiamis(c: ContexteCommunaute): ServicesSortiesMiamis {
  const lecture = creerLectureSortiesMiamis(c);

  async function rendreApres(moi: number, id: number, maintenant: Date, issue: Issue) {
    if ("ok" in issue) return issue;
    if (issue.apres) await issue.apres();
    const sortie = issue.selonVisibilite ? await lecture.lire(moi, id, maintenant) : await lecture.rendre(moi, id, maintenant);
    return sortie ? { ok: true as const, sortie, effets: await annoncerTout(c.relations, issue.annonces) } : refus("sortie-inconnue");
  }

  async function creerDansLaBase(moi: number, s: Parameters<ServicesSortiesMiamis["creer"]>[1], cle: string, villeCle: string, maintenant: Date) {
    return c.depot.ecrire(async (t) => {
      await t.verrouillerComptes([moi]);
      const deja = await t.lireIdempotence(moi, cle, "miamis");
      if (deja !== null) return { id: deja, cree: false };
      if ((await t.compterSortiesAVenir(moi, maintenant)) >= MAX_SORTIES_MIAMIS_A_VENIR) return refus("trop-de-sorties-miamis");
      const conversationId = await t.creerConversation(moi, maintenant);
      const id = await t.creerSortie({
        organisateurId: moi, lieuId: s.lieuId, conversationId, titre: s.titre, description: s.description, quand: new Date(s.quand), villeCle,
        ...ecrirePublicSortie(s.public), places: s.places, placeGardeeNouveau: s.placeGardeePourNouveau, recurrente: s.recurrente, serieId: null,
        etiquettes: s.etiquettes,
      }, maintenant);
      await t.ecrireParticipation({ sortieId: id, compteId: moi, statut: "organise", habitue: false, creeLe: maintenant, decideLe: maintenant });
      if (!(await t.noterIdempotence(moi, cle, "miamis", id, maintenant))) throw new CleDejaNotee();
      return { id, cree: true };
    });
  }

  const sorties: ServicesSortiesMiamis = {
    lister: lecture.lister,
    lire: lecture.lire,

    async creer(moi, s, cle, maintenant) {
      const deja = await c.depot.lire((t) => t.lireIdempotence(moi, cle, "miamis"));
      if (deja === null) {
        const lieu = (await c.depot.lire((t) => t.lireLieux([s.lieuId]))).get(s.lieuId);
        const villeCle = normaliserVilleCle(lieu?.ville);
        if (!lieu?.publie || !villeCle) return refus("lieu-inconnu");
        const profil = (await c.depot.lire((t) => lireProfilsVisibilite(c, t, [moi], maintenant))).get(moi);
        if (!profil || !peutOrganiserPourPublic(s.public, profil)) return refus("public-reserve");
        let issue: Awaited<ReturnType<typeof creerDansLaBase>>;
        try {
          issue = await creerDansLaBase(moi, s, cle, villeCle, maintenant);
        } catch (erreur) {
          if (!(erreur instanceof CleDejaNotee)) throw erreur;
          const relue = await c.depot.lire((t) => t.lireIdempotence(moi, cle, "miamis"));
          if (relue === null) return refus("cle-deja-prise");
          issue = { id: relue, cree: false };
        }
        if ("ok" in issue) return issue;
        const sortie = await lecture.rendre(moi, issue.id, maintenant);
        return sortie ? { ok: true, sortie, cree: issue.cree, effets: [] } : refus("sortie-inconnue");
      }
      const sortie = await lecture.rendre(moi, deja, maintenant);
      return sortie ? { ok: true, sortie, cree: false, effets: [] } : refus("sortie-inconnue");
    },

    async demander(moi, id, maintenant) {
      const issue: Issue = await c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const lue = await ouvrirSortie(t, id, maintenant);
        if (!lue || (lue.ligne.organisateurId !== moi && (await t.bloqueEntre(moi, lue.ligne.organisateurId)))) return refus("sortie-inconnue");
        const { ligne, participations } = lue;
        const mienne = participations.find((p) => p.compteId === moi);
        if (mienne?.statut === "renonce") await t.ecrireParticipation({ ...mienne, statut: "refuse" });
        if (mienne && ["organise", "accepte", "attente", "demande", "refuse", "renonce"].includes(mienne.statut)) return rien();
        if (ligne.quand.getTime() <= maintenant.getTime()) return refus("sortie-passee");
        if (mienne && estInvitationHabitueValable(mienne, maintenant)) {
          await entrer(t, ligne, mienne, maintenant);
          return rien();
        }
        const [profils, caches, lieux] = await Promise.all([lireProfilsVisibilite(c, t, [moi], maintenant), t.listerCaches(moi), t.lireLieux([ligne.lieuId])]);
        const autres = participations.filter((p) => p.compteId !== moi);
        const visible = estSortieVisible({ moi, ligne, participations: autres, profil: profils.get(moi) ?? null, caches, lieuPublie: lieux.get(ligne.lieuId)?.publie ?? false });
        if (!visible) return refus("sortie-inconnue");
        await t.ecrireParticipation({ sortieId: id, compteId: moi, statut: "demande", habitue: mienne?.habitue ?? false, creeLe: maintenant, decideLe: null, presentLe: null });
        return {
          annonces: [{
            type: "demande-sortie-miamis", acteurId: moi, cible: { type: "miamis", id }, detail: ligne.titre, destinataires: [ligne.organisateurId],
            push: (prenom) => ({ quoi: "demande", prenom, titre: ligne.titre, sortieId: id }),
          }],
        };
      });
      return rendreApres(moi, id, maintenant, issue);
    },

    async annulerDemande(moi, id, maintenant) {
      const issue: Issue = await c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const lue = await ouvrirSortie(t, id, maintenant);
        const mienne = lue?.participations.find((p) => p.compteId === moi);
        if (!lue || !mienne) return rien(true);
        if (mienne.statut === "demande") await t.effacerParticipation(id, moi);
        if (mienne.statut === "refuse") await t.ecrireParticipation({ ...mienne, statut: "renonce" });
        return rien();
      });
      return rendreApres(moi, id, maintenant, issue);
    },

    async quitter(moi, id, maintenant) {
      const issue: Issue = await c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const lue = await ouvrirSortie(t, id, maintenant);
        const mienne = lue?.participations.find((p) => p.compteId === moi);
        if (!lue || !mienne) return rien(true);
        const { ligne } = lue;
        const avant = ligne.quand.getTime() - maintenant.getTime();
        if (avant <= 0 || mienne.statut === "organise") return rien();
        if (mienne.statut === "refuse") {
          await t.ecrireParticipation({ ...mienne, statut: "renonce" });
          return rien();
        }
        if (!["accepte", "attente", "invite", "demande"].includes(mienne.statut)) return rien();
        const tardif = mienne.statut === "accepte" && avant < HEURES_DESISTEMENT_TARDIF * 3_600_000;
        await sortir(t, ligne, mienne, tardif ? "desiste" : null, maintenant);
        return { annonces: await remplirDepuisAttente(t, ligne, maintenant) };
      });
      return rendreApres(moi, id, maintenant, issue);
    },

    async validerPresence(moi, id, maintenant) {
      const issue: Issue = await c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const lue = await ouvrirSortie(t, id, maintenant);
        const mienne = lue?.participations.find((p) => p.compteId === moi);
        if (!lue || !mienne) return refus("sortie-inconnue");
        if (mienne.statut !== "organise" && mienne.statut !== "accepte") return refus("presence-non-validee");
        if (mienne.presentLe !== null) return rien();
        const fenetre = calculerFenetrePresence(lue.ligne.quand);
        if (maintenant < fenetre.de || maintenant > fenetre.a) return refus("presence-fermee");
        if (!(await t.aUneVisiteValidee(moi, lue.ligne.lieuId, fenetre.de, maintenant))) return refus("presence-non-validee");
        await t.ecrireParticipation({ ...mienne, presentLe: maintenant });
        return rien();
      });
      return rendreApres(moi, id, maintenant, issue);
    },

    async annuler(moi, id, maintenant) {
      const issue: Issue = await c.depot.ecrire(async (t) => {
        await t.verrouillerComptes([moi]);
        const lue = await ouvrirSortie(t, id, maintenant);
        if (!lue || (lue.ligne.organisateurId !== moi && !lue.participations.some((p) => p.compteId === moi))) return refus("sortie-inconnue");
        const { ligne, participations } = lue;
        if (ligne.organisateurId !== moi) return refus("reserve-a-l-organisateur");
        if (ligne.quand.getTime() <= maintenant.getTime()) return refus("sortie-passee");
        const acceptes = avecStatut(participations, "accepte");
        const tardive = acceptes.length > 0 && ligne.quand.getTime() - maintenant.getTime() < HEURES_DESISTEMENT_TARDIF * 3_600_000;
        const apres = ligne.conversationId !== null ? await t.effacerConversation(ligne.conversationId) : undefined;
        await t.changerSortie(id, { annuleeLe: maintenant, annulationTardive: tardive, conversationId: null }, maintenant);
        const destinataires = [...acceptes, ...avecStatut(participations, "attente", "demande"), ...participations.filter((p) => estInvitationHabitueValable(p, maintenant)).map((p) => p.compteId)];
        return { apres, annonces: [{ type: "sortie-miamis-annulee", acteurId: moi, cible: { type: "miamis", id }, detail: ligne.titre, destinataires }] };
      });
      if ("ok" in issue) return issue;
      if (issue.apres) await issue.apres();
      return { ok: true, effets: await annoncerTout(c.relations, issue.annonces) };
    },

    ...creerGestesOrganisateur(c, lecture),
    ...creerTachesSortiesMiamis(c),
  };
  return sorties;
}
