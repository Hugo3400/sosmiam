import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { CodeQrInvitation } from "~/composants/potes/CodeQrInvitation";
import { ListesDuProfil } from "~/composants/potes/ListesDuProfil";
import { ProfilCommunautaire } from "~/composants/potes/ProfilCommunautaire";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { CompteursSuivi } from "~/composants/suivi/CompteursSuivi";
import { EncadreComptePrive } from "~/composants/suivi/EncadreComptePrive";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import couleurs from "~/theme/couleurs";

/** Demande confirmation avant une action qui compte ; sur le web (aperçu de développement), Alert n'existe pas : on agit directement */
const confirmer = (titre: string, message: string, action: string, faire: () => void) => {
  if (Platform.OS === "web") return faire();
  Alert.alert(titre, message, [
    { text: "Annuler", style: "cancel" },
    { text: action, style: "destructive", onPress: faire },
  ]);
};

/**
 * Le profil communautaire d'un pote, ou le tien (id « moi »), avec ses abonnés et abonnements. Pour toi : ses listes et
 * « Partager mon profil » (lien et QR code). Pour quelqu'un d'autre : le suivre (ou lui demander, compte privé), l'ajouter à ta bande,
 * lui écrire (pote de ta bande), le retirer de ta bande, le bloquer (avec confirmation) ou le signaler.
 * Compte privé (ou mineur vu par un adulte hors de sa bande « en vrai ») : l'en-tête et un encadré, rien d'autre.
 * Personne bloquée ou inconnue : un message et le retour.
 */
