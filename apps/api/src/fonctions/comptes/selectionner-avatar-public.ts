import { construireFiltreLimitationActive } from "./construire-filtre-limitation-active.ts";

export function selectionnerAvatarPublic(maintenant: Date) {
  return {
    avatar: true,
    photoProfil: true,
    limitations: { where: construireFiltreLimitationActive(maintenant), select: { id: true }, take: 1 },
  } as const;
}
