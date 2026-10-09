// Espace pro (pro.sosmiam.fr) avec Prisma : rattachements d'un compte à ses lieux, sa fiche, les suggestions sur son lieu
// et son équipe. Formes, limites et contrat des services : pro-regles.ts ; double en mémoire : pro-en-memoire.ts.
// La validation d'une demande « gerant » par l'équipe se fait dans le logiciel de gestion (pas ici).
import { Prisma } from "../base-de-donnees/client-genere/client.ts";
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import {
  DEMANDES_RATTACHEMENT_PAR_JOUR, INVITATIONS_PAR_JOUR, MEMBRES_EQUIPE_MAX, RESULTATS_RECHERCHE, SUGGESTIONS_MONTREES, UN_JOUR_PRO,
  type CarteGardee, type FichePro, type LieuTrouve, type MembreEquipe, type RattachementVu, type RoleRattachement, type ServicesPro, type StatutRattachement,
  type SuggestionVue,
} from "./pro-regles.ts";
import { CHAMPS_PROPOSABLES, SUGGESTIONS_EN_ATTENTE_PAR_LIEU, SUGGESTIONS_PAR_JOUR, UN_JOUR } from "./suggestions-comptes-regles.ts";

const iso = (date: Date | null) => date?.toISOString() ?? null;
const VALIDES = { where: { statut: "valide" } } as const;
const estDoublon = (erreur: unknown) => typeof erreur === "object" && erreur !== null && "code" in erreur && erreur.code === "P2002";
/** Ce qu'un rattachement redemandé (après un refus ou un retrait) ou réinvité remet à zéro */
const REMISE_A_ZERO = { statut: "en-attente", reponse: null, decideLe: null } as const;

