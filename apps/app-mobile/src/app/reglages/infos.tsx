import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Alert, Linking, Platform, Pressable, Text, TextInput, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { ChoixVille } from "~/composants/inscription/ChoixVille";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

// Mêmes limites qu'à l'inscription (et que estProfilValide pour le prénom)
const LONGUEUR_MAX_PRENOM = 40;
const LONGUEUR_MAX_NOM = 60;
const ADRESSE_CONTACT = "bonjour@sosmiam.fr";

/** Mes infos : prénom, nom (facultatif) et ville. La date de naissance s'affiche sans se changer d'ici (elle décide de ce que l'app montre). */
export default function ReglagesInfos() {
  const router = useRouter();
  const { profil, enregistrer } = utiliserProfil();
  const champNom = useRef<TextInput>(null);
  const [prenom, setPrenom] = useState(profil?.prenom ?? "");
  const [nom, setNom] = useState(profil?.nom ?? "");
  const [ville, setVille] = useState(profil?.ville ?? "");
  const [prenomQuitte, setPrenomQuitte] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  if (!profil) return null;

  const prenomNettoye = prenom.trim();
  const nomNettoye = nom.trim();
  const prenomValable = prenomNettoye.length >= 1 && prenomNettoye.length <= LONGUEUR_MAX_PRENOM;
  const change = prenomNettoye !== profil.prenom || nomNettoye !== (profil.nom ?? "") || ville !== profil.ville;
  const dateNaissance = formaterDateLongue(profil.dateNaissance);
  const age = calculerAge(profil.dateNaissance);

  async function sauver() {
    if (!profil || !prenomValable || !change || enregistrementEnCours) return;
    setEnregistrementEnCours(true);
    try {
      await enregistrer({ ...profil, prenom: prenomNettoye, nom: nomNettoye || undefined, ville });
      router.back();
    } catch {
      setEnregistrementEnCours(false);
      if (Platform.OS !== "web") Alert.alert("Oups, ça a coincé", "Tes infos n'ont pas pu être enregistrées. Réessaie dans un instant.");
    }
  }

  return (
    <EcranReglage
      titre="Mes infos"
      sousTitre="Juste de quoi te saluer par ton prénom et te dénicher des bons plans près de chez toi."
      boutonPrincipal={{
        libelle: "Enregistrer",
        onPress: () => void sauver(),
        desactive: !prenomValable || !change || enregistrementEnCours,
        indice: "Enregistre tes infos et revient aux réglages",
      }}
    >
      <View className="gap-6">
        <ChampTexte
          libelle="Ton prénom"
          valeur={prenom}
          onChangeTexte={setPrenom}
          onBlur={() => setPrenomQuitte(true)}
          erreur={prenomQuitte && prenomNettoye.length === 0 ? "Il nous faut au moins ton prénom pour te dire bonjour !" : null}
          placeholder="Camille"
          textContentType="givenName"
          autoComplete="given-name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={LONGUEUR_MAX_PRENOM}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => champNom.current?.focus()}
        />

        <ChampTexte
          ref={champNom}
          libelle="Ton nom"
          mention="facultatif"
          valeur={nom}
          onChangeTexte={setNom}
          aide="Tu peux le laisser vide, on ne le prendra pas mal."
          placeholder="Dupont"
          textContentType="familyName"
          autoComplete="family-name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={LONGUEUR_MAX_NOM}
          returnKeyType="done"
        />

        <View className="gap-2">
          <View
            accessible
            accessibilityLabel={`Ta date de naissance : ${dateNaissance}, ${age} ans. Elle ne se change pas depuis l'app.`}
            className="gap-2"
          >
            <Text className="font-texte-semi text-base text-encre">Ta date de naissance</Text>
            <View className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-white px-4 py-3">
              <Text className="flex-1 font-texte text-[17px] text-encre">{`${dateNaissance} · ${age} ans`}</Text>
              <Ionicons name="lock-closed" size={18} color={couleurs.gris} />
            </View>
            <Text className="font-texte text-sm leading-5 text-gris">
              {"Elle ne se change pas d'ici : c'est elle qui décide de ce que l'app peut te montrer. Une erreur ? Pour la corriger, écris-nous."}
            </Text>
          </View>
          <Pressable
            accessibilityRole="link"
            accessibilityLabel={`Écrire à ${ADRESSE_CONTACT} pour corriger ta date de naissance`}
            hitSlop={8}
            onPress={() => Linking.openURL(`mailto:${ADRESSE_CONTACT}`).catch(() => {})}
            className="min-h-11 flex-row items-center gap-2 self-start active:opacity-70"
          >
            <Text accessibilityElementsHidden importantForAccessibility="no" className="text-base">
              💌
            </Text>
            <Text className="font-texte-semi text-base text-encre underline">{ADRESSE_CONTACT}</Text>
          </Pressable>
        </View>

        <ChoixVille valeur={ville} onChangeVille={setVille} />
      </View>
    </EcranReglage>
  );
}
