import { baseDeDonnees } from "../base-de-donnees/connexion.ts";
import { calculerPalierAuxPoints } from "../fonctions/ambassadeurs/calculer-palier-aux-points.ts";
import { calculerEmpreinteJeton } from "../fonctions/securite/calculer-empreinte-jeton.ts";
import { creerJeton } from "../fonctions/securite/creer-jeton.ts";
import { decrireCertifie, type CertifieVue } from "./certification.ts";
import { PseudoDejaPris } from "./erreurs-comptes.ts";
import type { LieuDuPro, RoleRattachement, StatutRattachement } from "./pro-regles.ts";

// Comptes SOS Miam (espace ambassadeur du site, puis l'app). Les fonctions ci-dessous servent aussi au logiciel de
// gestion (services/gestion) : la logique des points, des badges et des réinitialisations reste à un seul endroit.

export type PalierCompte = "curieux" | "denicheur" | "ambassadeur-quartier" | "ambassadeur-ville";

/**
 * Codes du barème (docs/decisions.md, packages/commun/src/regles/ambassadeurs.ts), plus « defi » et « equipe »
 * (ajout ou retrait à la main depuis le logiciel de gestion).
 */
export type RaisonPoints =
  | "visite" | "visite-sos" | "avis-photo" | "proposer-lieu" | "corriger-fiche" | "premier-sauveteur" | "rescousse" | "defi" | "equipe";

/** Durée de validité d'un lien de réinitialisation, préparé par l'équipe ou demandé (24 h au plus : CNIL, OWASP) */
const DUREE_REINITIALISATION = 24 * 3600_000;
/** Durée de validité du lien qui confirme l'e-mail, envoyé à l'inscription */
const DUREE_VERIFICATION_EMAIL = 7 * 24 * 3600_000;

/**
 * Ajoute (ou retire, si négatif) des points : journal, total et palier changent ensemble. Le total ne descend jamais
 * sous 0. Le palier suit les points, sauf « ambassadeur-ville », qui ne se donne et ne se retire qu'à la main.
 */
export async function ajouterPoints(compteId: number, points: number, raison: RaisonPoints, detail?: string): Promise<{ points: number; palier: PalierCompte }> {
  return baseDeDonnees.$transaction(async (transaction) => {
    await transaction.journalPoints.create({ data: { compteId, points, raison, detail: detail?.slice(0, 200) || null } });
    const apres = await transaction.compte.update({ where: { id: compteId }, data: { points: { increment: points } } });
    const total = Math.max(0, apres.points);
    const palier: PalierCompte = apres.palier === "ambassadeur-ville" ? "ambassadeur-ville" : calculerPalierAuxPoints(total);
    if (total !== apres.points || palier !== apres.palier) {
      await transaction.compte.update({ where: { id: compteId }, data: { points: total, palier } });
    }
    return { points: total, palier };
  });
}

/** Donne un badge (« premier-sauveteur », « deniche-par-toi », « fondateur »…). Renvoie true s'il est nouveau. */
export async function donnerBadge(compteId: number, badge: string): Promise<boolean> {
  const { count } = await baseDeDonnees.badgeCompte.createMany({ data: [{ compteId, badge }], skipDuplicates: true });
  return count === 1;
}

/** Nomme quelqu'un « Ambassadeur de ville » (sur candidature ou invitation, jamais aux points). */
export async function nommerAmbassadeurVille(compteId: number): Promise<void> {
  await baseDeDonnees.compte.update({ where: { id: compteId }, data: { palier: "ambassadeur-ville" } });
}

/** Retire « Ambassadeur de ville » : le compte retrouve le palier de ses points. */
export async function retirerAmbassadeurVille(compteId: number): Promise<PalierCompte> {
  const compte = await baseDeDonnees.compte.findUniqueOrThrow({ where: { id: compteId }, select: { points: true } });
  const palier = calculerPalierAuxPoints(compte.points);
  await baseDeDonnees.compte.update({ where: { id: compteId }, data: { palier } });
  return palier;
}

/**
 * Prépare une réinitialisation du mot de passe (lien préparé par l'équipe, ou « Mot de passe oublié » en libre-service).
 * Renvoie le jeton UNE seule fois, pour le lien https://ambassadeur.sosmiam.fr/nouveau-mot-de-passe#jeton=… (après un « # »,
 * le jeton n'est jamais envoyé au serveur, donc jamais écrit dans les journaux) ; la base n'en garde que l'empreinte,
 * valable 24 h. Un nouveau lien remplace le précédent.
 */
