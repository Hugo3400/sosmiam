// Les mails des comptes (espace ambassadeur aujourd'hui, l'app demain) : bienvenue à la validation, alertes 30 jours
// avant le retrait du rôle d'ambassadeur (1 an sans visite) et avant l'effacement du compte (2 ans sans visite), lien pour
// choisir un nouveau mot de passe.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { TEXTES_COURRIELS_COMPTES_PAR_LANGUE } from "../../../../../packages/commun/src/contenus/courriels-comptes.ts";
import { choisirTextes } from "../../../../../packages/commun/src/fonctions/langue/choisir-textes.ts";
import { lireLangue } from "../../../../../packages/commun/src/fonctions/langue/lire-langue.ts";
import { LANGUE_PAR_DEFAUT } from "../../../../../packages/commun/src/regles/langues.ts";
import { formaterDateCourriel } from "../../fonctions/courriels/formater-date-courriel.ts";
import { habillerCourriel } from "../../fonctions/courriels/habiller-courriel.ts";
import { envoyerToutDeSuite, mettreEnFile } from "./file-courriels.ts";
import { lireReglagesEnvoi } from "./reglages-envoi.ts";

/** Adresse écrite en dur (jamais tirée d'une requête) */
const ESPACE_AMBASSADEUR = "https://ambassadeur.sosmiam.fr";
/** Un compte sans rôle d'ambassadeur (compte pro) se connecte sur l'espace pro */
const ESPACE_PRO = "https://pro.sosmiam.fr";
const UN_JOUR = 86_400_000;
/** Sans visite pendant 1 an : le rôle d'ambassadeur est retiré ; 2 ans : le compte est effacé (décision du 8 octobre 2026).
 * On prévient 30 jours avant chacun, une seule fois. */
const RETRAIT = 365 * UN_JOUR;
const EFFACEMENT = 730 * UN_JOUR;
const PREVENIR_AVANT = 30 * UN_JOUR;

/** L'envoi est-il réglé ? Sinon on ne met rien en file : un mail parti des semaines plus tard n'aurait plus de sens. */
const envoiPret = async () => (await lireReglagesEnvoi()).etat === "pret";

const langueDuCompte = (langue: string) => lireLangue(langue) ?? LANGUE_PAR_DEFAUT;
const textesDuCompte = (langue: string) => choisirTextes(TEXTES_COURRIELS_COMPTES_PAR_LANGUE, langueDuCompte(langue));
const champsCompte = { prenom: true, email: true, langue: true } as const;

/** Inscription d'ambassadeur validée par l'équipe : un mot de bienvenue part tout seul (faux si l'envoi n'est pas réglé). */
export async function prevenirAmbassadeurValide(compteId: number) {
  if (!(await envoiPret())) return false;
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: champsCompte });
  if (!compte) return false;
  const T = textesDuCompte(compte.langue).ambassadeurValide;
  await mettreEnFile("ambassadeur-valide", compte.email, {
    objet: T.objet(compte.prenom),
    ...habillerCourriel({
      titre: T.titre(compte.prenom),
      paragraphes: [...T.paragraphes],
      bouton: { texte: T.bouton, adresse: ESPACE_AMBASSADEUR },
      pied: T.pied,
      langue: langueDuCompte(compte.langue),
    }),
  });
  return true;
}

/** Bienvenue chez les ambassadeurs certifiés (titre accepté dans le logiciel) : ce que le titre apporte, et la règle d'or. */
export async function prevenirCertifie(compteId: number) {
  if (!(await envoiPret())) return false;
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: champsCompte });
  if (!compte) return false;
  const T = textesDuCompte(compte.langue).certifie;
  await mettreEnFile("certifie", compte.email, {
    objet: T.objet(compte.prenom),
    ...habillerCourriel({
      titre: T.titre(compte.prenom),
      paragraphes: [...T.paragraphes],
      bouton: { texte: T.bouton, adresse: ESPACE_AMBASSADEUR },
      pied: T.pied,
      langue: langueDuCompte(compte.langue),
    }),
  });
  return true;
}

type Alerte = { type: "alerte-retrait" | "alerte-effacement"; delai: number; seulementAmbassadeurs: boolean };