export default function ProfilPote() {
  const router = useRouter();
  const navigation = useNavigation();
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const communaute = utiliserCommunaute();
  const suivis = utiliserSuivisPersonnes();
  const { ouvrirPrive } = utiliserConversations();
  const [signalementOuvert, setSignalementOuvert] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const pote = communaute.trouverPote(id);
  const estMoi = id === ID_MOI;
  const bloque = communaute.bloques.some((p) => p.id === id);
  const dansBande = communaute.potes.some((p) => p.id === id);
  // Ce que tu vois de cette personne et ce que la règle permet (null : pas encore prêt, ou personne inconnue)
  const relation = suivis.pret && !estMoi ? suivis.relationAvec(id) : null;
  const jeSuis = relation?.jeSuis;

  const revenir = () => (router.canGoBack() ? router.back() : router.replace("/potes"));
  const annoncer = (texte: string) => {
    setMessage(texte);
    // Sans les emoji (VoiceOver en dirait le nom) ; sur iPhone, après la phrase en cours (le bouton qu'il vient de lire)
    const lu = retirerEmoji(texte);
    if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(lu, { queue: true });
    else AccessibilityInfo.announceForAccessibility(lu);
  };

  // Compte privé : la demande est acceptée pendant que tu regardes son profil, qui s'ouvre en direct
  const jeSuisAvant = useRef(jeSuis);
  useEffect(() => {
    if (jeSuisAvant.current === "demande" && jeSuis === "suivi" && pote) annoncer(`${pote.prenom} a accepté ta demande : bienvenue dans ses bons plans !`);
    jeSuisAvant.current = jeSuis;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement quand ton lien avec cette personne change
  }, [jeSuis]);

  // Tant que les suivis (et la communauté) ne sont pas relus : un écran crème, comme l'onglet Potes, plutôt qu'un faux « introuvable »
  if (!suivis.pret) return <View style={{ flex: 1, backgroundColor: couleurs.creme }} />;

  if (!pote || (!estMoi && !bloque && !relation)) {
    return (
      <EcranReglage titre="Personne à l'horizon" sousTitre="On ne trouve pas ce profil : la personne a peut-être quitté SOS Miam, ou le lien s'est emmêlé.">
        <Bouton libelle="Retour" variante="blanc" onPress={revenir} />
      </EcranReglage>
    );
  }

  if (bloque) {
    return (
      <EcranReglage titre={`Tu as bloqué ${pote.prenom}`} sousTitre="Cette personne n'est plus dans ta bande, et tu ne vois plus ses messages ni ses commentaires.">
        <View className="gap-4">
          <Bouton libelle="Retour" onPress={revenir} />
          <Bouton
            libelle="Débloquer"
            variante="blanc"
            indice="Tu reverras ses messages et ses commentaires. Débloquer ne remet personne dans ta bande."
            onPress={() =>
              confirmer(`Débloquer ${pote.prenom} ?`, "Tu reverras ses messages et ses commentaires. Débloquer ne remet personne dans ta bande.", "Débloquer", () => {
                communaute.debloquer(pote.id);
                AccessibilityInfo.announceForAccessibility(`Tu as débloqué ${pote.prenom}.`);
              })
            }
          />
        </View>
      </EcranReglage>
    );
  }

  const prenom = pote.prenom;
  const visibilite = relation?.visibilite ?? "complet";
  const complet = estMoi || visibilite === "complet";
  // Un adulte n'ajoute jamais un mineur depuis un profil (et, tant que les comptes n'existent pas, d'aucune autre façon)
  const ajoutable = !estMoi && !dansBande && !(pote.mineur && !communaute.moiMineur);
  // Le bouton Suivre s'affiche si la règle le permet, ou pour défaire un lien qui existe déjà (gardé au passage à 18 ans)
  const suivreVisible = !!relation && (relation.verdict.permis || (relation.verdict.raison === "age" && relation.jeSuis !== "aucun"));
  const refusAgeAdo = communaute.moiMineur && !!relation && !relation.verdict.permis && relation.verdict.raison === "age" && relation.jeSuis === "aucun";

  const ajouter = () => {
    const resultat = communaute.ajouterPote(pote.id, "pseudo");
    annoncer(
      resultat === "ajoute" || resultat === "deja"
        ? `${prenom} fait partie de ta bande !`
        : resultat === "mineur"
          ? "Cette personne ne s'ajoute pas par son pseudo."
          : "Impossible de l'ajouter pour l'instant. Réessaie dans un instant ?",
    );
  };

  // Protection des 15-17 ans : avec un mineur, on ne discute qu'après s'être ajoutés en vrai
  const ecrire = () => {
    const conversation = ouvrirPrive(pote.id);
    if (!conversation) {
      annoncer(
        `Pour discuter avec ${prenom}, il faudra vous ajouter en vrai, avec un lien ou un QR code vérifié : ça arrive avec les comptes. C'est la règle des 15-17 ans, et elle protège tout le monde.`,
      );
      return;
    }
    const cible = { pathname: "/potes/discussion/[id]", params: { id: conversation } } as const;
    // Profil ouvert depuis cette discussion : on y revient, plutôt que d'en empiler une deuxième (deux retours, messages lus deux fois).
    // Seulement si c'est la dernière discussion de la pile : c'est celle que retrouve dismissTo
    const discussions = (navigation.getState()?.routes ?? []).filter((r) => r.name === "discussion/[id]");
    const derniere = discussions[discussions.length - 1]?.params as { id?: string } | undefined;
    if (derniere?.id === conversation) router.dismissTo(cible);
    else router.push(cible);
  };

  const retirer = () =>
    confirmer(
      `Retirer ${prenom} de ta bande ?`,
      pote.mineur && !communaute.moiMineur ? "Tu ne pourras pas l'y remettre avant l'arrivée des comptes." : "Pas de drame : tu pourras l'y remettre quand tu veux.",
      "Retirer",
      () => {
        communaute.retirerPote(pote.id);
        annoncer(`${prenom} ne fait plus partie de ta bande.`);
      },
    );

  const bloquer = () =>
    confirmer(
      `Bloquer ${prenom} ?`,
      dansBande
        ? `${prenom} sortira de ta bande, vous ne vous suivrez plus, et tu ne verras plus ses messages ni ses commentaires.`
        : "Vous ne vous suivrez plus, et tu ne verras plus ses messages ni ses commentaires.",
      "Bloquer",
      () => {
        communaute.bloquer(pote.id);
        AccessibilityInfo.announceForAccessibility(`Tu as bloqué ${prenom}.`);
      },
    );

  // Sous l'en-tête, dans cet ordre : Suivre, pourquoi pas de Suivre (ado), Suivre ou Ma bande, Ajouter, Écrire, et le dernier message
  const lignesActions = estMoi
    ? []
    : [
        suivreVisible ? <BoutonSuivreProfil key="suivre" cle={`personne:${pote.id}`} nom={prenom} emoji={pote.avatar} onAnnoncer={annoncer} taille="grand" /> : null,
        refusAgeAdo ? (
          <Text key="age" className="text-center font-texte text-sm leading-5 text-gris">
            {lierPonctuation("Entre 15 et 17 ans, tu suis les lieux, les créateurs et les gens de ton âge.")}
          </Text>
        ) : null,
        suivreVisible && ajoutable ? (
          <Text key="difference" className="text-center font-texte text-sm leading-5 text-gris">
            {lierPonctuation("Suivre, c'est voir passer ses listes et ses lieux. Ma bande, c'est pour sortir ensemble et discuter.")}
          </Text>
        ) : null,
        ajoutable ? (
          <Bouton key="ajouter" libelle={`Ajouter ${prenom} à ma bande`} variante="blanc" indice="Pour organiser des sorties et vous envoyer des lieux" onPress={ajouter} />
        ) : null,
        dansBande ? <Bouton key="ecrire" libelle={`Écrire à ${prenom}`} indice="Ouvre votre conversation privée" onPress={ecrire} /> : null,
        message ? (
          <Text key="message" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-center font-texte-semi text-sm text-encre">
            {lierPonctuation(message)}
          </Text>
        ) : null,
      ].filter((ligne) => ligne !== null);
  const actions = lignesActions.length > 0 ? <View className="gap-4">{lignesActions}</View> : null;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10">
        {estMoi ? null : (
          <View className="flex-row items-center gap-2.5 rounded-2xl border-2 border-dashed border-gris/40 bg-white/70 px-3.5 py-2.5">
            <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-lg">
              🧪
            </Text>
            <Text className="flex-1 font-texte text-[13px] leading-5 text-gris">
              <Text className="font-texte-gras text-encre">Potes d'exemple</Text>
              {lierPonctuation(" : tes vrais potes arriveront avec les comptes.")}
            </Text>
          </View>
        )}

        <ProfilCommunautaire
          pote={pote}
          estMoi={estMoi}
          visibilite={visibilite}
          compteurs={<CompteursSuivi id={id} />}
          teSuit={relation?.meSuit ?? false}
          actions={actions}
        />

        {complet ? <ListesDuProfil auteurId={pote.id} prenom={prenom} estMoi={estMoi} /> : <EncadreComptePrive prenom={prenom} peutDemander={!!relation?.verdict.permis} />}

        {estMoi ? (
          <SectionReglages titre="Partager mon profil">
            <View className="gap-3 pt-1">
              <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation("Ton QR code et ton lien : quand les comptes arriveront, tes potes t'ajouteront avec, sans chercher ton pseudo.")}</Text>
              <CodeQrInvitation pseudo={pote.pseudo} libellePartage="Partager mon profil" />
            </View>
          </SectionReglages>
        ) : (
          <View>
            {dansBande ? <LigneReglage emoji="👋" titre="Retirer de ma bande" detail="Vous restez potes dans la vraie vie, hein" onPress={retirer} /> : null}
            <LigneReglage emoji="🚫" titre="Bloquer" detail="Plus de messages ni de commentaires de sa part" danger onPress={bloquer} />
            <LigneReglage emoji="🚩" titre="Signaler" detail="Faux profil, harcèlement, contenu gênant…" onPress={() => setSignalementOuvert(true)} />
          </View>
        )}
      </ScrollView>

      <Modal visible={signalementOuvert} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={() => setSignalementOuvert(false)}>
        {/* La feuille remonte au-dessus du clavier quand on écrit le pourquoi du signalement */}
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Fermer" onPress={() => setSignalementOuvert(false)} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
          <View
            accessibilityViewIsModal
            onAccessibilityEscape={() => setSignalementOuvert(false)}
            style={{ paddingBottom: marges.bottom + 12, maxHeight: hauteurEcran * 0.88, flexShrink: 1 }}
            className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
          >
            <View className="mb-3 h-1.5 w-12 self-center rounded-full bg-ligne" />
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
              <SignalerContenu cible="profil" cibleId={pote.id} sujet={`le profil de ${prenom}`} onTermine={() => setSignalementOuvert(false)} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
