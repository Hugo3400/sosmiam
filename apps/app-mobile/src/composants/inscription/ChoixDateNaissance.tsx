import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Keyboard, Modal, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { formaterSaisieDate } from "~/fonctions/dates/formater-saisie-date";
import { lireDateIso } from "~/fonctions/dates/lire-date-iso";
import { lireDateSaisie } from "~/fonctions/dates/lire-date-saisie";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Date choisie, « AAAA-MM-JJ », ou null */
  valeur: string | null;
  /** Reçoit la nouvelle date « AAAA-MM-JJ » (null si la saisie web est incomplète ou fausse) */
  onChangeDate: (dateIso: string | null) => void;
  /** Petite phrase sous le champ */
  aide?: string;
};

const LIBELLE = "Ta date de naissance";
const ANNEE_MINIMUM = 1900;
const dateMinimum = new Date(ANNEE_MINIMUM, 0, 1, 12);

/** Fin de la journée d'aujourd'hui : on peut choisir aujourd'hui, pas demain. */
function finDAujourdhui(): Date {
  const maintenant = new Date();
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate(), 23, 59, 59);
}

/** Point de départ de la roulette quand rien n'est choisi : le 1er janvier d'il y a 20 ans. */
function dateDeDepart(valeur: string | null): Date {
  return valeur ? lireDateIso(valeur) : new Date(new Date().getFullYear() - 20, 0, 1, 12);
}

/**
 * Choix de la date de naissance avec le sélecteur natif : roulette dans un tiroir sur iOS, boîte de dialogue sur Android.
 * Sur le web (aperçu de développement seulement), un simple champ « JJ/MM/AAAA ».
 */
export function ChoixDateNaissance({ valeur, onChangeDate, aide }: Props) {
  const insets = useSafeAreaInsets();
  const [tiroirOuvert, setTiroirOuvert] = useState(false);
  const [dateEnCours, setDateEnCours] = useState(() => dateDeDepart(valeur));
  const [saisieWeb, setSaisieWeb] = useState(() => (valeur ? valeur.split("-").reverse().join("/") : ""));
  const [mouvementReduit, setMouvementReduit] = useState(false);

  useEffect(() => {
    let actif = true;
    AccessibilityInfo.isReduceMotionEnabled()
      .then((reduit) => actif && setMouvementReduit(reduit))
      .catch(() => {});
    const abonnement = AccessibilityInfo.addEventListener("reduceMotionChanged", setMouvementReduit);
    return () => {
      actif = false;
      abonnement.remove();
    };
  }, []);

  if (Platform.OS === "web") {
    const saisieComplete = saisieWeb.length === 10;
    const dateLue = lireDateSaisie(saisieWeb);
    let erreur: string | null = null;
    if (saisieComplete && !dateLue) erreur = "Cette date n'existe pas, même dans nos rêves les plus gourmands.";
    else if (dateLue && dateLue > formaterDateIso(new Date())) erreur = "Tu viens du futur\u00a0? Choisis une date déjà passée.";
    else if (dateLue && Number(dateLue.slice(0, 4)) < ANNEE_MINIMUM) erreur = `Avant ${ANNEE_MINIMUM}\u00a0? Respect, mais vérifie l'année.`;

    return (
      <ChampTexte
        libelle={LIBELLE}
        valeur={saisieWeb}
        onChangeTexte={(texte) => {
          const miseEnForme = formaterSaisieDate(texte);
          setSaisieWeb(miseEnForme);
          const date = lireDateSaisie(miseEnForme);
          const valable = date !== null && date <= formaterDateIso(new Date()) && Number(date.slice(0, 4)) >= ANNEE_MINIMUM;
          onChangeDate(valable ? date : null);
        }}
        placeholder="JJ/MM/AAAA"
        keyboardType="number-pad"
        inputMode="numeric"
        maxLength={10}
        aide={aide}
        erreur={erreur}
      />
    );
  }

  const ouvrir = () => {
    Keyboard.dismiss();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: dateDeDepart(valeur),
        mode: "date",
        minimumDate: dateMinimum,
        maximumDate: finDAujourdhui(),
        positiveButton: { label: "Valider" },
        negativeButton: { label: "Annuler" },
        onValueChange: (_evenement, date) => onChangeDate(formaterDateIso(date)),
      });
      return;
    }
    setDateEnCours(dateDeDepart(valeur));
    setTiroirOuvert(true);
  };

  const valider = () => {
    onChangeDate(formaterDateIso(dateEnCours));
    setTiroirOuvert(false);
  };

  const texteAffiche = valeur ? formaterDateLongue(valeur) : null;

  return (
    <View className="gap-2">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-base text-encre">
        {LIBELLE}
      </Text>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Date de naissance"
        accessibilityValue={{ text: texteAffiche ?? "pas encore choisie" }}
        accessibilityHint="Ouvre le choix de la date"
        onPress={ouvrir}
        className="min-h-[52px] flex-row items-center justify-between rounded-2xl border-2 border-encre bg-white px-4 py-3 active:opacity-80"
      >
        <Text className={`font-texte text-[17px] ${texteAffiche ? "text-encre" : "text-gris"}`}>{texteAffiche ?? "Choisis ta date"}</Text>
        <Ionicons name="calendar-outline" size={22} color={couleurs.encre} accessibilityElementsHidden importantForAccessibility="no" />
      </Pressable>

      {aide ? <Text className="font-texte text-sm leading-5 text-gris">{aide}</Text> : null}

      {Platform.OS === "ios" ? (
        <Modal
          visible={tiroirOuvert}
          transparent
          animationType={mouvementReduit ? "fade" : "slide"}
          onRequestClose={() => setTiroirOuvert(false)}
        >
          <View className="flex-1 justify-end bg-encre/40">
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Fermer sans changer la date"
              onPress={() => setTiroirOuvert(false)}
              className="flex-1"
            />
            <View
              accessibilityViewIsModal
              className="rounded-t-3xl border-2 border-b-0 border-encre bg-creme px-5 pt-5"
              style={{ paddingBottom: insets.bottom + 12 }}
            >
              <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
                {LIBELLE}
              </Text>
              <Text className="mt-1 font-texte text-base text-gris">Fais tourner les roulettes, on ne regarde pas.</Text>
              <DateTimePicker
                value={dateEnCours}
                mode="date"
                display="spinner"
                locale="fr-FR"
                minimumDate={dateMinimum}
                maximumDate={finDAujourdhui()}
                textColor={couleurs.encre}
                themeVariant="light"
                onValueChange={(_evenement, date) => setDateEnCours(date)}
              />
              <Bouton libelle="Valider cette date" onPress={valider} />
              <Pressable
                accessibilityRole="button"
                onPress={() => setTiroirOuvert(false)}
                hitSlop={8}
                className="mt-2 min-h-11 justify-center active:opacity-70"
              >
                <Text className="text-center font-texte-semi text-base text-gris underline">Annuler</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
