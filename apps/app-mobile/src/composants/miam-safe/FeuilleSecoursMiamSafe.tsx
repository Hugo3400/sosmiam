import { Text } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";

type Props = {
  visible: boolean;
  nomLieu?: string;
  sansInternet?: boolean;
  onFermer: () => void;
  onCreerCompte?: () => void;
};

const AVEC_UN_COMPTE = "prévenir un pote, demander de l'aide au comptoir ou nous raconter ce qui s'est passé";

export function FeuilleSecoursMiamSafe({ visible, nomLieu, sansInternet = false, onFermer, onCreerCompte }: Props) {
  return (
    <FeuilleBas
      visible={visible}
      titre="Miam Safe"
      sousTitre={nomLieu ? `${nomLieu} · on est là.` : "On est là."}
      onFermer={onFermer}
      pied={
        <>
          {onCreerCompte ? <Bouton libelle="Créer mon compte" variante="encre" indice={`Pour ${AVEC_UN_COMPTE}`} onPress={onCreerCompte} /> : null}
          <Bouton libelle="Fermer" variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <NumerosUrgence />
      {sansInternet ? <Text className="font-texte-gras text-base leading-6 text-encre">Ces numéros marchent sans Internet.</Text> : null}
      {onCreerCompte ? (
        <Text className="font-texte text-base leading-6 text-gris">
          {`Pour ${AVEC_UN_COMPTE}, il te faut un compte : c'est ce qui nous permet de prendre chaque alerte au sérieux.`}
        </Text>
      ) : null}
    </FeuilleBas>
  );
}
