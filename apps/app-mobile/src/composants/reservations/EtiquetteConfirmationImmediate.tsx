import { Text, View } from "react-native";

import { TEXTES_RESERVER_TABLE as T } from "~/contenus/textes-reserver-table";

export function EtiquetteConfirmationImmediate() {
  return (
    <View accessible accessibilityLabel={T.confirmationImmediateLu} className="self-start rounded-full border-2 border-encre bg-jaune px-3 py-1">
      <Text className="font-texte-gras text-[13px] text-encre">{T.confirmationImmediate}</Text>
    </View>
  );
}
