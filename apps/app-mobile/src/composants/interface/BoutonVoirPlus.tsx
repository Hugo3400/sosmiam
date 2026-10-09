import { Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

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
  if (restants === 0) return null;
  const libelle = restants > prochains ? `Voir ${prochains} ${prochains > 1 ? nom.des : nom.un} de plus` : restants === 1 ? "Voir l'autre" : `Voir les ${restants} autres`;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={restants > prochains ? `Il en reste ${restants} en tout` : undefined}
      onPress={() => {
        vibrerLegerement();
        onVoirPlus();
      }}
      className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
    >
      <Text className="font-texte-gras text-[15px] text-encre underline">{libelle}</Text>
      {restants > prochains ? <Text className="font-texte text-[13px] text-gris">{`Il en reste ${restants}`}</Text> : null}
    </Pressable>
  );
}
