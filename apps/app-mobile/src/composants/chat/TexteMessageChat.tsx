import { Text } from "react-native";

import { decouperMentions } from "~/fonctions/chat/decouper-mentions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  texte: string;
  pseudos?: ReadonlySet<string>;
  deMoi: boolean;
};

const AUCUN_PSEUDO: ReadonlySet<string> = new Set();

export function TexteMessageChat({ texte, pseudos = AUCUN_PSEUDO, deMoi }: Props) {
  const morceaux = decouperMentions(lierPonctuation(texte), pseudos);
  return (
    <Text className={`font-texte text-base leading-[22px] ${deMoi ? "text-nuit" : "text-encre"}`}>
      {morceaux.map((morceau, i) =>
        morceau.mention ? (
          <Text key={i} className={`font-texte-gras ${deMoi ? "bg-lait/70 text-nuit" : "bg-jaune-clair text-encre"}`}>
            {morceau.texte}
          </Text>
        ) : (
          morceau.texte
        ),
      )}
    </Text>
  );
}
