import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Platform, Pressable, Text, TextInput, View } from "react-native";

import { AGE_MINIMUM_INSCRIPTION } from "@sos-miam/commun/regles/ages";
import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { nomPublicContientMotInterdit } from "@sos-miam/commun/validation/nom-public-contient-mot-interdit";
import { ChoixDateNaissance } from "~/composants/inscription/ChoixDateNaissance";
import { ChoixVille } from "~/composants/inscription/ChoixVille";
import { EcranEtape } from "~/composants/inscription/EcranEtape";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Mascotte } from "~/composants/marque/Mascotte";
import { TEXTES_INSCRIPTION_PROFIL_PAR_LANGUE } from "~/contenus/textes-inscription-profil";
import { proposerPseudo } from "~/fonctions/communaute/proposer-pseudo";
import { calculerDateAnniversaire } from "~/fonctions/dates/calculer-date-anniversaire";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { listerPrenomsLangue } from "~/fonctions/langue/lister-prenoms-langue";
import { utiliserBrouillonInscription } from "~/hooks/utiliser-brouillon-inscription";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const LONGUEUR_MAX_PRENOM = 40;
const LONGUEUR_MAX_NOM = 60;
const LONGUEUR_MAX_PSEUDO = 20;
// Clavier sans accents ni emoji sur iPhone, sans suggestions sur Android
const CLAVIER_PSEUDO = Platform.select({ ios: "ascii-capable", android: "visible-password", default: "default" } as const);

/**
 * Étape 2 sur 4 : prénom, pseudo (proposé à partir du prénom, modifiable), nom (facultatif), date de naissance et ville.
 * Tout est gardé dans le brouillon au fil de la saisie. L'unicité du pseudo ne se vérifie pas ici : l'API la vérifie à la
 * création du compte (c-est-pret ramène ici si le pseudo est pris).
 * Âge minimum : rien ne l'annonce avant de continuer (on ne souffle pas la « bonne » année). Continuer avec une date trop
 * récente bloque l'inscription sur ce téléphone jusqu'à l'anniversaire (verrou d'âge), même si on revient changer la date.
 * Le verrou arrête aussi la visite sans compte : on reste sur cet écran, sans retour possible vers le fil.
 */
