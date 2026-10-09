import { memo, useEffect, useState } from "react";
import { Text, View } from "react-native";
import { Marker } from "react-native-maps";

import type { Lieu, PositionLieu } from "@sos-miam/commun/types/lieu";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

type Props = {
  lieu: Lieu;
  /** Où le poser (la position du lieu, déjà vérifiée par la carte) */
  position: PositionLieu;
  selectionne: boolean;
  /** La même fonction pour tous les marqueurs (stable), pour ne redessiner que ceux qui changent */
  onPress: (id: number) => void;
};

/** Place transparente autour du rond : le halo, l'ombre et la pastille SOS y tiennent (sur Android, le marqueur est une image coupée à ses bords) */
const BORD = 10;
/** Côté du marqueur, le même sélectionné ou non : sur iPhone, Apple Plans garde la plus grande taille vue et décalerait un marqueur qui rétrécit */
const COTE = 54 + BORD * 2;
/** Après un changement d'apparence, temps laissé à Android pour redessiner l'image du marqueur avant de la figer */
const DUREE_SUIVI = 500;

/** Ce que lit le lecteur d'écran : le nom, ce que c'est, le SOS ou l'alerte du moment */
function decrireLieu(lieu: Lieu): string[] {
  const sos = lieu.sos
    ? `En SOS ce soir : ${lieu.sos.places} place${lieu.sos.places > 1 ? "s" : ""} jusqu'à ${formaterHeure(lieu.sos.jusqua)}${lieu.sos.offre ? `, ${lieu.sos.offre}` : ""}`
    : null;
  const nonVerifie = estLieuVerifie(lieu) ? null : "Lieu non vérifié, sans compte SOS Miam";
  return [`${lieu.info}, ${lieu.quartier}`, sos, lieu.alerte ?? null, nonVerifie].filter((morceau): morceau is string => !!morceau);
}

/**
 * Un lieu sur la carte d'Explorer : un rond avec son emoji, bord encre et ombre décalée.
 * Jaune quand le lieu lance un SOS, tomate clair quand il a une alerte ; plus grand, avec un halo, quand il est sélectionné.
 * Mémorisé : seuls les marqueurs qui changent se redessinent.
 */
export const MarqueurLieu = memo(function MarqueurLieu({ lieu, position, selectionne, onPress }: Props) {
  // Android dessine le marqueur en image : on suit ses changements le temps de le redessiner, puis on le fige (bien plus fluide)
  const verifie = estLieuVerifie(lieu);
  const apparence = `${selectionne ? 1 : 0}|${lieu.sos ? 1 : 0}|${lieu.alerte ? 1 : 0}|${verifie ? 1 : 0}|${lieu.emoji}`;
  const [apparenceFigee, setApparenceFigee] = useState<string | null>(null);
  useEffect(() => {
    const minuterie = setTimeout(() => setApparenceFigee(apparence), DUREE_SUIVI);
    return () => clearTimeout(minuterie);
  }, [apparence]);

  const diametre = selectionne ? 54 : 40;
  // Le rond est centré dans le marqueur : l'ombre et la pastille se placent depuis son bord
  const autour = (COTE - diametre) / 2;
  const decalageOmbre = selectionne ? 4 : 3;
  // Non vérifié : un rond crème en pointillé, sans ombre, qu'on ne confond pas avec un lieu inscrit
  const fond = !verifie ? "bg-creme" : lieu.sos ? "bg-jaune" : lieu.alerte ? "bg-rose-alerte" : "bg-white";
  const details = decrireLieu(lieu);

  return (
    <Marker
      identifier={String(lieu.id)}
      coordinate={position}
      // Le centre du rond sur le lieu (Android ; sur iPhone, Apple Plans centre déjà la vue)
      anchor={{ x: 0.5, y: 0.5 }}
      zIndex={selectionne ? 3 : lieu.sos ? 2 : lieu.alerte ? 1 : 0}
      tracksViewChanges={apparence !== apparenceFigee}
      // Sur iPhone, sans ça, toucher le marqueur toucherait aussi la carte (et désélectionnerait le lieu)
      stopPropagation
      onPress={() => {
        vibrerLegerement();
        onPress(lieu.id);
      }}
      accessibilityRole="button"
      accessibilityLabel={[lieu.nom, ...details].join(". ")}
      accessibilityHint="Sélectionne ce lieu"
      accessibilityState={{ selected: selectionne }}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: COTE, height: COTE }}
        className="items-center justify-center"
      >
        {selectionne ? <View style={{ position: "absolute", inset: 1, borderRadius: 999 }} className="bg-jaune/50" /> : null}
        {verifie ? (
          <View
            style={{ position: "absolute", left: autour + decalageOmbre, top: autour + decalageOmbre, width: diametre, height: diametre, borderRadius: diametre / 2 }}
            className="bg-encre"
          />
        ) : null}
        <View
          style={{ width: diametre, height: diametre, borderRadius: diametre / 2, borderWidth: selectionne ? 3 : 2, borderStyle: verifie ? "solid" : "dashed" }}
          className={`items-center justify-center border-encre ${fond}`}
        >
          {/* Taille fixe : le rond ne grandit pas avec le texte du téléphone (le lecteur d'écran a le libellé complet) */}
          <Text allowFontScaling={false} style={{ fontSize: selectionne ? 28 : 20 }}>
            {lieu.emoji}
          </Text>
        </View>
        {/* Pastille : le SOS ou l'alerte se voient aussi sans les couleurs */}
        {lieu.sos ? (
          <View style={{ position: "absolute", top: autour - 8, right: autour - 10 }} className="rounded-full border-[1.5px] border-encre bg-tomate px-1.5">
            {/* Encre sur tomate : assez de contraste pour un texte aussi petit */}
            <Text allowFontScaling={false} className="font-texte-gras text-[10px] leading-[14px] text-encre">
              SOS
            </Text>
          </View>
        ) : lieu.alerte ? (
          <View style={{ position: "absolute", top: autour - 8, right: autour - 8 }} className="h-5 w-5 items-center justify-center rounded-full border-[1.5px] border-encre bg-white">
            <Text allowFontScaling={false} className="text-[10px]">
              🔥
            </Text>
          </View>
        ) : null}
      </View>
    </Marker>
  );
});
