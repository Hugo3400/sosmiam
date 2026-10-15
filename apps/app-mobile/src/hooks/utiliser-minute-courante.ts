import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { AppState } from "react-native";

const MINUTE = 60_000;

function lireMinute(): Date {
  const instant = Date.now();
  return new Date(instant - (instant % MINUTE));
}

export function utiliserMinuteCourante(): Date {
  const [maintenant, setMaintenant] = useState(lireMinute);

  useFocusEffect(
    useCallback(() => {
      let minuterie: ReturnType<typeof setTimeout> | undefined;
      const relire = () => {
        const minute = lireMinute();
        setMaintenant((avant) => (avant.getTime() === minute.getTime() ? avant : minute));
      };
      const avancer = () => {
        relire();
        minuterie = setTimeout(avancer, MINUTE - (Date.now() % MINUTE) + 50);
      };
      avancer();
      const abonnement = AppState.addEventListener("change", (etat) => {
        if (etat === "active") relire();
      });
      return () => {
        clearTimeout(minuterie);
        abonnement.remove();
      };
    }, []),
  );

  return maintenant;
}
