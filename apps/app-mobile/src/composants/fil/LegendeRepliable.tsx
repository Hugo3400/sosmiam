import { useState } from "react";
import { Platform, Pressable, Text, View, type LayoutChangeEvent, type TextLayoutEvent } from "react-native";

type Props = {
  /** Légende déjà mise en forme (lierPonctuation) */
  texte: string;
};

const LIGNES = 2;
const HAUTEUR_LIGNE = 21;
// Place laissée au bout de la deuxième ligne pour « … plus », en caractères (large : la police n'est pas à chasse fixe)
const PLACE_PLUS = 10;
const ombreTexte = { textShadowColor: "rgba(0,0,0,0.5)", textShadowRadius: 6 };
const styleTexte = "font-texte text-[15px] leading-[21px] text-white";

/** Coupe le début de la légende pour que « … plus » tienne au bout de la deuxième ligne, à la fin d'un mot si possible. */
const couper = (debut: string) => {
  const caracteres = Array.from(debut.trimEnd());
  const court = caracteres.slice(0, Math.max(0, caracteres.length - PLACE_PLUS)).join("");
  const espace = court.lastIndexOf(" ");
  return (espace > court.length - 14 && espace > 0 ? court.slice(0, espace) : court).trimEnd();
};

/**
 * La légende d'une publication, coupée sur deux lignes avec « … plus » pour la déplier et « moins » pour la replier.
 * Une copie invisible mesure ses lignes : sur le téléphone on sait où couper ; sur le web (aperçu), qui ne donne pas les lignes, « plus » passe dessous.
 * VoiceOver lit toujours la légende en entier ; quand elle est coupée, c'est un bouton qui la déplie.
 */
export function LegendeRepliable({ texte }: Props) {
  // null : elle tient sur deux lignes (ou n'est pas encore mesurée) ; sinon le texte de ses deux premières lignes ("" sur le web)
  const [deuxLignes, setDeuxLignes] = useState<string | null>(null);
  const [deplie, setDeplie] = useState(false);

  const mesurerLignes = (e: TextLayoutEvent) => {
    const lignes = e.nativeEvent.lines;
    setDeuxLignes(lignes.length > LIGNES ? lignes.slice(0, LIGNES).map((l) => l.text).join("") : null);
  };
  const mesurerHauteur = (e: LayoutChangeEvent) => setDeuxLignes(e.nativeEvent.layout.height > HAUTEUR_LIGNE * LIGNES + 2 ? "" : null);

  const mesure = (
    <Text
      onTextLayout={Platform.OS === "web" ? undefined : mesurerLignes}
      onLayout={Platform.OS === "web" ? mesurerHauteur : undefined}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      pointerEvents="none"
      style={{ position: "absolute", left: 0, right: 0, top: 0, opacity: 0 }}
      className={styleTexte}
    >
      {texte}
    </Text>
  );

  if (deuxLignes === null) {
    return (
      <View>
        {mesure}
        <Text numberOfLines={LIGNES} className={styleTexte} style={ombreTexte}>
          {texte}
        </Text>
      </View>
    );
  }

  return (
    <View>
      {mesure}
      <Pressable
        accessibilityRole="button"
        // Finit par le mot affiché (« plus » ou « moins ») : Commande vocale trouve le bouton
        accessibilityLabel={`${texte}, ${deplie ? "moins" : "plus"}`}
        accessibilityHint={deplie ? "Replie la légende" : "Affiche toute la légende"}
        hitSlop={{ top: 4, bottom: 4 }}
        onPress={() => setDeplie((d) => !d)}
        className="active:opacity-70"
      >
        {deplie ? (
          <Text className={styleTexte} style={ombreTexte}>
            {texte} <Text className="font-texte-gras text-white/90">moins</Text>
          </Text>
        ) : deuxLignes ? (
          <Text numberOfLines={LIGNES} className={styleTexte} style={ombreTexte}>
            {couper(deuxLignes)}… <Text className="font-texte-gras text-white/90">plus</Text>
          </Text>
        ) : (
          <>
            <Text numberOfLines={LIGNES} className={styleTexte} style={ombreTexte}>
              {texte}
            </Text>
            <Text className="font-texte-gras text-[15px] leading-[21px] text-white/90" style={ombreTexte}>
              plus
            </Text>
          </>
        )}
      </Pressable>
    </View>
  );
}
