import { isIPv6 } from "node:net";

/**
 * Clé de comptage d'un visiteur pour les limites d'essais : une IPv4 telle quelle, mais d'une IPv6 seulement son préfixe
 * /56. Un abonné reçoit d'un coup des milliards d'adresses IPv6 (au moins un /64, souvent un /56 entier) : compter
 * adresse par adresse ne limiterait rien. Un /56 ne regroupe qu'un foyer, comme l'IPv4 d'une box. « ::ffff:1.2.3.4 »
 * compte comme l'IPv4 1.2.3.4 ; ce qui n'est pas une adresse reste tel quel.
 */
export function calculerCleVisiteur(ip: string): string {
  const adresse = ip.trim().toLowerCase();
  if (!isIPv6(adresse)) return adresse;
  let canonique: string;
  try {
    // Forme canonique (un « 1.2.3.4 » final devient deux groupes hexadécimaux), puis « :: » développé en 8 groupes
    canonique = new URL(`http://[${adresse}]/`).hostname.slice(1, -1);
  } catch {
    return adresse;
  }
  const [tete, queue] = canonique.split("::");
  const debut = tete ? tete.split(":") : [];
  const fin = queue ? queue.split(":") : [];
  const groupes = (queue === undefined ? debut : [...debut, ...Array<string>(8 - debut.length - fin.length).fill("0"), ...fin])
    .map((groupe) => parseInt(groupe, 16));
  if (groupes.slice(0, 5).every((groupe) => groupe === 0) && groupes[5] === 0xffff) {
    return [groupes[6] >> 8, groupes[6] & 255, groupes[7] >> 8, groupes[7] & 255].join(".");
  }
  return `${groupes.slice(0, 3).map((groupe) => groupe.toString(16)).join(":")}:${(groupes[3] & 0xff00).toString(16)}::/56`;
}
