import { Platform, Pressable, Text, View } from "react-native";

import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

export type OngletFil = "tous" | "sos";

type Props = {
  onglet: OngletFil;
  onChoisir: (onglet: OngletFil) => void;
  /** Rescousses qu'il reste à donner cette semaine */
  restantes: number;
  /** Marge du haut (zone sûre) */
  haut: number;
  /** Visite sans compte : la pastille « 👀 Visite · Crée ton compte » remplace le compteur de rescousses */
  invite: boolean;
  /** Touché sur la pastille de visite : ouvre la feuille « Crée ton compte » */
  onCreerCompte: () => void;
};

/** Hauteur de l'en-tête sous la zone sûre : 6 (marge) + 44 (onglets) + 8 (marge du bas) ; ce qui est posé dessous commence après */
export const HAUTEUR_ENTETE_FIL = 58;
/** En visite, la pastille se pose sous les onglets (sur un iPhone SE, elle ne tiendrait pas à côté) : 36 (pastille) + 8 (marge du bas) en plus */
export const HAUTEUR_PASTILLE_VISITE = 44;

// « lu » : le nom de l'onglet pour le lecteur d'écran, sans emoji
const onglets: { cle: OngletFil; libelle: string; lu: string }[] = [
  { cle: "tous", libelle: "Pour toi", lu: "Pour toi" },
  { cle: "sos", libelle: "SOS ce soir 🔥", lu: "SOS ce soir" },
];

/**
 * En-tête posé sur le fil : rescousses restantes, et les deux fils (« Pour toi », « SOS ce soir »).
 * En visite sans compte, pas de rescousses à compter : une pastille jaune, sous les onglets, propose de créer son compte.
 */
export function EnTeteFil({ onglet, onChoisir, restantes, haut, invite, onCreerCompte }: Props) {
  return (
    // La bande des onglets arrête le doigt (comme toujours) ; sous elle, seule la pastille : à côté, on touche toujours la vidéo
    <View pointerEvents="box-none" className="absolute inset-x-0 top-0">
      <View style={{ paddingTop: haut + 6 }} className="flex-row items-center px-4 pb-2">
        <View className="w-16">
          {invite ? null : (
            <View
              accessible
              accessibilityLabel={`Il te reste ${restantes} rescousse${restantes > 1 ? "s" : ""} cette semaine`}
              className="flex-row items-center gap-1 self-start rounded-full bg-black/30 px-2.5 py-1.5"
            >
              <Text className="text-base">🛟</Text>
              <Text className="font-texte-gras text-base text-white">{restantes}</Text>
            </View>
          )}
        </View>
        <View accessibilityRole="tablist" className="flex-1 flex-row justify-center gap-5">
          {onglets.map(({ cle, libelle, lu }, i) => {
            const actif = cle === onglet;
            // iOS ne connaît pas le rôle « onglet » (VoiceOver le lirait comme du texte) : bouton, avec la position dans le libellé
            return (
              <Pressable
                key={cle}
                accessibilityRole={Platform.OS === "ios" ? "button" : "tab"}
                accessibilityLabel={Platform.OS === "ios" ? `${lu}, onglet ${i + 1} sur ${onglets.length}` : lu}
                accessibilityState={{ selected: actif }}
                hitSlop={8}
                onPress={() => onChoisir(cle)}
                className={`min-h-11 justify-center border-b-[3px] ${actif ? "border-jaune" : "border-transparent"}`}
              >
                <Text
                  className={`font-texte-gras text-base ${actif ? "text-white" : "text-white/65"}`}
                  style={{ textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 4 }}
                >
                  {libelle}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <View className="w-16" />
      </View>
      {invite ? (
        <View pointerEvents="box-none" className="items-center px-4 pb-2">
          {/* Jaune plein, bord noir : lisible sur n'importe quelle vidéo. 36 pt à l'écran, 44 pt sous le doigt (vers le bas : le haut reste aux onglets) */}
          <Pressable
            accessibilityRole="button"
            // Commence par le mot affiché : Commande vocale trouve la pastille (« Toucher Visite »)
            accessibilityLabel="Visite sans compte. Crée ton compte"
            accessibilityHint="Une minute, et à toi les rescousses, les J'aime et les commentaires"
            hitSlop={{ top: 0, bottom: 8, left: 8, right: 8 }}
            onPress={() => {
              vibrerLegerement();
              onCreerCompte();
            }}
            className="h-9 flex-row items-center rounded-full border-2 border-encre bg-jaune px-3.5 active:opacity-80"
          >
            <Text numberOfLines={1} maxFontSizeMultiplier={1.2} className="font-texte-semi text-[13px] text-encre">
              👀 Visite · <Text className="font-texte-gras">Crée ton compte</Text>
            </Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}
