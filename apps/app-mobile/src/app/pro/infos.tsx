import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { validerInfosPratiques, type ChampInfosPratiques } from "@sos-miam/commun/validation/valider-infos-pratiques";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampsInfosPratiques } from "~/composants/lieux/ChampsInfosPratiques";
import { InfosPratiquesLieu } from "~/composants/lieux/InfosPratiquesLieu";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { creerBrouillonInfosPratiques, type BrouillonInfosPratiques } from "~/fonctions/lieux/creer-brouillon-infos-pratiques";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";

/**
 * Les infos pratiques du lieu, remplies par le gérant : de quoi le joindre, les animaux, l'accès, les équipements, la
 * réservation et les paiements, avec l'aperçu du bloc tel qu'il apparaîtra sur la fiche. Une case non cochée n'est pas affichée.
 */
export default function EcranInfosPratiquesPro() {
  const couleurs = utiliserCouleurs();
  const marges = useSafeAreaInsets();
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const { comptoir } = utiliserServices();
  const [brouillon, setBrouillon] = useState<BrouillonInfosPratiques>(creerBrouillonInfosPratiques(null));
  const [erreur, setErreur] = useState<ChampInfosPratiques | null>(null);
  const [enregistrement, setEnregistrement] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  // Compte limité : dit au-dessus du bouton jusqu'au prochain essai (l'annonce du haut passerait sous celle de toute l'app)
  const [refusLimite, setRefusLimite] = useState<string | null>(null);

  useEffect(() => {
    if (!lieuPro) return;
    comptoir.lireInfosPratiques(lieuPro.id).then((r) => r.ok && setBrouillon(creerBrouillonInfosPratiques(r.infos)));
  }, [comptoir, lieuPro]);

  if (!lieuPro) return null;

  const changer = (partiel: Partial<BrouillonInfosPratiques>) => {
    setBrouillon((b) => ({ ...b, ...partiel }));
    setErreur(null);
  };
  // L'aperçu montre ce qui est déjà valable (un numéro à moitié tapé n'apparaît pas encore)
  const apercu = validerInfosPratiques(brouillon);

  async function enregistrer() {
    const valide = validerInfosPratiques(brouillon);
    if (!valide.ok) return setErreur(valide.champ);
    if (!lieuPro) return;
    setEnregistrement(true);
    setRefusLimite(null);
    const r = await comptoir.reglerInfosPratiques(lieuPro.id, valide.infos);
    setEnregistrement(false);
    if (!r.ok) {
      if (r.erreur === "compte-limite") return setRefusLimite(REFUS_LIMITATION.ficheLieu);
      return setAnnonce({ texte: "Les infos n'ont pas pu être enregistrées. Réessaie dans un instant ?", numero: Date.now() });
    }
    vibrerLegerement();
    fermer();
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={fermer}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
          <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
            Infos pratiques
          </Text>
        </View>

        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="gap-5 px-5 pb-8 pt-2">
          <Text className="font-texte text-base leading-6 text-gris">Ce que les gourmands voient sur ta fiche avant de venir. Ce que tu ne coches pas n'apparaît pas.</Text>

          <ChampsInfosPratiques brouillon={brouillon} onChanger={changer} erreur={erreur} />

          <View className="gap-2">
            <Text className="font-texte-gras text-base text-encre">Aperçu sur ta fiche</Text>
            <InfosPratiquesLieu nom={lieuPro.nom} pratique={apercu.ok ? apercu.infos : undefined} />
          </View>
        </ScrollView>

        <View className="gap-3 border-t border-ligne px-5 pt-3" style={{ paddingBottom: 12 }}>
          <RefusLimitationEnPlace texte={refusLimite} />
          <Bouton libelle={enregistrement ? "Enregistrement…" : "Enregistrer"} desactive={enregistrement} onPress={enregistrer} />
        </View>
      </KeyboardAvoidingView>
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={() => setAnnonce(null)} />
    </SafeAreaView>
  );
}
