// Les mails des comptes (espace ambassadeur aujourd'hui, l'app demain) : bienvenue à la validation, alertes 30 jours
// avant le retrait du rôle d'ambassadeur (1 an sans visite) et avant l'effacement du compte (2 ans sans visite), lien pour
// choisir un nouveau mot de passe.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { habillerCourriel } from "../../fonctions/courriels/habiller-courriel.ts";
import { envoyerToutDeSuite, mettreEnFile } from "./file-courriels.ts";
import { lireReglagesEnvoi } from "./reglages-envoi.ts";

/** Adresse écrite en dur (jamais tirée d'une requête) */
const ESPACE_AMBASSADEUR = "https://ambassadeur.sosmiam.fr";
const UN_JOUR = 86_400_000;
/** Sans visite pendant 1 an : le rôle d'ambassadeur est retiré ; 2 ans : le compte est effacé (décision du 8 octobre 2026).
 * On prévient 30 jours avant chacun, une seule fois. */
const RETRAIT = 365 * UN_JOUR;
const EFFACEMENT = 730 * UN_JOUR;
const PREVENIR_AVANT = 30 * UN_JOUR;
const jourEnLettres = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" });

/** L'envoi est-il réglé ? Sinon on ne met rien en file : un mail parti des semaines plus tard n'aurait plus de sens. */
const envoiPret = async () => (await lireReglagesEnvoi()).etat === "pret";

/** Inscription d'ambassadeur validée par l'équipe : un mot de bienvenue part tout seul (faux si l'envoi n'est pas réglé). */
export async function prevenirAmbassadeurValide(compteId: number) {
  if (!(await envoiPret())) return false;
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: { prenom: true, email: true } });
  if (!compte) return false;
  const objet = `C'est validé, ${compte.prenom} : bienvenue chez les ambassadeurs 🛟`;
  await mettreEnFile("ambassadeur-valide", compte.email, {
    objet,
    ...habillerCourriel({
      titre: `Bienvenue dans l'équipe, ${compte.prenom} !`,
      paragraphes: [
        "On a lu ton inscription et c'est tout bon : ton espace ambassadeur est ouvert.",
        "Tu peux y proposer tes pépites, suivre tes points et tes badges, et retrouver les missions et les messages de l'équipe. Les lieux qu'on aide comptent sur des gens comme toi pour se faire connaître : merci d'être là.",
        "Une question ? Réponds simplement à ce mail, on lit tout.",
      ],
      bouton: { texte: "Ouvrir mon espace", adresse: ESPACE_AMBASSADEUR },
      pied: "Tu reçois ce mail parce que tu t'es inscrit à l'espace ambassadeur de SOS Miam.",
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
    select: { prenom: true, email: true, derniereConnexion: true },
    take: 500,
  });
  if (comptes.length === 0) return [];
  const dejaPrevenus = new Set(
    (await baseDeDonnees.envoiCourriel.findMany({
      where: { type, destinataire: { in: comptes.map((c) => c.email) }, creeLe: { gte: new Date(maintenant.getTime() - 60 * UN_JOUR) } },
      select: { destinataire: true },
    })).map((envoi) => envoi.destinataire),
  );
  return comptes.filter((c) => !dejaPrevenus.has(c.email)).map((c) => ({ ...c, date: jourEnLettres.format(new Date(c.derniereConnexion.getTime() + delai)) }));
}

/**
 * Tâche de nuit : prévient par mail, une seule fois, les ambassadeurs qui perdront leur rôle dans 30 jours (11 mois sans
 * visite) et les comptes qui seront effacés dans 30 jours (23 mois sans visite). Rend le nombre de mails mis en file.
 */
export async function prevenirAvantEcheances(maintenant = new Date()) {
  if (!(await envoiPret())) return { retraits: 0, effacements: 0 };
  const retraits = await trouverAPrevenir({ type: "alerte-retrait", delai: RETRAIT, seulementAmbassadeurs: true }, maintenant);
  for (const compte of retraits) {
    await mettreEnFile("alerte-retrait", compte.email, {
      objet: `Ton rôle d'ambassadeur SOS Miam s'arrête le ${compte.date}`,
      ...habillerCourriel({
        titre: `Tu nous manques, ${compte.prenom} !`,
        paragraphes: [
          `Ton espace ambassadeur n'a pas servi depuis presque un an. Comme prévu dans nos règles, ton rôle d'ambassadeur s'arrêtera le ${compte.date} : tes missions et tes messages partiront avec lui. Ton compte SOS Miam, tes points et tes badges, eux, restent.`,
          "Tu veux continuer l'aventure ? Il suffit de te connecter d'ici là. Sinon, tu n'as rien à faire.",
        ],
        bouton: { texte: "Me connecter", adresse: ESPACE_AMBASSADEUR },
        pied: "Tu reçois ce mail parce que tu es ambassadeur SOS Miam. C'est le seul qu'on t'enverra à ce sujet.",
      }),
    });
  }
  const effacements = await trouverAPrevenir({ type: "alerte-effacement", delai: EFFACEMENT, seulementAmbassadeurs: false }, maintenant);
  for (const compte of effacements) {
    await mettreEnFile("alerte-effacement", compte.email, {
      objet: `Ton compte SOS Miam sera effacé le ${compte.date}`,
      ...habillerCourriel({
        titre: `On ne t'a pas vu depuis longtemps, ${compte.prenom}`,
        paragraphes: [
          `Ton compte SOS Miam n'a pas servi depuis presque deux ans. Comme promis dans notre politique de confidentialité, il sera effacé pour de bon le ${compte.date}, avec tout ce qui va avec.`,
          "Tu veux le garder ? Il suffit de te connecter d'ici là. Sinon, tu n'as rien à faire : on efface tout, sans relance.",
        ],
        bouton: { texte: "Me connecter", adresse: ESPACE_AMBASSADEUR },
        pied: "Tu reçois ce mail parce que tu as un compte SOS Miam. C'est le seul qu'on t'enverra à ce sujet.",
      }),
    });
  }
  return { retraits: retraits.length, effacements: effacements.length };
}

/** Envoie le lien pour choisir un nouveau mot de passe, tout de suite et sans passer par la file (rien n'en est gardé). */
export async function envoyerLienMotDePasse(compteId: number, lien: string, expireLe: Date) {
  const compte = await baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: { prenom: true, email: true } });
  if (!compte) return { ok: false as const, erreur: "introuvable" };
  const echeance = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" }).format(expireLe);
  return envoyerToutDeSuite("mot-de-passe", compte.email, {
    objet: "Ton lien pour choisir un nouveau mot de passe",
    ...habillerCourriel({
      titre: `Un nouveau mot de passe, ${compte.prenom} ?`,
      paragraphes: [
        `Voici ton lien pour choisir un nouveau mot de passe. Il marche jusqu'au ${echeance}.`,
        "Tu n'as rien demandé ? Ignore ce mail : ton mot de passe actuel ne change pas.",
      ],
      bouton: { texte: "Choisir mon mot de passe", adresse: lien },
      pied: "Tu reçois ce mail parce qu'une réinitialisation de mot de passe a été préparée pour ton compte SOS Miam.",
    }),
  });
}
