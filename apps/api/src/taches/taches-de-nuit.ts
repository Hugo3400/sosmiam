// Tâches de nuit, vers 3 h 30 (heure de Paris) : d'abord le ménage promis par la politique de confidentialité (contacts des
// demandes de lieux de plus de 3 ans, puis les comptes : sessions expirées, comptes refusés ou sans visite, candidatures
// refusées, liens de réinitialisation expirés), puis une sauvegarde chiffrée de la base. Au démarrage, le ménage et une
// sauvegarde tout de suite si la dernière date de plus de 26 heures (serveur arrêté pendant la nuit, première mise en route).
import { effacerContactsAnciens } from "../services/gestion/demandes.ts";
import { noterAction } from "../services/gestion/journal.ts";
import { listerSauvegardes, sauvegarderBase } from "../services/gestion/sauvegardes.ts";
import { faireLeMenageDesComptes } from "../services/menage-comptes.ts";
import { resumerErreur } from "../fonctions/comptes/resumer-erreur.ts";
import { formaterOctets } from "../fonctions/texte/formater-octets.ts";

const UNE_HEURE = 3600_000;
const heureParis = new Intl.DateTimeFormat("fr-FR", { timeZone: "Europe/Paris", hour: "numeric", minute: "numeric", hourCycle: "h23" });

async function sauvegarder() {
  try {
    const sauvegarde = await sauvegarderBase();
    await noterAction("serveur", "Sauvegarde automatique", `${sauvegarde.nom} (${formaterOctets(sauvegarde.taille)})`);
  } catch (erreur) {
    console.error("Sauvegarde automatique impossible :", erreur);
    await noterAction("serveur", "Sauvegarde automatique ratée", String((erreur as Error).message).slice(0, 250)).catch(() => {});
  }
}

async function faireLeMenage() {
  try {
    const effaces = await effacerContactsAnciens();
    if (effaces > 0) await noterAction("serveur", "Contacts de demandes effacés (plus de 3 ans)", `${effaces} demande(s)`);
  } catch (erreur) {
    console.error("Ménage de nuit impossible :", erreur);
  }
}

/** Ménage des comptes (espace ambassadeur), avant la sauvegarde : ce qui a passé sa durée de conservation n'y part pas. */
async function nettoyerComptes() {
  try {
    const bilan = await faireLeMenageDesComptes();
    const lignes: [number, string][] = [
      [bilan.sessions, "session(s) expirée(s)"],
      [bilan.comptesRefuses, "compte(s) refusé(s) depuis plus de 30 jours"],
      [bilan.comptesInactifs, "compte(s) sans visite depuis 1 an"],
      [bilan.candidatures, "candidature(s) refusée(s) depuis plus de 3 mois"],
      [bilan.liens, "lien(s) de réinitialisation expiré(s)"],
    ];
    const detail = lignes.filter(([nombre]) => nombre > 0).map(([nombre, quoi]) => `${nombre} ${quoi}`).join(", ");
    if (detail) await noterAction("serveur", "Ménage des comptes", detail);
  } catch (erreur) {
    // Seulement le nom et le code de l'erreur : jamais une donnée d'un compte dans le journal
    console.error("Ménage des comptes impossible :", resumerErreur(erreur));
  }
}

/** D'abord le ménage (contacts, puis comptes), ensuite la sauvegarde : ce qui a passé sa durée de conservation n'y part pas. */
async function nettoyerPuisSauvegarder() {
  await faireLeMenage();
  await nettoyerComptes();
  await sauvegarder();
}

/** Démarre les tâches de nuit ; renvoie de quoi les arrêter (arrêt propre de l'API). */
export function planifierTachesDeNuit(): () => void {
  let derniereNuit = "";
  // Vérifie chaque minute s'il est 3 h 30 à Paris (simple, et juste malgré les changements d'heure)
  const minuteur = setInterval(() => {
    const [heures, minutes] = heureParis.format(new Date()).split(":").map(Number);
    const jour = new Date().toISOString().slice(0, 10);
    if (heures === 3 && minutes === 30 && derniereNuit !== jour) {
      derniereNuit = jour;
      void nettoyerPuisSauvegarder();
    }
  }, 60_000);
  const rattrapage = setTimeout(async () => {
    const [derniere] = await listerSauvegardes();
    if (!derniere || Date.now() - new Date(derniere.creeLe).getTime() > 26 * UNE_HEURE) await nettoyerPuisSauvegarder();
  }, 60_000);
  return () => {
    clearInterval(minuteur);
    clearTimeout(rattrapage);
  };
}
