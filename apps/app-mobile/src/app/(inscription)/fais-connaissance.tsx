import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, Text, TextInput, View } from "react-native";

import { AGE_MINIMUM_INSCRIPTION } from "@sos-miam/commun/regles/ages";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { ChoixDateNaissance } from "~/composants/inscription/ChoixDateNaissance";
import { ChoixVille } from "~/composants/inscription/ChoixVille";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Mascotte } from "~/composants/marque/Mascotte";
import { potesExemples } from "~/contenus/potes-exemples";
import { proposerPseudo } from "~/fonctions/communaute/proposer-pseudo";
import { calculerDateAnniversaire } from "~/fonctions/dates/calculer-date-anniversaire";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";

const LONGUEUR_MAX_PRENOM = 40;
const LONGUEUR_MAX_NOM = 60;
const LONGUEUR_MAX_PSEUDO = 20;
// Mêmes règles que estPseudoValide (packages/commun), dites simplement
const REGLES_PSEUDO =
  "De 3 à 20 caractères\u00a0: lettres minuscules sans accents, chiffres, point ou tiret bas (pas au début ni à la fin, et jamais deux d'affilée).";
// Clavier sans accents ni emoji sur iPhone, sans suggestions sur Android
const CLAVIER_PSEUDO = Platform.select({ ios: "ascii-capable", android: "visible-password", default: "default" } as const);

/**
 * Étape 2 sur 4 : prénom, pseudo (proposé à partir du prénom, modifiable), nom (facultatif), date de naissance et ville.
 * Tout est gardé dans le brouillon au fil de la saisie. L'unicité du pseudo ne se vérifie pour l'instant qu'avec les potes
 * d'exemple : elle se vérifiera pour de vrai avec les comptes (API).
 * Âge minimum : rien ne l'annonce avant de continuer (on ne souffle pas la « bonne » année). Continuer avec une date trop
 * récente bloque l'inscription sur ce téléphone jusqu'à l'anniversaire (verrou d'âge), même si on revient changer la date.
 */
