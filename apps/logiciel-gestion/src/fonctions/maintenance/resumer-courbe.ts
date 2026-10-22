export function resumerCourbe(valeurs: (number | null)[]): { moyenne: number; pointe: number; dernier: number } | null {
  const connues = valeurs.filter((valeur): valeur is number => valeur !== null);
  const dernier = connues[connues.length - 1];
  if (dernier === undefined) return null;
  return { moyenne: connues.reduce((somme, valeur) => somme + valeur, 0) / connues.length, pointe: Math.max(...connues), dernier };
}
