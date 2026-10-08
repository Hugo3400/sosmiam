import { Ionicons } from "@expo/vector-icons";
import DateTimePicker, { DateTimePickerAndroid } from "@react-native-community/datetimepicker";
import { useEffect, useState } from "react";
import { AccessibilityInfo, Keyboard, Modal, Platform, Pressable, Text, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { formaterSaisieDate } from "~/fonctions/dates/formater-saisie-date";
import { lireDateSaisie } from "~/fonctions/dates/lire-date-saisie";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Jour et heure choisis */
  quand: Date;
  onChanger: (date: Date) => void;
  /** Le jour, déjà écrit : « Vendredi 10 octobre » */
  jour: string;
  /** L'heure, déjà écrite : « 20h30 » */
  heure: string;
  /** Message sous les champs (ex. moment déjà passé) */
  erreur?: string | null;
};

type Mode = "date" | "time";

const deux = (n: number) => String(n).padStart(2, "0");
const debutDAujourdhui = () => {
  const maintenant = new Date();
  return new Date(maintenant.getFullYear(), maintenant.getMonth(), maintenant.getDate());
};
const dansUnAn = () => new Date(Date.now() + 365 * 86_400_000);

/** Garde l'heure en changeant de jour, ou le jour en changeant d'heure. */
function fusionner(base: Date, choisi: Date, mode: Mode): Date {
  return mode === "date"
    ? new Date(choisi.getFullYear(), choisi.getMonth(), choisi.getDate(), base.getHours(), base.getMinutes())
    : new Date(base.getFullYear(), base.getMonth(), base.getDate(), choisi.getHours(), choisi.getMinutes());
}

/** « 2030 » → « 20:30 » : on garde les chiffres et on ajoute les deux-points tout seuls. */
const formaterSaisieHeure = (texte: string) => {
  const chiffres = texte.replace(/\D/g, "").slice(0, 4);
  return chiffres.length <= 2 ? chiffres : `${chiffres.slice(0, 2)}:${chiffres.slice(2)}`;
};

/**
 * Le jour et l'heure d'une sortie, avec le sélecteur natif : roulette dans un tiroir sur iPhone, boîte de dialogue sur Android.
 * Sur le web (aperçu de développement), deux simples champs « JJ/MM/AAAA » et « HH:MM ».
 */
