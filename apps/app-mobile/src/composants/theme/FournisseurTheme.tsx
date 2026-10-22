import { DarkTheme, DefaultTheme, ThemeProvider } from "expo-router";
import { useCallback, useEffect, useMemo, useState, type ReactNode } from "react";
import { Platform, useColorScheme, View } from "react-native";

import type { ReglageApparence } from "~/contenus/type-apparence";
import { choisirSchema } from "~/fonctions/theme/choisir-schema";
import { ContexteTheme, type EtatTheme, type Palette } from "~/hooks/utiliser-theme";
import { enregistrerReglageApparence, lireReglageApparence } from "~/stockage/apparence";
import palettes from "~/theme/palettes";
import { VARIABLES_CSS, VARIABLES_THEMES } from "~/theme/variables-themes";

export function FournisseurTheme({ children }: { children: ReactNode }) {
  const systeme = useColorScheme();
  const [reglage, setReglage] = useState<ReglageApparence>("automatique");

  useEffect(() => {
    let actif = true;
    void lireReglageApparence().then((lu) => {
      if (actif) setReglage(lu);
    });
    return () => {
      actif = false;
    };
  }, []);

  const changerReglage = useCallback((nouveau: ReglageApparence) => {
    setReglage(nouveau);
    void enregistrerReglageApparence(nouveau);
  }, []);

  const schema = choisirSchema(reglage, systeme);

  useEffect(() => {
    if (Platform.OS !== "web" || typeof document === "undefined") return;
    const racine = document.documentElement;
    for (const [nom, valeurVariable] of Object.entries(VARIABLES_CSS[schema])) racine.style.setProperty(nom, valeurVariable);
    racine.style.colorScheme = schema === "sombre" ? "dark" : "light";
  }, [schema]);

  const themeNavigation = useMemo(() => {
    const base = schema === "sombre" ? DarkTheme : DefaultTheme;
    const c = palettes[schema];
    return { ...base, colors: { ...base.colors, primary: c.jaune, background: c.creme, card: c.creme, text: c.encre, border: c.ligne, notification: c.tomate } };
  }, [schema]);

  const valeur = useMemo<EtatTheme>(
    () => ({ schema, reglage, couleurs: palettes[schema] as Palette, changerReglage }),
    [schema, reglage, changerReglage],
  );

  return (
    <ContexteTheme.Provider value={valeur}>
      <ThemeProvider value={themeNavigation}>
        <View style={[{ flex: 1 }, VARIABLES_THEMES[schema]]}>{children}</View>
      </ThemeProvider>
    </ContexteTheme.Provider>
  );
}
