import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { AccessibilityInfo, Alert, Platform, Pressable, Text, TextInput, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { nomPublicContientMotInterdit } from "@sos-miam/commun/validation/nom-public-contient-mot-interdit";
import { ChoixVille } from "~/composants/inscription/ChoixVille";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { MESSAGES_INFOS } from "~/contenus/annonces-profil";
import { potesExemples } from "~/contenus/potes-exemples";
import { proposerPseudo } from "~/fonctions/communaute/proposer-pseudo";
import { decrireRefusInfos } from "~/fonctions/compte/decrire-refus-infos";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserDisponibilitePseudo } from "~/hooks/utiliser-disponibilite-pseudo";
import { montrerErreurCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserProfil, type ChangementsInfos, type ResultatInfos } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import couleurs from "~/theme/couleurs";
import { DEMO_VISITES_ACTIVE } from "~/services/demo/demo-visites-active";

// Mêmes limites qu'à l'inscription (et que estProfilValide pour le prénom)
const LONGUEUR_MAX_PRENOM = 40;
const LONGUEUR_MAX_NOM = 60;
const LONGUEUR_MAX_PSEUDO = 20;
// Le prénom s'affiche à côté du pseudo (commentaires, sorties, classement) : même filtre que le pseudo, comme à l'inscription
const PRENOM_INTERDIT = lierPonctuation(MESSAGES_INFOS.prenomInterdit);
// Mêmes règles que estPseudoValide (packages/commun), dites simplement, comme à l'inscription
const REGLES_PSEUDO =
  "De 3 à 20 caractères : lettres minuscules sans accents, chiffres, point ou tiret bas (pas au début ni à la fin, et jamais deux d'affilée).";
// Ce que dit le serveur pendant la saisie (mêmes phrases que ses refus à l'enregistrement)
const PSEUDO_PRIS = decrireRefusInfos("pseudo-pris").texte;
const PSEUDO_MIS_DE_COTE = decrireRefusInfos("pseudo-mis-de-cote").texte;
// Clavier sans accents ni emoji sur iPhone, sans suggestions sur Android
const CLAVIER_PSEUDO = Platform.select({ ios: "ascii-capable", android: "visible-password", default: "default" } as const);
// Avec un compte, la date est gardée chiffrée sur le serveur : seule l'équipe la corrige, sur demande (docs/decisions.md)
const EXPLICATION_DATE_COMPTE = lierPonctuation(
  "Elle ne se change pas d'ici : c'est elle qui confirme que tu as l'âge d'être sur SOS Miam. Une erreur ? Écris-nous à bonjour@sosmiam.fr, on la corrige avec toi.",
);
// Sans compte connecté (la démo), le profil n'existe que sur le téléphone : personne ne peut corriger la date à ta place
const EXPLICATION_DATE_TELEPHONE = lierPonctuation(
  "Elle ne se change pas d'ici : c'est elle qui confirme que tu as l'âge d'être sur SOS Miam. Une erreur ? Ce profil n'existe que sur ton téléphone, on ne peut pas la corriger de notre côté. La seule solution : « Effacer mes données et recommencer », tout en bas des réglages (le reste repart aussi à zéro).",
);

/** Un refus du serveur montré sous sa case, tant que la case garde la valeur refusée ; `bloquant` : Enregistrer reste grisé */
type RefusAffiche = { champ: "prenom" | "pseudo" | "nom"; valeur: string; texte: string; bloquant: boolean };

/**
 * Mes infos : prénom, pseudo, nom (facultatif) et ville. La date de naissance s'affiche sans se changer d'ici (elle confirme ton âge).
 * Pseudo : mêmes règles qu'à l'inscription. Un profil créé avant Potes n'en a pas : il peut en choisir un (ou s'en faire proposer un),
 * mais une fois choisi, il ne peut plus être vidé. Avec un compte, le serveur fait foi : il dit si le pseudo est libre pendant que
 * tu tapes, et l'enregistrement attend sa réponse (sans réseau, le reste attend sur le téléphone et part tout seul ; un nouveau
 * pseudo, lui, doit être vérifié). Ses refus s'affichent sous la bonne case. En démo, tout reste sur le téléphone (« déjà pris » :
 * les potes d'exemple).
 */
