/** Durée lisible à partir de secondes : « 45 s », « 2 min 35 s », « 1 h 05 ». */
export function formaterDuree(secondes: number): string {
  const total = Math.max(0, Math.round(secondes));
  if (total < 60) return `${total} s`;
  if (total < 3600) return `${Math.floor(total / 60)} min ${String(total % 60).padStart(2, "0")} s`;
  return `${Math.floor(total / 3600)} h ${String(Math.floor((total % 3600) / 60)).padStart(2, "0")}`;
}