export async function preparerReinitialisation(compteId: number): Promise<{ jeton: string; expireLe: Date }> {
  const jeton = creerJeton();
  const expireLe = new Date(Date.now() + DUREE_REINITIALISATION);
  await baseDeDonnees.compte.update({
    where: { id: compteId },
    data: { jetonReinitialisation: calculerEmpreinteJeton(jeton), jetonExpireLe: expireLe },
  });
  return { jeton, expireLe };
}

// ─── Le compte vu par son titulaire : espace ambassadeur du site (routes /comptes) ───

/** Statut dans l'espace ambassadeur : « en-attente » à l'inscription, puis l'équipe décide dans le logiciel de gestion. */
export type StatutAmbassadeur = "en-attente" | "actif" | "refuse" | "suspendu";

/**
 * Le compte tel que la personne connectée le voit (apps/site-web/src/types/compte.ts, plus `age` et `pro.lieuxValides`
 * pour l'app) : jamais le mot de passe, ni la note de l'équipe. Dates en ISO 8601. Construit par presenterCompte
 * (fonctions/comptes/presenter-compte.ts) à partir de CompteLu.
 */
export type CompteConnecte = {
  prenom: string;
  email: string;
  points: number;
  palier: PalierCompte;
  badges: string[];
  creeLe: string;
  /** Adresse confirmée par le lien reçu à l'inscription */
  emailVerifie: boolean;
  ambassadeur: {
    statut: StatutAmbassadeur; ville: string; quartier: string | null; decideLe: string | null;
    /** Titre d'« ambassadeur certifié » (à part du palier), ou null */
    certifie: CertifieVue | null;
  } | null;
  /** Âge en années pleines (date du jour à Paris) si la date de naissance est gardée (comptes de l'app), sinon null */
  age: number | null;
  /** Espace pro : ses lieux (tous ses rattachements sauf « retire » ; liste vide s'il n'en a pas) ; lieuxValides : ceux
   * dont le rattachement est « valide » (les lieux qui sont à lui) */
  pro: { lieux: LieuDuPro[]; lieuxValides: LieuDuPro[] };
};

/**
 * Le compte tel que les services le lisent : sans âge ni masquage des rôles (presenterCompte s'en charge), avec la date
 * de naissance encore chiffrée (null : compte du site, qui ne la garde pas). Jamais envoyé tel quel.
 */
export type CompteLu = Omit<CompteConnecte, "age" | "pro"> & { pro: { lieux: LieuDuPro[] }; dateNaissanceChiffree: string | null };

/** Où la personne s'inscrit : l'espace ambassadeur (par défaut), l'espace pro (pro.sosmiam.fr) ou l'app */
export type EspaceInscription = "ambassadeur" | "pro" | "app";

/** Profil de l'app, gardé à l'inscription « app » : nom et date de naissance déjà CHIFFRÉS (services/chiffrement-donnees.ts) */
export type ProfilAppNouveau = {
  nomChiffre: string | null;
  dateNaissanceChiffree: string;
  ville: string;
  /** Envies par catégorie, jamais « regimes » */
  envies: Record<string, string[]>;
  pseudo: string | null;
};

export type NouveauCompte = {
  email: string;
  /** L'empreinte (hacherMotDePasse), jamais le mot de passe lui-même */
  motDePasse: string;
  prenom: string;
  /** Ville et quartier de la fiche d'ambassadeur ; ignorés pour l'espace pro (le site envoie "" et null) */
  ville: string;
  quartier: string | null;
  /** « pro » ou « app » : compte seul, SANS fiche d'ambassadeur (aucune demande à valider) ; absent : « ambassadeur » */
  espace?: EspaceInscription;
  /** Espace « app » seulement : le profil de l'app */
  profil?: ProfilAppNouveau;
  /** Date de mise à jour des conditions d'utilisation acceptées (AAAA-MM-JJ) */
  cguVersion: string;
};

/** Ce que la personne change elle-même dans « Mon compte » (quartier null : effacé). L'e-mail ne se change pas en ligne. */
export type ModificationCompte = { prenom?: string; ville?: string; quartier?: string | null };

