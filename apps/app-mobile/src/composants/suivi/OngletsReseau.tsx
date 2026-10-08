import { Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

export type OngletReseau = "abonnes" | "abonnements";

type Props = {
  onglet: OngletReseau;
  onChoisir: (onglet: OngletReseau) => void;
  /** null : on ne montre pas le chiffre (compte privé, ou pas encore prêt) */
  abonnes: number | null;
  abonnements: number | null;
};

/** « 12 abonnés », « 1 abonné », ou « Abonnés » sans chiffre */
function nommer(nombre: number | null, singulier: string, sansChiffre: string): string {
  if (nombre === null) return sansChiffre;
  return `${nombre} ${singulier}${nombre > 1 ? "s" : ""}`;
}

/** Les deux onglets du réseau d'une personne (abonnés, abonnements), comme ceux de Potes. */
export function OngletsReseau({ onglet, onChoisir, abonnes, abonnements }: Props) {
  const onglets: { cle: OngletReseau; nom: string }[] = [
    { cle: "abonnes", nom: nommer(abonnes, "abonné", "Abonnés") },
    { cle: "abonnements", nom: nommer(abonnements, "abonnement", "Abonnements") },
  ];

  return (
    <View className="bg-creme px-5 pt-1">
      <View accessibilityRole="tablist" className="flex-row border-b-2 border-ligne">
        {onglets.map((o, i) => {
          const actif = o.cle === onglet;
          // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
          return (
            <Pressable
              key={o.cle}
              accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
              accessibilityLabel={Platform.OS === "ios" ? `${o.nom}, onglet ${i + 1} sur ${onglets.length}` : o.nom}
              accessibilityState={{ selected: actif }}
              onPress={() => {
                vibrerLegerement();
                onChoisir(o.cle);
              }}
              className={`-mb-0.5 min-h-11 flex-1 items-center justify-center border-b-2 py-2 active:opacity-70 ${actif ? "border-encre" : "border-transparent"}`}
            >
              <Text numberOfLines={1} className={`font-texte-gras text-base ${actif ? "text-encre" : "text-gris"}`}>
                {o.nom}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
