import { StatusBar } from "expo-status-bar";

import { utiliserTheme } from "~/hooks/utiliser-theme";

export function BarreEtatTheme() {
  const { schema } = utiliserTheme();
  return <StatusBar style={schema === "sombre" ? "light" : "dark"} />;
}
