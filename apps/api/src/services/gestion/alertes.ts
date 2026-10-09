// Ce que le logiciel de gestion surveille chaque minute, en une petite demande : de quoi mettre des pastilles dans le
// menu et prévenir par une notification Windows quand quelque chose arrive (signalement grave, inscription
// d'ambassadeur, demande de lieu, modification de fiche proposée, candidature, compte rendu de mission, BIG SOS qui
// démarre bientôt).
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";
import { compterNonLus } from "./boite-reception.ts";
import { RAISONS_AVEC_MASQUAGE_IMMEDIAT } from "./moderation.ts";

const UN_JOUR = 86_400_000;

export async function lireAlertes(maintenant = new Date()) {
  const [aModerer, urgents, contestes, demandes, enAttente, candidatures, missionsFaites, bigSosATraiter, bigSosACloturer, bigSosBientot, suggestions, certifications, mailsNonLus, rattachementsEnAttente] = await Promise.all([
    baseDeDonnees.signalement.count({ where: { statut: "a-traiter" } }),
    baseDeDonnees.signalement.count({ where: { statut: "a-traiter", raison: { in: RAISONS_AVEC_MASQUAGE_IMMEDIAT } } }),
    baseDeDonnees.signalement.count({ where: { contesteLe: { not: null }, reexamineLe: null } }),
    baseDeDonnees.demandeLieu.count({ where: { statut: "a-traiter" } }),
    baseDeDonnees.ambassadeur.count({ where: { statut: "en-attente" } }),
    baseDeDonnees.candidatureFondateur.count({ where: { statut: "en-attente" } }),
    // Total des missions faites : quand il monte, un compte rendu vient d'arriver
    baseDeDonnees.missionAmbassadeur.count({ where: { statut: "faite" } }),
    baseDeDonnees.bigSos.count({ where: { statut: { in: ["demande", "verification", "vote"] } } }),
    baseDeDonnees.bigSos.count({ where: { statut: "valide", finLe: { lte: maintenant } } }),
    baseDeDonnees.bigSos.findMany({
      where: { statut: "valide", debutLe: { gt: maintenant, lte: new Date(maintenant.getTime() + UN_JOUR) } },
      select: { id: true, debutLe: true, lieu: { select: { nom: true } } },
    }),
    baseDeDonnees.suggestionLieu.count({ where: { statut: "en-attente" } }),
    baseDeDonnees.candidatureCertification.count({ where: { statut: "en-attente" } }),
    // Boîte bonjour@ : relue au plus toutes les 5 minutes ; null si elle ne répond pas
    compterNonLus().catch(() => null),
    baseDeDonnees.rattachementLieu.count({ where: { statut: "en-attente", role: "gerant" } }),
  ]);
  return {
    moderation: { aTraiter: aModerer, urgents, contestes },
    demandes: { aTraiter: demandes, rattachements: rattachementsEnAttente },
    lieux: { suggestions },
    boite: { nonLus: mailsNonLus },
    ambassadeurs: { enAttente, candidatures, certifications },
    missionsFaites,
    bigSos: { aTraiter: bigSosATraiter, aCloturer: bigSosACloturer, demarrentBientot: bigSosBientot.map((b) => ({ id: b.id, lieu: b.lieu.nom, debutLe: b.debutLe })) },
  };
}
