import { useRouter, type Href } from "expo-router";
import { useEffect } from "react";
import { Text, View } from "react-native";

import { citer } from "@sos-miam/commun/fonctions/langue/citer";
import { PHRASE_MIAM_SAFE } from "@sos-miam/commun/regles/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { AlerteComptoirMiamSafe } from "~/composants/miam-safe/AlerteComptoirMiamSafe";
import { ChoixAideMiamSafe, type CharteLueMiamSafe } from "~/composants/miam-safe/ChoixAideMiamSafe";
import { FeuilleSecoursMiamSafe } from "~/composants/miam-safe/FeuilleSecoursMiamSafe";
import { PrevenirPoteMiamSafe } from "~/composants/miam-safe/PrevenirPoteMiamSafe";
import { RaconterMiamSafe } from "~/composants/miam-safe/RaconterMiamSafe";
import { TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE } from "~/contenus/textes-miam-safe-aide";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserEtatMiamSafeLieu, type EtatLectureMiamSafeLieu } from "~/hooks/utiliser-etat-miam-safe-lieu";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserSuiviAlerteMiamSafe } from "~/hooks/utiliser-suivi-alerte-miam-safe";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { utiliserVueFeuilleMiamSafe } from "~/hooks/utiliser-vue-feuille-miam-safe";

type Props = {
  visible: boolean;
  lieuId: number;
  nomLieu: string;
  engage?: boolean;
  avecCompte: boolean;
  onFermer: () => void;
  onMontrerEcran?: () => void;
  onCreerCompte: () => void;
};

const DELAI_FERMETURE_FEUILLE_MS = 450;

function lireCharte({ lecture, engage }: EtatLectureMiamSafeLieu): CharteLueMiamSafe {
  if (lecture === "lue") return engage ? "signee" : "pas-signee";
  return lecture === "en-cours" ? "en-cours" : "inconnue";
}

export function FeuilleMiamSafe({ visible, lieuId, nomLieu, avecCompte, onFermer, onCreerCompte }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_MIAM_SAFE_AIDE_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const { cle, alerte, aRelire } = utiliserSuiviAlerteMiamSafe(lieuId, visible && avecCompte);
  const etatLieu = utiliserEtatMiamSafeLieu(lieuId);
  const charte = lireCharte(etatLieu);
  const { lecture, relire } = etatLieu;
  const { vue, renvoi, aller, renvoyer } = utiliserVueFeuilleMiamSafe(visible, alerte);

  useEffect(() => {
    if (visible && lecture === "ratee") relire();
  }, [visible, lecture, relire]);

  const ouvrirApresFermeture = (chemin: Href) => {
    onFermer();
    setTimeout(() => router.push(chemin), DELAI_FERMETURE_FEUILLE_MS);
  };

  const texteEcranEnClair = lierPonctuation(T.ecranEnClair[charte]);
  const souciEquipe = lierPonctuation(T.souciEquipe);

  if (!avecCompte) {
    return (
      <FeuilleSecoursMiamSafe
        visible={visible}
        nomLieu={nomLieu}
        texteComptoir={texteEcranEnClair}
        onFermer={onFermer}
        onMontrerEcran={() => ouvrirApresFermeture("/miam-safe/comptoir" as Href)}
        onCreerCompte={onCreerCompte}
      />
    );
  }

  return (
    <FeuilleBas
      visible={visible}
      titre={T.titres[vue]}
      sousTitre={vue === "choix" ? T.sousTitreChoix(nomLieu) : undefined}
      onFermer={onFermer}
      pied={vue === "choix" ? <Bouton libelle={T.fermer} variante="blanc" onPress={onFermer} /> : <Bouton libelle={T.retour} variante="blanc" onPress={() => aller("choix")} />}
    >
      {vue === "choix" ? <ChoixAideMiamSafe charte={charte} alerte={alerte} aRelire={aRelire} onChoisir={aller} /> : null}
      {vue === "pote" ? (
        <PrevenirPoteMiamSafe
          lieuId={lieuId}
          nomLieu={nomLieu}
          onOuvrirPartage={(partageId, telephones) => {
            onFermer();
            router.push((telephones === null ? `/miam-safe/partage/${partageId}` : `/miam-safe/partage/${partageId}?telephones=${telephones}`) as Href);
          }}
        />
      ) : null}
      {vue === "alerte" ? (
        <AlerteComptoirMiamSafe
          lieuId={lieuId}
          cle={cle}
          alerte={alerte}
          aRelire={aRelire}
          renvoi={renvoi}
          onRenvoyer={renvoyer}
          onPrevenirPote={() => aller("pote")}
        />
      ) : null}
      {vue === "raconter" ? <RaconterMiamSafe lieuId={lieuId} nomLieu={nomLieu} /> : null}
      {vue === "comptoir" && charte === "signee" ? (
        <View className="gap-4">
          <Text className="font-texte text-base leading-6 text-gris">{T.direPhrase}</Text>
          <Text accessibilityLanguage="fr-FR" className="font-titre-gras text-3xl text-encre">
            {lierPonctuation(citer(PHRASE_MIAM_SAFE, langue))}
          </Text>
          {T.prononciationPhrase ? <Text className="font-texte-semi text-base leading-6 text-encre">{T.prononciationPhrase}</Text> : null}
          {T.sensPhrase ? <Text className="font-texte text-base leading-6 text-gris">{T.sensPhrase}</Text> : null}
          <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(T.pasEnvieDeParler)}</Text>
          {T.traductionConsigneEquipe ? <Text className="font-texte text-sm leading-5 text-gris">{T.traductionConsigneEquipe}</Text> : null}
          <Bouton libelle={T.montrerEcranPersonnel} variante="encre" onPress={() => ouvrirApresFermeture("/miam-safe/comptoir?phrase=1" as Href)} />
          <Text className="font-texte text-sm leading-5 text-gris">{souciEquipe}</Text>
        </View>
      ) : null}
      {vue === "comptoir" && charte !== "signee" ? (
        <View className="gap-4">
          <Text accessibilityLiveRegion="polite" className="font-texte text-base leading-6 text-gris">{texteEcranEnClair}</Text>
          {T.traductionConsigne ? <Text className="font-texte text-sm leading-5 text-gris">{T.traductionConsigne}</Text> : null}
          <Bouton libelle={T.montrerEcranEquipe} variante="encre" onPress={() => ouvrirApresFermeture("/miam-safe/comptoir" as Href)} />
          <Text className="font-texte text-sm leading-5 text-gris">{souciEquipe}</Text>
        </View>
      ) : null}
    </FeuilleBas>
  );
}
