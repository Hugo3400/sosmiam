import type { ReactNode } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { ChevronPliable } from "~/composants/interface/ChevronPliable";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { enchainerPhrases } from "~/fonctions/texte/enchainer-phrases";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserSectionDepliee } from "~/hooks/utiliser-section-depliee";
import type { IdSectionPliable } from "~/stockage/sections-depliees";

type Compteur = {
  texte: string;
  lu: string;
};

type Props = {
  section: IdSectionPliable;
  titre: string;
  sousTitre?: string;
  resume?: string[];
  compteur?: Compteur;
  pliable?: boolean;
  apercu?: ReactNode;
  children: ReactNode;
};

const surIphone = Platform.OS === "ios";

export function SectionPliable({ section, titre, sousTitre, resume, compteur, pliable = true, apercu, children }: Props) {
  const { deplie, basculer } = utiliserSectionDepliee(section);
  const ouvert = !pliable || deplie;
  const lignes = !ouvert && resume ? resume : sousTitre ? [sousTitre] : [];
  const textesLignes = lignes.map((ligne, i) => (
    <Text key={i} className={i === 0 ? "font-texte text-sm text-gris" : "font-texte-semi text-sm leading-5 text-encre"}>
      {lierPonctuation(ligne)}
    </Text>
  ));
  const valeurCompteur = compteur ? (
    <Text accessibilityLabel={compteur.lu} className="font-texte-semi text-sm text-gris">
      {compteur.texte}
    </Text>
  ) : null;

  if (!pliable) {
    return (
      <View className="gap-3">
        <View className="flex-row items-baseline justify-between gap-3">
          <View className="flex-1">
            <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">{titre}</Text>
            {textesLignes}
          </View>
          {valeurCompteur}
        </View>
        {children}
      </View>
    );
  }

  const lu = enchainerPhrases([titre, surIphone ? (deplie ? "déplié" : "plié") : null, ...lignes.map(retirerEmoji), compteur?.lu]);
  const toucher = () => {
    vibrerLegerement();
    const maintenant = basculer();
    annoncerLecteurEcran(`${titre}, ${maintenant ? "déplié" : "plié"}`);
  };

  return (
    <View className="gap-3">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={lu}
        accessibilityHint={deplie ? "Touche pour plier" : "Touche pour déplier"}
        accessibilityState={surIphone ? undefined : { expanded: deplie }}
        onPress={toucher}
        className="min-h-11 flex-row items-center gap-3 active:opacity-70"
      >
        <View className="flex-1">
          <Text className="font-titre-gras text-xl text-encre">{titre}</Text>
          {textesLignes}
        </View>
        {valeurCompteur}
        <ChevronPliable deplie={deplie} />
      </Pressable>
      {deplie ? children : apercu}
    </View>
  );
}
