import { TEXTES_EN_TETE_PAR_LANGUE } from "~/contenus/liens-en-tete";
import { construireLiensEnTete } from "~/fonctions/navigation/construire-liens-en-tete";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function utiliserEnTete() {
  const langue = utiliserLangue();
  const textes = utiliserTextes(TEXTES_EN_TETE_PAR_LANGUE);
  return { textes, ...construireLiensEnTete(textes, langue) };
}
