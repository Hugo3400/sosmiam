// BIG SOS dans le logiciel de gestion : demandes, vérification sur place par un ambassadeur (une vraie mission dans son
// espace), vote (avec l'app), validation (dates de la une, 7 jours ; objectif ; liens des vidéos), puis bilan.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { calculerPhaseBigSos, type PhaseBigSos } from "../../fonctions/big-sos/calculer-phase-big-sos.ts";
import { creerMission } from "./missions-messages.ts";

/** À la une pendant 7 jours (docs/decisions.md) */
export const DUREE_A_LA_UNE = 7 * 86_400_000;

const RESUME = {
  id: true, lieuId: true, origine: true, statut: true, debutLe: true, finLe: true, creeLe: true, modifieLe: true,
  objectifTitre: true, objectifCible: true, objectifAtteint: true,
  lieu: { select: { id: true, nom: true, emoji: true, ville: true } },
  mission: { select: { statut: true, echeance: true, compte: { select: { prenom: true } } } },
} as const;

export async function listerBigSos(maintenant = new Date()) {
  const bigSos = await baseDeDonnees.bigSos.findMany({ orderBy: { creeLe: "desc" }, take: 300, select: RESUME });
  return bigSos.map((b) => ({ ...b, phase: calculerPhaseBigSos(b, maintenant) }));
}

export async function lireBigSos(id: number, maintenant = new Date()) {
  const bigSos = await baseDeDonnees.bigSos.findUnique({
    where: { id },
    include: {
      lieu: { select: { id: true, nom: true, emoji: true, ville: true, quartier: true, statut: true } },
      compte: { select: { id: true, prenom: true } },
      mission: { select: { id: true, titre: true, statut: true, echeance: true, compteRendu: true, faiteLe: true, compte: { select: { id: true, prenom: true } } } },
    },
  });
  if (!bigSos) return null;
  // De quoi juger des limites (pas encore décidées) : les autres BIG SOS de ce lieu, et ceux à la une en même temps
  const [memeLieu, enMemeTemps] = await Promise.all([
    baseDeDonnees.bigSos.findMany({ where: { lieuId: bigSos.lieuId, id: { not: id } }, select: { id: true, statut: true, debutLe: true, creeLe: true }, orderBy: { creeLe: "desc" }, take: 10 }),
    bigSos.debutLe && bigSos.finLe
      ? baseDeDonnees.bigSos.count({ where: { id: { not: id }, statut: { in: ["valide", "termine"] }, debutLe: { lt: bigSos.finLe }, finLe: { gt: bigSos.debutLe } } })
      : Promise.resolve(0),
  ]);
  return { ...bigSos, phase: calculerPhaseBigSos(bigSos, maintenant), memeLieu, enMemeTemps };
}

export async function creerBigSos(saisie: { lieuId: number; histoire: string; note: string | null }) {
  const lieu = await baseDeDonnees.lieu.findUnique({ where: { id: saisie.lieuId }, select: { id: true } });
  if (!lieu) return null;
  return baseDeDonnees.bigSos.create({ data: { ...saisie, origine: "equipe" }, select: { id: true } });
}

export type ModificationBigSos = Partial<{
  histoire: string; note: string | null; objectifTitre: string | null; objectifCible: number | null; objectifAtteint: number;
  liens: { titre: string; adresse: string }[]; bilan: string | null;
}>;

export async function modifierBigSos(id: number, modification: ModificationBigSos) {
  return baseDeDonnees.bigSos.update({ where: { id }, data: modification, select: { id: true } }).catch(() => null);
}

/** Confie la vérification sur place à un ambassadeur actif : une mission apparaît dans son espace. Null si impossible. */
export async function envoyerVerification(id: number, compteId: number, echeance: Date | null) {
  const bigSos = await baseDeDonnees.bigSos.findUnique({ where: { id }, select: { statut: true, missionId: true, lieu: { select: { id: true, nom: true, ville: true } } } });
  if (!bigSos || !["demande", "verification"].includes(bigSos.statut)) return null;
  const mission = await creerMission({
    compteId,
    titre: `Vérifier sur place : ${bigSos.lieu.nom}`.slice(0, 100),
    detail: [
      `${bigSos.lieu.nom} (${bigSos.lieu.ville}) demande un BIG SOS : une semaine à la une pour un lieu en vraie difficulté.`,
      "Passe sur place, discute avec l'équipe du lieu, et raconte-nous dans ton compte rendu : ce que tu as vu, si la difficulté est réelle, et ce qui aiderait le plus.",
      "Reste discret et bienveillant : on parle de gens qui traversent un moment dur.",
    ].join("\n\n"),
    lieuId: bigSos.lieu.id,
    echeance,
  });
  if (!mission) return { erreur: "ambassadeur-non-actif" as const };
  // Une ancienne mission de vérification (renvoyée à quelqu'un d'autre) est annulée
  if (bigSos.missionId) await baseDeDonnees.missionAmbassadeur.updateMany({ where: { id: bigSos.missionId, statut: "a-faire" }, data: { statut: "annulee" } });
  await baseDeDonnees.bigSos.update({ where: { id }, data: { missionId: mission.id, statut: "verification" } });
  return { missionId: mission.id };
}

export type DecisionBigSos =
  | { decision: "vote" | "refuser" | "rouvrir" }
  | { decision: "valider"; debutLe: Date }
  | { decision: "terminer"; bilan: string };

/** Fait avancer (ou reculer) un BIG SOS. Faux si la décision n'a pas de sens à ce moment-là. */
export async function deciderBigSos(id: number, choix: DecisionBigSos, maintenant = new Date()) {
  const bigSos = await baseDeDonnees.bigSos.findUnique({ where: { id }, select: { statut: true, debutLe: true, finLe: true } });
  if (!bigSos) return false;
  const phase: PhaseBigSos = calculerPhaseBigSos(bigSos, maintenant);
  const possible: Record<DecisionBigSos["decision"], PhaseBigSos[]> = {
    vote: ["demande", "verification"],
    valider: ["demande", "verification", "vote", "programme"],
    refuser: ["demande", "verification", "vote", "programme"],
    rouvrir: ["refuse"],
    terminer: ["a-la-une", "a-cloturer"],
  };
  if (!possible[choix.decision].includes(phase)) return false;
  const donnees =
    choix.decision === "valider"
      ? { statut: "valide", debutLe: choix.debutLe, finLe: new Date(choix.debutLe.getTime() + DUREE_A_LA_UNE) }
      : choix.decision === "terminer"
        ? { statut: "termine", bilan: choix.bilan, ...(phase === "a-la-une" ? { finLe: maintenant } : {}) }
        : { statut: { vote: "vote", refuser: "refuse", rouvrir: "demande" }[choix.decision] };
  await baseDeDonnees.bigSos.update({ where: { id }, data: donnees });
  return true;
}

export async function supprimerBigSos(id: number) {
  const { count } = await baseDeDonnees.bigSos.deleteMany({ where: { id } });
  return count > 0;
}
