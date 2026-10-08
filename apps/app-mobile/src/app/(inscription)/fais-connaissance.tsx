import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Text, TextInput, View } from "react-native";

import { AGE_MINIMUM_INSCRIPTION } from "@sos-miam/commun/regles/ages";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { ChoixDateNaissance } from "~/composants/inscription/ChoixDateNaissance";
import { ChoixVille } from "~/composants/inscription/ChoixVille";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Mascotte } from "~/composants/marque/Mascotte";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";

const LONGUEUR_MAX_PRENOM = 40;
const LONGUEUR_MAX_NOM = 60;
const messageTropJeune = `SOS Miam est ouvert à partir de ${AGE_MINIMUM_INSCRIPTION}\u00a0ans\u00a0: reviens nous voir bientôt\u00a0!`;

/** Étape 2 sur 4 : prénom, nom (facultatif), date de naissance et ville. Tout est gardé dans le brouillon au fil de la saisie. */
export default function FaisConnaissance() {
  const router = useRouter();
  const { brouillon, modifier } = utiliserBrouillonInscription();
  const champNom = useRef<TextInput>(null);
  const [prenomQuitte, setPrenomQuitte] = useState(false);

  const prenom = brouillon.prenom.trim();
  const prenomValable = prenom.length >= 1 && prenom.length <= LONGUEUR_MAX_PRENOM;
  const tropJeune = brouillon.dateNaissance !== null && calculerAge(brouillon.dateNaissance) < AGE_MINIMUM_INSCRIPTION;
  const valable = prenomValable && brouillon.dateNaissance !== null && !tropJeune && brouillon.ville !== null;

  // Le message d'âge apparaît plus bas que le doigt : VoiceOver le lit tout de suite
  useEffect(() => {
    if (tropJeune) AccessibilityInfo.announceForAccessibility(messageTropJeune);
  }, [tropJeune]);

  const continuer = () => {
    modifier({ prenom, nom: brouillon.nom.trim() });
    router.push("/envies");
  };

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
            aide={`Elle sert juste à vérifier ton âge\u00a0: SOS Miam, c'est à partir de ${AGE_MINIMUM_INSCRIPTION}\u00a0ans.`}
          />
          {tropJeune ? (
            <View
              accessible
              accessibilityLiveRegion="polite"
              className="flex-row items-center gap-3 rounded-2xl border-2 border-encre bg-white p-4"
            >
              <Mascotte expression="clin" taille={52} />
              <Text className="flex-1 font-texte-moyen text-base leading-6 text-encre">{messageTropJeune}</Text>
            </View>
          ) : null}
        </View>

        <ChoixVille valeur={brouillon.ville} onChangeVille={(ville) => modifier({ ville })} />
      </View>
    </EcranEtape>
  );
}
