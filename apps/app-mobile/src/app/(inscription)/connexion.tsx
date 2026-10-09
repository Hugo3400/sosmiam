import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View, type TextInput } from "react-native";

import { BoutonConnexion } from "~/composants/inscription/BoutonConnexion";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { utiliserEntreeCompte } from "~/hooks/utiliser-entree-compte";

/**
 * « Me connecter » : un compte qui existe déjà (créé dans l'app ou sur le site), par e-mail et mot de passe, Apple ou Google.
 * Son profil, gardé sur le serveur, s'installe sur le téléphone ; un compte du site sans date de naissance passe d'abord par
 * « Fais connaissance ».
 */
export default function Connexion() {
  const router = useRouter();
  const { connecterAvec, connecterParEmail, enCours } = utiliserEntreeCompte();
  const [email, setEmail] = useState("");
  const [motDePasse, setMotDePasse] = useState("");
  const champMotDePasse = useRef<TextInput>(null);
  const pret = email.trim() !== "" && motDePasse !== "";

  return (
    <EcranEtape
      titre="Te revoilà !"
      sousTitre="Connecte-toi pour retrouver tes rescousses, tes visites et tes cartes de fidélité."
      boutonPrincipal={{ libelle: enCours === "email" ? "Un instant…" : "Me connecter", onPress: () => void connecterParEmail(email, motDePasse), desactive: !pret || enCours !== null }}
    >
      <View className="gap-4">
        <BoutonConnexion fournisseur="apple" onPress={() => void connecterAvec("apple")} enCours={enCours === "apple"} desactive={enCours !== null} />
        <BoutonConnexion fournisseur="google" onPress={() => void connecterAvec("google")} enCours={enCours === "google"} desactive={enCours !== null} />
      </View>

      <View className="my-6 flex-row items-center gap-3">
        <View className="h-0.5 flex-1 bg-ligne" />
        <Text className="font-texte-semi text-sm text-gris">ou avec ton e-mail</Text>
        <View className="h-0.5 flex-1 bg-ligne" />
      </View>

      <View className="gap-5">
        <ChampTexte
          libelle="Ton e-mail"
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
          libelle="Ton mot de passe"
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
          <Text className="font-texte-semi text-base text-encre underline">Mot de passe oublié ?</Text>
        </Pressable>
      </View>
    </EcranEtape>
  );
}
