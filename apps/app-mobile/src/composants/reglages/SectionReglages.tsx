import type { ReactNode } from "react";
import { Text, View } from "react-native";

import { SectionPliable } from "~/composants/interface/SectionPliable";
import type { IdSectionPliable } from "~/stockage/sections-depliees";

type Props = {
  titre: string;
  section?: IdSectionPliable;
  resume?: string;
  /** Les lignes de la section (LigneReglage, petites notes…) */
  children: ReactNode;
};

/** Une section d'un écran de réglages : un petit titre, lu comme un titre par VoiceOver, puis ses lignes. */
export function SectionReglages({ titre, section, resume, children }: Props) {
  if (section) {
    return (
      <View className="mb-8">
        <SectionPliable section={section} titre={titre} resume={resume ? [resume] : undefined}>
          <View className="-mt-2">{children}</View>
        </SectionPliable>
      </View>
    );
  }
  return (
    <View className="mb-8">
      <Text accessibilityRole="header" className="mb-1 font-titre-gras text-xl text-encre">
        {titre}
      </Text>
      <View>{children}</View>
    </View>
  );
}
