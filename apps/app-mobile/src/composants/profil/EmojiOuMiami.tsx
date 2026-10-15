import { Image } from "expo-image";
import { Text, type TextProps } from "react-native";

import { PREFIXE_AVATAR_MIAMI } from "@sos-miam/commun/regles/avatars-miamis";
import { lireAvatarMiami } from "@sos-miam/commun/validation/lire-avatar-miami";
import { IMAGES_MIAMIS } from "~/contenus/images-miamis";

/** Ce qu'on montre pour un Miami que cette version de l'app ne connaît pas encore (ou un avatar vide) */
const AVATAR_INCONNU = "🙂";

type Props = Pick<TextProps, "className" | "style" | "allowFontScaling"> & {
  /** Un avatar tel que les autres le voient : un emoji, ou un Miami (« miami:toque ») */
  valeur: string | null;
  /** Diamètre du Miami en points (l'intérieur du rond où il se dessine, qu'il remplit) */
  taille: number;
};

/**
 * Un avatar : l'image du Miami s'il en est un, sinon l'emoji, dans le style de texte donné (comme avant les Miamis). Un
 * Miami inconnu (version plus récente de l'app) ou une valeur vide montre 🙂. Décoratif : le prénom est lu à côté.
 */
export function EmojiOuMiami({ valeur, taille, ...texte }: Props) {
  const miami = lireAvatarMiami(valeur);
  if (miami) {
    return (
      <Image
        source={IMAGES_MIAMIS[miami.id]}
        accessible={false}
        contentFit="cover"
        style={{ width: taille, height: taille, borderRadius: taille / 2 }}
      />
    );
  }
  const emoji = !valeur || valeur.startsWith(PREFIXE_AVATAR_MIAMI) ? AVATAR_INCONNU : valeur;
  return <Text {...texte}>{emoji}</Text>;
}
