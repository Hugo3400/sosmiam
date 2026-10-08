/** Semaine ISO d'un champ « semaine » (« 2026-W41 ») → son dimanche, « AAAA-MM-JJ ». Null si illisible. */
export function semaineVersDimanche(semaine: string): string | null {
  const morceaux = /^(\d{4})-W(\d{2})$/.exec(semaine);
  if (!morceaux) return null;
  const annee = Number(morceaux[1]);
  const numero = Number(morceaux[2]);
  // Le 4 janvier est toujours dans la semaine 1 ; on recule jusqu'à son lundi
  const quatreJanvier = new Date(Date.UTC(annee, 0, 4));
  const lundiSemaine1 = quatreJanvier.getTime() - ((quatreJanvier.getUTCDay() + 6) % 7) * 86_400_000;
  return new Date(lundiSemaine1 + ((numero - 1) * 7 + 6) * 86_400_000).toISOString().slice(0, 10);
}
