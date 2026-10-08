import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";

type Props = {
  /** La personne (« moi » pour toi) */
  id: string;
};

type Onglet = "abonnes" | "abonnements";

type Compteur = { onglet: Onglet; chiffre: string; mot: string };

/** « 0 abonné », « 1 abonné », « 12 abonnés » : en français, 0 et 1 restent au singulier */
const preparer = (onglet: Onglet, nombre: number, mot: string): Compteur => ({
  onglet,
  chiffre: formaterNombreCourt(nombre),
  mot: `${mot}${nombre > 1 ? "s" : ""}`,
});

/**
 * « 12 abonnés · 5 abonnements » sous l'en-tête d'un profil. Chaque compteur ouvre sa liste (Réseau) quand on peut la voir ;
 * sinon (compte privé), un seul texte qu'on ne peut pas toucher. Rien du tout quand l'écran ne doit pas montrer de compteurs
 * (un mineur vu par un adulte, ou suivis pas encore relus).
 */
export function CompteursSuivi({ id }: Props) {
  const router = useRouter();
  const { compteursDe, abonnesDe, abonnementsDe } = utiliserSuivisPersonnes();
  const compteurs = compteursDe(id);
  if (!compteurs) return null;

  const abonnes = preparer("abonnes", compteurs.abonnes, "abonné");
  const abonnements = preparer("abonnements", compteurs.abonnements, "abonnement");
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
      accessibilityHint="Ouvre la liste"
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
