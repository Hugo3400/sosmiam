import type { IdeeMiamis } from "@sos-miam/commun/types/idees";

export function changerIdeeDansListe(idees: readonly IdeeMiamis[], id: string, changer: (idee: IdeeMiamis) => IdeeMiamis): IdeeMiamis[] {
  return idees.map((idee) => (idee.id === id ? changer(idee) : idee));
}