/** Les comptes arrivés à 30 jours de l'échéance, et pas déjà prévenus dans les 60 derniers jours. */
async function trouverAPrevenir({ type, delai, seulementAmbassadeurs }: Alerte, maintenant: Date) {
  const comptes = await baseDeDonnees.compte.findMany({
    where: {
      derniereConnexion: { lt: new Date(maintenant.getTime() - delai + PREVENIR_AVANT), gte: new Date(maintenant.getTime() - delai) },
      ...(seulementAmbassadeurs ? { ambassadeur: { isNot: null } } : {}),
    },
    select: { prenom: true, email: true, langue: true, derniereConnexion: true, ambassadeur: { select: { compteId: true } } },
    take: 500,
  });
  if (comptes.length === 0) return [];
  const dejaPrevenus = new Set(
    (await baseDeDonnees.envoiCourriel.findMany({
      where: { type, destinataire: { in: comptes.map((c) => c.email) }, creeLe: { gte: new Date(maintenant.getTime() - 60 * UN_JOUR) } },
      select: { destinataire: true },
    })).map((envoi) => envoi.destinataire),
  );
  return comptes
    .filter((c) => !dejaPrevenus.has(c.email))
    .map((c) => ({ ...c, langue: langueDuCompte(c.langue), date: formaterDateCourriel(new Date(c.derniereConnexion.getTime() + delai), "jour", langueDuCompte(c.langue)) }));
}

/**
 * Tâche de nuit : prévient par mail, une seule fois, les ambassadeurs qui perdront leur rôle dans 30 jours (11 mois sans
 * visite) et les comptes qui seront effacés dans 30 jours (23 mois sans visite). Rend le nombre de mails mis en file.
 */
export async function prevenirAvantEcheances(maintenant = new Date()) {
  if (!(await envoiPret())) return { retraits: 0, effacements: 0 };
  const retraits = await trouverAPrevenir({ type: "alerte-retrait", delai: RETRAIT, seulementAmbassadeurs: true }, maintenant);
  for (const compte of retraits) {
    const T = choisirTextes(TEXTES_COURRIELS_COMPTES_PAR_LANGUE, compte.langue).alerteRetrait;
    await mettreEnFile("alerte-retrait", compte.email, {
      objet: T.objet(compte.date),
      ...habillerCourriel({
        titre: T.titre(compte.prenom),
        paragraphes: [...T.paragraphes(compte.date)],
        bouton: { texte: T.bouton, adresse: ESPACE_AMBASSADEUR },
        pied: T.pied,
        langue: compte.langue,
      }),
    });
  }
  const effacements = await trouverAPrevenir({ type: "alerte-effacement", delai: EFFACEMENT, seulementAmbassadeurs: false }, maintenant);
  for (const compte of effacements) {
    const T = choisirTextes(TEXTES_COURRIELS_COMPTES_PAR_LANGUE, compte.langue).alerteEffacement;
    await mettreEnFile("alerte-effacement", compte.email, {
      objet: T.objet(compte.date),
      ...habillerCourriel({
        titre: T.titre(compte.prenom),
        paragraphes: [...T.paragraphes(compte.date)],
        bouton: { texte: T.bouton, adresse: compte.ambassadeur ? ESPACE_AMBASSADEUR : ESPACE_PRO },
        pied: T.pied,
        langue: compte.langue,
      }),
    });
  }
  return { retraits: retraits.length, effacements: effacements.length };
}

/** Envoie le lien pour choisir un nouveau mot de passe, tout de suite et sans passer par la file (rien n'en est gardé). */
export async function envoyerLienMotDePasse(compteId: number, lien: string, expireLe: Date) {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: champsCompte });
  if (!compte) return { ok: false as const, erreur: "introuvable" };
  const langue = langueDuCompte(compte.langue);
  const T = choisirTextes(TEXTES_COURRIELS_COMPTES_PAR_LANGUE, langue).motDePasse;
  return envoyerToutDeSuite("mot-de-passe", compte.email, {
    objet: T.objet,
    ...habillerCourriel({
      titre: T.titre(compte.prenom),
      paragraphes: [...T.paragraphes(formaterDateCourriel(expireLe, "echeance", langue))],
      bouton: { texte: T.bouton, adresse: lien },
      pied: T.pied,
      langue,
    }),
    secrets: [lien],
    relancer: true,
  });
}

/**
 * Envoie le lien pour confirmer l'adresse e-mail d'un compte (à l'inscription), tout de suite et sans passer par la
 * file : le lien n'est gardé nulle part. Même ton que les autres mails des comptes.
 */
export async function envoyerLienVerificationEmail(compteId: number, lien: string, expireLe: Date) {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: champsCompte });
  if (!compte) return { ok: false as const, erreur: "introuvable" };
  const langue = langueDuCompte(compte.langue);
  const T = choisirTextes(TEXTES_COURRIELS_COMPTES_PAR_LANGUE, langue).verificationEmail;
  return envoyerToutDeSuite("verification-email", compte.email, {
    objet: T.objet,
    ...habillerCourriel({
      titre: T.titre(compte.prenom),
      paragraphes: [...T.paragraphes(formaterDateCourriel(expireLe, "echeance", langue))],
      bouton: { texte: T.bouton, adresse: lien },
      pied: T.pied,
      langue,
    }),
    secrets: [lien],
    relancer: true,
  });
}
