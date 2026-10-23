// Double en mémoire du profil social, des personnes, des masques et du pouls (contrat dans social-regles.ts), posé sur les
// tables partagées : mêmes règles que social.ts et social-pouls.ts (le pouls passe par la même mise en forme, presenterPouls).
import { calculerNiveauProfil } from "../../../../packages/commun/src/regles/calculer-niveau-profil.ts";
import { MAX_MASQUES } from "../../../../packages/commun/src/regles/potes.ts";
import { calculerDebutMoisParis } from "../../../../packages/commun/src/fonctions/temps/calculer-debut-mois-paris.ts";
import { peutVoirListe } from "../../../../packages/commun/src/fonctions/social/peut-voir-liste.ts";
import type { CibleMasque, NiveauProfil, SuggestionPersonneApi } from "../../../../packages/commun/src/types/social.ts";
import { creerIdPublic } from "../fonctions/social/creer-id-public.ts";
import { ecrireCurseurPersonne } from "../fonctions/social/ecrire-curseur-personne.ts";
import { lireCurseurPersonne } from "../fonctions/social/lire-curseur-personne.ts";
import { presenterListeResume } from "../fonctions/social/presenter-liste-resume.ts";
import { presenterProfil, type ProfilBande } from "../fonctions/social/presenter-profil.ts";
import { AUCUN_LIEN, type RelationsSociales } from "./relations-sociales-regles.ts";
import { presenterPouls, type LignePouls } from "./social-pouls.ts";
import {
  cibleIdSuggestion, LIENS_PAR_PAGE, MAX_COMPTEUR_POULS, MAX_LISTES_PROFIL, MAX_MASQUES_LUS, MAX_MENTIONS, MAX_RESULTATS_RECHERCHE, MAX_SUGGESTIONS,
  type ServicesSocial,
} from "./social-regles.ts";
import { listerCachesEnMemoire, type TablesSociales } from "./tables-sociales-en-memoire.ts";

/** Plus récent d'abord ; à la même milliseconde, le dernier écrit d'abord */
const plusRecentDAbord = <T extends { creeLe: Date }>(lignes: T[]) => [...lignes].reverse().sort((a, b) => b.creeLe.getTime() - a.creeLe.getTime());
/** La plus tardive de ces dates, ou null */
const auPlusTard = (dates: Date[]) => (dates.length === 0 ? null : new Date(Math.max(...dates.map((d) => d.getTime()))));