export function ChoixQuandSortie({ quand, onChanger, jour, heure, erreur }: Props) {
  const marges = useSafeAreaInsets();
  const animationsReduites = useReducedMotion();
  // Le mode reste gardé pendant que le tiroir se referme (pas de changement de titre en pleine animation)
  const [tiroirOuvert, setTiroirOuvert] = useState(false);
  const [tiroir, setTiroir] = useState<Mode>("date");
  const [enCours, setEnCours] = useState(quand);
  const [saisieJour, setSaisieJour] = useState(`${deux(quand.getDate())}/${deux(quand.getMonth() + 1)}/${quand.getFullYear()}`);
  const [saisieHeure, setSaisieHeure] = useState(`${deux(quand.getHours())}:${deux(quand.getMinutes())}`);

  // Sur iPhone, VoiceOver ignore les « live regions » d'Android : l'erreur est annoncée quand elle apparaît
  useEffect(() => {
    if (erreur && Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(erreur, { queue: true });
  }, [erreur]);

  if (Platform.OS === "web") {
    const dateLue = lireDateSaisie(saisieJour);
    const heureLue = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(saisieHeure);
    const erreurJour = saisieJour.length === 10 && !dateLue ? "Ce jour n'existe pas, même dans nos rêves les plus gourmands." : null;
    const erreurHeure = saisieHeure.length === 5 && !heureLue ? "Une heure entre 00:00 et 23:59, s'il te plaît." : null;
    const essayer = (texteJour: string, texteHeure: string) => {
      const date = lireDateSaisie(texteJour);
      const morceaux = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(texteHeure);
      if (!date || !morceaux) return;
      const [annee, mois, jourDuMois] = date.split("-").map(Number);
      onChanger(new Date(annee, mois - 1, jourDuMois, Number(morceaux[1]), Number(morceaux[2])));
    };
    return (
      <View className="gap-3">
        <ChampTexte
          libelle="Le jour"
          valeur={saisieJour}
          onChangeTexte={(texte) => {
            const miseEnForme = formaterSaisieDate(texte);
            setSaisieJour(miseEnForme);
            essayer(miseEnForme, saisieHeure);
          }}
          placeholder="JJ/MM/AAAA"
          inputMode="numeric"
          maxLength={10}
          erreur={erreurJour}
          aide={dateLue ? jour : undefined}
        />
        <ChampTexte
          libelle="L'heure"
          valeur={saisieHeure}
          onChangeTexte={(texte) => {
            const miseEnForme = formaterSaisieHeure(texte);
            setSaisieHeure(miseEnForme);
            essayer(saisieJour, miseEnForme);
          }}
          placeholder="HH:MM"
          inputMode="numeric"
          maxLength={5}
          erreur={erreurHeure ?? erreur}
        />
      </View>
    );
  }

  const ouvrir = (mode: Mode) => {
    Keyboard.dismiss();
    if (Platform.OS === "android") {
      DateTimePickerAndroid.open({
        value: quand,
        mode,
        is24Hour: true,
        minimumDate: mode === "date" ? debutDAujourdhui() : undefined,
        maximumDate: mode === "date" ? dansUnAn() : undefined,
        positiveButton: { label: "Valider" },
        negativeButton: { label: "Annuler" },
        onValueChange: (_evenement, date) => onChanger(fusionner(quand, date, mode)),
      });
      return;
    }
    setEnCours(quand);
    setTiroir(mode);
    setTiroirOuvert(true);
  };

  const cases = [
    { mode: "date" as const, libelle: "Jour de la sortie", valeur: jour, icone: "calendar-outline" as const, largeur: "flex-[1.6]" },
    { mode: "time" as const, libelle: "Heure de la sortie", valeur: heure, icone: "time-outline" as const, largeur: "flex-1" },
  ];

  return (
    <View className="gap-2">
      <View className="flex-row gap-3">
        {cases.map((c) => (
          <Pressable
            key={c.mode}
            accessibilityRole="button"
            accessibilityLabel={c.libelle}
            accessibilityValue={{ text: c.valeur }}
            accessibilityHint={c.mode === "date" ? "Ouvre le choix du jour" : "Ouvre le choix de l'heure"}
            onPress={() => ouvrir(c.mode)}
            className={`min-h-[52px] flex-row items-center justify-between gap-2 rounded-2xl border-2 bg-white px-4 py-3 active:opacity-80 ${c.largeur} ${erreur ? "border-rouge-texte" : "border-encre"}`}
          >
            <Text numberOfLines={1} className="shrink font-texte text-[17px] text-encre">
              {c.valeur}
            </Text>
            <Ionicons name={c.icone} size={20} color={couleurs.encre} accessibilityElementsHidden importantForAccessibility="no" />
          </Pressable>
        ))}
      </View>
      {erreur ? (
        <Text accessibilityLiveRegion="polite" className="font-texte text-sm leading-5 text-rouge-texte">
          {erreur}
        </Text>
      ) : null}

      {Platform.OS === "ios" ? (
        <Modal visible={tiroirOuvert} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={() => setTiroirOuvert(false)}>
          <View className="flex-1 justify-end bg-encre/40">
            <Pressable accessibilityRole="button" accessibilityLabel="Fermer sans rien changer" onPress={() => setTiroirOuvert(false)} className="flex-1" />
            <View accessibilityViewIsModal className="rounded-t-3xl border-2 border-b-0 border-encre bg-creme px-5 pt-5" style={{ paddingBottom: marges.bottom + 12 }}>
              <Text accessibilityRole="header" className="font-titre text-2xl text-encre">
                {tiroir === "time" ? "À quelle heure ?" : "Quel jour ?"}
              </Text>
              <Text className="mt-1 font-texte text-base text-gris">Fais tourner les roulettes, la bande s'occupe du reste.</Text>
              <DateTimePicker
                key={tiroir}
                value={enCours}
                mode={tiroir}
                display="spinner"
                locale="fr-FR"
                minuteInterval={tiroir === "time" ? 5 : undefined}
                minimumDate={tiroir === "date" ? debutDAujourdhui() : undefined}
                maximumDate={tiroir === "date" ? dansUnAn() : undefined}
                textColor={couleurs.encre}
                themeVariant="light"
                onValueChange={(_evenement, date) => setEnCours(date)}
              />
              <Bouton
                libelle="Valider"
                onPress={() => {
                  onChanger(fusionner(quand, enCours, tiroir));
                  setTiroirOuvert(false);
                }}
              />
              <Pressable accessibilityRole="button" onPress={() => setTiroirOuvert(false)} hitSlop={8} className="mt-2 min-h-11 justify-center active:opacity-70">
                <Text className="text-center font-texte-semi text-base text-gris underline">Annuler</Text>
              </Pressable>
            </View>
          </View>
        </Modal>
      ) : null}
    </View>
  );
}
