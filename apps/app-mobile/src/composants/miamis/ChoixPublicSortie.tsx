import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, Text, View } from "react-native";

import { peutOrganiserPourPublic } from "@sos-miam/commun/fonctions/sorties-miamis/peut-organiser-pour-public";
import { TRANCHES_AGE } from "@sos-miam/commun/regles/sorties-miamis";
import type { ProfilVisibiliteMiamis, TrancheAge } from "@sos-miam/commun/types/sorties-miamis";
import { Pastille } from "~/composants/interface/Pastille";
import { CHOIX_PUBLICS_SORTIE, NOMS_TRANCHES_AGE, PUBLIC_FERME, TEXTES_ORGANISER, type ChoixPublicSortie as ChoixPublic } from "~/contenus/textes-sorties-miamis";
import { construirePublicSortie } from "~/fonctions/miamis/construire-public-sortie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";

type Props = {
  choix: ChoixPublic;
  tranche: TrancheAge;
  profil: ProfilVisibiliteMiamis;
  onChoisir: (choix: ChoixPublic) => void;
  onChoisirTranche: (tranche: TrancheAge) => void;
};

const estGenre = (choix: ChoixPublic) => choix === "femme" || choix === "homme" || choix === "autre";

export function ChoixPublicSortie({ choix, tranche, profil, onChoisir, onChoisirTranche }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const explication = CHOIX_PUBLICS_SORTIE.find((c) => c.id === choix)?.explication ?? "";
  const ouvert = peutOrganiserPourPublic(construirePublicSortie(choix, tranche), profil);
  const ferme = !ouvert && choix !== "tous" && choix !== "nouveaux" ? PUBLIC_FERME[choix] : null;

  return (
    <View className="gap-3">
      <View accessibilityRole="radiogroup" className="flex-row flex-wrap gap-2">
        {CHOIX_PUBLICS_SORTIE.map((c, i) => (
          <Pastille key={c.id} libelle={c.nom} role="radio" choisi={c.id === choix} position={i + 1} total={CHOIX_PUBLICS_SORTIE.length} onPress={() => onChoisir(c.id)} />
        ))}
      </View>
      {choix === "age" ? (
        <View accessibilityRole="radiogroup" accessibilityLabel={TEXTES_ORGANISER.trancheAge} className="flex-row flex-wrap gap-2">
          {TRANCHES_AGE.map((t, i) => (
            <Pastille key={t} libelle={NOMS_TRANCHES_AGE[t]} role="radio" choisi={t === tranche} position={i + 1} total={TRANCHES_AGE.length} onPress={() => onChoisirTranche(t)} />
          ))}
        </View>
      ) : null}
      <View className="flex-row items-start gap-2.5 rounded-2xl bg-jaune-clair px-3.5 py-3">
        <Ionicons name="eye-outline" size={16} color={couleurs.encre} style={{ marginTop: 2 }} />
        <Text className="flex-1 font-texte text-[13px] leading-5 text-encre">{lierPonctuation(explication)}</Text>
      </View>
      {ferme ? (
        <View className="gap-1 rounded-2xl bg-rose-alerte px-3.5 py-3">
          <Text className="font-texte-semi text-[13px] leading-5 text-rouge-texte">{lierPonctuation(ferme)}</Text>
          {estGenre(choix) && profil.genre === null ? (
            <Pressable accessibilityRole="button" onPress={() => router.push("/reglages/genre")} className="min-h-11 justify-center self-start active:opacity-70">
              <Text className="font-texte-gras text-[13px] text-encre underline">{TEXTES_ORGANISER.choisirGenre}</Text>
            </Pressable>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
