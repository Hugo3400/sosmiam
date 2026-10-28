import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { FeuilleNePlusSuivre } from "~/composants/suivi/FeuilleNePlusSuivre";
import { INDICE_COMPTE_PAR_LANGUE } from "~/contenus/indice-compte";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_SUIVI_PAR_LANGUE } from "~/contenus/textes-suivi";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { lirePersonneSuivie } from "~/fonctions/suivi/lire-personne-suivie";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserEtatSuivi } from "~/hooks/utiliser-etat-suivi";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** Clé de suivi (calculerCleSuivi, ecrireCleSuivi) : « lieu:<id> », « createur:<pseudo> » ou « personne:<id> » */
  cle: string;
  /** Lu par VoiceOver et dans les annonces : « @lea.mange », le nom du lieu ou le prénom d'une personne */
  nom: string;
  /** Son emoji (🎬 pour un créateur, celui du lieu, l'avatar d'une personne), dans la feuille de confirmation */
  emoji: string;
  /** Affiche le petit message de l'écran (« 🔔 Tu suis maintenant … ! », « Tu ne suis plus … ») */
  onAnnoncer: (texte: string) => void;
  /** « grand » sur la fiche d'un lieu, la page d'un créateur et le profil d'une personne, « compact » dans les lignes (« Tu suis », abonnés, suggestions) */
  taille?: "grand" | "compact";
};

// Deux appuis plus rapprochés que ça comptent pour un seul : un double toucher sur « Suivre » n'ouvre pas aussitôt « Ne plus suivre ? »
const DELAI_ANTI_DOUBLE_APPUI = 700;

// « Choisir mon pseudo » : la feuille se referme d'abord, puis on part (allerChoisirPseudo)
const rienAFaire = () => {};

/**
 * La feuille ouverte (ou en train de se refermer) ; null : jamais ouverte, donc pas encore préparée. « pseudo » : pas encore de
 * pseudo pour suivre une personne, la feuille propose d'aller le choisir (et ne t'y emmène qu'une fois refermée)
 */
type Feuille = { type: "ne-plus-suivre" | "annuler-demande" | "pseudo"; visible: boolean } | null;

/**
 * « Suivre » (jaune) suit tout de suite, ou envoie une demande si le compte est privé (« Demandé ⏱ ») ; « Suivi ✓ » ouvre
 * une feuille « Ne plus suivre … ? » et « Demandé » une feuille « Annuler ta demande ? » : rien ne se défait sur un seul
 * toucher. Marche pour un lieu, un créateur ou une personne (utiliserEtatSuivi) ; rien du tout quand la règle ne permet
 * pas de suivre (toi, personne bloquée…). Lit lui-même l'état du suivi : il se met à jour même dans un en-tête mémorisé.
 * Sans compte (visite), il ouvre la feuille « Crée ton compte ».
 */
