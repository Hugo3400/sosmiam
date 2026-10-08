// Les mails des comptes (espace ambassadeur aujourd'hui, l'app demain) : bienvenue à la validation, alerte avant
// l'effacement d'un compte sans visite depuis presque 1 an, lien pour choisir un nouveau mot de passe.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { habillerCourriel } from "../../fonctions/courriels/habiller-courriel.ts";
import { envoyerToutDeSuite, mettreEnFile } from "./file-courriels.ts";
import { lireReglagesEnvoi } from "./reglages-envoi.ts";

/** Adresse écrite en dur (jamais tirée d'une requête) */
const ESPACE_AMBASSADEUR = "https://ambassadeur.sosmiam.fr";
const UN_JOUR = 86_400_000;
/** Un compte sans visite pendant 1 an est effacé (docs/decisions.md) : on prévient 30 jours avant, une seule fois */
const EFFACEMENT = 365 * UN_JOUR;
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

/**
 * Tâche de nuit : prévient les comptes qui seront effacés dans 30 jours faute de visite (une seule fois par période :
 * pas de nouveau mail s'il y en a déjà eu un dans les 60 derniers jours). Rend le nombre de mails mis en file.
 */
export async function prevenirAvantEffacement(maintenant = new Date()) {
  if (!(await envoiPret())) return 0;
  const comptes = await baseDeDonnees.compte.findMany({
    where: { derniereConnexion: { lt: new Date(maintenant.getTime() - EFFACEMENT + PREVENIR_AVANT), gte: new Date(maintenant.getTime() - EFFACEMENT) } },
    select: { prenom: true, email: true, derniereConnexion: true },
    take: 500,
  });
  if (comptes.length === 0) return 0;
  const dejaPrevenus = new Set(
    (await baseDeDonnees.envoiCourriel.findMany({
      where: { type: "alerte-effacement", destinataire: { in: comptes.map((c) => c.email) }, creeLe: { gte: new Date(maintenant.getTime() - 60 * UN_JOUR) } },
      select: { destinataire: true },
    })).map((envoi) => envoi.destinataire),
  );
  let prevenus = 0;
  for (const compte of comptes.filter((c) => !dejaPrevenus.has(c.email))) {
    const date = jourEnLettres.format(new Date(compte.derniereConnexion.getTime() + EFFACEMENT));
    await mettreEnFile("alerte-effacement", compte.email, {
      objet: `Ton compte SOS Miam sera effacé le ${date}`,
      ...habillerCourriel({
        titre: `On ne t'a pas vu depuis un moment, ${compte.prenom}`,
        paragraphes: [
          `Ton compte SOS Miam n'a pas servi depuis presque un an. Comme promis dans notre politique de confidentialité, il sera effacé pour de bon le ${date}, avec tout ce qui va avec.`,
          "Tu veux le garder ? Il suffit de te connecter d'ici là. Sinon, tu n'as rien à faire : on efface tout, sans relance.",
        ],
        bouton: { texte: "Me connecter", adresse: ESPACE_AMBASSADEUR },
        pied: "Tu reçois ce mail parce que tu as un compte SOS Miam. C'est le seul qu'on t'enverra à ce sujet.",
      }),
    });
    prevenus++;
  }
  return prevenus;
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
