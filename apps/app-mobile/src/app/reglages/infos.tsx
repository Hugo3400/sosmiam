import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { AccessibilityInfo, Alert, Platform, Pressable, Text, TextInput, View } from "react-native";

import { calculerAge } from "@sos-miam/commun/regles/calculer-age";
import { estPseudoValide } from "@sos-miam/commun/validation/est-pseudo-valide";
import { nomPublicContientMotInterdit } from "@sos-miam/commun/validation/nom-public-contient-mot-interdit";
import { ChoixVille } from "~/composants/inscription/ChoixVille";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { MESSAGES_INFOS_PAR_LANGUE } from "~/contenus/annonces-profil";
import { TEXTES_REGLAGES_INFOS_PAR_LANGUE } from "~/contenus/textes-reglages-infos";
import { proposerPseudo } from "~/fonctions/communaute/proposer-pseudo";
import { decrireRefusInfos } from "~/fonctions/compte/decrire-refus-infos";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserDisponibilitePseudo } from "~/hooks/utiliser-disponibilite-pseudo";
import { montrerErreurCompte } from "~/hooks/utiliser-entree-compte";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserProfil, type ChangementsInfos, type ResultatInfos } from "~/hooks/utiliser-profil";
import { utiliserSession } from "~/hooks/utiliser-session";
import { utiliserTextes } from "~/hooks/utiliser-textes";

// Mêmes limites qu'à l'inscription (et que estProfilValide pour le prénom)
const LONGUEUR_MAX_PRENOM = 40;
const LONGUEUR_MAX_NOM = 60;
const LONGUEUR_MAX_PSEUDO = 20;
// Clavier sans accents ni emoji sur iPhone, sans suggestions sur Android
const CLAVIER_PSEUDO = Platform.select({ ios: "ascii-capable", android: "visible-password", default: "default" } as const);

/** Un refus du serveur montré sous sa case, tant que la case garde la valeur refusée ; `bloquant` : Enregistrer reste grisé */
type RefusAffiche = { champ: "prenom" | "pseudo" | "nom"; valeur: string; texte: string; bloquant: boolean };

/**
 * Mes infos : prénom, pseudo, nom (facultatif) et ville. La date de naissance s'affiche sans se changer d'ici (elle confirme ton âge).
 * Pseudo : mêmes règles qu'à l'inscription. Un profil créé avant Potes n'en a pas : il peut en choisir un (ou s'en faire proposer un),
 * mais une fois choisi, il ne peut plus être vidé. Avec un compte, le serveur fait foi : il dit si le pseudo est libre pendant que
 * tu tapes, et l'enregistrement attend sa réponse (sans réseau, le reste attend sur le téléphone et part tout seul ; un nouveau
 * pseudo, lui, doit être vérifié). Ses refus s'affichent sous la bonne case.
 */
