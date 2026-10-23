// Profil social, personnes et masques dans la base (contrat dans social-regles.ts ; le pouls dans social-pouls.ts).
// Une simple lecture ne crée jamais le profil social ; les blocages valent dans les deux sens partout.
import { calculerNiveauProfil } from "../../../../packages/commun/src/regles/calculer-niveau-profil.ts";
import { MAX_MASQUES } from "../../../../packages/commun/src/regles/potes.ts";
import { calculerDebutMoisParis } from "../../../../packages/commun/src/fonctions/temps/calculer-debut-mois-paris.ts";
import { peutVoirListe } from "../../../../packages/commun/src/fonctions/social/peut-voir-liste.ts";
import type { CibleMasque, NiveauProfil, SuggestionPersonneApi } from "../../../../packages/commun/src/types/social.ts";
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { creerIdPublic } from "../fonctions/social/creer-id-public.ts";
import { ecrireCurseurPersonne } from "../fonctions/social/ecrire-curseur-personne.ts";
import { lireCurseurPersonne } from "../fonctions/social/lire-curseur-personne.ts";
import { presenterListeResume } from "../fonctions/social/presenter-liste-resume.ts";
import { presenterPersonne } from "../fonctions/social/presenter-personne.ts";
import { choisirAvatarPublic } from "../fonctions/comptes/choisir-avatar-public.ts";
import { selectionnerAvatarPublic } from "../fonctions/comptes/selectionner-avatar-public.ts";
import { masquerPhotoAvatar } from "../fonctions/comptes/masquer-photo-avatar.ts";
import { presenterProfil, type ProfilBande } from "../fonctions/social/presenter-profil.ts";
import { AUCUN_LIEN, type RelationsSociales } from "./relations-sociales-regles.ts";
import { lirePoulsSocial } from "./social-pouls.ts";
import {
  cibleIdSuggestion, LIENS_PAR_PAGE, MAX_LISTES_PROFIL, MAX_MASQUES_LUS, MAX_MENTIONS, MAX_RESULTATS_RECHERCHE, MAX_SUGGESTIONS,
  type ServicesSocial,
} from "./social-regles.ts";