export default function FaisConnaissance() {
  const router = useRouter();
  const { brouillon, modifier, verrouAge, verrouEnLecture, bloquer, debloquer } = utiliserBrouillonInscription();
  const champPseudo = useRef<TextInput>(null);
  const champNom = useRef<TextInput>(null);
  const [prenomQuitte, setPrenomQuitte] = useState(false);
  const [pseudoQuitte, setPseudoQuitte] = useState(false);
  // Dernier pseudo proposé, et le prénom dont il vient : tant que la personne ne l'a pas retouché, il suit le prénom
  const [proposition, setProposition] = useState<{ prenom: string; pseudo: string } | null>(null);

  const prenom = brouillon.prenom.trim();
  const prenomValable = prenom.length >= 1 && prenom.length <= LONGUEUR_MAX_PRENOM;
  const pseudo = brouillon.pseudo.trim();
  // Pour l'instant, « déjà pris » veut dire : le pseudo d'un pote d'exemple (les vrais se vérifieront avec les comptes)
  const erreurPseudo =
    pseudo === ""
      ? "Choisis-toi un pseudo\u00a0: c'est grâce à lui que tes potes te trouveront."
      : !estPseudoValide(pseudo)
        ? REGLES_PSEUDO
        : potesExemples.some((p) => p.pseudo === pseudo)
          ? "Ce pseudo est déjà pris\u00a0! Ajoute-lui une touche perso, quelques chiffres par exemple."
          : contientMotInterdit(pseudo)
            ? "Ce pseudo-là ne passera pas\u00a0: choisis-en un plus sympa."
            : null;
  const pseudoValable = erreurPseudo === null;
  // Un caractère interdit se signale tout de suite ; le reste (longueur, vide) une fois le champ quitté
  const montrerErreurPseudo = pseudoQuitte || /[^a-z0-9._]/.test(pseudo);
  // L'âge ne grise pas « Continuer » : rien ne souffle la limite, c'est en continuant qu'une date trop récente bloque
  const valable = prenomValable && pseudoValable && brouillon.dateNaissance !== null && brouillon.ville !== null;

  // Ce qui manque encore, affiché tant que « Continuer » est grisé
  const manquants = [
    prenomValable ? null : "ton prénom",
    pseudoValable ? null : pseudo === "" ? "ton pseudo" : "un pseudo valable",
    brouillon.dateNaissance === null ? "ta date de naissance" : null,
    brouillon.ville === null ? "ta ville" : null,
  ].filter((m): m is string => m !== null);
  const texteManquants = manquants.length > 1 ? `${manquants.slice(0, -1).join(", ")} et ${manquants.at(-1)}` : manquants[0];

  const proposer = (annoncer: boolean) => {
    let nouveau = proposerPseudo(prenom);
    if (nouveau === brouillon.pseudo) nouveau = proposerPseudo(prenom);
    setProposition({ prenom, pseudo: nouveau });
    modifier({ pseudo: nouveau });
    if (annoncer) AccessibilityInfo.announceForAccessibility(`Pseudo proposé : ${nouveau}`);
  };

  // En quittant le prénom : un pseudo proposé s'il n'y en a pas encore, ou si la proposition d'avant n'a pas été retouchée
  const proposerDepuisPrenom = () => {
    if (!prenom) return;
    const encoreLaProposition = proposition !== null && brouillon.pseudo === proposition.pseudo;
    if (brouillon.pseudo === "" || (encoreLaProposition && proposition.prenom !== prenom)) proposer(false);
  };

  const continuer = () => {
    // Âge calculé au moment de l'appui (l'écran a pu rester ouvert pendant un passage à minuit).
    // Date trop récente, validée en connaissance de cause (elle est écrite en toutes lettres dans le champ) :
    // verrou jusqu'à l'anniversaire, et la date saisie est oubliée
    if (brouillon.dateNaissance && calculerAge(brouillon.dateNaissance) < AGE_MINIMUM_INSCRIPTION) {
      bloquer(calculerDateAnniversaire(brouillon.dateNaissance, AGE_MINIMUM_INSCRIPTION));
      modifier({ dateNaissance: null });
      return;
    }
    modifier({ prenom, pseudo, nom: brouillon.nom.trim() });
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
          onBlur={() => {
            setPrenomQuitte(true);
            proposerDepuisPrenom();
          }}
          erreur={prenomQuitte && prenom.length === 0 ? "Il nous faut au moins ton prénom pour te dire bonjour\u00a0!" : null}
          placeholder="Camille"
          textContentType="givenName"
          autoComplete="given-name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={LONGUEUR_MAX_PRENOM}
          returnKeyType="next"
          submitBehavior="submit"
          onSubmitEditing={() => champPseudo.current?.focus()}
        />

        <View className="gap-1">
          <ChampTexte
            ref={champPseudo}
            libelle="Ton pseudo"
            valeur={brouillon.pseudo}
            // Sans « @ » et en minuscules : on corrige pour toi plutôt que de te gronder
            onChangeTexte={(texte) => modifier({ pseudo: texte.toLowerCase().replace(/^@+/, "") })}
            onBlur={() => setPseudoQuitte(true)}
            erreur={montrerErreurPseudo ? erreurPseudo : null}
            aide={"C'est avec lui que tes potes te trouveront\u00a0: 3 à 20 caractères, en minuscules, chiffres, point ou tiret bas. On vérifiera qu'il est bien libre quand les comptes arriveront."}
            placeholder="camille42"
            keyboardType={CLAVIER_PSEUDO}
            textContentType="none"
            autoComplete="off"
            autoCapitalize="none"
            autoCorrect={false}
            spellCheck={false}
            maxLength={LONGUEUR_MAX_PSEUDO}
            returnKeyType="next"
            submitBehavior="submit"
            onSubmitEditing={() => champNom.current?.focus()}
          />
          {prenom ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Une autre idée de pseudo"
              accessibilityHint="Remplace ton pseudo par une nouvelle proposition, à partir de ton prénom"
              onPress={() => {
                vibrerLegerement();
                proposer(true);
              }}
              hitSlop={4}
              className="min-h-11 justify-center self-start active:opacity-70"
            >
              <Text className="font-texte-semi text-sm text-encre underline">🎲 Une autre idée</Text>
            </Pressable>
          ) : null}
        </View>

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
