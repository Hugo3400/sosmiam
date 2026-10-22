import { View } from "react-native";

type Props = {
  barres: readonly number[];
  silence: boolean;
  libelle: string;
};

export const BARRES_ONDE_EN_DIRECT = 40;
const RECENTES = 8;
const HAUTEUR = 44;

export function OndeEnDirect({ barres, silence, libelle }: Props) {
  const remplies = [...Array<number>(Math.max(0, BARRES_ONDE_EN_DIRECT - barres.length)).fill(0), ...barres.slice(-BARRES_ONDE_EN_DIRECT)];
  return (
    <View accessible accessibilityRole="image" accessibilityLabel={libelle} style={{ height: HAUTEUR }} className="flex-row items-center justify-end gap-[3px] overflow-hidden">
      {remplies.map((niveau, i) => {
        const recente = i >= BARRES_ONDE_EN_DIRECT - RECENTES;
        const teinte = silence ? "bg-gris" : recente ? "bg-tomate" : "bg-encre";
        return <View key={i} style={{ width: 4, height: Math.max(4, Math.round(4 + niveau * (HAUTEUR - 4))) }} className={`shrink-0 rounded-sm ${teinte}`} />;
      })}
    </View>
  );
}
