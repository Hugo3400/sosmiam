import { Text } from "react-native";

import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { creerMotifMention } from "~/fonctions/communaute/creer-motif-mention";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  texte: string;
  className?: string;
};

/**
 * Le texte d'un commentaire, avec les mentions « @pseudo » en gras : les mêmes que celles enregistrées par extraireMentions
 * (même motif, pseudos valables seulement). Une adresse e-mail (« contact@sosmiam.fr ») ou « @lea..max » restent en texte normal.
 */
export function TexteAvecMentions({ texte, className = "" }: Props) {
  const morceaux = lierPonctuation(texte).split(creerMotifMention());
  return (
    <Text className={`font-texte text-[15px] leading-[21px] text-encre ${className}`}>
      {morceaux.map((morceau, index) =>
        // split avec un groupe capturant : les mentions tombent aux places impaires
        index % 2 === 1 && estPseudoValide(morceau.slice(1).toLowerCase()) ? (
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
