import { Text } from "react-native";

import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  texte: string;
  className?: string;
};

// Même forme de pseudo que extraireMentions (fonctions/communaute/extraire-mentions.ts)
const MENTION = /(@[a-z0-9][a-z0-9._]{1,18}[a-z0-9])/gi;

/** Le texte d'un commentaire, avec les mentions « @pseudo » en gras. */
export function TexteAvecMentions({ texte, className = "" }: Props) {
  const morceaux = lierPonctuation(texte).split(MENTION);
  return (
    <Text className={`font-texte text-[15px] leading-[21px] text-encre ${className}`}>
      {morceaux.map((morceau, index) =>
        // split avec un groupe capturant : les mentions tombent aux places impaires
        index % 2 === 1 ? (
          <Text key={index} className="font-texte-gras">
            {morceau}
          </Text>
        ) : (
          morceau
        ),
      )}
    </Text>
  );
}
