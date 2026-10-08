import { LinearGradient } from "expo-linear-gradient";
import { useEffect, useRef, useState } from "react";
import { Platform, Pressable, ScrollView, Text, View, useWindowDimensions } from "react-native";

import { BoutonNotifications } from "~/composants/notifications/BoutonNotifications";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";

export type OngletFil = "abonnements" | "tous" | "sos";

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

// « lu » : le nom de l'onglet pour le lecteur d'écran, sans emoji ; « court » : sur un écran étroit ; « mini » : sur un tout petit écran
const onglets: { cle: OngletFil; libelle: string; court?: string; mini?: string; lu: string }[] = [
  { cle: "abonnements", libelle: "Abonnements", mini: "Suivis", lu: "Abonnements" },
  { cle: "tous", libelle: "Pour toi", lu: "Pour toi" },
  { cle: "sos", libelle: "SOS ce soir 🔥", court: "SOS 🔥", lu: "SOS ce soir" },
];

// En dessous (en points, divisés par la taille de texte choisie), « SOS ce soir 🔥 » ne tient pas à côté des deux autres onglets,
// de la bouée et de la cloche : « SOS 🔥 » (même un iPhone Pro Max, 430 pt, est trop étroit pour le libellé long)
const LARGEUR_LIBELLES_LONGS = 450;
// En dessous (iPhone SE, mini zoomé, ou texte un cran plus grand sur 375 pt), « Abonnements » devient « Suivis » et les onglets se
// rapprochent : les trois tiennent encore à côté de la bouée et de la cloche
const LARGEUR_MINI = 360;
// Au-delà, le texte des onglets dépasserait la bande de 44 pt (les onglets, eux, défilent s'ils sont trop larges)
const AGRANDISSEMENT_MAX = 1.4;
// La pastille 🛟 grandit avec le texte jusque-là, puis s'arrête : elle ne passe pas sous les onglets
const AGRANDISSEMENT_MAX_PASTILLE = 1.2;
// Fondu sur le bord de la bande quand des onglets y sont coupés : on devine qu'elle défile
const LARGEUR_FONDU = 24;
const FONDU_DROITE = ["rgba(0,0,0,0)", "rgba(0,0,0,0.3)"] as const;
const FONDU_GAUCHE = ["rgba(0,0,0,0.3)", "rgba(0,0,0,0)"] as const;
const HORIZONTAL = { debut: { x: 0, y: 0 }, fin: { x: 1, y: 0 } };

type Mesure = { x: number; largeur: number };

/**
 * En-tête posé sur le fil : rescousses restantes, les trois fils (« Abonnements », « Pour toi », « SOS ce soir »), qui défilent
 * de côté si le texte est très grand, et la cloche des notifications (qui lit elle-même ce qu'elle compte).
 * En visite sans compte, pas de rescousses à compter : une pastille jaune, sous les onglets, propose de créer son compte.
 */