export default function FaisConnaissance() {
  const router = useRouter();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_INSCRIPTION_PROFIL_PAR_LANGUE);
  const { brouillon, modifier, verrouAge, verrouEnLecture, bloquer, debloquer } = utiliserBrouillonInscription();
  const { invite, quitterInvite } = utiliserProfil();
  const champPseudo = useRef<TextInput>(null);
  const champNom = useRef<TextInput>(null);
  const [prenomQuitte, setPrenomQuitte] = useState(false);
  const [pseudoQuitte, setPseudoQuitte] = useState(false);
  // Dernier pseudo proposé, et le prénom dont il vient : tant que la personne ne l'a pas retouché, il suit le prénom
  const [proposition, setProposition] = useState<{ prenom: string; pseudo: string } | null>(null);

  // Verrou d'âge posé (ou déjà là) pendant une visite sans compte : la visite s'arrête
  useEffect(() => {
    if (verrouAge && invite) quitterInvite().catch(() => {});
  }, [verrouAge, invite, quitterInvite]);

  const prenom = brouillon.prenom.trim();
  // Le prénom s'affiche à côté du pseudo (commentaires, sorties, classement) : même filtre que le pseudo
  const erreurPrenom = prenom.length === 0 ? T.prenomVide : nomPublicContientMotInterdit(prenom) ? T.prenomInterdit : null;
  const prenomValable = erreurPrenom === null && prenom.length <= LONGUEUR_MAX_PRENOM;
  const pseudo = brouillon.pseudo.trim();
  const erreurPseudo =
    pseudo === ""
      ? T.pseudoVide
      : !estPseudoValide(pseudo)
        ? T.reglesPseudo
        : nomPublicContientMotInterdit(pseudo)
          ? T.pseudoInterdit
          : null;
  const pseudoValable = erreurPseudo === null;
  // Un caractère interdit se signale tout de suite ; le reste (longueur, vide) une fois le champ quitté
  const montrerErreurPseudo = pseudoQuitte || /[^a-z0-9._]/.test(pseudo);
  // L'âge ne grise pas « Continuer » : rien ne souffle la limite, c'est en continuant qu'une date trop récente bloque
  const valable = prenomValable && pseudoValable && brouillon.dateNaissance !== null && brouillon.ville !== null;

  // Ce qui manque encore, affiché tant que « Continuer » est grisé
  const manquants = [
    prenomValable ? null : prenom === "" ? T.manqueTonPrenom : T.manquePrenomSympa,
    pseudoValable ? null : pseudo === "" ? T.manqueTonPseudo : T.manquePseudoValable,
    brouillon.dateNaissance === null ? T.manqueDate : null,
    brouillon.ville === null ? T.manqueVille : null,
  ].filter((m): m is string => m !== null);
  const texteManquants = listerPrenomsLangue(manquants, langue);

  const proposer = (annoncer: boolean) => {
    let nouveau = proposerPseudo(prenom);
    if (nouveau === brouillon.pseudo) nouveau = proposerPseudo(prenom);
    setProposition({ prenom, pseudo: nouveau });
    modifier({ pseudo: nouveau });
    if (annoncer) AccessibilityInfo.announceForAccessibility(T.pseudoPropose(nouveau));
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
        titre={T.patienceTitre}
        sousTitre={T.patienceSousTitre(AGE_MINIMUM_INSCRIPTION, ecrireDateLongueLangue(verrouAge, langue))}
        etape={{ numero: 2, total: 4 }}
      >
        <View className="items-center gap-4 pt-4">
          <Mascotte expression="clin" taille={140} />
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {T.patienceTexte}
          </Text>
          {/* Mode développement seulement (Expo Go, tests) : absent de l'app publiée */}
          {__DEV__ ? (
            <Pressable
              accessibilityRole="button"
              onPress={debloquer}
              className="mt-4 min-h-11 justify-center rounded-full border-2 border-dashed border-encre px-4 active:opacity-70"
            >
              <Text className="font-texte-semi text-sm text-encre">{T.debloquer}</Text>
            </Pressable>
          ) : null}
        </View>
      </EcranEtape>
    );
  }

  return (
    <EcranEtape
      titre={T.titre}
      sousTitre={T.sousTitre}
      etape={{ numero: 2, total: 4 }}
      boutonPrincipal={{ libelle: T.continuer, onPress: continuer, desactive: !valable }}
    >
      <View className="gap-6">
        <ChampTexte
          libelle={T.tonPrenom}
          valeur={brouillon.prenom}
          onChangeTexte={(texte) => modifier({ prenom: texte })}
          onBlur={() => {
            setPrenomQuitte(true);
            proposerDepuisPrenom();
          }}
          erreur={prenomQuitte ? erreurPrenom : null}
          placeholder={T.exemplePrenom}
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
            libelle={T.tonPseudo}
            valeur={brouillon.pseudo}
            // Sans « @ » et en minuscules : on corrige pour toi plutôt que de te gronder
            onChangeTexte={(texte) => modifier({ pseudo: texte.toLowerCase().replace(/^@+/, "") })}
            onBlur={() => setPseudoQuitte(true)}
            erreur={montrerErreurPseudo ? erreurPseudo : null}
            aide={T.aidePseudo}
            placeholder={T.exemplePseudo}
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
              accessibilityLabel={T.autreIdeeLu}
              accessibilityHint={T.autreIdeeIndice}
              onPress={() => {
                vibrerLegerement();
                proposer(true);
              }}
              hitSlop={4}
              className="min-h-11 justify-center self-start active:opacity-70"
            >
              <Text className="font-texte-semi text-sm text-encre underline">{T.autreIdee}</Text>
            </Pressable>
          ) : null}
        </View>

        <ChampTexte
          ref={champNom}
          libelle={T.tonNom}
          mention={T.facultatif}
          valeur={brouillon.nom}
          onChangeTexte={(texte) => modifier({ nom: texte })}
          aide={T.aideNom}
          placeholder={T.exempleNom}
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
            aide={T.aideDate}
          />
        </View>

        <ChoixVille valeur={brouillon.ville} onChangeVille={(ville) => modifier({ ville })} />

        {manquants.length > 0 ? (
          <Text accessibilityLiveRegion="polite" className="text-center font-texte text-sm text-gris">
            {T.ilManque(texteManquants)}
          </Text>
        ) : null}
      </View>
    </EcranEtape>
  );
}