export const estDoublon = (erreur: unknown) => typeof erreur === "object" && erreur !== null && "code" in erreur && erreur.code === "P2002";
/** Doublon sur le pseudo (et pas sur l'e-mail) : les détails de l'erreur Prisma citent la colonne ou l'index « pseudo » */
export const estDoublonPseudo = (erreur: unknown) =>
  estDoublon(erreur) && /pseudo/.test(JSON.stringify((erreur as { meta?: unknown }).meta ?? null) + String((erreur as Error).message ?? ""));

/**
 * Crée le compte et sa fiche d'ambassadeur « en-attente » (l'équipe valide ensuite), ou le compte seul pour l'espace pro
 * et pour l'app (avec son profil) ; null si l'e-mail est déjà pris. Pseudo déjà pris : lève PseudoDejaPris.
 */
export async function creerCompte({ email, motDePasse, prenom, ville, quartier, cguVersion, espace = "ambassadeur", profil }: NouveauCompte): Promise<number | null> {
  try {
    const compte = await baseDeDonnees.compte.create({
      data: {
        email, motDePasse, prenom, cguVersion,
        ...(espace === "ambassadeur" ? { ambassadeur: { create: { ville, quartier } } } : {}),
        ...(espace === "app" && profil
          ? { nomChiffre: profil.nomChiffre, dateNaissanceChiffree: profil.dateNaissanceChiffree, ville: profil.ville, envies: profil.envies, pseudo: profil.pseudo }
          : {}),
      },
      select: { id: true },
    });
    return compte.id;
  } catch (erreur) {
    // La base refuse un second compte avec le même e-mail ou le même pseudo (contrainte unique : erreur P2002 de Prisma)
    if (estDoublonPseudo(erreur)) throw new PseudoDejaPris();
    if (estDoublon(erreur)) return null;
    throw erreur;
  }
}

/** Pour la connexion : l'identifiant et l'empreinte du mot de passe, ou null si l'e-mail est inconnu. */
export async function trouverCompteParEmail(email: string): Promise<{ id: number; motDePasse: string } | null> {
  return baseDeDonnees.compte.findUnique({ where: { email }, select: { id: true, motDePasse: true } });
}

/** Le compte tel que les services le lisent (CompteLu, à passer par presenterCompte), ou null s'il n'existe plus. */
export async function lireCompte(id: number): Promise<CompteLu | null> {
  const compte = await baseDeDonnees.compte.findUnique({
    where: { id },
    select: {
      prenom: true, email: true, points: true, palier: true, creeLe: true, emailVerifieLe: true, dateNaissanceChiffree: true,
      badges: { orderBy: { obtenuLe: "asc" }, select: { badge: true } },
      ambassadeur: { select: { statut: true, ville: true, quartier: true, decideLe: true, certifieLe: true, profilCertifie: true, structure: true } },
      rattachementsLieux: {
        where: { statut: { not: "retire" } }, orderBy: { creeLe: "asc" },
        select: { lieuId: true, role: true, statut: true, lieu: { select: { nom: true, ville: true, emoji: true } } },
      },
    },
  });
  if (!compte) return null;
  const { ambassadeur } = compte;
  return {
    prenom: compte.prenom,
    email: compte.email,
    points: compte.points,
    palier: compte.palier as PalierCompte,
    badges: compte.badges.map(({ badge }) => badge),
    creeLe: compte.creeLe.toISOString(),
    emailVerifie: compte.emailVerifieLe !== null,
    dateNaissanceChiffree: compte.dateNaissanceChiffree,
    ambassadeur: ambassadeur
      ? {
          statut: ambassadeur.statut as StatutAmbassadeur,
          ville: ambassadeur.ville,
          quartier: ambassadeur.quartier,
          decideLe: ambassadeur.decideLe?.toISOString() ?? null,
          certifie: decrireCertifie(ambassadeur.certifieLe, ambassadeur.profilCertifie, ambassadeur.structure),
        }
      : null,
    pro: {
      lieux: compte.rattachementsLieux.map(({ lieuId, role, statut, lieu }) => ({
        lieuId, nom: lieu.nom, ville: lieu.ville, emoji: lieu.emoji, role: role as RoleRattachement, statut: statut as StatutRattachement,
      })),
    },
  };
}

