import { Text, View } from "react-native";

import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";

type Props = {
  /** L'espace autour (ex. « mb-6 ») : avec un compte, rien n'est rendu, l'espace non plus */
  className?: string;
};

/**
 * Le petit bandeau honnête de la démo : la bande d'exemple vote et répond toute seule. Il décide lui-même de s'afficher (en
 * démo seulement) : avec un compte, en visite ou le temps de relire la session, il ne rend rien, quel que soit l'écran.
 */
export function BandeauDemoPotes({ className = "" }: Props) {
  const source = utiliserSourceSociale();
  if (source !== "demo") return null;
  return (
    <View
      accessible
      accessibilityLabel="Démo : ce sont des potes d'exemple, ils votent et répondent tout seuls. Quitte la démo pour retrouver ta vraie bande."
      className={`flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-carte/70 px-3.5 py-2.5 ${className}`}
    >
      <Text className="text-lg">🧪</Text>
      <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
        <Text className="font-texte-gras text-encre">{"Potes d'exemple"}</Text>
        {" : ils votent et répondent tout seuls. Quitte la démo pour retrouver ta vraie bande."}
      </Text>
    </View>
  );
}
