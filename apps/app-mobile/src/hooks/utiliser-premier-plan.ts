import { useEffect, useRef, useState } from "react";
import { AppState, type AppStateStatus } from "react-native";

const estAuPremierPlan = (etat: AppStateStatus | null | undefined) => etat !== "background" && etat !== "inactive";

export function utiliserPremierPlan(absenceMinMs: number): { auPremierPlan: boolean; retoursApresAbsence: number } {
  const [auPremierPlan, setAuPremierPlan] = useState(() => estAuPremierPlan(AppState.currentState));
  const [retoursApresAbsence, setRetoursApresAbsence] = useState(0);
  const partiLe = useRef<number | null>(null);

  useEffect(() => {
    const abonnement = AppState.addEventListener("change", (etat) => {
      setAuPremierPlan(estAuPremierPlan(etat));
      if (etat === "background") {
        partiLe.current ??= Date.now();
        return;
      }
      if (etat !== "active") return;
      const depuis = partiLe.current;
      partiLe.current = null;
      if (depuis !== null && Date.now() - depuis >= absenceMinMs) setRetoursApresAbsence((n) => n + 1);
    });
    return () => abonnement.remove();
  }, [absenceMinMs]);

  return { auPremierPlan, retoursApresAbsence };
}
