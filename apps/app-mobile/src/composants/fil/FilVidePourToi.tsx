import { Text } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import { ZoneClaire } from "~/composants/theme/ZoneClaire";
import { TEXTES_FIL_PAR_LANGUE } from "~/contenus/textes-fil";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  hauteur: number;
  /** Le serveur n'a pas répondu et rien n'est gardé sur le téléphone */
  horsLigne: boolean;
  onVoirAdresses: () => void;
};

/** Fil « Pour toi » sans aucune publication : les lieux préparent leurs vidéos (ou pas de réseau). Explorer reste ouvert. */
export function FilVidePourToi({ hauteur, horsLigne, onVoirAdresses }: Props) {
  const T = utiliserTextes(TEXTES_FIL_PAR_LANGUE).videPourToi;
  return (
    <ZoneClaire style={{ height: hauteur }} className="items-center justify-center gap-4 bg-jaune px-8">
      <Mascotte expression={horsLigne ? "surprise" : "clin"} taille={140} />
      <Text accessibilityRole="header" className="text-center font-titre text-3xl text-nuit">
        {horsLigne ? T.horsLigneTitre : T.titre}
      </Text>
      <Text className="text-center font-texte text-base leading-6 text-nuit/75">
        {lierPonctuation(horsLigne ? T.horsLigneTexte : T.texte)}
      </Text>
      <Bouton libelle={T.bouton} variante="blanc" onPress={onVoirAdresses} className="mt-2 self-stretch" />
    </ZoneClaire>
  );
}
