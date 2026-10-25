import { getLocales } from "expo-localization";

export function lireLanguesTelephone(): string[] {
  try {
    return getLocales().map((locale) => locale.languageTag);
  } catch {
    return [];
  }
}
