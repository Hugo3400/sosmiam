import { useRef, useState } from "react";
import { Alert, Platform, Pressable, Text, View } from "react-native";

import type { Pote } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { TEXTES_REGLAGES_BLOQUES_PAR_LANGUE } from "~/contenus/textes-reglages-bloques";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserTextes } from "~/hooks/utiliser-textes";

// Le bouton touché disparaît avec sa ligne : le lecteur d'écran passe sur le message, une fois la confirmation refermée
const DELAI_FOCUS = 500;

/**
 * Réglages > Personnes bloquées : les gens que tu as bloqués (avatar, prénom, @pseudo), chacun avec « Débloquer » (après confirmation).
 * Personne de bloqué : un petit mot pour dire où ça se passe, si un jour il le faut.
 */
export default function PersonnesBloquees() {
  const T = utiliserTextes(TEXTES_REGLAGES_BLOQUES_PAR_LANGUE);
  const communaute = utiliserCommunaute();
  const { bloques } = communaute;
  const [message, setMessage] = useState<string | null>(null);
  const zoneMessage = useRef<View>(null);
  const nombre = bloques.length;

  function debloquer(pote: Pote) {
    communaute.debloquer(pote.id);
    // Débloquer ne remet personne dans ta bande : on le dit, sans promettre plus
    setMessage(T.debloque(pote.prenom));
    setTimeout(() => deplacerFocusLecteurEcran(zoneMessage.current), DELAI_FOCUS);
  }

  function demanderDeblocage(pote: Pote) {
    // Sur le web (aperçu de développement), Alert n'existe pas : on débloque directement
    if (Platform.OS === "web") return debloquer(pote);
    Alert.alert(T.confirmerTitre(pote.prenom), T.confirmerTexte, [
      { text: T.annuler, style: "cancel" },
      { text: T.debloquer, onPress: () => debloquer(pote) },
    ]);
  }

  return (
    <EcranReglage titre={T.titre} sousTitre={T.sousTitre}>
      {message ? (
        <View ref={zoneMessage} accessible className="mb-6 rounded-carte border-2 border-encre bg-jaune-clair px-4 py-3">
          <Text className="font-texte-semi text-base leading-6 text-encre">{lierPonctuation(message)}</Text>
        </View>
      ) : null}

      {!communaute.pret ? null : nombre === 0 ? (
        <View className="items-center gap-2 px-2 py-6">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
            🕊️
          </Text>
          <Text accessibilityRole="header" className="text-center font-titre text-2xl text-encre">
            {T.videTitre}
          </Text>
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {lierPonctuation(T.videTexte)}
          </Text>
        </View>
      ) : (
        <SectionReglages titre={T.nombre(nombre)}>
          {bloques.map((pote) => (
            <View key={pote.id} className="min-h-16 flex-row items-center gap-3 border-b border-ligne py-3">
              <RondPote pote={pote} taille={44} />
              <View accessible accessibilityLabel={pote.pseudo ? `${pote.prenom}, @${pote.pseudo}` : pote.prenom} className="flex-1">
                <Text numberOfLines={1} className="font-texte-gras text-base text-encre">
                  {pote.prenom}
                </Text>
                {pote.pseudo ? (
                  <Text numberOfLines={1} className="font-texte text-sm text-gris">
                    @{pote.pseudo}
                  </Text>
                ) : null}
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={T.debloquerLu(pote.prenom)}
                onPress={() => {
                  vibrerLegerement();
                  demanderDeblocage(pote);
                }}
                className="min-h-11 justify-center rounded-full border-2 border-encre bg-carte px-4 active:opacity-80"
              >
                <Text className="font-texte-gras text-sm text-encre">{T.debloquer}</Text>
              </Pressable>
            </View>
          ))}
          <Text className="mt-3 font-texte text-sm leading-5 text-gris">
            {lierPonctuation(T.note)}
          </Text>
        </SectionReglages>
      )}
    </EcranReglage>
  );
}
