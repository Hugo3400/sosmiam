import { utiliserModes } from "~/hooks/utiliser-modes";
import { ECRITURE_ACTUS_SANS_ROLE } from "~/services/actus-visibles";

export function utiliserPeutEcrireActus(): boolean {
  const { modesOuverts } = utiliserModes();
  return modesOuverts.includes("ambassadeur") || ECRITURE_ACTUS_SANS_ROLE;
}
