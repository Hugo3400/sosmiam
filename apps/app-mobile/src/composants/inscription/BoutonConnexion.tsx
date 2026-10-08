import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

export type Fournisseur = "apple" | "google" | "email";

const styles: Record<Fournisseur, { libelle: string; icone: "logo-apple" | "logo-google" | "mail"; fond: string; texte: string; couleurIcone: string }> = {
  // Apple : bouton noir, logo et texte blancs (règles d'Apple)
  apple: { libelle: "Continuer avec Apple", icone: "logo-apple", fond: "bg-encre border-encre", texte: "text-white", couleurIcone: "#FFFFFF" },
  google: { libelle: "Continuer avec Google", icone: "logo-google", fond: "bg-white border-encre", texte: "text-encre", couleurIcone: couleurs.encre },
  email: { libelle: "Continuer avec mon e-mail", icone: "mail", fond: "bg-jaune border-encre", texte: "text-encre", couleurIcone: couleurs.encre },
};

/** Grand bouton de connexion (Apple, Google ou e-mail), tous de la même taille. */
export function BoutonConnexion({ fournisseur, onPress }: { fournisseur: Fournisseur; onPress: () => void }) {
  const s = styles[fournisseur];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={s.libelle}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-14 flex-row items-center justify-center gap-3 rounded-full border-2 px-5 active:opacity-80 ${s.fond}`}
    >
      <Ionicons name={s.icone} size={22} color={s.couleurIcone} />
      <Text className={`font-texte-gras text-[17px] ${s.texte}`}>{s.libelle}</Text>
    </Pressable>
  );
}
