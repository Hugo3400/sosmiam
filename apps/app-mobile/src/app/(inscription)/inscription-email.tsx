import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, View, type TextInput } from "react-native";

import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { TEXTES_INSCRIPTION_CONNEXION_PAR_LANGUE } from "~/contenus/textes-inscription-connexion";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Le mot de passe de l'API : 12 caractères au moins (le serveur refuse aussi les trop évidents) */
const MOT_DE_PASSE_MIN = 12;
const FORME_EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/**
 * Étape 1 bis : l'e-mail et le mot de passe du nouveau compte. Ils restent en mémoire jusqu'à « C'est prêt », où le compte
 * est créé (jamais gardés sur le téléphone). Un lien de confirmation part alors à cette adresse.
 */
export default function InscriptionEmail() {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_INSCRIPTION_CONNEXION_PAR_LANGUE);
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
      titre={T.emailTitre}
      sousTitre={T.emailSousTitre}
      etape={{ numero: 1, total: 4 }}
      boutonPrincipal={{ libelle: T.continuer, onPress: continuer }}
    >
      <View className="gap-5">
        <ChampTexte
          libelle={T.tonEmail}
          valeur={email}
          onChangeTexte={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          returnKeyType="next"
          onSubmitEditing={() => champMotDePasse.current?.focus()}
          erreur={tente && !emailOk ? T.emailIncomplet : null}
        />
        <View className="gap-2">
          <ChampTexte
            ref={champMotDePasse}
            libelle={T.tonMotDePasse}
            valeur={motDePasse}
            onChangeTexte={setMotDePasse}
            secureTextEntry={!voir}
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="done"
            onSubmitEditing={continuer}
            aide={T.aideMotDePasse(MOT_DE_PASSE_MIN)}
            erreur={tente && !motDePasseOk ? (longueur < MOT_DE_PASSE_MIN ? T.motDePasseCourt(MOT_DE_PASSE_MIN - longueur) : T.motDePasseEmail) : null}
          />
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={voir ? T.cacherMotDePasse : T.voirMotDePasse}
            onPress={() => {
              vibrerLegerement();
              setVoir(!voir);
            }}
            hitSlop={6}
            className="min-h-11 justify-center self-start active:opacity-70"
          >
            <Text className="font-texte-semi text-base text-encre underline">{voir ? T.cacherMotDePasse : T.voirMotDePasse}</Text>
          </Pressable>
        </View>
      </View>
    </EcranEtape>
  );
}
