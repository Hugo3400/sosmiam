import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import type { PorteeExplorer } from "~/contenus/portee-explorer";
import { TEXTES_EXPLORER_PAR_LANGUE } from "~/contenus/textes-explorer";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  fauteDeDepart: boolean;
  portee: PorteeExplorer | null;
  region: string | null;
  ouOnRegarde: string | null;
  motRecherche: string;
  avecFiltres: boolean;
  onAutourDeMoi: () => void;
  onChoisirPortee: (portee: PorteeExplorer) => void;
  onEffacer: (aussiLaRecherche: boolean) => void;
};

type Elargissement = { portee: PorteeExplorer; libelle: string };
type TextesVide = (typeof TEXTES_EXPLORER_PAR_LANGUE)["fr"]["vide"];

function proposerElargissement(V: TextesVide, portee: PorteeExplorer | null, region: string | null): Elargissement | null {
  if (portee === "proche") return region ? { portee: "region", libelle: V.voirRegion } : { portee: "france", libelle: V.voirFrance };
  if (portee === "region") return { portee: "france", libelle: V.voirFrance };
  return null;
}

function conseillerSansFiltre(V: TextesVide, portee: PorteeExplorer | null, region: string | null): string {
  if (portee === "proche") return V.personneRayon(region !== null && region !== "");
  if (portee === "region") return V.personneRegion;
  return V.aucunLieu;
}

function conseiller(V: TextesVide, motRecherche: string, avecFiltres: boolean, sansFiltre: string): string {
  if (motRecherche) return avecFiltres ? V.rienRechercheFiltres(motRecherche) : V.rienRecherche(motRecherche);
  return avecFiltres ? V.rienFiltres : sansFiltre;
}

export function VideExplorer(props: Props) {
  const { fauteDeDepart, portee, region, ouOnRegarde, motRecherche, avecFiltres, onEffacer } = props;
  const T = utiliserTextes(TEXTES_EXPLORER_PAR_LANGUE);
  const V = T.vide;

  if (fauteDeDepart) {
    return (
      <View className="items-center gap-3 px-6 py-6">
        <Mascotte expression="surprise" taille={96} />
        <Text className="text-center font-titre text-xl text-encre">{lierPonctuation(V.ouEsTu)}</Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation(V.ouEsTuTexte)}
        </Text>
        <Bouton libelle={T.autourDeMoi.libelle} indice={V.autourDeMoiIndice} petit onPress={props.onAutourDeMoi} />
        <Bouton libelle={V.voirFrance} variante="blanc" petit onPress={() => props.onChoisirPortee("france")} />
      </View>
    );
  }

  const elargir = proposerElargissement(V, portee, region);
  const conseil = conseiller(V, motRecherche, avecFiltres, conseillerSansFiltre(V, portee, region));
  const effacement = motRecherche ? (
    avecFiltres ? (
      <Bouton libelle={V.toutEffacer} indice={V.toutEffacerIndice} variante="blanc" petit onPress={() => onEffacer(true)} />
    ) : (
      <Bouton libelle={T.recherche.effacer} variante="blanc" petit onPress={() => onEffacer(true)} />
    )
  ) : avecFiltres ? (
    <Bouton libelle={T.effacerFiltres} variante="blanc" petit onPress={() => onEffacer(false)} />
  ) : null;

  return (
    <View className="items-center gap-3 px-6 py-6">
      <Mascotte expression="surprise" taille={96} />
      <Text className="text-center font-titre text-xl text-encre">{V.rienParIci}</Text>
      {elargir && ouOnRegarde ? <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(V.tuRegardes(ouOnRegarde))}</Text> : null}
      {elargir ? <Bouton libelle={elargir.libelle} petit onPress={() => props.onChoisirPortee(elargir.portee)} /> : null}
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(conseil)}</Text>
      {effacement}
    </View>
  );
}
