import type { Traduction } from "@sos-miam/commun/types/traduction";
import type { TEXTES_INVITER_LIEU } from "~/contenus/textes-inviter-lieu";

export const TEXTES_INVITER_LIEU_ANGLAIS: Traduction<typeof TEXTES_INVITER_LIEU> = {
  message: (nom: string, adresse: string) =>
    `Hi ${nom}! I found you on SOS Miam, the app that helps people discover independent places near them. List your venue – it's free – and your customers will be able to get their visits confirmed with you: ${adresse}`,
};
