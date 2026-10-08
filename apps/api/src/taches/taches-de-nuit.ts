// Tâches de nuit, vers 3 h 30 (heure de Paris) : d'abord le ménage promis par la politique de confidentialité (contacts des
// demandes de lieux de plus de 3 ans), puis une sauvegarde chiffrée de la base. Au démarrage, une sauvegarde tout de suite
// si la dernière date de plus de 26 heures (serveur arrêté pendant la nuit, première mise en route).
import { effacerContactsAnciens } from "../services/gestion/demandes.ts";
import { noterAction } from "../services/gestion/journal.ts";
import { listerSauvegardes, sauvegarderBase } from "../services/gestion/sauvegardes.ts";
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

/** Démarre les tâches de nuit ; renvoie de quoi les arrêter (arrêt propre de l'API). */
export function planifierTachesDeNuit(): () => void {
  let derniereNuit = "";
  // Vérifie chaque minute s'il est 3 h 30 à Paris (simple, et juste malgré les changements d'heure)
  const minuteur = setInterval(() => {
    const [heures, minutes] = heureParis.format(new Date()).split(":").map(Number);
    const jour = new Date().toISOString().slice(0, 10);
    if (heures === 3 && minutes === 30 && derniereNuit !== jour) {
      derniereNuit = jour;
      void faireLeMenage().then(sauvegarder);
    }
  }, 60_000);
  const rattrapage = setTimeout(async () => {
    const [derniere] = await listerSauvegardes();
    if (!derniere || Date.now() - new Date(derniere.creeLe).getTime() > 26 * UNE_HEURE) await sauvegarder();
  }, 60_000);
  return () => {
    clearInterval(minuteur);
    clearTimeout(rattrapage);
  };
}
