import { Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

export type OngletPotes = "sorties" | "bande" | "listes";

type Props = {
  onglet: OngletPotes;
  onChoisir: (onglet: OngletPotes) => void;
  /** Lieux reçus de tes potes et pas encore ouverts : une pastille sur « Sorties » */
  nouveautes: number;
};

const onglets: { cle: OngletPotes; nom: string }[] = [
  { cle: "sorties", nom: "Sorties" },
  { cle: "bande", nom: "Ma bande" },
  { cle: "listes", nom: "Listes" },
];

/** Les trois onglets de Potes (Sorties, Ma bande, Listes), sur fond crème pour rester lisibles quand ils restent collés en haut. */
export function OngletsPotes({ onglet, onChoisir, nouveautes }: Props) {
  return (
    // -mx-5 px-5 : le fond crème couvre toute la largeur quand les onglets restent collés en haut de l'écran
    <View className="-mx-5 bg-creme px-5 pt-1">
      <View accessibilityRole="tablist" className="flex-row border-b-2 border-ligne">
        {onglets.map((o, i) => {
          const actif = o.cle === onglet;
          const pastille = o.cle === "sorties" ? nouveautes : 0;
          const lu = pastille > 0 ? `${o.nom}, ${pastille} lieu${pastille > 1 ? "x" : ""} reçu${pastille > 1 ? "s" : ""} pas encore vu${pastille > 1 ? "s" : ""}` : o.nom;
          // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
          return (
            <Pressable
              key={o.cle}
              accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
              accessibilityLabel={Platform.OS === "ios" ? `${lu}, onglet ${i + 1} sur ${onglets.length}` : lu}
              accessibilityState={{ selected: actif }}
              onPress={() => {
                vibrerLegerement();
                onChoisir(o.cle);
              }}
              className={`-mb-0.5 min-h-11 flex-1 flex-row items-center justify-center gap-1.5 border-b-2 py-2 active:opacity-70 ${actif ? "border-encre" : "border-transparent"}`}
            >
              <Text numberOfLines={1} className={`font-texte-gras text-base ${actif ? "text-encre" : "text-gris"}`}>
                {o.nom}
              </Text>
              {pastille > 0 ? (
                <View className="min-w-5 items-center rounded-full bg-rouge-texte px-1.5 py-0.5">
                  <Text allowFontScaling={false} className="font-texte-gras text-[11px] text-white">
                    {pastille}
                  </Text>
                </View>
              ) : null}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
