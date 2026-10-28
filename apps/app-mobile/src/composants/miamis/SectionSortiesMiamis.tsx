import { useRouter } from "expo-router";
import { useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, Text, View } from "react-native";

import { NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE } from "@sos-miam/commun/contenus/etiquettes-officielles";
import type { SortieMiamisApi } from "@sos-miam/commun/types/communaute";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { CarteSortieMiamis } from "~/composants/miamis/CarteSortieMiamis";
import { EtatMiamis } from "~/composants/miamis/EtatMiamis";
import { FiltresSortiesMiamis } from "~/composants/miamis/FiltresSortiesMiamis";
import { TEXTES_ECRANS_MIAMIS_PAR_LANGUE } from "~/contenus/textes-ecrans-miamis";
import { TEXTES_ACCUEIL_MIAMIS_PAR_LANGUE } from "~/contenus/textes-miamis";
import { filtrerSortiesMiamis, type FiltreSortiesMiamis } from "~/fonctions/miamis/filtrer-sorties-miamis";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  sorties: SortieMiamisApi[] | null;
  chargement: boolean;
  envies: string[];
  genreChoisi: boolean;
  enCours: string | null;
  refus: { texte: string; limite: boolean } | null;
  onDemander: (id: string) => void;
  onModifierEnvies: () => void;
};

export function SectionSortiesMiamis({ sorties, chargement, envies, genreChoisi, enCours, refus, onDemander, onModifierEnvies }: Props) {
  const nomsEtiquettes = utiliserTextes(NOMS_ETIQUETTES_OFFICIELLES_PAR_LANGUE);
  const TE = utiliserTextes(TEXTES_ECRANS_MIAMIS_PAR_LANGUE);
  const T = utiliserTextes(TEXTES_ACCUEIL_MIAMIS_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const [filtre, setFiltre] = useState<FiltreSortiesMiamis>({ type: "toutes" });
  const filtrees = sorties ? filtrerSortiesMiamis(sorties, filtre, envies) : [];
  const organiser = () => {
    vibrerLegerement();
    router.push("/potes/miamis/organiser");
  };

  return (
    <View className="gap-3">
      <View className="gap-1.5 px-5">
        <View className="flex-row items-center justify-between gap-3">
          <Text accessibilityRole="header" className="flex-1 font-titre text-[22px] text-encre">
            {T.sortiesTitre}
          </Text>
          <Pressable accessibilityRole="button" accessibilityLabel={TE.organiserLu} hitSlop={8} onPress={organiser} className="min-h-11 justify-center active:opacity-70">
            <Text className="font-texte-gras text-[15px] text-encre underline">{T.organiser}</Text>
          </Pressable>
        </View>
        <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.sortiesIntro)}</Text>
      </View>

      <FiltresSortiesMiamis filtre={filtre} onChoisir={setFiltre} />

      <View className="flex-row items-center justify-between gap-3 px-5">
        <Text numberOfLines={2} className="flex-1 font-texte text-[13px] text-gris">
          {T.tesEnvies}
          <Text className="font-texte-semi text-encre">{envies.length > 0 ? envies.map((nom) => nomsEtiquettes[nom] ?? nom).join(", ") : T.aucuneEnvie}</Text>
        </Text>
        <Pressable accessibilityRole="button" accessibilityLabel={TE.modifierEnviesLu} hitSlop={8} onPress={onModifierEnvies} className="min-h-11 justify-center active:opacity-70">
          <Text className="font-texte-gras text-[13px] text-encre underline">{T.modifierEnvies}</Text>
        </Pressable>
      </View>

      {genreChoisi ? null : (
        <Pressable
          accessibilityRole="button"
          accessibilityHint={T.astuceGenreLien}
          onPress={() => router.push("/reglages/genre")}
          className="mx-5 gap-1 rounded-2xl bg-jaune-clair px-4 py-3 active:opacity-80"
        >
          <Text className="font-texte text-[13px] leading-5 text-encre">{lierPonctuation(T.astuceGenre)}</Text>
          <Text className="font-texte-gras text-[13px] text-encre underline">{T.astuceGenreLien}</Text>
        </Pressable>
      )}

      {refus ? (
        <View className="px-5">
          {refus.limite ? (
            <RefusLimitationEnPlace texte={refus.texte} />
          ) : (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(refus.texte)}</Text>
          )}
        </View>
      ) : null}

      {sorties === null ? (
        chargement ? <ActivityIndicator color={couleurs.encre} style={{ paddingVertical: 24 }} accessibilityLabel={TE.chargementSorties} /> : null
      ) : sorties.length === 0 ? (
        <View className="px-5">
          <EtatMiamis emoji="🧭" titre={T.aucuneSortieTitre} texte={T.aucuneSortieTexte} action={{ libelle: T.organiserBouton, onPress: organiser }} />
        </View>
      ) : filtrees.length === 0 ? (
        <Text className="mx-5 rounded-2xl border-2 border-dashed border-gris/50 px-4 py-4 text-center font-texte text-sm leading-5 text-encre">
          {lierPonctuation(filtre.type === "envies" && envies.length === 0 ? T.aucuneEnvieChoisie : T.aucuneSortie)}
        </Text>
      ) : (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-3 px-5 pb-1">
          {filtrees.map((s) => (
            <CarteSortieMiamis key={s.id} sortie={s} envies={envies} envoi={enCours === `venir-${s.id}`} onDemander={() => onDemander(s.id)} />
          ))}
        </ScrollView>
      )}
    </View>
  );
}
