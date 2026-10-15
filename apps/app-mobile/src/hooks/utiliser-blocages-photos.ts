import { createContext, useContext } from "react";

export type BlocagesPhotos = { pret: boolean; ids: ReadonlySet<string>; photos: ReadonlySet<string> };

export const BLOCAGES_INCONNUS: BlocagesPhotos = { pret: false, ids: new Set(), photos: new Set() };

export const ContexteBlocagesPhotos = createContext<BlocagesPhotos>(BLOCAGES_INCONNUS);

export function utiliserBlocagesPhotos(): BlocagesPhotos {
  return useContext(ContexteBlocagesPhotos);
}
