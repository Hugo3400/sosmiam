import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, ScrollView, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { POINTS_AMBASSADEUR } from "@sos-miam/commun/regles/ambassadeurs";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { EnTeteFicheLieu } from "~/composants/lieux/EnTeteFicheLieu";
import { SuiteFicheLieu } from "~/composants/lieux/SuiteFicheLieu";
import { EnvoyerAPote } from "~/composants/potes/EnvoyerAPote";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { filtrerLieuxSelonAge } from "~/fonctions/lieux/filtrer-lieux-selon-age";
import { estPremierSauvetagePossible } from "~/fonctions/lieux/est-premier-sauvetage-possible";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

/** La feuille « Envoyer à un pote » : pas encore ouverte (donc pas encore préparée), ouverte, ou refermée */
type EtatEnvoi = "jamais" | "ouvert" | "ferme";

/**
 * Fiche d'un lieu (première version) : ses infos, ses horaires, son plat signature, et de quoi y aller ou l'aider.
 * Pour une arrivée fluide, seul le haut est dessiné tout de suite ; la suite (horaires, carte, tags) vient juste après l'animation.
 */
export default function FicheLieu() {
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profil } = utiliserProfil();
  const activite = utiliserActivite();
  // Distance depuis le centre de ta ville (partout en France), pas depuis Montpellier
  const depart = utiliserPointDeDepart();
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const [envoi, setEnvoi] = useState<EtatEnvoi>("jamais");
  const ouvrirEnvoi = useCallback(() => setEnvoi("ouvert"), []);
  const fermerEnvoi = useCallback(() => setEnvoi("ferme"), []);
  const retour = useCallback(() => router.back(), [router]);
  const age = useMemo(() => (profil ? calculerAge(profil.dateNaissance) : null), [profil]);
  const lieu = useMemo(() => filtrerLieuxSelonAge(lieuxExemples, age).find((l) => String(l.id) === id), [age, id]);
  const contenuDefilant = useMemo(() => ({ paddingBottom: marges.bottom + 120 }), [marges.bottom]);

  if (!lieu) {
    return (
      <View style={{ flex: 1, paddingTop: marges.top + 24 }} className="items-center gap-4 bg-creme px-8">
        <Text className="text-center font-titre text-2xl text-encre">Ce lieu n'est pas disponible</Text>
        <Bouton libelle="Retour" variante="blanc" onPress={retour} />
      </View>
    );
  }

  const sauve = activite.aSauve(lieu.id);
  // Plus de rescousse cette semaine : le bouton est désactivé (pas de vibration pour rien) et dit pourquoi
  const epuisee = !sauve && activite.restantes <= 0;
  const annoncer = (texte: string) => setAnnonce({ texte, numero: Date.now() });

  // Mêmes règles et mêmes messages que dans le fil (onglet « Pour toi »)
  const basculerRescousse = () => {
    // activite est l'état d'avant l'appui : un lieu déjà compté ne refait pas « Premier sauveteur »
    const premierSauveteur = estPremierSauvetagePossible(lieu, activite.premiersSauvetages);
    const resultat = activite.basculerRescousse(lieu.id);
    if (resultat === "epuisee") return annoncer("Plus de rescousse cette semaine, reviens lundi ! 🛟");
    if (resultat === "annulee") return annoncer("Rescousse reprise");
    const reste = activite.restantes - 1;
    if (premierSauveteur) {
      activite.noterPremierSauvetage(lieu.id);
      annoncer(`🚀 Premier sauveteur ! ${lieu.nom} vient d'arriver et tu es déjà là : +${POINTS_AMBASSADEUR.premierSauveteur} points`);
    } else annoncer(reste > 0 ? `🛟 Merci ! Encore ${reste} rescousse${reste > 1 ? "s" : ""} cette semaine` : "Dernière rescousse donnée, merci pour eux ! 🦸");
  };

  return (
    <View className="flex-1 bg-creme">
      <StatusBar style="light" />
      <ScrollView contentContainerStyle={contenuDefilant}>
        {/* Haut (mémorisé) tout de suite, suite (mémorisée) après l'animation d'arrivée : une rescousse ne redessine ni l'un ni l'autre */}
        <EnTeteFicheLieu lieu={lieu} km={calculerKmLieu(lieu, depart)} margeHaut={marges.top} onEnvoyer={ouvrirEnvoi} />
        <SuiteFicheLieu lieu={lieu} age={age} />
      </ScrollView>

      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Retour"
        hitSlop={8}
        onPress={retour}
        style={{ top: marges.top + 8 }}
        className="absolute left-4 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
      >
        <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
      </Pressable>

      {/* Libellés sans emoji : Bouton les fait lire tels quels, VoiceOver et TalkBack diraient « bouée de sauvetage » ; l'état (donnée ou pas) est dans le libellé */}
      <View style={{ paddingBottom: marges.bottom + 12 }} className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-ligne bg-creme px-5 pt-3">
        <Bouton
          className="flex-1"
          libelle={sauve ? "Sauvé !" : epuisee ? "Reviens lundi" : "À la rescousse"}
          variante={sauve ? "encre" : "jaune"}
          desactive={epuisee}
          indice={
            sauve
              ? "Reprend ta rescousse, elle te sera rendue pour un autre lieu"
              : epuisee
                ? "Plus de rescousse cette semaine, elles reviennent lundi"
                : `Donne une de tes rescousses à ce lieu, il t'en reste ${activite.restantes} cette semaine`
          }
          onPress={basculerRescousse}
        />
        <Bouton
          className="flex-1"
          libelle="Y aller"
          variante="blanc"
          indice="Ouvre l'itinéraire dans Plans"
          onPress={() => Linking.openURL(`https://maps.apple.com/?q=${encodeURIComponent(`${lieu.nom}, ${lieu.ville}`)}`)}
        />
      </View>

      {/* Préparée seulement au premier « Envoyer à un pote » : rien de plus à dessiner à l'arrivée sur la fiche */}
      {envoi !== "jamais" ? <EnvoyerAPote visible={envoi === "ouvert"} lieuId={lieu.id} onFermer={fermerEnvoi} /> : null}
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
