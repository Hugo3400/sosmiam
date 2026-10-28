import { Pressable, Text } from "react-native";

import { accorder } from "@sos-miam/commun/fonctions/langue/accorder";
import { TEXTES_INTERFACE_PAR_LANGUE } from "~/contenus/textes-interface";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Le nom de ce qu'on montre : « lieu » et « lieux » */
export type NomElements = { un: string; des: string };

type Props = {
  /** utiliserPagination : combien attendent encore, et combien le prochain appui en montre */
  restants: number;
  prochains: number;
  nom: NomElements;
  onVoirPlus: () => void;
};

/**
 * « Voir 5 lieux de plus », puis « Voir les 3 autres » ou « Voir l'autre » : la suite d'une longue liste, par morceaux. Il
 * disparaît quand tout est affiché. Le lecteur d'écran est ensuite posé sur le premier élément ajouté (utiliserPagination).
 */
export function BoutonVoirPlus({ restants, prochains, nom, onVoirPlus }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_INTERFACE_PAR_LANGUE);
  if (restants === 0) return null;
  const libelle = restants > prochains ? T.voirPlus(prochains, accorder(prochains, langue, nom.un, nom.des)) : restants === 1 ? T.voirAutre : T.voirAutres(restants);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={restants > prochains ? T.resteEnTout(restants) : undefined}
      onPress={() => {
        vibrerLegerement();
        onVoirPlus();
      }}
      className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
    >
      <Text className="font-texte-gras text-[15px] text-encre underline">{libelle}</Text>
      {restants > prochains ? <Text className="font-texte text-[13px] text-gris">{T.reste(restants)}</Text> : null}
    </Pressable>
  );
}
