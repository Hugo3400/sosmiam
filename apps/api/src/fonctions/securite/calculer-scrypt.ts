import { scrypt } from "node:crypto";

/**
 * Pas plus de 2 calculs en même temps : chacun prend 16 Mio de mémoire et environ un quart de seconde. Les suivants
 * attendent leur tour dans une petite file, au lieu d'occuper tous les fils de Node (et la mémoire) d'un coup.
 */
const CALCULS_SIMULTANES = 2;
let enCours = 0;
const enAttente: (() => void)[] = [];

export type ReglagesScrypt = { N: number; r: number; p: number };

/** scrypt de node:crypto (clé de `longueur` octets), en file d'attente : jamais plus de 2 calculs à la fois. */
export async function calculerScrypt(motDePasse: string, sel: Buffer, longueur: number, { N, r, p }: ReglagesScrypt): Promise<Buffer> {
  if (enCours < CALCULS_SIMULTANES) enCours += 1;
  else await new Promise<void>((sonTour) => enAttente.push(sonTour));
  try {
    return await new Promise<Buffer>((reussi, rate) => {
      scrypt(motDePasse, sel, longueur, { N, r, p }, (erreur, cle) => (erreur ? rate(erreur) : reussi(cle)));
    });
  } finally {
    // La place passe au suivant de la file ; sans personne qui attend, elle se libère
    const suivant = enAttente.shift();
    if (suivant) suivant();
    else enCours -= 1;
  }
}