/** La même ligne que la requête de social-pouls.ts, calculée sur les tables en mémoire */
function calculerLignePouls(tables: TablesSociales, compteId: number, maintenant: Date, ancienneApp = false): LignePouls {
  const caches = listerCachesEnMemoire(tables, compteId);
  const profil = tables.profils.get(compteId);
  const conversations = tables.membres.flatMap((m) => {
    const c = m.compteId === compteId ? tables.conversations.get(m.conversationId) : undefined;
    return c ? [{ c, depuis: Math.max(m.luJusqua, m.visibleApres) }] : [];
  });
  const nonLus = (type: "messages" | "sorties") => conversations
    .filter(({ c }) => (c.type === "sortie") === (type === "sorties"))
    .reduce((somme, { c, depuis }) => somme + Math.min(MAX_COMPTEUR_POULS, [...tables.messages.values()].filter((m) =>
      m.conversationId === c.id && m.id > depuis && m.auteurId !== compteId && !m.supprimeLe && !m.suspenduLe && !m.retireLe
      && (m.auteurId === null || !caches.has(m.auteurId)) && (!ancienneApp || m.systeme === null)).length), 0);
  const privesEtGroupes = conversations.filter(({ c }) => c.type !== "sortie");
  const invitationsGroupes = tables.invitationsGroupes.filter((i) => i.compteId === compteId && i.statut === "invite");
  const sorties = tables.invitationsSorties.flatMap((i) => {
    const sortie = i.compteId === compteId && (i.statut === "invite" || i.statut === "accepte") ? tables.sorties.get(i.sortieId) : undefined;
    return sortie ? [{ i, sortie }] : [];
  });
  const cloche = [...tables.cloche.values()].filter((n) => n.compteId === compteId && (n.acteurId === null || !caches.has(n.acteurId))
    && !(ancienneApp && n.type === "mention" && n.cible === "conversation"));
  const vue = profil?.clocheVueLe ?? null;
  const demandesBande = tables.demandes.filter((d) => d.aId === compteId && d.refuseeLe === null);
  const demandesSuivis = tables.suivis.filter((s) => s.suiviId === compteId && s.statut === "demande");
  const potes = tables.bande.filter((b) => b.compteId === compteId);
  return {
    aProfil: profil !== undefined,
    messagesNonLus: nonLus("messages"),
    sortiesNonLus: nonLus("sorties"),
    conversations: privesEtGroupes.length,
    conversationsLe: auPlusTard(privesEtGroupes.map(({ c }) => c.modifieLe)),
    discussionsSortiesLe: auPlusTard(conversations.filter(({ c }) => c.type === "sortie").map(({ c }) => c.modifieLe)),
    invitationsGroupes: invitationsGroupes.length,
    invitationsGroupesLe: auPlusTard(invitationsGroupes.map((i) => i.creeLe)),
    sorties: sorties.filter(({ i }) => i.statut === "accepte").length,
    invitationsSorties: sorties.filter(({ i, sortie }) => i.statut === "invite" && sortie.quand.getTime() > maintenant.getTime()).length,
    sortiesLe: auPlusTard(sorties.map(({ sortie }) => sortie.modifieLe)),
    clocheNonVues: Math.min(MAX_COMPTEUR_POULS, cloche.filter((n) => !vue || n.creeLe.getTime() > vue.getTime()).length),
    clocheMaxId: cloche.length === 0 ? null : Math.max(...cloche.map((n) => n.id)),
    clocheNombre: cloche.length,
    clocheLe: auPlusTard(cloche.map((n) => n.creeLe)),
    demandesBande: demandesBande.length,
    demandesBandeLe: auPlusTard(demandesBande.map((d) => d.creeLe)),
    demandesSuivis: demandesSuivis.length,
    demandesSuivisLe: auPlusTard(demandesSuivis.map((d) => d.creeLe)),
    potes: potes.length,
    potesLe: auPlusTard(potes.map((b) => b.creeLe)),
  };
}

