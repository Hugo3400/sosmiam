import { Text } from "react-native";

import { creerMotifMention } from "@sos-miam/commun/fonctions/commentaires/creer-motif-mention";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  texte: string;
  className?: string;
  /**
   * Visite et compte connecté : les mentions retrouvées par le serveur (le pseudo tel qu'écrit, et le profil qu'il ouvre).
   * Absent : toute « @pseudo » valable passe en gras, sans lien.
   */
  mentions?: readonly { pseudo: string; id: string }[];
  /** Une mention du serveur touchée : son profil (la feuille se referme d'abord) */
  onOuvrirProfil?: (id: string) => void;
};

/**
 * Le texte d'un commentaire, avec les mentions « @pseudo » en gras : les mêmes que celles enregistrées par extraireMentions
 * (même motif, pseudos valables seulement). Une adresse e-mail (« contact@sosmiam.fr ») ou « @lea..max » restent en texte normal.
 * Avec les mentions du serveur, seules celles-là sont en gras, et elles ouvrent le profil de la personne.
 */
export function TexteAvecMentions({ texte, className = "", mentions, onOuvrirProfil }: Props) {
  const morceaux = lierPonctuation(texte).split(creerMotifMention());
  // Le serveur garde le pseudo tel qu'écrit : on compare sans tenir compte des majuscules
  const profilDe = (morceau: string) => mentions?.find((m) => m.pseudo.toLowerCase() === morceau.slice(1).toLowerCase())?.id ?? null;

  return (
    <Text className={`font-texte text-[15px] leading-[21px] text-encre ${className}`}>
      {morceaux.map((morceau, index) => {
        // split avec un groupe capturant : les mentions tombent aux places impaires
        if (index % 2 === 0) return morceau;
        if (!mentions) {
          return estPseudoValide(morceau.slice(1).toLowerCase()) ? (
            <Text key={index} className="font-texte-gras">
              {morceau}
            </Text>
          ) : (
            morceau
          );
        }
        const id = profilDe(morceau);
        if (!id) return morceau;
        return (
          <Text
            key={index}
            accessibilityRole="link"
            onPress={onOuvrirProfil ? () => onOuvrirProfil(id) : undefined}
            className="font-texte-gras"
          >
            {morceau}
          </Text>
        );
      })}
    </Text>
  );
}
