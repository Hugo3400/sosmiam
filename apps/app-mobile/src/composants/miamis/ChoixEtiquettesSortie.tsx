import { useState } from "react";
import { Pressable, Text, View } from "react-native";

import { FAMILLES_ETIQUETTES } from "@sos-miam/commun/contenus/etiquettes-officielles";
import { normaliserEtiquette } from "@sos-miam/commun/fonctions/etiquettes/normaliser-etiquette";
import { MAX_ETIQUETTES_SORTIE_MIAMIS } from "@sos-miam/commun/regles/sorties-miamis";
import type { FamilleEtiquette } from "@sos-miam/commun/types/etiquette";
import type { EtiquetteSortieMiamis } from "@sos-miam/commun/types/sorties-miamis";
import { ChampEtiquetteLibre } from "~/composants/miamis/ChampEtiquetteLibre";
import { FamilleEtiquettesDepliable } from "~/composants/miamis/FamilleEtiquettesDepliable";
import { TEXTES_ORGANISER } from "~/contenus/textes-sorties-miamis";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  etiquettes: EtiquetteSortieMiamis[];
  onChanger: (etiquettes: EtiquetteSortieMiamis[]) => void;
  erreur?: string | null;
};

export function ChoixEtiquettesSortie({ etiquettes, onChanger, erreur }: Props) {
  const [ouverte, setOuverte] = useState<FamilleEtiquette | null>("assiette");
  const plein = etiquettes.length >= MAX_ETIQUETTES_SORTIE_MIAMIS;
  const noms = etiquettes.map((e) => e.nom);
  const libres = etiquettes.filter((e) => !e.officielle);

  function basculer(nom: string) {
    if (noms.includes(nom)) return onChanger(etiquettes.filter((e) => e.nom !== nom));
    if (!plein) onChanger([...etiquettes, { nom, officielle: true }]);
  }

  function ajouter(etiquette: EtiquetteSortieMiamis) {
    if (plein || etiquettes.some((e) => normaliserEtiquette(e.nom) === normaliserEtiquette(etiquette.nom))) return;
    onChanger([...etiquettes, etiquette]);
  }

  return (
    <View className="gap-3">
      <View className="flex-row items-baseline justify-between">
        <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">{lierPonctuation(TEXTES_ORGANISER.etiquettesIntro)}</Text>
        <Text className="ml-3 font-texte-gras text-xs text-gris">{`${etiquettes.length} / ${MAX_ETIQUETTES_SORTIE_MIAMIS}`}</Text>
      </View>
      {FAMILLES_ETIQUETTES.map((famille) => (
        <FamilleEtiquettesDepliable
          key={famille.id}
          famille={famille}
          ouverte={ouverte === famille.id}
          onOuvrir={() => setOuverte(ouverte === famille.id ? null : famille.id)}
          choisies={noms}
          onBasculer={basculer}
          plein={plein}
        />
      ))}
      {plein ? <Text className="font-texte-semi text-xs text-gris">{lierPonctuation(TEXTES_ORGANISER.etiquettesPleines(MAX_ETIQUETTES_SORTIE_MIAMIS))}</Text> : null}
      <ChampEtiquetteLibre plein={plein} onAjouter={ajouter} />
      {libres.length > 0 ? (
        <View className="flex-row flex-wrap gap-2">
          {libres.map((e) => (
            <Pressable
              key={e.nom}
              accessibilityRole="button"
              accessibilityLabel={TEXTES_ORGANISER.retirerLibre(e.nom)}
              onPress={() => onChanger(etiquettes.filter((x) => x.nom !== e.nom))}
              className="min-h-11 flex-row items-center gap-1 rounded-full border-2 border-dashed border-encre bg-jaune px-3.5 active:opacity-80"
            >
              <Text className="font-texte-semi text-[13px] text-nuit">{`${e.nom} ×`}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
      {erreur ? <Text className="font-texte-semi text-sm text-rouge-texte">{lierPonctuation(erreur)}</Text> : null}
    </View>
  );
}
