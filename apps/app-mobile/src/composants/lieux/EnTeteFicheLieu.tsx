import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  lieu: Lieu;
  /** Distance du lieu depuis ta ville, en km (un nombre : l'en-tête est mémorisé) */
  km: number;
  /** Hauteur de la zone de l'heure et de l'encoche, en haut de l'écran */
  margeHaut: number;
  onEnvoyer: () => void;
  /** Annonce « Tu suis maintenant… » / « Tu ne suis plus… » (une fonction stable : l'en-tête est mémorisé) */
  onAnnoncer: (texte: string) => void;
};

// Mêmes objets à chaque rendu : rien à recalculer pour le dégradé
const DEBUT_DEGRADE = { x: 0.1, y: 0 };
const FIN_DEGRADE = { x: 0.9, y: 1 };
const AUTEUR_LIEU = { type: "lieu" } as const;

/**
 * Haut de la fiche d'un lieu, dessiné dès l'arrivée : dégradé et emoji, badges (SOS, alerte), nom, infos, texte,
 * « Suivre » et « Envoyer à un pote ». Mémorisé : une rescousse ou une annonce ne le redessine pas
 * (« Suivre » lit lui-même tes suivis, il est le seul à se redessiner quand tu suis le lieu).
 */
export const EnTeteFicheLieu = memo(function EnTeteFicheLieu({ lieu, km, margeHaut, onEnvoyer, onAnnoncer }: Props) {
  return (
    <>
      <LinearGradient
        colors={lieu.couleurs}
        start={DEBUT_DEGRADE}
        end={FIN_DEGRADE}
        style={{ height: 260 + margeHaut, alignItems: "center", justifyContent: "center" }}
      >
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontSize: 110, marginTop: margeHaut }}>
          {lieu.emoji}
        </Text>
      </LinearGradient>

      <View className="gap-4 px-5 pt-5">
        <View className="flex-row flex-wrap gap-2">
          {lieu.sos ? (
            <Text className="overflow-hidden rounded-full border-2 border-encre bg-jaune px-3 py-1 font-texte-gras text-[13px] text-encre">
              🛟 SOS · {lieu.sos.places} place{lieu.sos.places > 1 ? "s" : ""} jusqu'à {formaterHeure(lieu.sos.jusqua)}{lieu.sos.offre ? ` · ${lieu.sos.offre}` : ""}
            </Text>
          ) : null}
          {lieu.alerte ? (
            <Text className="overflow-hidden rounded-full bg-rose-alerte px-3 py-1 font-texte-gras text-[13px] text-rouge-texte">🔥 {lieu.alerte}</Text>
          ) : null}
        </View>
        <Text accessibilityRole="header" className="font-titre text-[34px] leading-[38px] text-encre">
          {lieu.nom}
        </Text>
        <Text className="font-texte-moyen text-base text-gris">
          {lieu.info} · 📍 {lieu.quartier}, {lieu.ville} · {formaterDistance(km)} · {lieu.prix}
        </Text>
        <Text className="font-texte text-[17px] leading-[26px] text-encre">{lierPonctuation(lieu.texte)}</Text>
        {/* L'un au-dessus de l'autre : côte à côte, « Envoyer à un pote » passerait sur deux lignes sur un iPhone SE */}
        <BoutonSuivreProfil cle={calculerCleSuivi(AUTEUR_LIEU, lieu.id)} nom={lieu.nom} emoji={lieu.emoji} onAnnoncer={onAnnoncer} taille="grand" />
        <Bouton
          libelle="Envoyer à un pote"
          variante="blanc"
          petit
          indice="Choisis des potes de ta bande à qui envoyer ce lieu"
          onPress={onEnvoyer}
          className="self-start"
        />
      </View>
    </>
  );
});
