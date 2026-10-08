import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { AccessibilityInfo, Alert, Platform, Pressable, Text, TextInput, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { pseudoContientMotInterdit } from "@sos-miam/commun/validation/pseudo-contient-mot-interdit";
import { ChoixVille } from "~/composants/inscription/ChoixVille";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { potesExemples } from "~/contenus/potes-exemples";
import { proposerPseudo } from "~/fonctions/communaute/proposer-pseudo";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

// Mêmes limites qu'à l'inscription (et que estProfilValide pour le prénom)
const LONGUEUR_MAX_PRENOM = 40;
const LONGUEUR_MAX_NOM = 60;
const LONGUEUR_MAX_PSEUDO = 20;
// Le prénom s'affiche à côté du pseudo (commentaires, sorties, classement) : même filtre que les messages, comme à l'inscription
const PRENOM_INTERDIT = "Ce prénom-là ne passera pas chez nous\u00a0! Mets ton vrai prénom, ou un petit surnom sympa.";
// Mêmes règles que estPseudoValide (packages/commun), dites simplement, comme à l'inscription
const REGLES_PSEUDO =
  "De 3 à 20 caractères\u00a0: lettres minuscules sans accents, chiffres, point ou tiret bas (pas au début ni à la fin, et jamais deux d'affilée).";
// Clavier sans accents ni emoji sur iPhone, sans suggestions sur Android
const CLAVIER_PSEUDO = Platform.select({ ios: "ascii-capable", android: "visible-password", default: "default" } as const);
// Tant que le profil n'existe que sur le téléphone, personne ne peut corriger la date à ta place
const EXPLICATION_DATE = lierPonctuation(
  "Elle ne se change pas d'ici : c'est elle qui décide de ce que l'app peut te montrer. Une erreur ? Pour l'instant, tout est rangé sur ton téléphone et on ne peut pas la corriger de notre côté. La seule solution : « Effacer mes données et recommencer », tout en bas des réglages (le reste repart aussi à zéro).",
);

/**
 * Mes infos : prénom, pseudo, nom (facultatif) et ville. La date de naissance s'affiche sans se changer d'ici (elle décide de ce que l'app montre).
 * Pseudo : mêmes règles qu'à l'inscription. Un profil créé avant Potes n'en a pas : il peut en choisir un (ou s'en faire proposer un),
 * mais une fois choisi, il ne peut plus être vidé. L'unicité ne se vérifie pour l'instant qu'avec les potes d'exemple (les vrais comptes viendront avec l'API).
 */
export default function ReglagesInfos() {
  const router = useRouter();
  const { profil, enregistrer } = utiliserProfil();
  const champPseudo = useRef<TextInput>(null);
  const champNom = useRef<TextInput>(null);
  const [prenom, setPrenom] = useState(profil?.prenom ?? "");
  const [pseudo, setPseudo] = useState(profil?.pseudo ?? "");
  const [nom, setNom] = useState(profil?.nom ?? "");
  // null tant que ce qui est tapé n'est pas une ville
  const [ville, setVille] = useState<string | null>(profil?.ville ?? null);
  const [prenomQuitte, setPrenomQuitte] = useState(false);
  const [pseudoQuitte, setPseudoQuitte] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  if (!profil) return null;

  const prenomNettoye = prenom.trim();
  const nomNettoye = nom.trim();
  // Vérifié seulement s'il change : un prénom déjà enregistré ne bloque jamais l'enregistrement du reste
  const erreurPrenom =
    prenomNettoye.length === 0
      ? "Il nous faut au moins ton prénom pour te dire bonjour\u00a0!"
      : prenomNettoye !== profil.prenom && contientMotInterdit(prenomNettoye)
        ? PRENOM_INTERDIT
        : null;
  const prenomValable = erreurPrenom === null && prenomNettoye.length <= LONGUEUR_MAX_PRENOM;
  const pseudoNettoye = pseudo.trim();
  const pseudoActuel = profil.pseudo ?? "";
  const pseudoChange = pseudoNettoye !== pseudoActuel;
  // Sans pseudo, on peut rester sans (profil d'avant Potes) ; « déjà pris » veut dire, pour l'instant, le pseudo d'un pote d'exemple
  const erreurPseudo =
    pseudoNettoye === ""
      ? pseudoActuel
        ? "Garde un pseudo\u00a0: c'est grâce à lui que tes potes te trouvent."
        : null
      : !estPseudoValide(pseudoNettoye)
        ? REGLES_PSEUDO
        : pseudoChange && potesExemples.some((p) => p.pseudo === pseudoNettoye)
          ? "Ce pseudo est déjà pris\u00a0! Ajoute-lui une touche perso, quelques chiffres par exemple."
          : pseudoChange && pseudoContientMotInterdit(pseudoNettoye)
            ? "Ce pseudo-là ne passera pas\u00a0: choisis-en un plus sympa."
            : null;
  const pseudoValable = erreurPseudo === null;
  // Un caractère interdit se signale tout de suite ; le reste (longueur, vide) une fois le champ quitté
  const montrerErreurPseudo = pseudoQuitte || /[^a-z0-9._]/.test(pseudoNettoye);
  const change = prenomNettoye !== profil.prenom || pseudoChange || nomNettoye !== (profil.nom ?? "") || ville !== profil.ville;
  const dateNaissance = formaterDateLongue(profil.dateNaissance);
  const age = calculerAge(profil.dateNaissance);

  function proposer() {
    vibrerLegerement();
    // Le bouton n'apparaît qu'avec un prénom
    let nouveau = proposerPseudo(prenomNettoye);
    if (nouveau === pseudoNettoye) nouveau = proposerPseudo(prenomNettoye);
    setPseudo(nouveau);
    AccessibilityInfo.announceForAccessibility(`Pseudo proposé : ${nouveau}`);
  }

  async function sauver() {
    if (!profil || !prenomValable || !pseudoValable || !ville || !change || enregistrementEnCours) return;
    setEnregistrementEnCours(true);
    try {
      await enregistrer({ ...profil, prenom: prenomNettoye, pseudo: pseudoNettoye || undefined, nom: nomNettoye || undefined, ville });
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
        desactive: !prenomValable || !pseudoValable || !change || !ville || enregistrementEnCours,
        indice: "Enregistre tes infos et revient aux réglages",
      }}
    >
      <View className="gap-6">
        <ChampTexte
          libelle="Ton prénom"
          valeur={prenom}
          onChangeTexte={setPrenom}
          onBlur={() => setPrenomQuitte(true)}
          erreur={prenomQuitte ? erreurPrenom : null}
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
            valeur={pseudo}
            // Sans « @ » et en minuscules : on corrige pour toi plutôt que de te gronder
            onChangeTexte={(texte) => setPseudo(texte.toLowerCase().replace(/^@+/, ""))}
            onBlur={() => setPseudoQuitte(true)}
            erreur={montrerErreurPseudo ? erreurPseudo : null}
            aide={
              pseudoActuel
                ? "C'est avec lui que tes potes te trouvent (ton lien d'invitation et ton QR code suivront s'il change). On vérifiera qu'il est bien libre quand les comptes arriveront."
                : "Tu n'en as pas encore\u00a0: choisis-en un pour que tes potes te trouvent. 3 à 20 caractères, en minuscules, chiffres, point ou tiret bas. On vérifiera qu'il est bien libre quand les comptes arriveront."
            }
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
          {prenomNettoye ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={pseudoNettoye ? "Une autre idée de pseudo" : "Me proposer un pseudo"}
              accessibilityHint="Remplace ton pseudo par une proposition, à partir de ton prénom"
              onPress={proposer}
              hitSlop={4}
              className="min-h-11 justify-center self-start active:opacity-70"
            >
              <Text className="font-texte-semi text-sm text-encre underline">{pseudoNettoye ? "🎲 Une autre idée" : "🎲 Me proposer un pseudo"}</Text>
            </Pressable>
          ) : null}
        </View>

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

        <View accessible accessibilityLabel={`Ta date de naissance : ${dateNaissance}, ${age} ans. ${EXPLICATION_DATE}`} className="gap-2">
          <Text className="font-texte-semi text-base text-encre">Ta date de naissance</Text>
          <View className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-white px-4 py-3">
            <Text className="flex-1 font-texte text-[17px] text-encre">{`${dateNaissance} · ${age} ans`}</Text>
            <Ionicons name="lock-closed" size={18} color={couleurs.gris} />
          </View>
          <Text className="font-texte text-sm leading-5 text-gris">{EXPLICATION_DATE}</Text>
        </View>

        <ChoixVille valeur={ville} onChangeVille={setVille} />
      </View>
    </EcranReglage>
  );
}
