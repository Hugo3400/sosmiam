import { useMemo } from "react";
import { View, type ViewProps } from "react-native";

import { ContexteTheme, type EtatTheme, type Palette, utiliserTheme } from "~/hooks/utiliser-theme";
import palettes from "~/theme/palettes";
import { VARIABLES_THEMES } from "~/theme/variables-themes";

type Props = ViewProps & { className?: string; active?: boolean };

export function ZoneClaire({ style, active = true, ...vue }: Props) {
  const theme = utiliserTheme();
  const valeur = useMemo<EtatTheme>(() => (active ? { ...theme, schema: "clair", couleurs: palettes.clair as Palette } : theme), [theme, active]);
  return (
    <ContexteTheme.Provider value={valeur}>
      <View {...vue} style={active ? [VARIABLES_THEMES.clair, style] : style} />
    </ContexteTheme.Provider>
  );
}