/** E-mail et empreinte du mot de passe : pour vérifier le mot de passe actuel avant un changement ou une suppression. */
export async function lireIdentifiants(id: number): Promise<{ email: string; motDePasse: string } | null> {
  return baseDeDonnees.compte.findUnique({ where: { id }, select: { email: true, motDePasse: true } });
}

/** Prénom, ville et quartier changés par la personne dans « Mon compte ». */
export async function modifierCompte(id: number, { prenom, ville, quartier }: ModificationCompte): Promise<void> {
  await baseDeDonnees.$transaction([
    ...(prenom !== undefined ? [baseDeDonnees.compte.update({ where: { id }, data: { prenom } })] : []),
    ...(ville !== undefined || quartier !== undefined
      ? [baseDeDonnees.ambassadeur.updateMany({ where: { compteId: id }, data: { ville, quartier } })]
      : []),
  ]);
}

/** Nouveau mot de passe (son empreinte). Un lien de réinitialisation encore en attente ne sert plus à rien : il est effacé. */
export async function changerMotDePasse(id: number, empreinte: string): Promise<void> {
  await baseDeDonnees.compte.update({ where: { id }, data: { motDePasse: empreinte, jetonReinitialisation: null, jetonExpireLe: null } });
}

/**
 * La personne efface son compte : tout ce qui lui est lié part avec lui (ambassadeur, sessions, badges, points,
 * candidatures, missions, messages), sauf ses propositions de lieux, qui restent sans lien vers lui.
 */
export async function effacerCompte(id: number): Promise<void> {
  await baseDeDonnees.compte.deleteMany({ where: { id } });
}

/** Le compte qui détient ce jeton de réinitialisation (par son empreinte), s'il n'a pas expiré. */
export async function trouverCompteParJeton(empreinteJeton: string, maintenant: Date): Promise<{ id: number; email: string } | null> {
  return baseDeDonnees.compte.findFirst({
    where: { jetonReinitialisation: empreinteJeton, jetonExpireLe: { gt: maintenant } },
    select: { id: true, email: true },
  });
}

/**
 * Nouveau mot de passe choisi avec le lien préparé par l'équipe. Le jeton est effacé dans la même écriture, et seulement
 * s'il est encore celui du compte et valable : il ne sert qu'une fois, même avec deux envois en même temps.
 */
export async function reinitialiserMotDePasse(id: number, empreinteJeton: string, empreinte: string, maintenant: Date): Promise<boolean> {
  const { count } = await baseDeDonnees.compte.updateMany({
    where: { id, jetonReinitialisation: empreinteJeton, jetonExpireLe: { gt: maintenant } },
    data: { motDePasse: empreinte, jetonReinitialisation: null, jetonExpireLe: null },
  });
  return count === 1;
}

/**
 * Prépare le lien qui confirme l'e-mail (à l'inscription, ou renvoyé à la demande) : jeton de 32 octets rendu UNE fois,
 * pour https://ambassadeur.sosmiam.fr/verifier-email#jeton=… ; la base n'en garde que l'empreinte, valable 7 jours. Un
 * nouveau lien remplace le précédent.
 */
export async function preparerVerificationEmail(compteId: number): Promise<{ jeton: string; expireLe: Date }> {
  const jeton = creerJeton();
  const expireLe = new Date(Date.now() + DUREE_VERIFICATION_EMAIL);
  await baseDeDonnees.compte.update({
    where: { id: compteId },
    data: { jetonVerification: calculerEmpreinteJeton(jeton), jetonVerificationExpireLe: expireLe },
  });
  return { jeton, expireLe };
}

/**
 * Confirme l'e-mail du compte qui détient ce jeton (par son empreinte), s'il n'a pas expiré : la date est notée et le
 * jeton effacé dans la même écriture (il ne sert qu'une fois). Faux si le jeton est inconnu, déjà servi ou expiré.
 */
export async function verifierEmail(empreinteJeton: string, maintenant: Date): Promise<boolean> {
  const { count } = await baseDeDonnees.compte.updateMany({
    where: { jetonVerification: empreinteJeton, jetonVerificationExpireLe: { gt: maintenant } },
    data: { emailVerifieLe: maintenant, jetonVerification: null, jetonVerificationExpireLe: null },
  });
  return count === 1;
}
