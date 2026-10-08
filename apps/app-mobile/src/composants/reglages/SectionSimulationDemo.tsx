import { Text, View } from "react-native";

import { Interrupteur } from "~/composants/interface/Interrupteur";
import { Pastille } from "~/composants/interface/Pastille";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserReglagesDemo } from "~/hooks/utiliser-reglages-demo";
import type { PepinDemo, ReglagesDemo } from "~/services/demo/types-demo";

type Props = {
  /** Message à afficher et à faire lire après un changement (« Pépin réservé : … ») */
  onAnnoncer: (texte: string) => void;
};

type ChoixPepin = { pepin: PepinDemo | null; emoji: string; libelle: string; quand: string };

/** Chaque pépin arrive une seule fois, au prochain geste qui peut le subir (voir consommerPepin) */
const PEPINS: readonly ChoixPepin[] = [
  { pepin: null, emoji: "😌", libelle: "Aucun", quand: "" },
  { pepin: "hors-zone", emoji: "🗺️", libelle: "Trop loin", quand: "à ta prochaine demande d'addition ou à ton prochain scan" },
  { pepin: "position-imprecise", emoji: "🌫️", libelle: "Position floue", quand: "à ta prochaine demande d'addition ou à ton prochain scan" },
  { pepin: "hors-ligne", emoji: "📶", libelle: "Pas de réseau", quand: "à ta prochaine demande d'addition ou à ton prochain scan" },
  { pepin: "refus-lieu", emoji: "🙅", libelle: "Le lieu refuse", quand: "à ta prochaine demande d'addition, refusée au bout de 3 secondes" },
  { pepin: "qr-expire", emoji: "⏳", libelle: "QR déjà changé", quand: "à ton prochain scan du comptoir" },
];

type Bascule = { cle: Exclude<keyof ReglagesDemo, "pepin">; emoji: string; titre: string; detail: string; oui: string; non: string };

const BASCULES: readonly Bascule[] = [
  {
    cle: "vraiePosition",
    emoji: "📍",
    titre: "Vérifier ma vraie position",
    detail: "Coupé, on te place à 30 m du lieu choisi, à 15 m près",
    oui: "📍 Vraie position : il faudra être sur place, pour de vrai.",
    non: "Position de démo : on te place à 30 m du lieu choisi.",
  },
  {
    cle: "lieuxRepondentSeuls",
    emoji: "🤖",
    titre: "Les lieux répondent tout seuls",
    detail: "Ton addition est réglée au bout de 8 secondes, sauf chez le lieu que tu joues",
    oui: "🤖 Les lieux répondent tout seuls : ton addition sera réglée au bout de 8 secondes.",
    non: "Les lieux ne répondent plus seuls : c'est toi qui réponds, avec le panneau de démo ou le mode pro.",
  },
  {
    cle: "avisAccelere",
    emoji: "⏩",
    titre: "Avis en accéléré, 1 min",
    detail: "Ton avis s'ouvre une minute après ta visite, au lieu d'une heure",
    oui: "⏩ Avis en accéléré : il s'ouvrira une minute après ta prochaine visite.",
    non: "Avis au rythme normal : une heure après ta visite.",
  },
];

/**
 * Coulisses de la démo > Simulation : vraie position ou position de démo, lieux qui répondent tout seuls, avis en
 * accéléré, et un pépin à réserver (une seule fois) pour voir les écrans d'échec sans quitter son canapé.
 */
export function SectionSimulationDemo({ onAnnoncer }: Props) {
  const { reglages, changer } = utiliserReglagesDemo();
  const reserve = PEPINS.find((p) => p.pepin !== null && p.pepin === reglages.pepin) ?? null;

  function basculer(bascule: Bascule, valeur: boolean) {
    const partiel: Partial<ReglagesDemo> = {};
    partiel[bascule.cle] = valeur;
    changer(partiel).catch(() => {});
    onAnnoncer(valeur ? bascule.oui : bascule.non);
  }

  function reserver(choix: ChoixPepin) {
    if (choix.pepin === reglages.pepin) return;
    changer({ pepin: choix.pepin }).catch(() => {});
    onAnnoncer(choix.pepin === null ? "Plus aucun pépin en réserve." : `${choix.emoji} Pépin réservé : ${choix.libelle.toLocaleLowerCase("fr-FR")}, ${choix.quand}.`);
  }

  return (
    <SectionReglages titre="Simulation">
      {BASCULES.map((bascule) => (
        <Interrupteur
          key={bascule.cle}
          emoji={bascule.emoji}
          titre={bascule.titre}
          detail={bascule.detail}
          valeur={reglages[bascule.cle]}
          onChanger={(valeur) => basculer(bascule, valeur)}
        />
      ))}

      <View className="gap-3 border-b border-ligne py-4">
        <View className="flex-row items-center gap-4">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-2xl">
            🐞
          </Text>
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
              Simuler un pépin (une fois)
            </Text>
            <Text className="font-texte text-sm text-gris">
              {lierPonctuation(reserve ? `Réservé : ${reserve.libelle.toLocaleLowerCase("fr-FR")}, ${reserve.quand}.` : "Pour voir les écrans d'échec sans quitter ton canapé.")}
            </Text>
          </View>
        </View>
        <View className="flex-row flex-wrap gap-2">
          {PEPINS.map((choix, i) => (
            <Pastille
              key={choix.libelle}
              libelle={choix.libelle}
              emoji={choix.emoji}
              role="radio"
              position={i + 1}
              total={PEPINS.length}
              choisi={reglages.pepin === choix.pepin}
              indice={choix.pepin === null ? "Aucun pépin en réserve" : `Arrive une seule fois, ${choix.quand}`}
              onPress={() => reserver(choix)}
            />
          ))}
        </View>
      </View>
    </SectionReglages>
  );
}
