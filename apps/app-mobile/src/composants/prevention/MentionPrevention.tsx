import { Linking, Pressable, Text, View } from "react-native";

import { ALCOOL_INFO_SERVICE, MESSAGE_SANITAIRE_ALCOOL } from "@sos-miam/commun/contenus/prevention-alcool";
import { TEXTES_PREVENTION_PAR_LANGUE } from "~/contenus/textes-prevention";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /**
   * « bloc » : encadré avec le service d'aide (téléphone et site) ; « ligne » : une ligne discrète et « Besoin d'aide ? » ;
   * « sur-image » : la même ligne en clair, posée sur une vidéo ou une photo (fil) ; « courte » : le message seul, sans lien,
   * pour l'intérieur d'un bouton (une carte de fidélité qu'on touche).
   */
  variante?: "bloc" | "ligne" | "sur-image" | "courte";
};

const ouvrir = (adresse: string) => Linking.openURL(adresse).catch(() => {});
const ombreTexte = { textShadowColor: "rgba(0,0,0,0.6)", textShadowOffset: { width: 0, height: 1 }, textShadowRadius: 3 };
const SITE_AFFICHE = ALCOOL_INFO_SERVICE.site.replace(/^https:\/\/www\./, "");

/**
 * Le message sanitaire de la loi Évin, mot pour mot (formule imposée, jamais au tutoiement), à côté de tout ce qui parle
 * d'alcool dans l'app : fiche d'un bar ou d'un lieu qui en sert, carte avec des boissons alcoolisées, publication, offre ou
 * récompense qui en parle. Avec le service d'aide Alcool Info Service (appel anonyme et non surtaxé).
 */
export function MentionPrevention({ variante = "ligne" }: Props) {
  const T = utiliserTextes(TEXTES_PREVENTION_PAR_LANGUE);
  const traduction = T.traductionMessageSanitaire;
  const langueMessage = traduction ? "fr-FR" : undefined;

  if (variante === "bloc") {
    return (
      <View className="gap-2 rounded-carte border-2 border-ligne bg-carte px-4 py-3">
        <Text accessibilityLanguage={langueMessage} className="font-texte-semi text-sm leading-5 text-encre">{MESSAGE_SANITAIRE_ALCOOL}</Text>
        {traduction ? <Text className="font-texte-semi text-sm leading-5 text-encre">{traduction}</Text> : null}
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{T.besoinDEnParler(ALCOOL_INFO_SERVICE.nom)}</Text>
        <View className="flex-row flex-wrap gap-2">
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={T.appelerLu(ALCOOL_INFO_SERVICE.nom, ALCOOL_INFO_SERVICE.telephone)}
            onPress={() => ouvrir(ALCOOL_INFO_SERVICE.lienTelephone)}
            className="min-h-11 flex-row items-center rounded-full border-2 border-encre bg-carte px-3.5 active:opacity-80"
          >
            <Text className="font-texte-gras text-[13px] text-encre">📞 {T.telephone(ALCOOL_INFO_SERVICE.telephone)}</Text>
          </Pressable>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={T.ouvrirSiteLu(ALCOOL_INFO_SERVICE.nom)}
            onPress={() => ouvrir(ALCOOL_INFO_SERVICE.site)}
            className="min-h-11 flex-row items-center rounded-full border-2 border-encre bg-carte px-3.5 active:opacity-80"
          >
            <Text className="font-texte-gras text-[13px] text-encre">{SITE_AFFICHE}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (variante === "courte") {
    if (!traduction) return <Text className="font-texte text-[11px] leading-[15px] text-gris">{MESSAGE_SANITAIRE_ALCOOL}</Text>;
    return (
      <View>
        <Text accessibilityLanguage={langueMessage} className="font-texte text-[11px] leading-[15px] text-gris">{MESSAGE_SANITAIRE_ALCOOL}</Text>
        <Text className="font-texte text-[11px] leading-[15px] text-gris">{traduction}</Text>
      </View>
    );
  }

  const surImage = variante === "sur-image";
  const classeMessage = `font-texte text-[12px] leading-4 ${surImage ? "text-white/90" : "text-gris"}`;
  const styleMessage = [{ flexShrink: 1 }, surImage ? ombreTexte : null];
  return (
    <View className="flex-row flex-wrap items-center gap-x-2">
      {/* flexShrink : dans une rangée, le texte revient à la ligne au lieu de déborder */}
      <Text accessibilityLanguage={langueMessage} className={classeMessage} style={styleMessage}>
        {MESSAGE_SANITAIRE_ALCOOL}
      </Text>
      {traduction ? (
        <Text className={classeMessage} style={styleMessage}>
          {traduction}
        </Text>
      ) : null}
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={T.besoinDAideLu(ALCOOL_INFO_SERVICE.nom)}
        hitSlop={10}
        onPress={() => ouvrir(ALCOOL_INFO_SERVICE.site)}
        className="active:opacity-70"
      >
        <Text className={`font-texte-semi text-[12px] leading-4 underline ${surImage ? "text-white" : "text-encre"}`} style={surImage ? ombreTexte : undefined}>
          {T.besoinDAide}
        </Text>
      </Pressable>
    </View>
  );
}
