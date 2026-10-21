import type { NativeIntent } from "expo-router";

import { trierLienEntrant } from "~/fonctions/liens-entrants/trier-lien-entrant";

export const redirectSystemPath: NativeIntent["redirectSystemPath"] = ({ path }) => {
  try {
    return trierLienEntrant(path, { expoGo: __DEV__ });
  } catch {
    return "/";
  }
};
