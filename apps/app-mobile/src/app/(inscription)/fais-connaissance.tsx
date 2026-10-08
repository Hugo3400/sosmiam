import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Pressable, Text, TextInput, View } from "react-native";

import { AGE_MINIMUM_INSCRIPTION } from "@sos-miam/commun/regles/ages";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { ChoixDateNaissance } from "~/composants/inscription/ChoixDateNaissance";
import { ChoixVille } from "~/composants/inscription/ChoixVille";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Mascotte } from "~/composants/marque/Mascotte";
import { calculerDateAnniversaire } from "~/fonctions/dates/calculer-date-anniversaire";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";

const LONGUEUR_MAX_PRENOM = 40;
const LONGUEUR_MAX_NOM = 60;

/**
 * Étape 2 sur 4 : prénom, nom (facultatif), date de naissance et ville. Tout est gardé dans le brouillon au fil de la saisie.
 * Âge minimum : rien ne l'annonce avant de continuer (on ne souffle pas la « bonne » année). Continuer avec une date trop
 * récente bloque l'inscription sur ce téléphone jusqu'à l'anniversaire (verrou d'âge), même si on revient changer la date.
 */
export default function FaisConnaissance() {
  const router = useRouter();
  const { brouillon, modifier, verrouAge, verrouEnLecture, bloquer, debloquer } = utiliserBrouillonInscription();
  const champNom = useRef<TextInput>(null);
  const [prenomQuitte, setPrenomQuitte] = useState(false);

  const prenom = brouillon.prenom.trim();
  const prenomValable = prenom.length >= 1 && prenom.length <= LONGUEUR_MAX_PRENOM;
  // L'âge ne grise pas « Continuer » : rien ne souffle la limite, c'est en continuant qu'une date trop récente bloque
  const valable = prenomValable && brouillon.dateNaissance !== null && brouillon.ville !== null;

  // Ce qui manque encore, affiché tant que « Continuer » est grisé
  const manquants = [
    prenomValable ? null : "ton prénom",
    brouillon.dateNaissance === null ? "ta date de naissance" : null,
    brouillon.ville === null ? "ta ville" : null,
  ].filter((m): m is string => m !== null);
  const texteManquants = manquants.length > 1 ? `${manquants.slice(0, -1).join(", ")} et ${manquants.at(-1)}` : manquants[0];

  const continuer = () => {
    // Âge calculé au moment de l'appui (l'écran a pu rester ouvert pendant un passage à minuit).
    // Date trop récente, validée en connaissance de cause (elle est écrite en toutes lettres dans le champ) :
    // verrou jusqu'à l'anniversaire, et la date saisie est oubliée
    if (brouillon.dateNaissance && calculerAge(brouillon.dateNaissance) < AGE_MINIMUM_INSCRIPTION) {
      bloquer(calculerDateAnniversaire(brouillon.dateNaissance, AGE_MINIMUM_INSCRIPTION));
      modifier({ dateNaissance: null });
      return;
    }
    modifier({ prenom, nom: brouillon.nom.trim() });
    router.push("/envies");
  };

  if (verrouEnLecture) return null;

  if (verrouAge) {
    return (
      <EcranEtape
        titre="Encore un peu de patience"
        sousTitre={`SOS Miam t'ouvre ses portes à partir de ${AGE_MINIMUM_INSCRIPTION}\u00a0ans. Rendez-vous le ${formaterDateLongue(verrouAge)}\u00a0: on te gardera une bonne table\u00a0!`}
        etape={{ numero: 2, total: 4 }}
      >
        <View className="items-center gap-4 pt-4">
          <Mascotte expression="clin" taille={140} />
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {"D'ici là, régale-toi bien, et pense à nous quand tu passeras devant un bon petit resto\u00a0😉"}
          </Text>
          {/* Mode développement seulement (Expo Go, tests) : absent de l'app publiée */}
          {__DEV__ ? (
            <Pressable
              accessibilityRole="button"
              onPress={debloquer}
              className="mt-4 min-h-11 justify-center rounded-full border-2 border-dashed border-encre px-4 active:opacity-70"
            >
              <Text className="font-texte-semi text-sm text-encre">🔓 Débloquer (mode développement)</Text>
            </Pressable>
          ) : null}
        </View>
      </EcranEtape>
    );
  }

  return (
    <EcranEtape
      titre="Fais connaissance"
      sousTitre={"Promis, c'est rapide\u00a0: juste de quoi te saluer par ton prénom et te dénicher des bons plans près de chez toi."}
      etape={{ numero: 2, total: 4 }}
      boutonPrincipal={{ libelle: "Continuer", onPress: continuer, desactive: !valable }}
    >
      <View className="gap-6">
        <ChampTexte
          libelle="Ton prénom"
          valeur={brouillon.prenom}
          onChangeTexte={(texte) => modifier({ prenom: texte })}
          onBlur={() => setPrenomQuitte(true)}
          erreur={prenomQuitte && prenom.length === 0 ? "Il nous faut au moins ton prénom pour te dire bonjour\u00a0!" : null}
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
          valeur={brouillon.nom}
          onChangeTexte={(texte) => modifier({ nom: texte })}
          aide="Tu peux le laisser vide, on ne le prendra pas mal."
          placeholder="Dupont"
          textContentType="familyName"
          autoComplete="family-name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={LONGUEUR_MAX_NOM}
          returnKeyType="done"
        />

        <View className="gap-3">
          <ChoixDateNaissance
            valeur={brouillon.dateNaissance}
            onChangeDate={(dateNaissance) => modifier({ dateNaissance })}
            aide="Elle sert juste à adapter l'app à ton âge, et elle reste sur ton téléphone."
          />
        </View>

        <ChoixVille valeur={brouillon.ville} onChangeVille={(ville) => modifier({ ville })} />

        {manquants.length > 0 ? (
          <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm text-gris">
            Il manque encore {texteManquants}.
          </Text>
        ) : null}
      </View>
    </EcranEtape>
  );
}