export function BoutonSuivreProfil({ cle, nom, emoji, onAnnoncer, taille = "grand" }: Props) {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const T = utiliserTextes(TEXTES_SUIVI_PAR_LANGUE);
  const indiceCompte = utiliserTextes(INDICE_COMPTE_PAR_LANGUE);
  const refusLimitation = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE).suivre;
  const etatSuivi = utiliserEtatSuivi(cle);
  const exiger = utiliserCompteRequis();
  const avecCompte = utiliserProfil().profil !== null;
  const [feuille, setFeuille] = useState<Feuille>(null);
  const dernierAppui = useRef(0);
  const bouton = useRef<View>(null);
  // « Annuler la demande » touché alors qu'elle venait d'être acceptée : on le dit, plutôt que d'annoncer une annulation qui n'a pas eu lieu
  const tropTard = useRef(false);
  const { etat, surDemande, meSuit } = etatSuivi;
  const personne = etatSuivi.type === "personne";
  const suivi = etat === "suivi";
  const demande = etat === "demande";
  const compact = taille === "compact";

  function toucher() {
    const maintenant = Date.now();
    if (maintenant - dernierAppui.current < DELAI_ANTI_DOUBLE_APPUI) return;
    dernierAppui.current = maintenant;
    vibrerLegerement();
    if (!exiger("suivre")) return;
    if (suivi) return setFeuille({ type: "ne-plus-suivre", visible: true });
    if (demande) return setFeuille({ type: "annuler-demande", visible: true });
    // Affiché tout de suite ; si le serveur refuse ensuite, le bouton revient à « Suivre » et on dit pourquoi
    const resultat = etatSuivi.suivre((erreur) =>
      onAnnoncer(erreur === "compte-limite" ? refusLimitation : T.impossibleReessaie(nom)),
    );
    if (resultat === "suivi") onAnnoncer(T.suisMaintenant(nom));
    else if (resultat === "demande") onAnnoncer(T.demandeEnvoyee(nom));
    else if (resultat === "interdit") onAnnoncer(T.impossible(nom));
    // Une feuille plutôt qu'un changement d'écran aussitôt : on sait pourquoi on part (et VoiceOver n'est pas coupé en route)
    else if (resultat === "pseudo-manquant") setFeuille({ type: "pseudo", visible: true });
  }

  // « Choisir mon pseudo » touché, feuille refermée : direction Mes infos
  function allerChoisirPseudo() {
    router.push("/reglages/infos");
  }

  // Déjà arrêté ailleurs pendant que la feuille était ouverte : nePlusSuivre ne fait rien (surtout pas se réabonner)
  function arreterDeSuivre() {
    etatSuivi.nePlusSuivre();
  }

  function annulerDemande() {
    // Acceptée pendant que la feuille était ouverte : il n'y a plus rien à annuler
    tropTard.current = !demande;
    etatSuivi.annulerDemande();
  }

  // Annoncé une fois la feuille refermée : VoiceOver est revenu de lui-même sur le bouton (TalkBack, lui, a besoin qu'on l'y ramène)
  function annoncerArret() {
    if (Platform.OS === "android") deplacerFocusLecteurEcran(bouton.current);
    onAnnoncer(T.nePlusSuivi(nom));
  }

  function annoncerAnnulation() {
    if (Platform.OS === "android") deplacerFocusLecteurEcran(bouton.current);
    onAnnoncer(tropTard.current ? T.tropTard(nom) : T.demandeAnnulee(nom));
  }

  // « Suivre en retour » seulement en grand : dans une ligne, « Te suit » est déjà écrit à côté du nom
  const suivreEnRetour = !suivi && !demande && meSuit && !compact;
  const libelle = suivi ? T.libelles.suivi : demande ? T.libelles.demande : suivreEnRetour ? T.libelles.suivreEnRetour : T.libelles.suivre;
  const icone = suivi ? "checkmark" : demande ? "time-outline" : "person-add";
  const fondBlanc = suivi || demande;
  const texteBouton = fondBlanc ? "text-encre" : "text-nuit";
  const iconeBouton = fondBlanc ? couleurs.encre : couleurs.nuit;
  const indicePourSuivre = surDemande ? T.indicePrive : personne ? T.indicePersonne : T.indicePublications;
  const accessibilite = {
    accessibilityRole: "button" as const,
    // Commence par le mot affiché : Commande vocale trouve le bouton (« Toucher Suivi », « Toucher Demandé »)
    accessibilityLabel: suivi
      ? T.suiviLu(nom)
      : demande
        ? T.demandeLu(nom)
        : `${suivreEnRetour ? T.suivreEnRetourLu(nom) : T.suivreLu(nom)}${surDemande ? T.comptePriveLu : ""}`,
    // En visite, VoiceOver dit avant qu'on touche qu'un compte sera demandé (comme le menu « ⋯ » du fil)
    accessibilityHint: !avecCompte ? indiceCompte : suivi ? T.indiceNePlusSuivre : demande ? T.indiceAnnulerDemande : indicePourSuivre,
  };

  // Préparée seulement au premier « Suivi » ou « Demandé » touché : rien de plus à dessiner à l'arrivée sur la fiche ou la liste
  const fermer = () => setFeuille((f) => (f ? { ...f, visible: false } : f));
  const confirmation =
    feuille === null ? null : feuille.type === "ne-plus-suivre" ? (
      <FeuilleNePlusSuivre
        visible={feuille.visible && etat !== "interdit"}
        nom={nom}
        emoji={emoji}
        personneId={lirePersonneSuivie(cle)}
        detail={!personne ? undefined : surDemande ? T.nePlusSuivre.detailPrive : T.nePlusSuivre.detailPersonne}
        onConfirmer={arreterDeSuivre}
        onRefermee={annoncerArret}
        onFermer={fermer}
      />
    ) : feuille.type === "pseudo" ? (
      <FeuilleConfirmation
        visible={feuille.visible && etat !== "interdit"}
        emoji="🏷️"
        titre={T.pseudo.titre}
        detail={T.pseudo.detail(nom)}
        libelleConfirmer={T.pseudo.confirmer}
        libelleRester={T.pseudo.rester}
        indiceRester={T.pseudo.indiceRester(nom)}
        onConfirmer={rienAFaire}
        onRefermee={allerChoisirPseudo}
        onFermer={fermer}
      />
    ) : (
      <FeuilleConfirmation
        visible={feuille.visible && etat !== "interdit"}
        emoji={emoji}
        personneId={lirePersonneSuivie(cle)}
        titre={T.annulerDemande.titre(nom)}
        detail={T.annulerDemande.detail(nom)}
        libelleConfirmer={T.annulerDemande.confirmer}
        libelleRester={T.annulerDemande.rester}
        indiceRester={T.annulerDemande.indiceRester(nom)}
        onConfirmer={annulerDemande}
        onRefermee={annoncerAnnulation}
        onFermer={fermer}
      />
    );

  // Comme le Bouton SOS Miam en grand : bord noir et ombre décalée, avec une icône
  const dessin = compact ? (
    <Pressable
      ref={bouton}
      {...accessibilite}
      // 36 pt de haut à l'écran, 48 pt sous le doigt
      hitSlop={6}
      onPress={toucher}
      className={`h-9 min-w-24 flex-row items-center justify-center gap-1 rounded-full border-2 border-encre px-3 active:opacity-70 ${fondBlanc ? "bg-carte" : "bg-jaune"}`}
    >
      <Ionicons name={icone} size={14} color={iconeBouton} />
      <Text className={`font-texte-gras text-[13px] ${texteBouton}`}>{libelle}</Text>
      {fondBlanc ? <Ionicons name="chevron-down" size={12} color={couleurs.encre} /> : null}
    </Pressable>
  ) : (
    <View className="relative">
      <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
      <Pressable
        ref={bouton}
        {...accessibilite}
        onPress={toucher}
        className={`min-h-14 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-6 py-3.5 active:translate-x-0.5 active:translate-y-0.5 ${fondBlanc ? "bg-carte" : "bg-jaune"}`}
      >
        <Ionicons name={icone} size={suivi ? 20 : 18} color={iconeBouton} />
        <Text className={`font-texte-gras text-base ${texteBouton}`}>{libelle}</Text>
        {fondBlanc ? <Ionicons name="chevron-down" size={16} color={couleurs.encre} /> : null}
      </Pressable>
    </View>
  );

  // Rien à suivre (toi, personne bloquée, pas encore prêt) : pas de bouton, et une feuille ouverte se referme. La feuille
  // garde sa place (même rang dans le fragment) pour finir sa sortie et annoncer
  return (
    <>
      {etat === "interdit" ? null : dessin}
      {confirmation}
    </>
  );
}
