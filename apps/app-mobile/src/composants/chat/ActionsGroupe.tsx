import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { TEXTES_INFOS_GROUPE as T } from "~/contenus/textes-infos-groupe";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  admin: boolean;
  epinglee: boolean;
  coupee: boolean;
  onAjouter: () => void;
  onEpingler: () => void;
  onCouper: () => void;
};

export function ActionsGroupe({ admin, epinglee, coupee, onAjouter, onEpingler, onCouper }: Props) {
  const couleurs = utiliserCouleurs();
  const tuiles = [
    { cle: "ajouter", libelle: T.ajouter, lu: T.ajouterLu, icone: "person-add-outline" as const, fond: "bg-jaune", texte: "text-nuit", teinte: couleurs.nuit, faire: onAjouter, inactif: !admin, indice: admin ? undefined : T.ajouterAdmins },
    {
      cle: "epingler",
      libelle: epinglee ? T.epingle : T.epingler,
      lu: epinglee ? T.epingle : T.epingler,
      icone: (epinglee ? "pin" : "pin-outline") as "pin" | "pin-outline",
      fond: epinglee ? "bg-choix" : "bg-carte",
      texte: epinglee ? "text-sur-choix" : "text-encre",
      teinte: epinglee ? couleurs["sur-choix"] : couleurs.encre,
      faire: onEpingler,
      inactif: false,
      indice: undefined,
      choisi: epinglee,
    },
    {
      cle: "couper",
      libelle: coupee ? T.remettre : T.couper,
      lu: coupee ? T.remettreLu : T.couperLu,
      icone: (coupee ? "notifications-outline" : "notifications-off-outline") as "notifications-outline" | "notifications-off-outline",
      fond: "bg-carte",
      texte: "text-encre",
      teinte: couleurs.encre,
      faire: onCouper,
      inactif: false,
      indice: undefined,
    },
  ];
  return (
    <View className="flex-row gap-2">
      {tuiles.map((t) => (
        <Pressable
          key={t.cle}
          accessibilityRole="button"
          accessibilityLabel={t.lu}
          accessibilityHint={t.indice}
          accessibilityState={{ disabled: t.inactif, ...("choisi" in t ? { selected: t.choisi } : {}) }}
          disabled={t.inactif}
          onPress={() => {
            vibrerLegerement();
            t.faire();
          }}
          className={`min-h-16 flex-1 items-center justify-center gap-1 rounded-2xl border-2 border-encre p-1.5 active:opacity-80 ${t.fond} ${t.inactif ? "opacity-40" : ""}`}
        >
          <Ionicons name={t.icone} size={20} color={t.teinte} />
          <Text numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.85} className={`font-texte-semi text-[13px] ${t.texte}`}>
            {t.libelle}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}