export function EnTeteFil({ onglet, onChoisir, restantes, haut, invite, onCreerCompte }: Props) {
  const { width: largeur, fontScale } = useWindowDimensions();
  const court = largeur / fontScale < LARGEUR_LIBELLES_LONGS;
  const mini = largeur / fontScale < LARGEUR_MINI;
  // Onglets trop larges pour l'écran (iPhone SE, très grand texte) : l'onglet choisi revient au milieu de la bande
  const defilement = useRef<ScrollView>(null);
  const mesures = useRef<Partial<Record<OngletFil, Mesure>>>({});
  const bande = useRef({ visible: 0, contenu: 0, position: 0 });
  const centreAuDepart = useRef(false);
  // Des onglets coupés à gauche ou à droite : un fondu de ce côté
  const [coupes, setCoupes] = useState({ gauche: false, droite: false });

  function noterCoupes() {
    const { visible, contenu, position } = bande.current;
    const gauche = contenu > visible + 1 && position > 2;
    const droite = contenu > visible + 1 && position + visible < contenu - 2;
    setCoupes((c) => (c.gauche === gauche && c.droite === droite ? c : { gauche, droite }));
  }

  function centrer(anime: boolean) {
    const mesure = mesures.current[onglet];
    const { visible, contenu } = bande.current;
    if (!mesure || visible === 0 || contenu <= visible) return;
    const x = Math.min(Math.max(0, mesure.x + mesure.largeur / 2 - visible / 2), contenu - visible);
    defilement.current?.scrollTo({ x, animated: anime });
  }

  // Au premier affichage aussi, pas seulement au changement d'onglet : dès que la bande et l'onglet choisi sont mesurés
  function apresMesure() {
    noterCoupes();
    const { visible, contenu } = bande.current;
    if (centreAuDepart.current || !mesures.current[onglet] || visible === 0 || contenu === 0) return;
    centreAuDepart.current = true;
    centrer(false);
  }

  useEffect(() => {
    centrer(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement quand l'onglet change (les mesures sont dans des refs)
  }, [onglet]);
  return (
    // La bande des onglets arrête le doigt (comme toujours) ; sous elle, seule la pastille : à côté, on touche toujours la vidéo
    <View pointerEvents="box-none" className="absolute inset-x-0 top-0">
      {/* Côtés au plus juste (bouée, cloche de 44 pt) : les trois onglets tiennent sans défiler dès 320 pt de large (taille de texte normale) */}
      <View style={{ paddingTop: haut + 6 }} className="flex-row items-center px-3 pb-2">
        {/* Au moins 56 pt, plus avec un grand texte (jusqu'à AGRANDISSEMENT_MAX_PASTILLE) : la pastille ne passe jamais sous les onglets */}
        <View className="min-w-14 shrink-0">
          {invite ? null : (
            <View
              accessible
              accessibilityLabel={`Il te reste ${restantes} rescousse${restantes > 1 ? "s" : ""} cette semaine`}
              className="flex-row items-center gap-1 self-start rounded-full bg-black/30 px-2.5 py-1.5"
            >
              <Text maxFontSizeMultiplier={AGRANDISSEMENT_MAX_PASTILLE} className="text-base">
                🛟
              </Text>
              <Text maxFontSizeMultiplier={AGRANDISSEMENT_MAX_PASTILLE} className="font-texte-gras text-base text-white">
                {restantes}
              </Text>
            </View>
          )}
        </View>
        <View className="flex-1">
          <ScrollView
            ref={defilement}
            horizontal
            accessibilityRole="tablist"
            showsHorizontalScrollIndicator={false}
            scrollEventThrottle={32}
            onScroll={(e) => {
              bande.current.position = e.nativeEvent.contentOffset.x;
              noterCoupes();
            }}
            onLayout={(e) => {
              bande.current.visible = e.nativeEvent.layout.width;
              apresMesure();
            }}
            onContentSizeChange={(largeurContenu) => {
              bande.current.contenu = largeurContenu;
              apresMesure();
            }}
            contentContainerStyle={{ flexGrow: 1, justifyContent: "center", gap: mini ? 10 : 16 }}
          >
            {onglets.map(({ cle, libelle, court: libelleCourt, mini: libelleMini, lu }, i) => {
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
                  onLayout={(e) => {
                    mesures.current[cle] = { x: e.nativeEvent.layout.x, largeur: e.nativeEvent.layout.width };
                    if (actif) apresMesure();
                  }}
                  className={`min-h-11 justify-center border-b-[3px] ${actif ? "border-jaune" : "border-transparent"}`}
                >
                  <Text
                    maxFontSizeMultiplier={AGRANDISSEMENT_MAX}
                    className={`font-texte-gras text-[15px] ${actif ? "text-white" : "text-white/65"}`}
                    style={{ textShadowColor: "rgba(0,0,0,0.4)", textShadowRadius: 4 }}
                  >
                    {mini && libelleMini ? libelleMini : court && libelleCourt ? libelleCourt : libelle}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>
          {coupes.gauche ? (
            <LinearGradient pointerEvents="none" colors={FONDU_GAUCHE} start={HORIZONTAL.debut} end={HORIZONTAL.fin} style={{ position: "absolute", left: 0, top: 0, bottom: 0, width: LARGEUR_FONDU }} />
          ) : null}
          {coupes.droite ? (
            <LinearGradient pointerEvents="none" colors={FONDU_DROITE} start={HORIZONTAL.debut} end={HORIZONTAL.fin} style={{ position: "absolute", right: 0, top: 0, bottom: 0, width: LARGEUR_FONDU }} />
          ) : null}
        </View>
        <View className="w-11 items-end">
          <BoutonNotifications variante="sombre" />
        </View>
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