export default function ReglagesInfos() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_REGLAGES_INFOS_PAR_LANGUE);
  const MESSAGES_INFOS = utiliserTextes(MESSAGES_INFOS_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const router = useRouter();
  const { profil, modifierInfos, pseudoMisDeCote } = utiliserProfil();
  // Le prénom s'affiche à côté du pseudo (commentaires, sorties, classement) : même filtre que le pseudo, comme à l'inscription
  const PRENOM_INTERDIT = lierPonctuation(MESSAGES_INFOS.prenomInterdit);
  // Mêmes règles que estPseudoValide (packages/commun), dites simplement, comme à l'inscription
  const REGLES_PSEUDO = T.reglesPseudo;
  // Ce que dit le serveur pendant la saisie (mêmes phrases que ses refus à l'enregistrement)
  const PSEUDO_PRIS = decrireRefusInfos("pseudo-pris", langue).texte;
  const PSEUDO_MIS_DE_COTE = decrireRefusInfos("pseudo-mis-de-cote", langue).texte;
  // Sans compte (un profil d'avant les comptes), personne ne vérifie le pseudo : on dit où il l'est pour de vrai
  const PSEUDO_SANS_COMPTE = T.pseudoSansCompte;
  // Avec un compte, la date est gardée chiffrée sur le serveur : seule l'équipe la corrige, sur demande (docs/decisions.md)
  const EXPLICATION_DATE_COMPTE = lierPonctuation(T.dateAvecCompte);
  // Sans compte connecté, le profil n'existe que sur le téléphone : personne ne peut corriger la date à ta place
  const EXPLICATION_DATE_TELEPHONE = lierPonctuation(T.dateSurTelephone);
  const { connecte } = utiliserSession();
  const avecCompte = connecte;
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
      ? T.prenomVide
      : prenomNettoye !== profil.prenom && nomPublicContientMotInterdit(prenomNettoye)
        ? PRENOM_INTERDIT
        : (refusPrenom?.texte ?? null);
  const prenomValable = erreurPrenom === null && prenomNettoye.length <= LONGUEUR_MAX_PRENOM;
  // Sans pseudo, on peut rester sans (profil d'avant Potes)
  const erreurPseudoLocale =
    pseudoNettoye === ""
      ? pseudoActuel
        ? T.garderPseudo
        : null
      : !estPseudoValide(pseudoNettoye)
        ? REGLES_PSEUDO
        : pseudoChange && nomPublicContientMotInterdit(pseudoNettoye)
          ? T.pseudoInterdit
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
    ? lierPonctuation(`${pseudoActuel ? T.aideSansCompteAvecPseudo : T.aideSansCompteSansPseudo} ${PSEUDO_SANS_COMPTE}`)
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
  const dateNaissance = ecrireDateLongueLangue(profil.dateNaissance, langue);
  const age = calculerAge(profil.dateNaissance);
  const explicationDate = connecte ? EXPLICATION_DATE_COMPTE : EXPLICATION_DATE_TELEPHONE;

  function proposer() {
    vibrerLegerement();
    // Le bouton n'apparaît qu'avec un prénom
    let nouveau = proposerPseudo(prenomNettoye);
    if (nouveau === pseudoNettoye) nouveau = proposerPseudo(prenomNettoye);
    setPseudo(nouveau);
    AccessibilityInfo.announceForAccessibility(T.pseudoPropose(nouveau));
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
      if (Platform.OS !== "web") Alert.alert(T.rateTitre, T.rateTexte);
      return;
    }
    if (r.ok) {
      // Sans réseau (ou le serveur trébuche) : gardé ici, il partira tout seul
      if (!r.parti) AccessibilityInfo.announceForAccessibility(lierPonctuation(r.attente === "reseau" ? MESSAGES_INFOS.enAttenteDuReseau : MESSAGES_INFOS.enAttenteDuServeur));
      router.back();
      return;
    }
    setEnregistrementEnCours(false);
    // Session expirée : l'app te ramène d'elle-même à « Me connecter »
    if (r.refus === "connexion-requise") return;
    const description = decrireRefusInfos(r.refus, langue, r.champ);
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
      titre={T.titre}
      sousTitre={T.sousTitre}
      boutonPrincipal={{
        // Avec un compte, la réponse du serveur peut prendre quelques secondes sur un réseau lent
        libelle: enregistrementEnCours ? T.unInstant : T.enregistrer,
        onPress: () => void sauver(),
        desactive: !prenomValable || !pseudoValable || !nomValable || !change || !ville || enregistrementEnCours,
        indice: T.enregistrerIndice,
      }}
    >
      <View className="gap-6">
        <ChampTexte
          ref={champPrenom}
          libelle={T.prenom}
          valeur={prenom}
          onChangeTexte={setPrenom}
          onBlur={() => setPrenomQuitte(true)}
          erreur={prenomQuitte || refusPrenom ? erreurPrenom : null}
          placeholder={T.prenomExemple}
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
            libelle={T.pseudo}
            valeur={pseudo}
            // Sans « @ » et en minuscules : on corrige pour toi plutôt que de te gronder
            onChangeTexte={(texte) => setPseudo(texte.toLowerCase().replace(/^@+/, ""))}
            onBlur={() => setPseudoQuitte(true)}
            erreur={messagePseudo}
            aide={aidePseudo}
            placeholder={T.pseudoExemple}
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
              accessibilityLabel={pseudoNettoye ? T.autreIdeeLu : T.proposerLu}
              accessibilityHint={T.proposerIndice}
              onPress={proposer}
              hitSlop={4}
              className="min-h-11 justify-center self-start active:opacity-70"
            >
              <Text className="font-texte-semi text-sm text-encre underline">{pseudoNettoye ? T.autreIdee : T.proposer}</Text>
            </Pressable>
          ) : null}
        </View>

        <ChampTexte
          ref={champNom}
          libelle={T.nom}
          mention={T.facultatif}
          valeur={nom}
          onChangeTexte={setNom}
          erreur={refusNom?.texte ?? null}
          aide={T.nomAide}
          placeholder={T.nomExemple}
          textContentType="familyName"
          autoComplete="family-name"
          autoCapitalize="words"
          autoCorrect={false}
          maxLength={LONGUEUR_MAX_NOM}
          returnKeyType="done"
        />

        <View accessible accessibilityLabel={T.dateLue(dateNaissance, age, explicationDate)} className="gap-2">
          <Text className="font-texte-semi text-base text-encre">{T.dateTitre}</Text>
          <View className="min-h-[52px] flex-row items-center gap-3 rounded-2xl border-2 border-ligne bg-carte px-4 py-3">
            <Text className="flex-1 font-texte text-[17px] text-encre">{T.dateValeur(dateNaissance, age)}</Text>
            <Ionicons name="lock-closed" size={18} color={couleurs.gris} />
          </View>
          <Text className="font-texte text-sm leading-5 text-gris">{explicationDate}</Text>
        </View>

        <ChoixVille key={versionVille} valeur={ville} onChangeVille={setVille} />
      </View>
    </EcranReglage>
  );
}
