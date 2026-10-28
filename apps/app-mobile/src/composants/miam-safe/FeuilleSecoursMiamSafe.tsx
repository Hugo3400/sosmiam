import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE } from "~/contenus/textes-miam-safe-aide";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  nomLieu?: string;
  sansInternet?: boolean;
  texteComptoir?: string;
  onFermer: () => void;
  onMontrerEcran: () => void;
  onCreerCompte?: () => void;
};

export function FeuilleSecoursMiamSafe({ visible, nomLieu, sansInternet = false, texteComptoir, onFermer, onMontrerEcran, onCreerCompte }: Props) {
  const T = utiliserTextes(TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE);
  const texteSansCompte = lierPonctuation(T.texteSansCompte(T.avecUnCompte));
  return (
    <FeuilleBas
      visible={visible}
      titre={T.titres.choix}
      sousTitre={nomLieu ? T.sousTitreSecours(nomLieu) : T.onEstLa}
      onFermer={onFermer}
      pied={
        <>
          {onCreerCompte ? <Bouton libelle={T.creerCompte} variante="encre" indice={T.indiceCreerCompte(T.avecUnCompte)} onPress={onCreerCompte} /> : null}
          <Bouton libelle={T.fermer} variante="blanc" onPress={onFermer} />
        </>
      }
    >
      <NumerosUrgence />
      {sansInternet ? <Text className="font-texte-gras text-base leading-6 text-encre">{T.sansInternet}</Text> : null}
      <View className="gap-3">
        <Text accessibilityRole="header" className="font-texte-gras text-lg text-encre">
          {T.demanderAuComptoir}
        </Text>
        <Text accessibilityLiveRegion="polite" className="font-texte text-base leading-6 text-gris">
          {texteComptoir ?? lierPonctuation(T.texteComptoir)}
        </Text>
        {T.traductionConsigne ? <Text className="font-texte text-sm leading-5 text-gris">{T.traductionConsigne}</Text> : null}
        <Bouton libelle={T.montrerEcranEquipe} variante="encre" indice={T.montrerEcranIndice} onPress={onMontrerEcran} />
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.souciEquipe)}</Text>
      </View>
      {onCreerCompte ? <Text className="font-texte text-base leading-6 text-gris">{texteSansCompte}</Text> : null}
    </FeuilleBas>
  );
}