export const servicesPro: ServicesPro = {
  async listerRattachements(compteId) {
    const lignes = await baseDeDonnees.rattachementLieu.findMany({
      where: { compteId, statut: { not: "retire" } },
      orderBy: { creeLe: "desc" },
      select: { id: true, lieuId: true, role: true, statut: true, reponse: true, creeLe: true, decideLe: true, lieu: { select: { nom: true, ville: true, emoji: true } } },
    });
    return lignes.map(({ lieu, ...r }): RattachementVu => ({
      ...r, ...lieu, role: r.role as RoleRattachement, statut: r.statut as StatutRattachement, creeLe: r.creeLe.toISOString(), decideLe: iso(r.decideLe),
    }));
  },

  async demanderRattachement(compteId, { lieuId, preuve, siret }, maintenant) {
    try {
      return await baseDeDonnees.$transaction(async (transaction) => {
        const lieu = await transaction.lieu.findFirst({ where: { id: lieuId, statut: { in: ["publie", "brouillon"] } }, select: { id: true } });
        if (!lieu) return { ok: false, erreur: "lieu-inconnu" } as const;
        const existant = await transaction.rattachementLieu.findUnique({ where: { lieuId_compteId: { lieuId, compteId } }, select: { id: true, statut: true } });
        if (existant && (existant.statut === "en-attente" || existant.statut === "valide")) return { ok: false, erreur: "deja-demande" } as const;
        const duJour = await transaction.rattachementLieu.count({
          where: { compteId, role: "gerant", creeLe: { gt: new Date(maintenant.getTime() - UN_JOUR_PRO) } },
        });
        if (duJour >= DEMANDES_RATTACHEMENT_PAR_JOUR) return { ok: false, erreur: "trop-de-demandes" } as const;
        const donnees = { role: "gerant", preuve, siret, creeLe: maintenant, ...REMISE_A_ZERO };
        const { id } = existant
          ? await transaction.rattachementLieu.update({ where: { id: existant.id }, data: donnees, select: { id: true } })
          : await transaction.rattachementLieu.create({ data: { ...donnees, lieuId, compteId }, select: { id: true } });
        return { ok: true, id } as const;
      });
    } catch (erreur) {
      // Deux demandes en même temps : la contrainte unique (lieu, compte) refuse la seconde
      if (estDoublon(erreur)) return { ok: false, erreur: "deja-demande" };
      throw erreur;
    }
  },

  async accepterInvitation(compteId, id, maintenant) {
    const { count } = await baseDeDonnees.rattachementLieu.updateMany({
      where: { id, compteId, role: "equipe", statut: "en-attente" },
      data: { statut: "valide", decideLe: maintenant },
    });
    return count === 1;
  },

  async quitterRattachement(compteId, id, maintenant) {
    const { count } = await baseDeDonnees.rattachementLieu.updateMany({
      where: { id, compteId, statut: { in: ["en-attente", "valide"] } },
      data: { statut: "retire", decideLe: maintenant },
    });
    return count === 1;
  },

  async chercherLieux(mots) {
    const lignes = await baseDeDonnees.lieu.findMany({
      where: {
        statut: { in: ["publie", "brouillon"] },
        AND: mots.map((mot) => ({ OR: [{ nom: { contains: mot, mode: "insensitive" } }, { ville: { contains: mot, mode: "insensitive" } }] })),
      } satisfies Prisma.LieuWhereInput,
      orderBy: [{ nom: "asc" }, { id: "asc" }],
      take: RESULTATS_RECHERCHE,
      select: { id: true, nom: true, emoji: true, type: true, quartier: true, ville: true, statut: true, _count: { select: { rattachements: VALIDES } } },
    });
    return lignes.map(({ _count, ...lieu }): LieuTrouve => ({ ...lieu, statut: lieu.statut as LieuTrouve["statut"], estVerifie: _count.rattachements > 0 }));
  },

  async lireRole(compteId, lieuId) {
    const rattachement = await baseDeDonnees.rattachementLieu.findFirst({ where: { compteId, lieuId, statut: "valide" }, select: { role: true } });
    return (rattachement?.role as RoleRattachement | undefined) ?? null;
  },

  async lireFichePro(lieuId) {
    const lieu = await baseDeDonnees.lieu.findUnique({
      where: { id: lieuId },
      select: {
        id: true, type: true, emoji: true, info: true, quartier: true, ville: true, statut: true,
        ...(Object.fromEntries(CHAMPS_PROPOSABLES.map((champ) => [champ, true])) as Record<(typeof CHAMPS_PROPOSABLES)[number], true>),
        _count: { select: { rattachements: VALIDES } },
      },
    });
    if (!lieu) return null;
    const { _count, ...fiche } = lieu;
    return { ...fiche, estVerifie: _count.rattachements > 0 } satisfies FichePro;
  },

  async modifierFichePro(compteId, lieuId, { directs, suggestion }, maintenant) {
    return baseDeDonnees.$transaction(async (transaction) => {
      let suggestionId: number | null = null;
      if (suggestion) {
        const [duJour, enAttente] = await Promise.all([
          transaction.suggestionLieu.count({ where: { compteId, creeLe: { gt: new Date(maintenant.getTime() - UN_JOUR) } } }),
          transaction.suggestionLieu.count({ where: { compteId, lieuId, statut: "en-attente" } }),
        ]);
        if (duJour >= SUGGESTIONS_PAR_JOUR || enAttente >= SUGGESTIONS_EN_ATTENTE_PAR_LIEU) return { ok: false, erreur: "trop-de-suggestions" } as const;
        ({ id: suggestionId } = await transaction.suggestionLieu.create({
          data: {
            lieuId, compteId, source: "pro", message: suggestion.message, creeLe: maintenant,
            proposition: suggestion.proposition as Prisma.InputJsonObject, avant: suggestion.avant as Prisma.InputJsonObject,
          },
          select: { id: true },
        }));
      }
      if (Object.keys(directs).length > 0) {
        await transaction.lieu.update({ where: { id: lieuId }, data: directs as Prisma.LieuUpdateInput, select: { id: true } });
      }
      return { ok: true, suggestionId } as const;
    });
  },

  async listerSuggestionsDuLieu(lieuId) {
    const lignes = await baseDeDonnees.suggestionLieu.findMany({
      where: { lieuId },
      orderBy: [{ creeLe: "desc" }, { id: "desc" }],
      take: SUGGESTIONS_MONTREES,
      // Jamais compteId ni compte : l'auteur d'une suggestion client reste anonyme pour le lieu
      select: { id: true, source: true, proposition: true, avant: true, message: true, statut: true, champsAcceptes: true, reponse: true, creeLe: true, decideLe: true },
    });
    return lignes.map((s): SuggestionVue => {
      const proposition = (s.proposition ?? {}) as Record<string, unknown>;
      return {
        id: s.id, source: s.source === "pro" ? "pro" : "client", champs: Object.keys(proposition), avant: (s.avant ?? {}) as Record<string, unknown>, proposition,
        message: s.message, statut: s.statut, champsAcceptes: s.champsAcceptes, reponse: s.source === "pro" ? s.reponse : null,
        creeLe: s.creeLe.toISOString(), decideLe: iso(s.decideLe),
      };
    });
  },

  async lireCarte(lieuId) {
    const lieu = await baseDeDonnees.lieu.findUnique({ where: { id: lieuId }, select: { carte: true, carteMajLe: true } });
    if (!lieu) return null;
    return { carte: (lieu.carte ?? null) as CarteGardee["carte"], majLe: lieu.carteMajLe };
  },

  async enregistrerCarte(lieuId, carte, maintenant) {
    const { count } = await baseDeDonnees.lieu.updateMany({
      where: { id: lieuId },
      // Prisma.DbNull : la colonne redevient vraiment vide (NULL), pas le JSON « null »
      data: carte === null ? { carte: Prisma.DbNull, carteMajLe: null } : { carte: carte as Prisma.InputJsonObject, carteMajLe: maintenant },
    });
    return count === 1;
  },

  async listerEquipe(lieuId) {
    const lignes = await baseDeDonnees.rattachementLieu.findMany({
      where: { lieuId, OR: [{ role: "equipe", statut: { in: ["en-attente", "valide"] } }, { role: "gerant", statut: "valide" }] },
      orderBy: [{ role: "desc" }, { creeLe: "asc" }],
      select: { compteId: true, role: true, statut: true, creeLe: true, decideLe: true, compte: { select: { prenom: true, email: true } } },
    });
    return lignes.map(({ compte, ...m }): MembreEquipe => ({
      compteId: m.compteId, prenom: compte.prenom, email: m.role === "equipe" ? compte.email : null, role: m.role as RoleRattachement,
      statut: m.statut as MembreEquipe["statut"], creeLe: m.creeLe.toISOString(), decideLe: iso(m.decideLe),
    }));
  },

  async inviterMembre(lieuId, inviteurId, email, maintenant, lireMajorite) {
    try {
      return await baseDeDonnees.$transaction(async (transaction) => {
        const compte = await transaction.compte.findUnique({ where: { email }, select: { id: true, dateNaissanceChiffree: true } });
        if (!compte) return { ok: false, erreur: "compte-inconnu" } as const;
        const majorite = lireMajorite(compte.dateNaissanceChiffree);
        if (majorite === "mineur") return { ok: false, erreur: "compte-mineur" } as const;
        if (majorite === "illisible") return { ok: false, erreur: "chiffrement-indisponible" } as const;
        const existant = await transaction.rattachementLieu.findUnique({ where: { lieuId_compteId: { lieuId, compteId: compte.id } }, select: { id: true, statut: true } });
        if (existant && (existant.statut === "en-attente" || existant.statut === "valide")) return { ok: false, erreur: "deja-membre" } as const;
        const [duJour, membres] = await Promise.all([
          transaction.rattachementLieu.count({ where: { lieuId, role: "equipe", creeLe: { gt: new Date(maintenant.getTime() - UN_JOUR_PRO) } } }),
          transaction.rattachementLieu.count({ where: { lieuId, role: "equipe", statut: { in: ["en-attente", "valide"] } } }),
        ]);
        if (duJour >= INVITATIONS_PAR_JOUR) return { ok: false, erreur: "trop-d-invitations" } as const;
        if (membres >= MEMBRES_EQUIPE_MAX) return { ok: false, erreur: "equipe-complete" } as const;
        // La preuve d'une invitation : qui l'a faite (le compte du gérant)
        const donnees = { role: "equipe", preuve: `Invitation du gérant (compte ${inviteurId})`, siret: null, creeLe: maintenant, ...REMISE_A_ZERO };
        if (existant) await transaction.rattachementLieu.update({ where: { id: existant.id }, data: donnees, select: { id: true } });
        else await transaction.rattachementLieu.create({ data: { ...donnees, lieuId, compteId: compte.id }, select: { id: true } });
        return { ok: true } as const;
      });
    } catch (erreur) {
      if (estDoublon(erreur)) return { ok: false, erreur: "deja-membre" };
      throw erreur;
    }
  },

  async retirerMembre(lieuId, compteId, maintenant) {
    const { count } = await baseDeDonnees.rattachementLieu.updateMany({
      where: { lieuId, compteId, role: "equipe", statut: { in: ["en-attente", "valide"] } },
      data: { statut: "retire", decideLe: maintenant },
    });
    return count === 1;
  },
};
