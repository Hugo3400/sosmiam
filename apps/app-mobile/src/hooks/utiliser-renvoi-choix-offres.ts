import { useEffect } from "react";

import { utiliserAppareilPush } from "~/hooks/utiliser-appareil-push";
import { utiliserRetoursPremierPlan } from "~/hooks/utiliser-retours-premier-plan";

export function utiliserRenvoiChoixOffres(pret: boolean): void {
  const { renvoyer } = utiliserAppareilPush();
  const retours = utiliserRetoursPremierPlan();

  useEffect(() => {
    if (pret) void renvoyer();
  }, [pret, retours, renvoyer]);
}
