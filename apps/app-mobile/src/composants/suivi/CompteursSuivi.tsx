import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { TEXTES_SUIVI_PAR_LANGUE } from "~/contenus/textes-suivi";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterNombreCourtLangue } from "~/fonctions/langue/formater-nombre-court-langue";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** La personne (« moi » pour toi) */
  id: string;
};

type Onglet = "abonnes" | "abonnements";

type Compteur = { onglet: Onglet; chiffre: string; mot: string };

/** « 0 abonné », « 1 abonné », « 12 abonnés » : en français, 0 et 1 restent au singulier */
const preparer = (onglet: Onglet, nombre: number, chiffre: string, mot: (n: number) => string): Compteur => ({
  onglet,
  chiffre,
  mot: mot(nombre),
});

/**
 * « 12 abonnés · 5 abonnements » sous l'en-tête d'un profil. Chaque compteur ouvre sa liste (Réseau) quand on peut la voir ;
 * sinon (compte privé), un seul texte qu'on ne peut pas toucher. Rien du tout quand l'écran ne doit pas montrer de compteurs
 * (suivis pas encore relus, personne inconnue ou bloquée).
 */
export function CompteursSuivi({ id }: Props) {
  const router = useRouter();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_SUIVI_PAR_LANGUE).compteurs;
  const { compteursDe, abonnesDe, abonnementsDe, lectureSuivis } = utiliserSuivisPersonnes();
  const { lectureActivite } = utiliserActivite();
  const monId = utiliserMonId();
  const compteurs = compteursDe(id);
  const lusSurLeServeur = id !== monId || (lectureSuivis === "lue" && lectureActivite === "lue");
  if (!compteurs || !lusSurLeServeur) return null;

  const abonnes = preparer("abonnes", compteurs.abonnes, formaterNombreCourtLangue(compteurs.abonnes, langue), T.abonnes);
  const abonnements = preparer("abonnements", compteurs.abonnements, formaterNombreCourtLangue(compteurs.abonnements, langue), T.abonnements);
  const ouvert = abonnesDe(id) !== "ferme" && abonnementsDe(id) !== "ferme";

  if (!ouvert) {
    return (
      <Text accessibilityLabel={`${abonnes.chiffre} ${abonnes.mot}, ${abonnements.chiffre} ${abonnements.mot}`} className="mt-1 text-center font-texte text-[15px] text-gris">
        <Text className="font-texte-gras text-encre">{abonnes.chiffre}</Text> {abonnes.mot} ·{" "}
        <Text className="font-texte-gras text-encre">{abonnements.chiffre}</Text> {abonnements.mot}
      </Text>
    );
  }

  const bouton = ({ onglet, chiffre, mot }: Compteur) => (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${chiffre} ${mot}`}
      accessibilityHint={T.indiceOuvrir}
      onPress={() => {
        vibrerLegerement();
        router.push({ pathname: "/potes/reseau/[id]", params: { id, onglet } });
      }}
      className="min-h-11 flex-row items-center justify-center gap-1 rounded-full px-2.5 active:opacity-60"
    >
      <Text className="font-texte-gras text-[15px] text-encre">{chiffre}</Text>
      <Text className="font-texte text-[15px] text-gris">{mot}</Text>
    </Pressable>
  );

  return (
    <View className="flex-row flex-wrap items-center justify-center">
      {bouton(abonnes)}
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte text-[15px] text-gris">
        ·
      </Text>
      {bouton(abonnements)}
    </View>
  );
}
