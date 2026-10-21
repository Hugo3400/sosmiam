const DEPLACEMENT_MIN = 12;
const PART_DE_L_ECART = 0.25;
const SEUIL_MIN = 48;
const SEUIL_MAX = 80;
const ELAN = 150;

export function choisirCranFeuille<Cran extends string>(hauteurs: Record<Cran, number>, ordre: readonly Cran[], depart: Cran, actuelle: number, vitesse: number): Cran {
  const base = hauteurs[depart];
  const deplacement = actuelle - base;
  const elan = -vitesse * ELAN;
  if (Math.abs(deplacement) < DEPLACEMENT_MIN && Math.abs(elan) < DEPLACEMENT_MIN) return depart;
  const projection = deplacement + elan;
  const rang = ordre.indexOf(depart);
  const suivants = projection > 0 ? ordre.slice(rang + 1) : ordre.slice(0, Math.max(0, rang)).reverse();
  const candidats = suivants.filter((cran) => (projection > 0 ? hauteurs[cran] > base + 0.5 : hauteurs[cran] < base - 0.5));
  if (candidats.length === 0) return depart;
  const ecart = Math.abs(hauteurs[candidats[0]] - base);
  const seuil = Math.min(ecart / 2, Math.max(SEUIL_MIN, Math.min(SEUIL_MAX, ecart * PART_DE_L_ECART)));
  if (Math.abs(projection) < seuil) return depart;
  const visee = base + projection;
  return candidats.reduce((meilleur, cran) => (Math.abs(hauteurs[cran] - visee) < Math.abs(hauteurs[meilleur] - visee) ? cran : meilleur));
}
