// Les mails d'une limitation de compte (décision de Hugo du 15 octobre 2026, docs/decisions.md, « Modération des avis et
// limitation d'un compte ») : la limitation décidée (la règle en clair, le pourquoi de l'équipe, jusqu'à quand, ce qui
// change, comment contester), sa levée, et le résultat d'un réexamen. Le texte de la contestation n'est jamais recopié.
import { DETAILS_MOTIFS_MODERATION } from "../../../../../packages/commun/src/contenus/motifs-moderation.ts";
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { habillerCourriel } from "../../fonctions/courriels/habiller-courriel.ts";
import type { LimitationLue } from "../limitations-comptes-regles.ts";
import { mettreEnFile } from "./file-courriels.ts";
import { lireReglagesEnvoi } from "./reglages-envoi.ts";

/** Adresse écrite en dur : « Mon compte » sur le site, où l'on conteste (même page sur les trois hôtes) */
const MON_COMPTE = "https://sosmiam.fr/mon-compte";
const moment = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "long", year: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Europe/Paris" });
const PIED = "Tu reçois ce mail parce que l'équipe SOS Miam a pris une décision sur ton compte. Une question ? Réponds simplement à ce mail.";
const ce_qui_change =
  "Tant qu'elle dure, tu ne peux plus rien publier que les autres voient (messages, commentaires, avis, sorties, listes, invitations, nouveau pseudo ou avatar). Lire, valider tes visites, Miam Safe, signaler, bloquer, tes réglages, l'export de tes données et la suppression de ton compte marchent comme d'habitude.";

const enClair = (motif: string) => (DETAILS_MOTIFS_MODERATION as Readonly<Record<string, { enClair: string } | undefined>>)[motif]?.enClair ?? "une règle de la communauté";
const decrireFin = (fin: Date | null) => (fin ? `jusqu'au ${moment.format(fin)}` : "jusqu'à nouvel ordre");

async function lireDestinataire(compteId: number) {
  if ((await lireReglagesEnvoi()).etat !== "pret") return null;
  return baseDeDonnees.compte.findUnique({ where: { id: compteId }, select: { prenom: true, email: true } });
}

/** La limitation décidée : faux si l'envoi n'est pas réglé ou si le compte n'existe plus (la cloche part quand même). */
export async function prevenirCompteLimite(l: LimitationLue, maintenant = new Date()) {
  const compte = await lireDestinataire(l.compteId);
  if (!compte) return false;
  const aVenir = l.debut.getTime() > maintenant.getTime();
  await mettreEnFile("compte-limite", compte.email, {
    objet: aVenir ? "Ton compte SOS Miam va être limité" : "Ton compte SOS Miam est limité",
    ...habillerCourriel({
      titre: `${compte.prenom}, ton compte est limité`,
      paragraphes: [
        aVenir
          ? `L'équipe SOS Miam va limiter ton compte à partir du ${moment.format(l.debut)}, ${decrireFin(l.fin)}.`
          : `L'équipe SOS Miam a limité ton compte ${decrireFin(l.fin)}.`,
        `La règle en cause : ${enClair(l.motif)}.`,
        `Ce que l'équipe t'explique : « ${l.motivation} »`,
        ce_qui_change,
        "Pas d'accord ? Dis-nous pourquoi depuis « Mon compte » (une seule fois, tant que la limitation dure) : quelqu'un d'autre dans l'équipe relit tout et te répond.",
      ],
      bouton: { texte: "Ouvrir Mon compte", adresse: MON_COMPTE },
      pied: PIED,
    }),
  });
  return true;
}

/** Fin de la limitation avant l'heure : levée par l'équipe, ou après un réexamen qui donne raison à la personne. */
export async function prevenirLimitationLevee(l: LimitationLue, apresReexamen: boolean, message: string | null) {
  const compte = await lireDestinataire(l.compteId);
  if (!compte) return false;
  await mettreEnFile("limitation-levee", compte.email, {
    objet: "Ton compte SOS Miam n'est plus limité",
    ...habillerCourriel({
      titre: `C'est levé, ${compte.prenom}`,
      paragraphes: [
        apresReexamen ? "On a relu ta contestation, et tu avais raison : la limitation de ton compte est levée." : "L'équipe SOS Miam a levé la limitation de ton compte.",
        ...(message ? [`Le mot de l'équipe : « ${message} »`] : []),
        "Tout remarche comme avant. Merci de ta patience, et à bientôt dans les bons coins !",
      ],
      pied: PIED,
    }),
  });
  return true;
}

/** Réexamen qui maintient la limitation : la personne le sait, avec le mot de l'équipe s'il y en a un. */
export async function prevenirLimitationMaintenue(l: LimitationLue, message: string | null) {
  const compte = await lireDestinataire(l.compteId);
  if (!compte) return false;
  await mettreEnFile("limitation-maintenue", compte.email, {
    objet: "On a relu ta contestation",
    ...habillerCourriel({
      titre: `On a relu ta contestation, ${compte.prenom}`,
      paragraphes: [
        `Une autre personne de l'équipe a tout relu : la limitation de ton compte est maintenue, ${decrireFin(l.fin)}.`,
        ...(message ? [`Le mot de l'équipe : « ${message} »`] : []),
        `La règle en cause reste : ${enClair(l.motif)}.`,
        "Tu peux toujours lire, valider tes visites, exporter tes données ou supprimer ton compte depuis « Mon compte ».",
      ],
      bouton: { texte: "Ouvrir Mon compte", adresse: MON_COMPTE },
      pied: PIED,
    }),
  });
  return true;
}
