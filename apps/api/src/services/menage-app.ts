// Ménage de nuit des données de l'app (décidé par Hugo le 14 octobre 2026, docs/decisions.md « Notifications push ») :
// - un téléphone inscrit aux notifications est oublié après 90 jours sans signe de vie (l'app le confirme à chaque lancement,
//   ce qui remet vuLe à jour) ou dès qu'Apple ou Google ont dit que son jeton ne marche plus (actif faux) ;
// - un « Ça m'intéresse » est effacé 30 jours après la dernière date de son événement (la seule, ou « chaque semaine
//   jusqu'à »). Appelé par taches/taches-de-nuit.ts ; seuls des nombres sont journalisés.
import { baseDeDonnees } from "../base-de-donnees/connexion.ts";

const UN_JOUR = 24 * 60 * 60_000;
export const JOURS_SANS_SIGNE_DE_VIE = 90;
export const JOURS_APRES_EVENEMENT = 30;

/** Les téléphones silencieux depuis 90 jours, ou dont le jeton ne marche plus : effacés (leurs réceptions partent avec eux). */
export async function effacerAppareilsSilencieux(maintenant = new Date()): Promise<number> {
  const limite = new Date(maintenant.getTime() - JOURS_SANS_SIGNE_DE_VIE * UN_JOUR);
  const { count } = await baseDeDonnees.appareilPush.deleteMany({ where: { OR: [{ actif: false }, { vuLe: { lt: limite } }] } });
  return count;
}

/** Les « Ça m'intéresse » d'un événement dont la dernière date est passée depuis plus de 30 jours. */
export async function effacerInteretsPasses(maintenant = new Date()): Promise<number> {
  const limite = new Date(maintenant.getTime() - JOURS_APRES_EVENEMENT * UN_JOUR);
  const { count } = await baseDeDonnees.interetEvenement.deleteMany({
    where: { evenement: { OR: [{ hebdoJusqua: null, debut: { lt: limite } }, { hebdoJusqua: { lt: limite } }] } },
  });
  return count;
}