export function creerSocialEnMemoire(tables: TablesSociales, relations: RelationsSociales, tirer: (max: number) => number): ServicesSocial {
  const niveauSur = async (moi: number, cible: number) => {
    const lien = (await relations.lireLiens(moi, [cible])).get(cible) ?? AUCUN_LIEN;
    const prive = tables.comptes.get(cible)?.prive ?? false;
    const niveau: NiveauProfil = calculerNiveauProfil({ prive }, { estMoi: false, pote: lien.pote, abonne: lien.jeSuis === "suivi" });
    return { lien, niveau };
  };

  const social: ServicesSocial = {
    async lireIdPublic(compteId) {
      return tables.profils.get(compteId)?.idPublic ?? null;
    },

    async assurerProfil(compteId) {
      if (!tables.comptes.get(compteId)?.pseudo) return null;
      const existant = tables.profils.get(compteId);
      if (existant) return { compteId, idPublic: existant.idPublic, cree: false };
      const pris = new Set([...tables.profils.values()].map((p) => p.idPublic));
      let idPublic = creerIdPublic(tirer);
      for (let essai = 0; pris.has(idPublic); essai++) {
        if (essai >= 5) throw new Error("Identifiant public impossible à tirer");
        idPublic = creerIdPublic(tirer);
      }
      tables.profils.set(compteId, {
        compteId, idPublic, codeInvitationChiffre: null, codeInvitationLe: null, arriveesParLien: 0, arriveesDepuis: null,
        trouvable: true, suggerable: true, activitePartagee: true, pushSocial: true, accusesLecture: true, apercuMessages: true, clocheVueLe: null,
        lieuxRecusVusJusqua: 0,
        creeLe: new Date(),
      });
      return { compteId, idPublic, cree: true };
    },

    async lireMoi(compteId) {
      const profil = tables.profils.get(compteId);
      const compte = tables.comptes.get(compteId);
      const personne = (await relations.presenter([compteId])).get(compteId);
      if (!profil || !compte || !personne) return null;
      const { trouvable, suggerable, activitePartagee, pushSocial, accusesLecture, apercuMessages } = profil;
      return { personne, prive: compte.prive, reglages: { trouvable, suggerable, activitePartagee, pushSocial, accusesLecture, apercuMessages } };
    },

    async modifierReglages(compteId, reglages) {
      const profil = tables.profils.get(compteId);
      if (!profil) throw new Error("Profil social introuvable");
      Object.assign(profil, reglages);
      const moi = await social.lireMoi(compteId);
      if (!moi) throw new Error("Profil social introuvable après modification");
      return moi;
    },

    async chercher(compteId, debut) {
      const caches = listerCachesEnMemoire(tables, compteId);
      const trouves = [...tables.profils.values()].flatMap((p) => {
        const compte = tables.comptes.get(p.compteId);
        if (!compte?.pseudo?.startsWith(debut) || !p.trouvable || p.compteId === compteId || caches.has(p.compteId)) return [];
        return [{ compte, pseudo: compte.pseudo }];
      });
      trouves.sort((a, b) => Number(b.pseudo === debut) - Number(a.pseudo === debut) || a.pseudo.length - b.pseudo.length || (a.pseudo < b.pseudo ? -1 : 1));
      const retenus = trouves.slice(0, MAX_RESULTATS_RECHERCHE);
      const personnes = await relations.presenter(retenus.map((t) => t.compte.id));
      return retenus.flatMap(({ compte }) => {
        const personne = personnes.get(compte.id);
        const pote = tables.bande.some((b) => b.compteId === compteId && b.poteId === compte.id);
        return personne ? [{ personne, pote, prive: compte.prive }] : [];
      });
    },

    async suggerer(compteId) {
      const potes = await relations.listerPotes(compteId);
      const exclus = new Set([compteId, ...tables.suivis.filter((s) => s.suiveurId === compteId).map((s) => s.suiviId), ...listerCachesEnMemoire(tables, compteId)]);
      const candidats = new Map<number, SuggestionPersonneApi["raison"]>();
      const proposer = (id: number, raison: SuggestionPersonneApi["raison"]) => {
        if (!exclus.has(id) && !candidats.has(id)) candidats.set(id, raison);
      };
      for (const s of plusRecentDAbord(tables.suivis.filter((s) => s.suiviId === compteId && s.statut === "accepte"))) proposer(s.suiveurId, "te-suit");
      for (const id of potes) proposer(id, "ta-bande");
      const communs = new Map<number, number>();
      for (const pote of potes) {
        for (const b of tables.bande) {
          if (b.compteId === pote && b.poteId !== compteId && !potes.includes(b.poteId)) communs.set(b.poteId, (communs.get(b.poteId) ?? 0) + 1);
        }
      }
      for (const [id] of [...communs].sort((a, b) => b[1] - a[1] || a[0] - b[0])) proposer(id, "potes-en-commun");
      const masquees = new Set(tables.masques.filter((m) => m.compteId === compteId && m.cible === "suggestion").map((m) => m.cibleId));
      const personnes = await relations.presenter([...candidats.keys()]);
      const suggestions: SuggestionPersonneApi[] = [];
      for (const [id, raison] of candidats) {
        const personne = personnes.get(id);
        const profil = tables.profils.get(id);
        if (!personne || !profil || masquees.has(cibleIdSuggestion(profil.idPublic))) continue;
        if (raison === "potes-en-commun" && (!profil.suggerable || tables.comptes.get(id)?.prive)) continue;
        suggestions.push({ personne, raison });
        if (suggestions.length >= MAX_SUGGESTIONS) break;
      }
      return suggestions;
    },

    async trouverMentions(compteId, pseudos) {
      const liste = new Set([...new Set(pseudos.map((p) => p.toLowerCase()))].slice(0, MAX_MENTIONS));
      const caches = listerCachesEnMemoire(tables, compteId);
      // « trouvable: false » : seulement pour qui connaît déjà son identifiant public (bande, suivi accepté dans un sens ou l'autre)
      const connu = (id: number) => tables.bande.some((b) => b.compteId === compteId && b.poteId === id)
        || tables.suivis.some((s) => s.statut === "accepte" && ((s.suiveurId === compteId && s.suiviId === id) || (s.suiveurId === id && s.suiviId === compteId)));
      const carte = new Map<string, string>();
      for (const compte of tables.comptes.values()) {
        const profil = tables.profils.get(compte.id);
        if (!compte.pseudo || !liste.has(compte.pseudo) || !profil || caches.has(compte.id)) continue;
        if (profil.trouvable || connu(compte.id)) carte.set(compte.pseudo, profil.idPublic);
      }
      return carte;
    },

    async lireProfil(compteId, cibleId, maintenant) {
      const estMoi = compteId === cibleId;
      const personne = (await relations.presenter([cibleId])).get(cibleId);
      const compte = tables.comptes.get(cibleId);
      const profil = tables.profils.get(cibleId);
      if (!personne || !compte || !profil) return null;
      const { lien, niveau } = estMoi ? { lien: AUCUN_LIEN, niveau: "bande" as const } : await niveauSur(compteId, cibleId);
      const relation = estMoi
        ? null
        : { pote: lien.pote, demandeBande: lien.demandeBande, jeSuis: lien.jeSuis, meSuit: lien.meSuit, meDemande: lien.meDemande, bloque: lien.bloqueParMoi };
      const compteurs = {
        abonnes: tables.suivis.filter((s) => s.suiviId === cibleId && s.statut === "accepte").length,
        abonnements: tables.suivis.filter((s) => s.suiveurId === cibleId && s.statut === "accepte").length,
      };
      const vide = { personne, prive: compte.prive, niveau, relation, compteurs, badges: [], listes: [], bande: null, activitePartagee: profil.activitePartagee };
      if (relation?.bloque || niveau === "prive") return presenterProfil(vide);
      let bande: ProfilBande | null = null;
      if (niveau === "bande") {
        bande = { ville: compte.villeApp, points: compte.points, palier: compte.palier, pointsDuMois: 0, rescoussesDuMois: 0, lieuxSauves: [], gardes: [] };
        if (estMoi || profil.activitePartagee) {
          const debutMois = calculerDebutMoisParis(maintenant.getTime());
          const duMois = <T extends { compteId: number; creeLe: Date }>(l: T[]) => l.filter((x) => x.compteId === cibleId && x.creeLe.getTime() >= debutMois);
          bande.pointsDuMois = duMois(tables.journalPoints).reduce((somme, j) => somme + j.points, 0);
          bande.rescoussesDuMois = duMois(tables.rescousses).length;
          bande.lieuxSauves = [...new Set(plusRecentDAbord(tables.rescousses.filter((r) => r.compteId === cibleId)).map((r) => r.lieuId))];
          bande.gardes = plusRecentDAbord(tables.gardes.filter((g) => g.compteId === cibleId)).map((g) => g.lieuId);
        }
      }
      return presenterProfil({ ...vide, badges: [...compte.badges], listes: await social.listerListesDe(compteId, cibleId), bande });
    },

    async listerLiens(compteId, cibleId, sens, apres) {
      if (compteId !== cibleId && !(await relations.lireLiens(compteId, [cibleId])).get(cibleId)?.pote) return "ferme";
      const curseur = lireCurseurPersonne(apres) ?? null;
      // Comme la base : le compte de l'identifiant public départage une même seconde ; parti depuis, la date seule
      const depart = curseur ? ([...tables.profils.values()].find((p) => p.idPublic === curseur.idPublic)?.compteId ?? null) : null;
      const caches = listerCachesEnMemoire(tables, compteId);
      const abonnes = sens === "abonnes";
      const autre = (s: { suiveurId: number; suiviId: number }) => (abonnes ? s.suiveurId : s.suiviId);
      const ordre = (a: { creeLe: Date; id: number }, b: { creeLe: Date; id: number }) => b.creeLe.getTime() - a.creeLe.getTime() || b.id - a.id;
      const apresDepart = (s: { creeLe: Date; id: number }) => !curseur
        || s.creeLe.getTime() < curseur.date.getTime() || (depart !== null && s.creeLe.getTime() === curseur.date.getTime() && s.id < depart);
      const lignes = tables.suivis
        .filter((s) => (abonnes ? s.suiviId : s.suiveurId) === cibleId && s.statut === "accepte" && !caches.has(autre(s)) && tables.profils.has(autre(s)))
        .map((s) => ({ ...s, id: autre(s) }))
        .filter(apresDepart)
        .sort(ordre);
      const page = lignes.slice(0, LIENS_PAR_PAGE);
      const personnes = await relations.presenter(page.map((l) => l.id));
      const derniere = page.at(-1);
      return {
        liens: page.flatMap((l) => {
          const personne = personnes.get(l.id);
          return personne ? [{ personne, depuis: (l.accepteLe ?? l.creeLe).toISOString() }] : [];
        }),
        suite: lignes.length > LIENS_PAR_PAGE && derniere ? ecrireCurseurPersonne(derniere.creeLe, tables.profils.get(derniere.id)!.idPublic) : null,
      };
    },

    async listerListesDe(compteId, cibleId) {
      const estMoi = compteId === cibleId;
      const auteur = (await relations.presenter([cibleId])).get(cibleId);
      if (!auteur) return [];
      let niveau: NiveauProfil = "bande";
      if (!estMoi) {
        const lu = await niveauSur(compteId, cibleId);
        if (lu.lien.bloqueParMoi || lu.lien.mABloque) return [];
        niveau = lu.niveau;
      }
      const signalees = new Set([...tables.signalements.values()].filter((s) => s.signaleParId === compteId && s.cible === "liste").map((s) => s.cibleId));
      return [...tables.listes.values()]
        .filter((l) => l.auteurId === cibleId && (estMoi || (l.suspendueLe === null && l.retireeLe === null)))
        .filter((l) => {
          const coAuteur = tables.coAuteurs.some((c) => c.listeId === l.id && c.compteId === compteId && c.statut === "accepte");
          return peutVoirListe({ visibilite: l.visibilite === "bande" ? "bande" : "tous" }, niveau, coAuteur) && !signalees.has(String(l.id));
        })
        .sort((a, b) => b.modifieLe.getTime() - a.modifieLe.getTime() || b.id - a.id)
        .slice(0, MAX_LISTES_PROFIL)
        .map((l) => presenterListeResume({
          ...l,
          nombreLieux: tables.lieuxListes.filter((x) => x.listeId === l.id && tables.lieux.get(x.lieuId)?.statut === "publie").length,
          abonnes: tables.abonnementsListes.filter((x) => x.listeId === l.id).length,
        }, auteur));
    },

    async listerMasques(compteId, cible) {
      return plusRecentDAbord(tables.masques.filter((m) => m.compteId === compteId && (!cible || m.cible === cible)))
        .slice(0, MAX_MASQUES_LUS)
        .map((m) => ({ cible: m.cible as CibleMasque, cibleId: m.cibleId }));
    },

    async masquer(compteId, cible, cibleId, masque) {
      const indice = tables.masques.findIndex((m) => m.compteId === compteId && m.cible === cible && m.cibleId === cibleId);
      if (!masque) {
        if (indice >= 0) tables.masques.splice(indice, 1);
        return { ok: true };
      }
      if (indice >= 0) return { ok: true };
      if (tables.masques.filter((m) => m.compteId === compteId).length >= MAX_MASQUES) return { ok: false, erreur: "trop-de-masques" };
      tables.masques.push({ compteId, cible, cibleId, creeLe: new Date() });
      return { ok: true };
    },

    lirePouls: async (compteId, maintenant, app = {}) => presenterPouls(calculerLignePouls(tables, compteId, maintenant, app.ancienneApp === true)),
  };
  return social;
}
