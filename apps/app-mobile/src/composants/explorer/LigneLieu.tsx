import { Ionicons } from "@expo/vector-icons";
import { memo } from "react";
import { Pressable, Text, View, type ImageSourcePropType } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { VignetteLieu } from "~/composants/explorer/VignetteLieu";
import { BadgeVerification } from "~/composants/lieux/BadgeVerification";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { estOuvertMaintenant } from "~/fonctions/lieux/est-ouvert-maintenant";
import couleurs from "~/theme/couleurs";

type Props = {
  lieu: Lieu;
  /** Distance affichée (depuis ta position quand on la connaît) */
  km: number;
  /** Image du lieu ; sans image, son dégradé et son emoji */
  image: ImageSourcePropType | null;
  /** Lieu touché sur la carte : la ligne est mise en avant */
  selectionne: boolean;
  onOuvrir: (id: number) => void;
};

// « €€ » lu tel quel donnerait « euro euro » : on le dit en mots, avec les mêmes noms que les pastilles de budget (FiltresExplorer)
const BUDGET_LU: Record<Lieu["prix"], string> = { "€": "petit budget", "€€": "budget moyen", "€€€": "budget plaisir" };

/** Une ligne de la liste d'Explorer : vignette, nom, ce que c'est et où, distance, prix, ouvert ou pas, et son SOS ou son bon plan du moment. */
export const LigneLieu = memo(function LigneLieu({ lieu, km, image, selectionne, onOuvrir }: Props) {
  const ouvert = estOuvertMaintenant(lieu);
  const distance = formaterDistance(km);
  // Sans compte SOS Miam : pas de SOS, et c'est dit clairement (« Non vérifié »)
  const verifie = estLieuVerifie(lieu);
  const sos = verifie && lieu.sos ? `${lieu.sos.places} place${lieu.sos.places > 1 ? "s" : ""} jusqu'à ${formaterHeure(lieu.sos.jusqua)}` : null;

  // Un seul libellé, dans l'ordre de l'écran ; l'état « sélectionné » est annoncé par accessibilityState
  const lu = [
    `${lieu.nom}, ${lieu.info}, ${lieu.quartier}, ${lieu.ville}`,
    `À ${distance}, ${BUDGET_LU[lieu.prix]}, ${ouvert ? "ouvert en ce moment" : "fermé en ce moment"}`,
    sos ? `SOS : ${sos}` : null,
    lieu.alerte && !sos ? lieu.alerte : null,
    verifie ? null : "Lieu non vérifié, sans compte SOS Miam",
  ]
    .filter(Boolean)
    .join(". ");

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint="Ouvre la fiche du lieu"
      accessibilityState={{ selected: selectionne }}
      onPress={() => {
        vibrerLegerement();
        onOuvrir(lieu.id);
      }}
      className={`min-h-16 flex-row items-center gap-3 border-b border-ligne px-4 py-2.5 active:opacity-70 ${selectionne ? "bg-jaune-clair" : ""}`}
    >
      <View className={`rounded-2xl border-2 ${selectionne ? "border-encre" : "border-transparent"}`}>
        <VignetteLieu lieu={lieu} image={image} hauteur={56} />
      </View>

      <View className="flex-1 gap-0.5">
        <Text numberOfLines={1} className="font-texte-gras text-base text-encre">{lieu.nom}</Text>
        <Text numberOfLines={1} className="font-texte text-[13px] text-gris">
          {lieu.info} · {lieu.quartier}, {lieu.ville}
        </Text>
        <Text numberOfLines={1} className="font-texte-moyen text-[13px] text-gris">
          {distance} · {lieu.prix} · <Text className={ouvert ? "font-texte-gras text-encre" : "font-texte-semi text-rouge-texte"}>{ouvert ? "Ouvert" : "Fermé"}</Text>
        </Text>
        {sos ? (
          <Text numberOfLines={1} className="mt-1 self-start overflow-hidden rounded-full border border-encre bg-jaune px-2 py-0.5 font-texte-gras text-xs text-encre">
            🛟 SOS · {sos}
          </Text>
        ) : lieu.alerte ? (
          <Text numberOfLines={1} className="mt-1 self-start overflow-hidden rounded-full bg-rose-alerte px-2 py-0.5 font-texte-gras text-xs text-rouge-texte">
            🔥 {lieu.alerte}
          </Text>
        ) : null}
        {verifie ? null : (
          <View className="mt-1">
            <BadgeVerification verifie={false} taille="petite" />
          </View>
        )}
      </View>

      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
});
