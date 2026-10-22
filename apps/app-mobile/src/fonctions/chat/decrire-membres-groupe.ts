export function decrireMembresGroupe(nombre: number, createur: string | null): string {
  const membres = `${nombre} membre${nombre > 1 ? "s" : ""}`;
  return createur ? `${membres} · créé par ${createur}` : membres;
}
