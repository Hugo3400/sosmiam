import { Text, View } from "react-native";

import { accorder } from "@sos-miam/commun/fonctions/langue/accorder";
import type { Visite } from "@sos-miam/commun/types/visite";
import { TEXTES_MES_VISITES_PAR_LANGUE } from "~/contenus/textes-mes-visites";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Toutes tes visites : seules les validées sont comptées */
  visites: readonly Visite[];
};

type Chiffre = { cle: string; valeur: number; singulier: string; pluriel: string };

type PetitsMots = typeof TEXTES_MES_VISITES_PAR_LANGUE.fr.petitsMots;

/** Un petit mot selon le nombre de visites validées : on encourage, on ne compare jamais */
function choisirPetitMot(nombre: number, petitsMots: PetitsMots): string {
  if (nombre <= 1) return petitsMots.debut;
  if (nombre < 5) return petitsMots.pli;
  if (nombre < 10) return petitsMots.reconnu;
  return petitsMots.quartier;
}

/**
 * En tête de « Mes visites » : « 12 visites, 7 lieux, 3 villes » (visites validées seulement), les points qu'elles
 * t'ont rapportés et un petit mot qui encourage. Lu d'une traite par VoiceOver.
 */
export function EnTeteMesVisites({ visites }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_MES_VISITES_PAR_LANGUE);
  const validees = visites.filter((v) => v.statut === "validee");
  const lieux = new Set(validees.map((v) => v.lieu.id)).size;
  const villes = new Set(validees.map((v) => v.lieu.ville.trim().toLocaleLowerCase("fr-FR"))).size;
  const points = validees.reduce((total, v) => total + v.points, 0);
  const chiffres: Chiffre[] = [
    { cle: "visites", valeur: validees.length, ...T.chiffres.visites },
    { cle: "lieux", valeur: lieux, ...T.chiffres.lieux },
    { cle: "villes", valeur: villes, ...T.chiffres.villes },
  ];
  const accorderChiffre = (c: Chiffre) => accorder(c.valeur, langue, c.singulier, c.pluriel);
  const nommer = (c: Chiffre) => `${c.valeur} ${accorderChiffre(c)}`;
  const petitMot = choisirPetitMot(validees.length, T.petitsMots);
  const phrasePoints = points > 0 ? T.phrasePoints(points) : "";
  const libelle = `${T.resumeLu(nommer(chiffres[0]), validees.length, nommer(chiffres[1]), nommer(chiffres[2]))}${phrasePoints} ${petitMot}`;

  return (
    <View accessible accessibilityLabel={libelle} className="gap-3 rounded-carte border-2 border-encre bg-jaune p-4">
      <View className="flex-row">
        {chiffres.map((c, i) => (
          <View key={c.cle} className={`flex-1 items-center px-1 ${i > 0 ? "border-l-2 border-nuit/15" : ""}`}>
            <Text className="font-titre text-3xl text-nuit">{c.valeur}</Text>
            <Text className="font-texte-semi text-sm text-nuit">{accorderChiffre(c)}</Text>
          </View>
        ))}
      </View>
      <View className="flex-row items-center gap-2 rounded-2xl bg-white/70 px-3 py-2">
        <Text className="text-base">{points > 0 ? "⭐" : "🌱"}</Text>
        <Text className="flex-1 font-texte text-[13px] leading-[18px] text-nuit">
          {points > 0 ? <Text className="font-texte-gras">{T.pointsGagnes(points)}</Text> : null}
          {lierPonctuation(petitMot)}
        </Text>
      </View>
    </View>
  );
}
