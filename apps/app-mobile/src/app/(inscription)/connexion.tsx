import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View, type TextInput } from "react-native";

import { BoutonConnexion } from "~/composants/inscription/BoutonConnexion";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { TEXTES_CONNEXION_QR_PAR_LANGUE } from "~/contenus/connexion-qr";
import { TEXTES_INSCRIPTION_CONNEXION_PAR_LANGUE } from "~/contenus/textes-inscription-connexion";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserEntreeCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/**
 * « Me connecter » : un compte qui existe déjà (créé dans l'app ou sur le site), par e-mail et mot de passe, Apple, Google, ou
 * un QR code scanné par un téléphone déjà connecté.
 * Son profil, gardé sur le serveur, s'installe sur le téléphone ; un compte du site sans date de naissance passe d'abord par
 * « Fais connaissance ».
 */
export default function Connexion() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const T = utiliserTextes(TEXTES_INSCRIPTION_CONNEXION_PAR_LANGUE);
  const textesQr = utiliserTextes(TEXTES_CONNEXION_QR_PAR_LANGUE);
  const { connecterAvec, connecterParEmail, enCours } = utiliserEntreeCompte();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const champMotDePasse = useRef<TextInput>(null);
  const pret = email.trim() !== "" && motDePasse !== "";

  return (
    <EcranEtape
      titre={T.titre}
      sousTitre={T.sousTitre}
      boutonPrincipal={{ libelle: enCours === "email" ? T.unInstant : T.meConnecter, onPress: () => void connecterParEmail(email, motDePasse), desactive: !pret || enCours !== null }}
    >
      <View className="gap-4">
        <BoutonConnexion fournisseur="apple" onPress={() => void connecterAvec("apple")} enCours={enCours === "apple"} desactive={enCours !== null} />
        <BoutonConnexion fournisseur="google" onPress={() => void connecterAvec("google")} enCours={enCours === "google"} desactive={enCours !== null} />
        {/* Même allure que les boutons Apple et Google juste au-dessus (estompé pendant une autre connexion, petite vibration) */}
        <Pressable
          accessibilityRole="button"
          accessibilityHint={T.indiceQr}
          disabled={enCours !== null}
          onPress={() => {
            vibrerLegerement();
            router.push("/connexion-qr");
          }}
          className={`min-h-14 flex-row items-center justify-center gap-3 rounded-full border-2 border-encre bg-carte px-5 active:opacity-80 ${enCours !== null ? "opacity-50" : ""}`}
        >
          <Ionicons name="qr-code-outline" size={22} color={couleurs.encre} />
          <Text className="font-texte-gras text-[17px] text-encre">{textesQr.titreAfficher}</Text>
        </Pressable>
      </View>

      <View className="my-6 flex-row items-center gap-3">
        <View className="h-0.5 flex-1 bg-ligne" />
        <Text className="font-texte-semi text-sm text-gris">{T.ouEmail}</Text>
        <View className="h-0.5 flex-1 bg-ligne" />
      </View>

      <View className="gap-5">
        <ChampTexte
          libelle={T.tonEmail}
          valeur={email}
          onChangeTexte={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="username"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => champMotDePasse.current?.focus()}
        />
        <ChampTexte
          ref={champMotDePasse}
          libelle={T.tonMotDePasse}
          valeur={motDePasse}
          onChangeTexte={setMotDePasse}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="password"
          autoComplete="current-password"
          returnKeyType="go"
          onSubmitEditing={() => pret && void connecterParEmail(email, motDePasse)}
        />
        <Pressable accessibilityRole="button" onPress={() => router.push("/mot-de-passe-oublie")} hitSlop={6} className="min-h-11 justify-center self-start active:opacity-70">
          <Text className="font-texte-semi text-base text-encre underline">{T.motDePasseOublie}</Text>
        </Pressable>
      </View>
    </EcranEtape>
  );
}
