import type { ChoixTelephone } from "~/stockage/choix-offres-a-renvoyer";

export function deduireChoixTelephone(actives: boolean, offres: boolean): ChoixTelephone {
  if (!actives) return "couper";
  return offres ? "oui" : "non";
}
