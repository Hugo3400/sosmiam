import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { Mascotte } from "~/composants/marque/Mascotte";
import type { PorteeExplorer } from "~/contenus/portee-explorer";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

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

function proposerElargissement(portee: PorteeExplorer | null, region: string | null): Elargissement | null {
  if (portee === "proche") return region ? { portee: "region", libelle: "Voir toute ta région" } : { portee: "france", libelle: "Voir toute la France" };
  if (portee === "region") return { portee: "france", libelle: "Voir toute la France" };
  return null;
}

function conseillerSansFiltre(portee: PorteeExplorer | null, region: string | null): string {
  if (portee === "proche") {
    return `Personne dans ce rayon pour l'instant : pousse le curseur ou regarde ${region ? "ta région" : "toute la France"}, la bonne table n'est sûrement pas loin !`;
  }
  if (portee === "region") return "Personne dans ta région pour l'instant : jette un œil à toute la France, la bonne table t'attend peut-être ailleurs !";
  return "Aucun lieu à te montrer pour l'instant : repasse un peu plus tard, le Capitaine Bouiboui est sur le pont !";
}

function conseiller(motRecherche: string, avecFiltres: boolean, sansFiltre: string): string {
  if (motRecherche) {
    return avecFiltres
      ? `Rien pour « ${motRecherche} » avec ces filtres : essaie un autre mot ou élargis un peu !`
      : `Rien pour « ${motRecherche} » : essaie un autre mot, la bonne table n'est sûrement pas loin !`;
  }
  return avecFiltres ? "Aucun lieu avec ces filtres : élargis un peu, la bonne table n'est sûrement pas loin !" : sansFiltre;
}

export function VideExplorer(props: Props) {
  const { fauteDeDepart, portee, region, ouOnRegarde, motRecherche, avecFiltres, onEffacer } = props;

  if (fauteDeDepart) {
    return (
      <View className="items-center gap-3 px-6 py-6">
        <Mascotte expression="surprise" taille={96} />
        <Text className="text-center font-titre text-xl text-encre">{lierPonctuation("Tu es où ?")}</Text>
        <Text className="text-center font-texte text-base leading-6 text-gris">
          {lierPonctuation("On ne sait pas où tu es : touche « Autour de moi » ou choisis une ville en haut, et on te trouve de bonnes tables à côté !")}
        </Text>
        <Bouton libelle="Autour de moi" indice="Demande ta position pour voir les lieux autour de toi" petit onPress={props.onAutourDeMoi} />
        <Bouton libelle="Voir toute la France" variante="blanc" petit onPress={() => props.onChoisirPortee("france")} />
      </View>
    );
  }

  const elargir = proposerElargissement(portee, region);
  const conseil = conseiller(motRecherche, avecFiltres, conseillerSansFiltre(portee, region));
  const effacement = motRecherche ? (
    avecFiltres ? (
      <Bouton libelle="Tout effacer" indice="Efface la recherche et les filtres" variante="blanc" petit onPress={() => onEffacer(true)} />
    ) : (
      <Bouton libelle="Effacer la recherche" variante="blanc" petit onPress={() => onEffacer(true)} />
    )
  ) : avecFiltres ? (
    <Bouton libelle="Effacer les filtres" variante="blanc" petit onPress={() => onEffacer(false)} />
  ) : null;

  return (
    <View className="items-center gap-3 px-6 py-6">
      <Mascotte expression="surprise" taille={96} />
      <Text className="text-center font-titre text-xl text-encre">Rien par ici…</Text>
      {elargir && ouOnRegarde ? <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(`Tu regardes ${ouOnRegarde}.`)}</Text> : null}
      {elargir ? <Bouton libelle={elargir.libelle} petit onPress={() => props.onChoisirPortee(elargir.portee)} /> : null}
      <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(conseil)}</Text>
      {effacement}
    </View>
  );
}
