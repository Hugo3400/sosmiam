import { Text } from "react-native";

export function PastilleAmbassadeur({ libelle }: { libelle: string }) {
  return (
    <Text maxFontSizeMultiplier={1.4} className="overflow-hidden rounded-full border-[1.5px] border-encre bg-jaune-clair px-2 py-0.5 font-texte-gras text-[11px] text-encre">
      {libelle}
    </Text>
  );
}
