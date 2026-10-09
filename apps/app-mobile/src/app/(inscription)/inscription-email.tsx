import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View, type TextInput } from "react-native";

import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";

/** Le mot de passe de l'API : 12 caractères au moins (le serveur refuse aussi les trop évidents) */
const MOT_DE_PASSE_MIN = 12;
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Étape 1 bis : l'e-mail et le mot de passe du nouveau compte. Ils restent en mémoire jusqu'à « C'est prêt », où le compte
 * est créé (jamais gardés sur le téléphone). Un lien de confirmation part alors à cette adresse.
 */
export default function InscriptionEmail() {
  const router = useRouter();
  const { brouillon, modifier } = utiliserBrouillonInscription();
  const dejaLa = brouillon.connexion?.type === "email" ? brouillon.connexion : null;
  const [email, setEmail] = useState(dejaLa?.email ?? "");
  const [motDePasse, setMotDePasse] = useState(dejaLa?.motDePasse ?? "");
  const [voir, setVoir] = useState(false);
  const [tente, setTente] = useState(false);
  const champMotDePasse = useRef<TextInput>(null);

  const emailOk = FORME_EMAIL.test(email.trim());
  const longueur = [...motDePasse].length;
  const motDePasseOk = longueur >= MOT_DE_PASSE_MIN && motDePasse.trim().toLowerCase() !== email.trim().toLowerCase();

  function continuer() {
    setTente(true);
    if (!emailOk || !motDePasseOk) return;
    modifier({ connexion: { type: "email", email: email.trim().toLowerCase(), motDePasse } });
    router.push("/fais-connaissance");
  }

  return (
    <EcranEtape
      titre="Ton e-mail et ton mot de passe"
      sousTitre="Pour te reconnecter sur un autre téléphone. On t'enverra un lien pour confirmer ton adresse."
      etape={{ numero: 1, total: 4 }}
      boutonPrincipal={{ libelle: "Continuer", onPress: continuer }}
    >
      <View className="gap-5">
        <ChampTexte
          libelle="Ton e-mail"
          valeur={email}
          onChangeTexte={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => champMotDePasse.current?.focus()}
          erreur={tente && !emailOk ? "Il manque un petit quelque chose : une adresse comme prenom@exemple.fr." : null}
        />
        <View className="gap-2">
          <ChampTexte
            ref={champMotDePasse}
            libelle="Ton mot de passe"
            valeur={motDePasse}
            onChangeTexte={setMotDePasse}
            secureTextEntry={!voir}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={continuer}
            aide={`${MOT_DE_PASSE_MIN} caractères au moins. Une petite phrase, c'est parfait : « mon chat adore les crêpes ».`}
            erreur={tente && !motDePasseOk ? (longueur < MOT_DE_PASSE_MIN ? `Encore ${MOT_DE_PASSE_MIN - longueur} caractère${MOT_DE_PASSE_MIN - longueur > 1 ? "s" : ""}, et c'est bon.` : "Pas ton e-mail comme mot de passe, voyons !") : null}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voir ? "Cacher le mot de passe" : "Voir le mot de passe"}
            onPress={() => {
              vibrerLegerement();
              setVoir(!voir);
            }}
            hitSlop={6}
            className="min-h-11 justify-center self-start active:opacity-70"
          >
            <Text className="font-texte-semi text-base text-encre underline">{voir ? "Cacher" : "Voir"} le mot de passe</Text>
          </Pressable>
        </View>
      </View>
    </EcranEtape>
  );
}
