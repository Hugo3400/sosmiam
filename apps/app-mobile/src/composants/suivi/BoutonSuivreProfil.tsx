import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useRef, useState } from "react";
import { Platform, Pressable, Text, View } from "react-native";

import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { FeuilleNePlusSuivre } from "~/composants/suivi/FeuilleNePlusSuivre";
import { INDICE_COMPTE } from "~/contenus/indice-compte";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserEtatSuivi } from "~/hooks/utiliser-etat-suivi";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import couleurs from "~/theme/couleurs";

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

/** La feuille de confirmation ouverte (ou en train de se refermer) ; null : jamais ouverte, donc pas encore préparée */
type Feuille = { type: "ne-plus-suivre" | "annuler-demande"; visible: boolean } | null;

/**
 * « Suivre » (jaune) suit tout de suite, ou envoie une demande si le compte est privé (« Demandé ⏱ ») ; « Suivi ✓ » ouvre
 * une feuille « Ne plus suivre … ? » et « Demandé » une feuille « Annuler ta demande ? » : rien ne se défait sur un seul
 * toucher. Marche pour un lieu, un créateur ou une personne (utiliserEtatSuivi) ; rien du tout quand la règle ne permet
 * pas de suivre (toi, personne bloquée, âge…). Lit lui-même l'état du suivi : il se met à jour même dans un en-tête mémorisé.
 * Sans compte (visite), il ouvre la feuille « Crée ton compte ».
 */
export function BoutonSuivreProfil({ cle, nom, emoji, onAnnoncer, taille = "grand" }: Props) {
  const router = useRouter();
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
    const resultat = etatSuivi.suivre();
    if (resultat === "suivi") onAnnoncer(`🔔 Tu suis maintenant ${nom} !`);
    else if (resultat === "demande") onAnnoncer(`📨 Demande envoyée à ${nom}. Croisons les doigts (et les fourchettes) !`);
    else if (resultat === "interdit") onAnnoncer(`Impossible de suivre ${nom} pour l'instant.`);
    else if (resultat === "pseudo-manquant") {
      onAnnoncer("Choisis d'abord ton pseudo : c'est lui que verront les gens que tu suis.");
      router.push("/reglages/infos");
    }
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
    onAnnoncer(`Tu ne suis plus ${nom}, sans rancune 👋`);
  }

  function annoncerAnnulation() {
    if (Platform.OS === "android") deplacerFocusLecteurEcran(bouton.current);
    onAnnoncer(tropTard.current ? `Trop tard : ${nom} venait d'accepter ta demande ! Touche « Suivi » si tu préfères ne plus suivre.` : `Demande annulée. ${nom} n'en saura rien 🤫`);
  }

  // « Suivre en retour » seulement en grand : dans une ligne, « Te suit » est déjà écrit à côté du nom
  const libelle = suivi ? "Suivi" : demande ? "Demandé" : meSuit && !compact ? "Suivre en retour" : "Suivre";
  const icone = suivi ? "checkmark" : demande ? "time-outline" : "person-add";
  const fondBlanc = suivi || demande;
  const indicePourSuivre = surDemande
    ? "Son compte est privé : ça lui envoie une demande"
    : personne
      ? "Tu verras passer ses listes et ses lieux"
      : "Ses prochaines publications passeront en tête de ton fil";
  const accessibilite = {
    accessibilityRole: "button" as const,
    // Commence par le mot affiché : Commande vocale trouve le bouton (« Toucher Suivi », « Toucher Demandé »)
    accessibilityLabel: suivi
      ? `Suivi, tu suis ${nom}`
      : demande
        ? `Demandé, demande envoyée à ${nom}`
        : `${libelle === "Suivre" ? `Suivre ${nom}` : `Suivre en retour, ${nom} te suit`}${surDemande ? ", compte privé" : ""}`,
    // En visite, VoiceOver dit avant qu'on touche qu'un compte sera demandé (comme le menu « ⋯ » du fil)
    accessibilityHint: !avecCompte ? INDICE_COMPTE : suivi ? "Touche pour ne plus suivre" : demande ? "Touche pour annuler ta demande" : indicePourSuivre,
  };

  // Préparée seulement au premier « Suivi » ou « Demandé » touché : rien de plus à dessiner à l'arrivée sur la fiche ou la liste
  const fermer = () => setFeuille((f) => (f ? { ...f, visible: false } : f));
  const confirmation =
    feuille === null ? null : feuille.type === "ne-plus-suivre" ? (
      <FeuilleNePlusSuivre
        visible={feuille.visible && etat !== "interdit"}
        nom={nom}
        emoji={emoji}
        detail={
          !personne
            ? undefined
            : surDemande
              ? "Son compte est privé : pour revoir ses listes et ses lieux, il faudra refaire une demande."
              : "Ses listes ne remonteront plus chez toi. Pas de drame, pas de porte qui claque : tu pourras revenir quand tu veux."
        }
        onConfirmer={arreterDeSuivre}
        onRefermee={annoncerArret}
        onFermer={fermer}
      />
    ) : (
      <FeuilleConfirmation
        visible={feuille.visible && etat !== "interdit"}
        emoji={emoji}
        titre={`Annuler ta demande à ${nom} ?`}
        detail={`${nom} ne verra plus ta demande. Tu pourras en refaire une quand tu veux.`}
        libelleConfirmer="Annuler la demande"
        libelleRester="Je patiente"
        indiceRester={`Ta demande à ${nom} reste envoyée`}
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
      className={`h-9 min-w-24 flex-row items-center justify-center gap-1 rounded-full border-2 border-encre px-3 active:opacity-70 ${fondBlanc ? "bg-white" : "bg-jaune"}`}
    >
      <Ionicons name={icone} size={14} color={couleurs.encre} />
      <Text className="font-texte-gras text-[13px] text-encre">{libelle}</Text>
      {fondBlanc ? <Ionicons name="chevron-down" size={12} color={couleurs.encre} /> : null}
    </Pressable>
  ) : (
    <View className="relative">
      <View className="absolute inset-0 translate-x-1 translate-y-1 rounded-full bg-encre" />
      <Pressable
        ref={bouton}
        {...accessibilite}
        onPress={toucher}
        className={`min-h-14 flex-row items-center justify-center gap-2 rounded-full border-2 border-encre px-6 py-3.5 active:translate-x-0.5 active:translate-y-0.5 ${fondBlanc ? "bg-white" : "bg-jaune"}`}
      >
        <Ionicons name={icone} size={suivi ? 20 : 18} color={couleurs.encre} />
        <Text className="font-texte-gras text-base text-encre">{libelle}</Text>
        {fondBlanc ? <Ionicons name="chevron-down" size={16} color={couleurs.encre} /> : null}
      </Pressable>
    </View>
  );

  // Rien à suivre (toi, personne bloquée, âge, pas encore prêt) : pas de bouton, et une feuille ouverte se referme. La feuille
  // garde sa place (même rang dans le fragment) pour finir sa sortie et annoncer, par exemple après « Ne plus suivre » un lien
  // que la règle ne permettrait plus de refaire (passage à 18 ans)
  return (
    <>
      {etat === "interdit" ? null : dessin}
      {confirmation}
    </>
  );
}
