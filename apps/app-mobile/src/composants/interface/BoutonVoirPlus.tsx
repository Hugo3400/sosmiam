import { AccessibilityInfo, Pressable, Text } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

/** Le nom de ce qu'on montre : « lieu » et « lieux », et s'il est féminin (« sortie ») */
export type NomElements = { un: string; des: string; feminin?: boolean };

type Props = {
  /** utiliserPagination : combien attendent encore, combien le prochain appui en montre, et si on peut replier */
  restants: number;
  prochains: number;
  deplie: boolean;
  nom: NomElements;
  onVoirPlus: () => void;
  onReplier: () => void;
};

/** « Voir 5 lieux de plus », « Voir les 3 dernières », puis « Replier » : la suite d'une longue liste, par morceaux. */
export function BoutonVoirPlus({ restants, prochains, deplie, nom, onVoirPlus, onReplier }: Props) {
  if (restants === 0 && !deplie) return null;
  const derniers = nom.feminin ? "dernières" : "derniers";
  const libelle =
    restants === 0
      ? "Replier"
      : restants > prochains
        ? `Voir ${prochains} ${prochains > 1 ? nom.des : nom.un} de plus`
        : restants === 1
          ? `Voir ${nom.feminin ? "la dernière" : "le dernier"}`
          : `Voir les ${restants} ${derniers}`;
  const indice = restants > prochains ? `Il en reste ${restants} en tout` : restants === 0 ? `Ne garder que les premiers ${nom.des}` : undefined;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityHint={indice}
      onPress={() => {
        vibrerLegerement();
        if (restants === 0) return onReplier();
        onVoirPlus();
        AccessibilityInfo.announceForAccessibility(`${prochains} ${prochains > 1 ? nom.des : nom.un} de plus`);
      }}
      className="min-h-11 items-center justify-center self-center px-4 active:opacity-70"
    >
      <Text className="font-texte-gras text-[15px] text-encre underline">{libelle}</Text>
      {restants > prochains ? <Text className="font-texte text-[13px] text-gris">{`Il en reste ${restants}`}</Text> : null}
    </Pressable>
  );
}
