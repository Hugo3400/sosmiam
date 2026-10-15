import { Image } from "expo-image";
import { Text, type TextProps } from "react-native";

import { construireAdressePhotoProfil } from "@sos-miam/commun/fonctions/compte/construire-adresse-photo-profil";
import { EMOJI_AVATAR_PAR_DEFAUT } from "@sos-miam/commun/regles/avatar-par-defaut";
import { PREFIXE_AVATAR_MIAMI } from "@sos-miam/commun/regles/avatars-miamis";
import { PREFIXE_AVATAR_PHOTO } from "@sos-miam/commun/regles/photo-profil";
import { lireAvatarMiami } from "@sos-miam/commun/validation/lire-avatar-miami";
import { PhotoProfilPersonne } from "~/composants/profil/PhotoProfilPersonne";
import { IMAGES_MIAMIS } from "~/contenus/images-miamis";
import { peutMontrerPhotoPersonne } from "~/fonctions/compte/peut-montrer-photo-personne";
import { utiliserBlocagesPhotos } from "~/hooks/utiliser-blocages-photos";
import { ADRESSE_MEDIAS } from "~/services/adresse-api";

/** Ce qu'on montre pour un Miami que cette version de l'app ne connaît pas encore */
const MIAMI_INCONNU = "🙂";

type Props = Pick<TextProps, "className" | "style" | "allowFontScaling"> & {
  /** Un avatar tel que les autres le voient : un emoji, ou un Miami (« miami:toque ») */
  valeur: string | null;
  /** Diamètre du Miami en points (l'intérieur du rond où il se dessine, qu'il remplit) */
  taille: number;
  personneId?: string;
};

/**
 * Un avatar : l'image du Miami s'il en est un, sinon l'emoji, dans le style de texte donné (comme avant les Miamis). Un
 * avatar vide montre l'avatar par défaut (🦸, comme chez la personne), un Miami inconnu (version plus récente de l'app) 🙂.
 * Décoratif : le prénom est lu à côté.
 */
export function EmojiOuMiami({ valeur, taille, personneId, ...texte }: Props) {
  const blocages = utiliserBlocagesPhotos();
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
  const photo = peutMontrerPhotoPersonne(valeur, personneId, blocages) ? construireAdressePhotoProfil(valeur, ADRESSE_MEDIAS) : null;
  if (photo) return <PhotoProfilPersonne key={photo} adresse={photo} taille={taille} texte={texte} />;
  const emoji = !valeur || valeur.startsWith(PREFIXE_AVATAR_PHOTO) ? EMOJI_AVATAR_PAR_DEFAUT : valeur.startsWith(PREFIXE_AVATAR_MIAMI) ? MIAMI_INCONNU : valeur;
  return <Text {...texte}>{emoji}</Text>;
}
