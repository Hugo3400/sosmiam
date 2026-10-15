import { useIsFocused } from "expo-router";
import { useEffect, useRef } from "react";
import { Alert, Linking, Platform } from "react-native";

import type { ErreurPosition } from "~/fonctions/geo/lire-position-telephone";
import { utiliserPositionActuelle } from "~/hooks/utiliser-position-actuelle";

type Options = {
  depuisVille: string | null;
  annoncer: (texte: string) => void;
  onActive: () => void;
};

const CHEMIN_LOCALISATION =
  Platform.OS === "ios" ? "Réglages > Confidentialité et sécurité > Service de localisation" : "les réglages du téléphone (Localisation)";

function ecrireRepli(depuisVille: string | null): string | null {
  return depuisVille ? `les distances repartent ${depuisVille}` : null;
}

function ecrireErreur(erreur: ErreurPosition, actualisation: boolean, depuisVille: string | null): string {
  const repli = actualisation ? ecrireRepli(depuisVille) : null;
  const enAttendant = repli ? ` En attendant, ${repli}.` : "";
  if (erreur === "coupee") return `Ta localisation est éteinte : allume-la dans ${CHEMIN_LOCALISATION}.${enAttendant}`;
  if (erreur === "refus-definitif") return `SOS Miam n'a pas accès à ta position : tu peux l'autoriser dans les réglages du téléphone.${enAttendant}`;
  if (erreur === "introuvable") {
    return actualisation ? "On ne te retrouve pas pour l'instant : on garde ta position d'avant." : "On ne te trouve pas pour l'instant : réessaie dans un instant.";
  }
  if (!actualisation) return "Pas de souci : la liste suit tes envies 💛";
  return repli ? `Pas de souci : ta position est oubliée, ${repli} 💛` : "Pas de souci : ta position est oubliée 💛";
}

export function utiliserAutourDeMoi({ depuisVille, annoncer, onActive }: Options) {
  const etat = utiliserPositionActuelle();
  const { position, chercher, oublier, oublisApresAbsence } = etat;
  const focus = useIsFocused();
  const oublisDits = useRef(oublisApresAbsence);

  useEffect(() => {
    if (!focus || oublisDits.current === oublisApresAbsence) return;
    oublisDits.current = oublisApresAbsence;
    const repli = ecrireRepli(depuisVille);
    annoncer(`Plus de 5 minutes d'absence : ta position est oubliée${repli ? `, ${repli}` : ""} 📍`);
  }, [focus, oublisApresAbsence, depuisVille, annoncer]);

  function signaler(erreur: ErreurPosition, actualisation: boolean) {
    const message = ecrireErreur(erreur, actualisation, depuisVille);
    if (Platform.OS === "web") return annoncer(message);
    if (erreur === "refus-definitif") {
      Alert.alert("Autour de moi", message, [
        { text: "Plus tard", style: "cancel" },
        { text: "Ouvrir les réglages", onPress: () => Linking.openSettings().catch(() => {}) },
      ]);
    } else if (erreur === "coupee") Alert.alert("Autour de moi", message, [{ text: "Compris" }]);
    else annoncer(message);
  }

  async function toucher() {
    const actualisation = position !== null;
    const resultat = await chercher();
    if (!resultat) return;
    if ("erreur" in resultat) return signaler(resultat.erreur, actualisation);
    if (actualisation) annoncer("Position à jour : les distances partent de toi 📍");
    else onActive();
  }

  function arreter() {
    oublier();
    const repli = ecrireRepli(depuisVille);
    annoncer(repli ? `Autour de moi arrêté : ${repli}` : "Autour de moi arrêté : ta position est oubliée");
  }

  return { ...etat, toucher, arreter };
}
