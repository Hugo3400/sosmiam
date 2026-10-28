import { useMemo, useState } from "react";
import { Text, View } from "react-native";

import { LigneChoixZone } from "~/composants/explorer/LigneChoixZone";
import { Bouton } from "~/composants/interface/Bouton";
import { Curseur } from "~/composants/interface/Curseur";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { RAYON_PROCHE_KM, type PorteeExplorer } from "~/contenus/portee-explorer";
import { TEXTES_EXPLORER_PAR_LANGUE } from "~/contenus/textes-explorer";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Ce qu'on regarde : une zone (à quelques km, ta région, toute la France), ou une ville précise */
export type ChoixZone = { portee: PorteeExplorer; rayonKm: number; ville: null } | { portee: null; rayonKm: number; ville: string };

type Props = {
  visible: boolean;
  /** Le choix en cours */
  choix: ChoixZone;
  /** Ta région (null si on ne la connaît pas : elle n'est pas proposée) */
  region: string | null;
  /** « de toi » avec « Autour de moi », sinon « de Montpellier » */
  autourDe: string;
  /** Villes proposées */
  villes: string[];
  onValider: (choix: ChoixZone) => void;
  onFermer: () => void;
};

/**
 * Feuille « On explore où ? » d'Explorer, pour la carte comme pour la liste : à quelques km (rayon de 1 à 50 km au curseur,
 * gardé pour la prochaine fois), ta région, toute la France, ou une ville précise. Rien ne change avant « Voir ces lieux »
 * (la carte ne saute pas à chaque cran du curseur).
 */
export function FeuilleZoneExplorer({ visible, choix, region, autourDe, villes, onValider, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_EXPLORER_PAR_LANGUE);
  const Z = T.zone;
  const [brouillon, setBrouillon] = useState<ChoixZone>(choix);
  // À chaque ouverture, on repart du choix en cours
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) setBrouillon(choix);
  }

  const km = brouillon.rayonKm;
  const zone = (portee: PorteeExplorer) => setBrouillon({ portee, rayonKm: km, ville: null });
  // Une ville choisie qui n'est plus dans la liste reste proposée : on peut toujours la voir cochée
  const proposees = useMemo(() => (choix.ville && !villes.includes(choix.ville) ? [choix.ville, ...villes] : villes), [choix.ville, villes]);
  const choixVilles = useMemo(() => proposees.map((ville) => () => setBrouillon((b) => ({ portee: null, rayonKm: b.rayonKm, ville }))), [proposees]);
  const zones: { portee: PorteeExplorer; emoji: string; libelle: string; detail?: string }[] = [
    { portee: "proche", emoji: "📍", libelle: Z.aQuelquesKm, detail: Z.autour(autourDe) },
    ...(region ? [{ portee: "region" as const, emoji: "🗺️", libelle: Z.taRegion, detail: region }] : []),
    { portee: "france", emoji: "🇫🇷", libelle: T.touteLaFrance },
  ];
  const total = zones.length + proposees.length;

  return (
    <FeuilleBas
      visible={visible}
      titre={Z.titre}
      sousTitre={Z.sousTitre}
      onFermer={onFermer}
      pied={
        <>
          <Bouton libelle={brouillon.portee === "proche" ? Z.voirAKm(km) : Z.voirCesLieux} onPress={() => onValider(brouillon)} />
          <Bouton libelle={Z.annuler} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <View>
        {zones.map((z, i) => (
          <View key={z.portee}>
            <LigneChoixZone emoji={z.emoji} libelle={z.libelle} detail={z.detail} choisi={brouillon.portee === z.portee} position={i + 1} total={total} onPress={() => zone(z.portee)} />
            {z.portee === "proche" && brouillon.portee === "proche" ? (
              <View className="gap-1 border-b border-ligne pb-3 pt-2">
                <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-center font-titre text-[32px] leading-10 text-encre">
                  {Z.km(km)}
                </Text>
                <Curseur valeur={km} min={RAYON_PROCHE_KM.min} max={RAYON_PROCHE_KM.max} onChanger={(rayonKm) => setBrouillon({ portee: "proche", rayonKm, ville: null })} libelle={Z.rayon} dire={Z.kilometres} />
                <View className="flex-row justify-between px-14">
                  <Text className="font-texte text-xs text-gris">{Z.km(RAYON_PROCHE_KM.min)}</Text>
                  <Text className="font-texte text-xs text-gris">{Z.km(RAYON_PROCHE_KM.max)}</Text>
                </View>
              </View>
            ) : null}
          </View>
        ))}
      </View>

      {proposees.length > 0 ? (
        <View>
          <Text accessibilityRole="header" className="mb-1 font-texte-gras text-base text-encre">
            {Z.villePrecise}
          </Text>
          {proposees.map((v, i) => (
            <LigneChoixZone key={v} emoji="🏙️" libelle={v} choisi={brouillon.ville === v} position={zones.length + i + 1} total={total} onPress={choixVilles[i]} />
          ))}
        </View>
      ) : null}
    </FeuilleBas>
  );
}