/** Essais pour tirer un identifiant public libre (32^10 possibilités : un seul suffit presque toujours) */
const ESSAIS_ID_PUBLIC = 5;
/** On lit un peu plus de listes qu'on n'en montre : certaines ne sont pas visibles pour toi */
const MAX_LISTES_PAR_LECTURE = 200;
/** Recherche par début de pseudo (B.1) : l'exact en tête, puis les plus courts ; « _ » échappé (joker de LIKE) */
export function construireRequeteRecherche(compteId: number, debut: string): Prisma.Sql {
  const motif = `${debut.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  return Prisma.sql`
    SELECT c.id, c.pseudo, c.prenom, c.avatar, c.prive, p.id_public AS "idPublic",
      CASE WHEN NOT EXISTS (
        SELECT 1 FROM limitations_comptes l
        WHERE l.compte_id = c.id AND l.levee_le IS NULL AND l.debut <= now() AND (l.fin IS NULL OR l.fin > now())
      ) THEN c.photo_profil END AS "photoProfil",
      EXISTS (SELECT 1 FROM membres_bandes b WHERE b.compte_id = ${compteId} AND b.pote_id = c.id) AS pote
    FROM comptes c JOIN profils_sociaux p ON p.compte_id = c.id
    WHERE c.pseudo LIKE ${motif} ESCAPE '\\' AND p.trouvable AND c.id <> ${compteId}
      AND NOT EXISTS (
        SELECT 1 FROM blocages x
        WHERE (x.bloqueur_id = ${compteId} AND x.bloque_id = c.id) OR (x.bloqueur_id = c.id AND x.bloque_id = ${compteId})
      )
    ORDER BY (c.pseudo = ${debut}) DESC, length(c.pseudo), c.pseudo
    LIMIT ${MAX_RESULTATS_RECHERCHE}`;
}

/** Potes de mes potes qui ne sont pas déjà dans ma bande, rangés par nombre de potes en commun */
export function construireRequetePotesDePotes(compteId: number): Prisma.Sql {
  return Prisma.sql`
    SELECT b2.pote_id AS id, COUNT(*)::int AS communs
    FROM membres_bandes b1 JOIN membres_bandes b2 ON b2.compte_id = b1.pote_id
    WHERE b1.compte_id = ${compteId} AND b2.pote_id <> ${compteId}
      AND NOT EXISTS (SELECT 1 FROM membres_bandes b3 WHERE b3.compte_id = ${compteId} AND b3.pote_id = b2.pote_id)
    GROUP BY b2.pote_id
    ORDER BY communs DESC, b2.pote_id
    LIMIT 100`;
}

type LigneRecherche = { id: number; pseudo: string; prenom: string; avatar: string | null; photoProfil: string | null; prive: boolean; idPublic: string; pote: boolean };

export function creerSocial(o: { relations: RelationsSociales; tirer: (max: number) => number; base?: typeof baseDeDonnees }): ServicesSocial {
  const { relations, tirer } = o;
  const base = o.base ?? baseDeDonnees;

  /** Le niveau de `moi` sur `cible` et nos liens (cible ≠ moi) */
  async function lireNiveau(moi: number, cible: number, prive: boolean) {
    const lien = (await relations.lireLiens(moi, [cible])).get(cible) ?? AUCUN_LIEN;
    const niveau: NiveauProfil = calculerNiveauProfil({ prive }, { estMoi: false, pote: lien.pote, abonne: lien.jeSuis === "suivi" });
    return { lien, niveau };
  }

  const social: ServicesSocial = {
    async lireIdPublic(compteId) {
      const profil = await base.profilSocial.findUnique({ where: { compteId }, select: { idPublic: true } });
      return profil?.idPublic ?? null;
    },

    async assurerProfil(compteId) {
      const compte = await base.compte.findUnique({ where: { id: compteId }, select: { pseudo: true, profilSocial: { select: { idPublic: true } } } });
      if (!compte?.pseudo) return null;
      if (compte.profilSocial) return { compteId, idPublic: compte.profilSocial.idPublic, cree: false };
      for (let essai = 0; essai < ESSAIS_ID_PUBLIC; essai++) {
        const idPublic = creerIdPublic(tirer);
        // Sans cible : un compte déjà pourvu (deux demandes en même temps) ou un identifiant déjà pris ne font aucune erreur
        const ajoutes = await base.$executeRaw`INSERT INTO profils_sociaux (compte_id, id_public) VALUES (${compteId}, ${idPublic}) ON CONFLICT DO NOTHING`;
        if (ajoutes === 1) return { compteId, idPublic, cree: true };
        const existant = await base.profilSocial.findUnique({ where: { compteId }, select: { idPublic: true } });
        if (existant) return { compteId, idPublic: existant.idPublic, cree: false };
      }
      throw new Error("Identifiant public impossible à tirer");
    },

    async lireMoi(compteId) {
      const profil = await base.profilSocial.findUnique({
        where: { compteId },
        select: {
          idPublic: true, trouvable: true, suggerable: true, activitePartagee: true, pushSocial: true, accusesLecture: true, apercuMessages: true,
          compte: { select: { pseudo: true, prenom: true, avatar: true, photoProfil: true, prive: true } },
        },
      });
      if (!profil?.compte.pseudo) return null;
      const { compte, idPublic, ...reglages } = profil;
      return { personne: presenterPersonne({ idPublic, pseudo: compte.pseudo!, prenom: compte.prenom, avatar: choisirAvatarPublic(compte) }), prive: compte.prive, reglages };
    },

    async modifierReglages(compteId, reglages) {
      if (Object.keys(reglages).length > 0) await base.profilSocial.update({ where: { compteId }, data: reglages });
      const moi = await social.lireMoi(compteId);
      if (!moi) throw new Error("Profil social introuvable après modification");
      return moi;
    },

    async chercher(compteId, debut) {
      const lignes = await base.$queryRaw<LigneRecherche[]>(construireRequeteRecherche(compteId, debut));
      return lignes.map((l) => ({ personne: presenterPersonne({ ...l, avatar: choisirAvatarPublic(l) }), pote: l.pote, prive: l.prive }));
    },

    async suggerer(compteId) {
      const [potes, mesSuivis, teSuivent, blocages, masques, potesDePotes] = await Promise.all([
        relations.listerPotes(compteId),
        base.suiviPersonne.findMany({ where: { suiveurId: compteId }, select: { suiviId: true } }),
        base.suiviPersonne.findMany({ where: { suiviId: compteId, statut: "accepte" }, select: { suiveurId: true }, orderBy: { creeLe: "desc" }, take: 100 }),
        relations.listerBlocages(compteId),
        base.elementMasque.findMany({ where: { compteId, cible: "suggestion" }, select: { cibleId: true } }),
        base.$queryRaw<{ id: number; communs: number }[]>(construireRequetePotesDePotes(compteId)),
      ]);
      const exclus = new Set([compteId, ...mesSuivis.map((s) => s.suiviId), ...blocages.caches]);
      const candidats = new Map<number, SuggestionPersonneApi["raison"]>();
      const proposer = (id: number, raison: SuggestionPersonneApi["raison"]) => {
        if (!exclus.has(id) && !candidats.has(id)) candidats.set(id, raison);
      };
      for (const s of teSuivent) proposer(s.suiveurId, "te-suit");
      for (const id of potes) proposer(id, "ta-bande");
      for (const p of potesDePotes) proposer(p.id, "potes-en-commun");
      const profils = await base.profilSocial.findMany({
        where: { compteId: { in: [...candidats.keys()] } },
        select: { compteId: true, idPublic: true, suggerable: true, compte: { select: { pseudo: true, prenom: true, prive: true, ...selectionnerAvatarPublic(new Date()) } } },
      });
      const parCompte = new Map(profils.map((p) => [p.compteId, p]));
      const masquees = new Set(masques.map((m) => m.cibleId));
      const suggestions: SuggestionPersonneApi[] = [];
      for (const [id, raison] of candidats) {
        const p = parCompte.get(id);
        if (!p?.compte.pseudo || masquees.has(cibleIdSuggestion(p.idPublic))) continue;
        // Par les potes de potes : seulement un compte public qui veut être proposé (jamais un compte privé)
        if (raison === "potes-en-commun" && (!p.suggerable || p.compte.prive)) continue;
        suggestions.push({ personne: presenterPersonne({ idPublic: p.idPublic, pseudo: p.compte.pseudo, prenom: p.compte.prenom, avatar: choisirAvatarPublic(p.compte) }), raison });
        if (suggestions.length >= MAX_SUGGESTIONS) break;
      }
      return suggestions;
    },

    async trouverMentions(compteId, pseudos) {
      const liste = [...new Set(pseudos.map((p) => p.toLowerCase()))].slice(0, MAX_MENTIONS);
      if (liste.length === 0) return new Map();
      const [comptes, { caches }] = await Promise.all([
        base.compte.findMany({
          where: {
            pseudo: { in: liste },
            profilSocial: { isNot: null },
            // « trouvable: false » : jamais par son pseudo, sauf pour qui connaît déjà son identifiant public (même bande, ou
            // un suivi accepté dans un sens ou dans l'autre)
            OR: [
              { profilSocial: { is: { trouvable: true } } },
              { dansLesBandes: { some: { compteId } } },
              { suivisRecus: { some: { suiveurId: compteId, statut: "accepte" } } },
              { suivisDonnes: { some: { suiviId: compteId, statut: "accepte" } } },
            ],
          },
          select: { id: true, pseudo: true, profilSocial: { select: { idPublic: true } } },
        }),
        relations.listerBlocages(compteId),
      ]);
      return new Map(comptes.flatMap((c) => (c.pseudo && c.profilSocial && !caches.has(c.id) ? [[c.pseudo, c.profilSocial.idPublic] as const] : [])));
    },

    async lireProfil(compteId, cibleId, maintenant) {
      const estMoi = compteId === cibleId;
      const [personnes, compte, profil] = await Promise.all([
        relations.presenter([cibleId]),
        base.compte.findUnique({ where: { id: cibleId }, select: { prive: true, ville: true, points: true, palier: true } }),
        base.profilSocial.findUnique({ where: { compteId: cibleId }, select: { activitePartagee: true } }),
      ]);
      const personne = personnes.get(cibleId);
      if (!personne || !compte || !profil) return null;
      const { lien, niveau } = estMoi ? { lien: AUCUN_LIEN, niveau: "bande" as const } : await lireNiveau(compteId, cibleId, compte.prive);
      const relation = estMoi
        ? null
        : { pote: lien.pote, demandeBande: lien.demandeBande, jeSuis: lien.jeSuis, meSuit: lien.meSuit, meDemande: lien.meDemande, bloque: lien.bloqueParMoi };
      const vide = { personne, prive: compte.prive, niveau, relation, compteurs: { abonnes: 0, abonnements: 0 }, badges: [], listes: [], bande: null, activitePartagee: false };
      if (relation?.bloque) return presenterProfil({ ...vide, personne: masquerPhotoAvatar(personne) });
      const [abonnes, abonnements] = await Promise.all([
        base.suiviPersonne.count({ where: { suiviId: cibleId, statut: "accepte" } }),
        base.suiviPersonne.count({ where: { suiveurId: cibleId, statut: "accepte" } }),
      ]);
      if (niveau === "prive") return presenterProfil({ ...vide, compteurs: { abonnes, abonnements } });
      const [badges, listes] = await Promise.all([
        base.badgeCompte.findMany({ where: { compteId: cibleId }, select: { badge: true }, orderBy: { obtenuLe: "asc" } }),
        social.listerListesDe(compteId, cibleId),
      ]);
      let bande: ProfilBande | null = null;
      if (niveau === "bande") {
        bande = { ville: compte.ville, points: compte.points, palier: compte.palier, pointsDuMois: 0, rescoussesDuMois: 0, lieuxSauves: [], gardes: [] };
        // Rien de l'activité n'est même lu si elle ne la partage pas
        if (estMoi || profil.activitePartagee) {
          const debutMois = new Date(calculerDebutMoisParis(maintenant.getTime()));
          const [points, rescoussesMois, rescousses, gardes] = await Promise.all([
            base.journalPoints.aggregate({ _sum: { points: true }, where: { compteId: cibleId, creeLe: { gte: debutMois } } }),
            base.rescousse.count({ where: { compteId: cibleId, creeLe: { gte: debutMois } } }),
            base.rescousse.findMany({ where: { compteId: cibleId }, select: { lieuId: true }, orderBy: { creeLe: "desc" } }),
            base.lieuGarde.findMany({ where: { compteId: cibleId }, select: { lieuId: true }, orderBy: { creeLe: "desc" } }),
          ]);
          bande.pointsDuMois = points._sum.points ?? 0;
          bande.rescoussesDuMois = rescoussesMois;
          bande.lieuxSauves = [...new Set(rescousses.map((r) => r.lieuId))];
          bande.gardes = gardes.map((g) => g.lieuId);
        }
      }
      return presenterProfil({ ...vide, compteurs: { abonnes, abonnements }, badges: badges.map((b) => b.badge), listes, bande, activitePartagee: profil.activitePartagee });
    },

    async listerLiens(compteId, cibleId, sens, apres) {
      if (compteId !== cibleId) {
        const lien = (await relations.lireLiens(compteId, [cibleId])).get(cibleId);
        if (!lien?.pote) return "ferme";
      }
      const curseur = lireCurseurPersonne(apres) ?? null;
      // Le compte de l'identifiant public du curseur, pour départager une même seconde (sans filtre : rien n'en sort) ;
      // parti depuis, on repart de la date seule
      const depart = curseur ? (await base.profilSocial.findUnique({ where: { idPublic: curseur.idPublic }, select: { compteId: true } }))?.compteId ?? null : null;
      const { caches } = await relations.listerBlocages(compteId);
      const exclus = [...caches];
      const abonnes = sens === "abonnes";
      const lignes = await base.suiviPersonne.findMany({
        where: {
          AND: [
            abonnes ? { suiviId: cibleId } : { suiveurId: cibleId },
            { statut: "accepte" },
            // Sans profil social, personne à montrer (ni d'identifiant public pour le curseur)
            abonnes ? { suiveur: { profilSocial: { isNot: null } } } : { suivi: { profilSocial: { isNot: null } } },
            exclus.length === 0 ? {} : abonnes ? { suiveurId: { notIn: exclus } } : { suiviId: { notIn: exclus } },
            !curseur ? {} : {
              OR: [
                { creeLe: { lt: curseur.date } },
                ...(depart === null ? [] : [abonnes ? { creeLe: curseur.date, suiveurId: { lt: depart } } : { creeLe: curseur.date, suiviId: { lt: depart } }]),
              ],
            },
          ],
        },
        select: {
          suiveurId: true, suiviId: true, creeLe: true, accepteLe: true,
          suiveur: { select: { profilSocial: { select: { idPublic: true } } } },
          suivi: { select: { profilSocial: { select: { idPublic: true } } } },
        },
        orderBy: abonnes ? [{ creeLe: "desc" }, { suiveurId: "desc" }] : [{ creeLe: "desc" }, { suiviId: "desc" }],
        take: LIENS_PAR_PAGE + 1,
      });
      const page = lignes.slice(0, LIENS_PAR_PAGE);
      const autre = (l: (typeof page)[number]) => (abonnes ? l.suiveurId : l.suiviId);
      const personnes = await relations.presenter(page.map(autre));
      const derniere = page.at(-1);
      const idPublicDerniere = derniere ? (abonnes ? derniere.suiveur : derniere.suivi).profilSocial?.idPublic : undefined;
      return {
        liens: page.flatMap((l) => {
          const personne = personnes.get(autre(l));
          return personne ? [{ personne, depuis: (l.accepteLe ?? l.creeLe).toISOString() }] : [];
        }),
        // Jamais l'id d'un compte dans la suite : l'identifiant public seulement
        suite: lignes.length > LIENS_PAR_PAGE && derniere && idPublicDerniere ? ecrireCurseurPersonne(derniere.creeLe, idPublicDerniere) : null,
      };
    },

    async listerListesDe(compteId, cibleId) {
      const estMoi = compteId === cibleId;
      const [auteurs, compte] = await Promise.all([
        relations.presenter([cibleId]),
        base.compte.findUnique({ where: { id: cibleId }, select: { prive: true } }),
      ]);
      const auteur = auteurs.get(cibleId);
      if (!auteur || !compte) return [];
      let niveau: NiveauProfil = "bande";
      if (!estMoi) {
        const lu = await lireNiveau(compteId, cibleId, compte.prive);
        if (lu.lien.bloqueParMoi || lu.lien.mABloque) return [];
        niveau = lu.niveau;
      }
      const listes = await base.listeLieux.findMany({
        where: { auteurId: cibleId, ...(estMoi ? {} : { suspendueLe: null, retireeLe: null }) },
        orderBy: [{ modifieLe: "desc" }, { id: "desc" }],
        take: MAX_LISTES_PAR_LECTURE,
        select: {
          id: true, titre: true, emoji: true, description: true, visibilite: true, modifieLe: true, suspendueLe: true, retireeLe: true,
          _count: { select: { lieux: { where: { lieu: { statut: "publie" } } }, abonnes: true } },
        },
      });
      const ids = listes.map((l) => l.id);
      const [coEcrites, signalees] = ids.length === 0 ? [[], []] : await Promise.all([
        estMoi ? [] : base.coAuteurListe.findMany({ where: { compteId, statut: "accepte", listeId: { in: ids } }, select: { listeId: true } }),
        base.signalement.findMany({ where: { signaleParId: compteId, cible: "liste", cibleId: { in: ids.map(String) } }, select: { cibleId: true } }),
      ]);
      const coAuteur = new Set(coEcrites.map((c) => c.listeId));
      const cachees = new Set(signalees.map((s) => s.cibleId));
      return listes
        .filter((l) => peutVoirListe({ visibilite: l.visibilite === "bande" ? "bande" : "tous" }, niveau, coAuteur.has(l.id)) && !cachees.has(String(l.id)))
        .slice(0, MAX_LISTES_PROFIL)
        .map(({ _count, ...l }) => presenterListeResume({ ...l, nombreLieux: _count.lieux, abonnes: _count.abonnes }, auteur));
    },

    async listerMasques(compteId, cible) {
      const lignes = await base.elementMasque.findMany({
        where: { compteId, ...(cible ? { cible } : {}) },
        select: { cible: true, cibleId: true },
        orderBy: { creeLe: "desc" },
        take: MAX_MASQUES_LUS,
      });
      return lignes.map((l) => ({ cible: l.cible as CibleMasque, cibleId: l.cibleId }));
    },

    async masquer(compteId, cible, cibleId, masque) {
      if (!masque) {
        await base.elementMasque.deleteMany({ where: { compteId, cible, cibleId } });
        return { ok: true };
      }
      return base.$transaction(async (tx) => {
        // Sous le verrou du compte : deux gestes en même temps ne dépassent pas les 2 000
        await relations.verrouillerComptes(tx, [compteId]);
        const deja = await tx.elementMasque.findUnique({ where: { compteId_cible_cibleId: { compteId, cible, cibleId } }, select: { creeLe: true } });
        if (deja) return { ok: true } as const;
        if ((await tx.elementMasque.count({ where: { compteId } })) >= MAX_MASQUES) return { ok: false, erreur: "trop-de-masques" } as const;
        await tx.elementMasque.create({ data: { compteId, cible, cibleId } });
        return { ok: true } as const;
      });
    },

    lirePouls: (compteId, maintenant, app) => lirePoulsSocial(base, compteId, maintenant, app),
  };
  return social;
}
