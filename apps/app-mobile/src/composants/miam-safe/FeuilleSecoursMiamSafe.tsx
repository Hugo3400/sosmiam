import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  visible: boolean;
  nomLieu?: string;
  sansInternet?: boolean;
  texteComptoir?: string;
  onFermer: () => void;
  onMontrerEcran: () => void;
  onCreerCompte?: () => void;
};

const AVEC_UN_COMPTE = "prévenir un pote, alerter le comptoir en silence ou nous raconter ce qui s'est passé depuis l'app";

const TEXTE_SANS_COMPTE = lierPonctuation(`Pour ${AVEC_UN_COMPTE}, il te faut un compte : c'est ce qui nous permet de prendre chaque alerte au sérieux.`);

const TEXTE_COMPTOIR = lierPonctuation(
  "Montre cet écran à quelqu'un de l'équipe : il dit en clair que tu as besoin d'aide, et quoi faire, même à une équipe qui ne connaît pas Miam Safe.",
);

const SANS_INTERNET = "Ces numéros marchent sans Internet, comme l'écran à montrer à l'équipe.";

const SOUCI_EQUIPE = lierPonctuation("Le souci vient de l'équipe ? Appelle plutôt un proche ou les secours.");

export function FeuilleSecoursMiamSafe({ visible, nomLieu, sansInternet = false, texteComptoir = TEXTE_COMPTOIR, onFermer, onMontrerEcran, onCreerCompte }: Props) {
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
      {sansInternet ? <Text className="font-texte-gras text-base leading-6 text-encre">{SANS_INTERNET}</Text> : null}
      <View className="gap-3">
        <Text accessibilityRole="header" className="font-texte-gras text-lg text-encre">
          Demander au comptoir
        </Text>
        <Text accessibilityLiveRegion="polite" className="font-texte text-base leading-6 text-gris">
          {texteComptoir}
        </Text>
        <Bouton libelle="Montrer l'écran à l'équipe" variante="encre" indice="Un écran qui dit en clair à l'équipe que tu as besoin d'aide" onPress={onMontrerEcran} />
        <Text className="font-texte text-sm leading-5 text-gris">{SOUCI_EQUIPE}</Text>
      </View>
      {onCreerCompte ? <Text className="font-texte text-base leading-6 text-gris">{TEXTE_SANS_COMPTE}</Text> : null}
    </FeuilleBas>
  );
}
