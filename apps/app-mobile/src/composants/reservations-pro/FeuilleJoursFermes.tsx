import { Text } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { CalendrierJoursFermes } from "~/composants/reservations-pro/CalendrierJoursFermes";
import { TEXTES_FEUILLE_JOURS_FERMES_PAR_LANGUE } from "~/contenus/textes-reglages-reservations";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visible: boolean;
  aujourdhui: string;
  joursFermes: readonly string[];
  enCours: ReadonlySet<string>;
  erreur: string | null;
  onBasculer: (jour: string, ferme: boolean) => void;
  onFermer: () => void;
};

export function FeuilleJoursFermes({ visible, aujourdhui, joursFermes, enCours, erreur, onBasculer, onFermer }: Props) {
  const T = utiliserTextes(TEXTES_FEUILLE_JOURS_FERMES_PAR_LANGUE);
  return (
    <FeuilleBas visible={visible} titre={T.titre} sousTitre={T.sousTitre} onFermer={onFermer} pied={<Bouton libelle={T.fermer} onPress={onFermer} />}>
      {erreur ? (
        <Text accessibilityLiveRegion="polite" className="rounded-2xl bg-rose-alerte px-3.5 py-2.5 font-texte-semi text-[14px] leading-5 text-rouge-texte">
          {lierPonctuation(erreur)}
        </Text>
      ) : null}
      <CalendrierJoursFermes aujourdhui={aujourdhui} joursFermes={joursFermes} enCours={enCours} onBasculer={onBasculer} />
    </FeuilleBas>
  );
}
