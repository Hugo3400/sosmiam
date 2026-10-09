/** L'id du bouton d'un geste de l'éditeur de carte (« monter-plat:0:2 » → « carte-monter-plat-0-2 »), pour y remettre le focus. */
export function nommerBoutonCarte(geste: string): string {
  return `carte-${geste.replace(/:/g, "-")}`;
}
