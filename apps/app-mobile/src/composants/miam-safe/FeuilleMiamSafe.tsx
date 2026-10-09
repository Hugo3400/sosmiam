import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { PHRASE_MIAM_SAFE } from "@sos-miam/commun/regles/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleBas } from "~/composants/interface/FeuilleBas";
import { AlerteComptoirMiamSafe } from "~/composants/miam-safe/AlerteComptoirMiamSafe";
import { ChoixAideMiamSafe, type VueAideMiamSafe } from "~/composants/miam-safe/ChoixAideMiamSafe";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { PrevenirPoteMiamSafe } from "~/composants/miam-safe/PrevenirPoteMiamSafe";
import { RaconterMiamSafe } from "~/composants/miam-safe/RaconterMiamSafe";

type Props = {
  visible: boolean;
  nomLieu: string;
  /** Le lieu a signé la charte Miam Safe */
  engage: boolean;
  /** Sans compte : seulement les secours, et de quoi créer un compte pour le reste */
  avecCompte: boolean;
  onFermer: () => void;
  /** « Montrer l'écran au personnel » : la feuille se referme et l'écran discret s'ouvre en grand */
  onMontrerEcran: () => void;
  /** Sans compte, « Créer mon compte » : la feuille se referme, puis la feuille d'inscription s'ouvre */
  onCreerCompte: () => void;
};

type Vue = "choix" | VueAideMiamSafe;

const TITRES: Record<Vue, string> = {
  choix: "Miam Safe",
  pote: "Prévenir un pote",
  comptoir: "Demander au comptoir",
  alerte: "Alerter le comptoir",
  raconter: "Raconte-nous",
};

/**
 * La feuille Miam Safe, depuis la fiche d'un lieu : les secours d'abord (même sans compte), puis prévenir un pote, demander
 * au comptoir (phrase ou écran), l'alerte silencieuse (lieux Miam Safe seulement) et raconter après coup.
 * Ton doux et sérieux : pas de blague ici.
 */
export function FeuilleMiamSafe({ visible, nomLieu, engage, avecCompte, onFermer, onMontrerEcran, onCreerCompte }: Props) {
  const [vue, setVue] = useState<Vue>("choix");

  // Chaque ouverture repart du début
  useEffect(() => {
    if (visible) setVue("choix");
  }, [visible]);

  if (!avecCompte) {
    return (
      <FeuilleBas
        visible={visible}
        titre="Miam Safe"
        sousTitre={`${nomLieu} · on est là.`}
        onFermer={onFermer}
        pied={
          <>
            <Bouton libelle="Créer mon compte" variante="encre" indice="Pour prévenir un pote, alerter le comptoir ou nous raconter ce qui s'est passé" onPress={onCreerCompte} />
            <Bouton libelle="Fermer" variante="blanc" onPress={onFermer} />
          </>
        }
      >
        <NumerosUrgence />
        <Text className="font-texte text-base leading-6 text-gris">
          Prévenir un pote, alerter le comptoir ou nous raconter ce qui s'est passé demande un compte : c'est ce qui nous permet de prendre chaque alerte au sérieux.
        </Text>
      </FeuilleBas>
    );
  }

  return (
    <FeuilleBas
      visible={visible}
      titre={TITRES[vue]}
      sousTitre={vue === "choix" ? `${nomLieu} · on est là, prends ton temps.` : undefined}
      onFermer={onFermer}
      pied={vue === "choix" ? <Bouton libelle="Fermer" variante="blanc" onPress={onFermer} /> : <Bouton libelle="Retour" variante="blanc" onPress={() => setVue("choix")} />}
    >
      {vue === "choix" ? <ChoixAideMiamSafe engage={engage} onChoisir={setVue} /> : null}
      {vue === "pote" ? <PrevenirPoteMiamSafe nomLieu={nomLieu} /> : null}
      {vue === "alerte" ? <AlerteComptoirMiamSafe onPrevenirPote={() => setVue("pote")} /> : null}
      {vue === "raconter" ? <RaconterMiamSafe nomLieu={nomLieu} /> : null}
      {vue === "comptoir" ? (
        <View className="gap-4">
          <Text className="font-texte text-base leading-6 text-gris">Dis cette phrase à quelqu'un de l'équipe. Elle ne veut rien dire pour les autres.</Text>
          <Text className="font-titre-gras text-3xl text-encre">« {PHRASE_MIAM_SAFE} »</Text>
          <Text className="font-texte text-base leading-6 text-gris">Pas envie de parler ? Montre l'écran : il est sombre et discret, la consigne n'est écrite qu'en petit.</Text>
          <Bouton libelle="Montrer l'écran au personnel" variante="encre" onPress={onMontrerEcran} />
        </View>
      ) : null}
    </FeuilleBas>
  );
}