export default function ReglagesInfos() {
  const router = useRouter();
  const { profil, modifierInfos, pseudoMisDeCote } = utiliserProfil();
  const { connecte } = utiliserSession();
  const avecCompte = connecte && !DEMO_VISITES_ACTIVE;
  const champPrenom = useRef<TextInput>(null);
  const champPseudo = useRef<TextInput>(null);
  const champNom = useRef<TextInput>(null);
  const [prenom, setPrenom] = useState(profil?.prenom ?? "");
  const [pseudo, setPseudo] = useState(profil?.pseudo ?? "");
  const [nom, setNom] = useState(profil?.nom ?? "");
  // null tant que ce qui est tapé n'est pas une ville
  const [ville, setVille] = useState<string | null>(profil?.ville ?? null);
  // Change quand la ville suit le profil : le choix de la ville repart de la nouvelle valeur
  const [versionVille, setVersionVille] = useState(0);
  const [prenomQuitte, setPrenomQuitte] = useState(false);
  const [pseudoQuitte, setPseudoQuitte] = useState(false);
  const [enregistrementEnCours, setEnregistrementEnCours] = useState(false);
  const [refus, setRefus] = useState<RefusAffiche | null>(null);

  // Le profil change pendant que l'écran est ouvert (réponse du serveur, pseudo neutre…) : les cases pas touchées le suivent
  const [precedent, setPrecedent] = useState(profil);
  if (profil !== precedent) {
    setPrecedent(profil);
    if (precedent && profil) {
      if (prenom === precedent.prenom) setPrenom(profil.prenom);
      if (pseudo === (precedent.pseudo ?? "")) setPseudo(profil.pseudo ?? "");
      if (nom === (precedent.nom ?? "")) setNom(profil.nom ?? "");
      if (ville === precedent.ville && profil.ville !== precedent.ville) {
        setVille(profil.ville);
        setVersionVille((v) => v + 1);
      }
    }
  }

  const pseudoNettoye = pseudo.trim();
  const pseudoActuel = profil?.pseudo ?? "";
  const pseudoChange = pseudoNettoye !== pseudoActuel;
  const pseudoBienForme = estPseudoValide(pseudoNettoye) && !nomPublicContientMotInterdit(pseudoNettoye);
  const disponibilite = utiliserDisponibilitePseudo(pseudoNettoye, avecCompte && pseudoChange && pseudoBienForme, pseudoMisDeCote);
  if (!profil) return null;

  /** Le refus affiché pour cette case, s'il porte encore sur ce qui est tapé */
  const refusDe = (champ: RefusAffiche["champ"], valeur: string) => (refus && refus.champ === champ && refus.valeur === valeur ? refus : null);
  const prenomNettoye = prenom.trim();
  const nomNettoye = nom.trim();
  const refusPrenom = refusDe("prenom", prenomNettoye);
  const refusPseudo = refusDe("pseudo", pseudoNettoye);
  const refusNom = refusDe("nom", nomNettoye);
  // Vérifié seulement s'il change : un prénom déjà enregistré ne bloque jamais l'enregistrement du reste
  const erreurPrenom =
    prenomNettoye.length === 0
      ? "Il nous faut au moins ton prénom pour te dire bonjour !"
      : prenomNettoye !== profil.prenom && nomPublicContientMotInterdit(prenomNettoye)
        ? PRENOM_INTERDIT
        : (refusPrenom?.texte ?? null);
  const prenomValable = erreurPrenom === null && prenomNettoye.length <= LONGUEUR_MAX_PRENOM;
  // Sans pseudo, on peut rester sans (profil d'avant Potes) ; en démo, « déjà pris » veut dire le pseudo d'un pote d'exemple
  const erreurPseudoLocale =
    pseudoNettoye === ""
      ? pseudoActuel
        ? "Garde un pseudo : c'est grâce à lui que tes potes te trouvent."
        : null
      : !estPseudoValide(pseudoNettoye)
        ? REGLES_PSEUDO
        : pseudoChange && DEMO_VISITES_ACTIVE && potesExemples.some((p) => p.pseudo === pseudoNettoye)
          ? "Ce pseudo est déjà pris ! Ajoute-lui une touche perso, quelques chiffres par exemple."
          : pseudoChange && nomPublicContientMotInterdit(pseudoNettoye)
            ? "Ce pseudo-là ne passera pas : choisis-en un plus sympa."
            : null;
  // Ce que le serveur a dit de ce pseudo-là (à l'enregistrement, ou pendant la saisie)
  const erreurPseudoServeur = refusPseudo?.bloquant
    ? refusPseudo.texte
    : disponibilite === "pris"
      ? PSEUDO_PRIS
      : disponibilite === "mis-de-cote"
        ? PSEUDO_MIS_DE_COTE
        : null;
  const pseudoValable = erreurPseudoLocale === null && erreurPseudoServeur === null;
  // Un caractère interdit se signale tout de suite ; le reste (longueur, vide) une fois le champ quitté ; le serveur, tout de suite
  const montrerErreurPseudo = pseudoQuitte || /[^a-z0-9._]/.test(pseudoNettoye);
  const messagePseudo = (montrerErreurPseudo ? erreurPseudoLocale : null) ?? erreurPseudoServeur ?? (refusPseudo && !refusPseudo.bloquant ? refusPseudo.texte : null);
  const aidePseudo = !avecCompte
    ? pseudoActuel
      ? "C'est avec lui que tes potes te trouvent (ton lien d'invitation et ton QR code suivront s'il change). On vérifiera qu'il est bien libre quand les comptes arriveront."
      : "Tu n'en as pas encore : choisis-en un pour que tes potes te trouvent. 3 à 20 caractères, en minuscules, chiffres, point ou tiret bas. On vérifiera qu'il est bien libre quand les comptes arriveront."
    : lierPonctuation(
        disponibilite === "verification"
          ? MESSAGES_INFOS.pseudoVerification
          : disponibilite === "libre"
            ? MESSAGES_INFOS.pseudoLibre
            : pseudoActuel
              ? MESSAGES_INFOS.aidePseudoAvecCompte
              : MESSAGES_INFOS.aidePseudoManquantAvecCompte,
      );
  const nomValable = !refusNom?.bloquant;
  const change = prenomNettoye !== profil.prenom || pseudoChange || nomNettoye !== (profil.nom ?? "") || ville !== profil.ville;
  const dateNaissance = formaterDateLongue(profil.dateNaissance);
  const age = calculerAge(profil.dateNaissance);
  const explicationDate = connecte ? EXPLICATION_DATE_COMPTE : EXPLICATION_DATE_TELEPHONE;

  function proposer() {
    vibrerLegerement();
    // Le bouton n'apparaît qu'avec un prénom
    let nouveau = proposerPseudo(prenomNettoye);
    if (nouveau === pseudoNettoye) nouveau = proposerPseudo(prenomNettoye);
    setPseudo(nouveau);
    AccessibilityInfo.announceForAccessibility(`Pseudo proposé : ${nouveau}`);
  }

  async function sauver() {
    if (!profil || !prenomValable || !pseudoValable || !nomValable || !ville || !change || enregistrementEnCours) return;
    setEnregistrementEnCours(true);
    // Seulement ce qui a bougé : un prénom gelé (compte limité) ne bloque pas un changement de ville
    const changements: ChangementsInfos = {
      ...(prenomNettoye !== profil.prenom ? { prenom: prenomNettoye } : {}),
      ...(pseudoChange && pseudoNettoye ? { pseudo: pseudoNettoye } : {}),
      ...(nomNettoye !== (profil.nom ?? "") ? { nom: nomNettoye } : {}),
      ...(ville !== profil.ville ? { ville } : {}),
    };
    let r: ResultatInfos;
    try {
      r = await modifierInfos(changements);
    } catch {
      setEnregistrementEnCours(false);
      if (Platform.OS !== "web") Alert.alert("Oups, ça a coincé", "Tes infos n'ont pas pu être enregistrées. Réessaie dans un instant.");
      return;
    }
    if (r.ok) {
      // Sans réseau : gardé ici, il partira tout seul
      if (!r.parti) AccessibilityInfo.announceForAccessibility(lierPonctuation(MESSAGES_INFOS.enAttenteDuReseau));
      router.back();
      return;
    }
    setEnregistrementEnCours(false);
    // Session expirée : l'app te ramène d'elle-même à « Me connecter »
    if (r.refus === "connexion-requise") return;
    const description = decrireRefusInfos(r.refus, r.champ);
    if (description.champ === "prenom" || description.champ === "pseudo" || description.champ === "nom") {
      const valeur = description.champ === "prenom" ? prenomNettoye : description.champ === "pseudo" ? pseudoNettoye : nomNettoye;
      setRefus({ champ: description.champ, valeur, texte: description.texte, bloquant: description.bloquant });
      // Le curseur revient dans la case à corriger
      if (description.bloquant) (description.champ === "prenom" ? champPrenom : description.champ === "pseudo" ? champPseudo : champNom).current?.focus();
      return;
    }
    // La ville, un compte limité ou un autre pépin : une alerte (texte de contenus/messages-services.ts)
    if (r.refus !== "pseudo-mis-de-cote" && r.refus !== "pseudo-sans-reseau") montrerErreurCompte(r.refus, r.details);
  }

  return (
    <EcranReglage
      titre="Mes infos"
      sousTitre="Juste de quoi te saluer par ton prénom et te dénicher des bons plans près de chez toi."
      boutonPrincipal={{
        // Avec un compte, la réponse du serveur peut prendre quelques secondes sur un réseau lent
        libelle: enregistrementEnCours ? "Un instant…" : "Enregistrer",
        onPress: () => void sauver(),
        desactive: !prenomValable || !pseudoValable || !nomValable || !change || !ville || enregistrementEnCours,
        indice: "Enregistre tes infos et revient aux réglages",
      }}
    >
      <View className="gap-6">
        <ChampTexte
          ref={champPrenom}
          libelle="Ton prénom"
          valeur={prenom}
          onChangeTexte={setPrenom}
          onBlur={() => setPrenomQuitte(true)}
          erreur={prenomQuitte || refusPrenom ? erreurPrenom : null}
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
            erreur={messagePseudo}
            aide={aidePseudo}
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
          erreur={refusNom?.texte ?? null}
          aide="Tu peux le laisser vide, on ne le prendra pas mal."
          placeholder="Dupont"
          textContentType="familyName"
          autoComplete="family-name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={LONGUEUR_MAX_NOM}
          returnKeyType="done"
        />

        <View accessible accessibilityLabel={`Ta date de naissance : ${dateNaissance}, ${age} ans. ${explicationDate}`} className="gap-2">
          <Text className="font-texte-semi text-base text-encre">Ta date de naissance</Text>
          <View className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-white px-4 py-3">
            <Text className="flex-1 font-texte text-[17px] text-encre">{`${dateNaissance} · ${age} ans`}</Text>
            <Ionicons name="lock-closed" size={18} color={couleurs.gris} />
          </View>
          <Text className="font-texte text-sm leading-5 text-gris">{explicationDate}</Text>
        </View>

        <ChoixVille key={versionVille} valeur={ville} onChangeVille={setVille} />
      </View>
    </EcranReglage>
  );
}
