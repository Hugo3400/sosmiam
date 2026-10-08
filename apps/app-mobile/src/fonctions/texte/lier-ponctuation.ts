/** Met une espace insécable avant ? ! ; : » et après «, pour que le signe ne parte jamais seul à la ligne (comme sur le site). */
export function lierPonctuation(texte: string): string {
  return texte.replace(/ ([?!;:»])/g, " $1").replace(/« /g, "« ");
}
