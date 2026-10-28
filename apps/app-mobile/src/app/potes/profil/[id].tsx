import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Alert, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, useWindowDimensions, View } from "react-native";
import Animated, { useReducedMotion } from "react-native-reanimated";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";

import { Bouton } from "~/composants/interface/Bouton";
import { PoigneeFeuille } from "~/composants/interface/PoigneeFeuille";
import { CodeQrInvitation } from "~/composants/potes/CodeQrInvitation";
import { ListesDuProfil } from "~/composants/potes/ListesDuProfil";
import { ProfilCommunautaire } from "~/composants/potes/ProfilCommunautaire";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import { BandeDemandeRecue } from "~/composants/suivi/BandeDemandeRecue";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { CompteursSuivi } from "~/composants/suivi/CompteursSuivi";
import { EncadreComptePrive } from "~/composants/suivi/EncadreComptePrive";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_ECRAN_PROFIL_POTE_PAR_LANGUE } from "~/contenus/textes-ecran-profil-pote";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGlisserPourFermer } from "~/hooks/utiliser-glisser-pour-fermer";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserProfilCommunautaire } from "~/hooks/utiliser-profil-communautaire";
import { utiliserSuivisPersonnes } from "~/hooks/utiliser-suivis-personnes";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Demande confirmation avant une action qui compte ; sur le web (aperçu de développement), Alert n'existe pas : on agit directement */
const confirmer = (titre: string, message: string, action: string, annuler: string, faire: () => void) => {
  if (Platform.OS === "web") return faire();
  Alert.alert(titre, message, [
    { text: annuler, style: "cancel" },
    { text: action, style: "destructive", onPress: faire },
  ]);
};

/**
 * Le profil communautaire d'un pote, ou le tien (id « moi »), avec ses abonnés et abonnements. Pour toi : ses listes et
 * « Partager mon profil » (lien et QR code). Pour quelqu'un d'autre : le suivre (ou lui demander, compte privé), l'ajouter à ta bande,
 * lui écrire (pote de ta bande), le retirer de ta bande, le bloquer (avec confirmation) ou le signaler.
 * Compte privé (ni de ta bande « en vrai », ni suivi) : l'en-tête et un encadré, rien d'autre.
 * Personne bloquée ou inconnue : un message et le retour.
 */
export default function ProfilPote() {
  const T = utiliserTextes(TEXTES_ECRAN_PROFIL_POTE_PAR_LANGUE);
  const REFUS_LIMITATION = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const navigation = useNavigation();
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const communaute = utiliserCommunaute();
  const monId = utiliserMonId();
  const suivis = utiliserSuivisPersonnes();
  const { ouvrirPrive } = utiliserConversations();
  const [signalementOuvert, setSignalementOuvert] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const geste = utiliserGlisserPourFermer(signalementOuvert, () => setSignalementOuvert(false));

  // Compte connecté : son profil est lu sur le serveur (la communauté le connaît ensuite)
  const lecture = utiliserProfilCommunautaire(id);
  const pote = communaute.trouverPote(id);
  const estMoi = id === monId;
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
    if (jeSuisAvant.current === "demande" && jeSuis === "suivi" && pote) annoncer(T.demandeAcceptee(pote.prenom));
    jeSuisAvant.current = jeSuis;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- seulement quand ton lien avec cette personne change
  }, [jeSuis]);

  // Sa demande à te suivre : la bande apparaît dès qu'il y en a une, et garde sa place (avec ta réponse) jusqu'à ton départ
  const [bandeDemande, setBandeDemande] = useState(false);
  if (relation?.demandeRecue && !bandeDemande) setBandeDemande(true);

  // Tant que les suivis (et la communauté) ne sont pas relus : un écran crème, comme l'onglet Potes, plutôt qu'un faux « introuvable »
  if (!suivis.pret || (lecture.chargement && !pote)) return <View style={{ flex: 1, backgroundColor: couleurs.creme }} />;

  if (!pote || (!estMoi && !bloque && !relation)) {
    return (
      <EcranReglage titre={T.introuvableTitre} sousTitre={T.introuvableTexte}>
        <Bouton libelle={T.retour} variante="blanc" onPress={revenir} />
      </EcranReglage>
    );
  }

  if (bloque) {
    return (
      <EcranReglage titre={T.bloqueTitre(pote.prenom)} sousTitre={T.bloqueTexte}>
        <View className="gap-4">
          <Bouton libelle={T.retour} onPress={revenir} />
          <Bouton
            libelle={T.debloquer}
            variante="blanc"
            indice={T.debloquerDetail}
            onPress={() =>
              confirmer(T.debloquerTitre(pote.prenom), T.debloquerDetail, T.debloquer, T.annuler, () => {
                communaute.debloquer(pote.id);
                AccessibilityInfo.announceForAccessibility(T.debloque(pote.prenom));
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
  const ajoutable = !estMoi && !dansBande;
  // Le bouton Suivre s'affiche si la règle le permet
  const suivreVisible = !!relation && relation.verdict.permis;

  const demandeBandeRecue = communaute.demandesRecues.some((p) => p.id === id);
  const demandeBandeEnvoyee = communaute.demandesEnvoyees.some((p) => p.id === id);
  const accepterDemande = async () => {
    const erreur = await communaute.accepterDemandeBande(pote.id);
    annoncer(erreur ? T.rate : T.aRejoint(prenom));
  };
  const retirerDemande = async (pourquoi: "refuse" | "annule") => {
    const erreur = await communaute.retirerDemandeBande(pote.id);
    annoncer(erreur ? T.rate : pourquoi === "refuse" ? T.refusDiscret : T.demandeAnnulee);
  };
  // Par le profil, c'est une demande ; s'il t'avait déjà demandé, vous voilà potes
  const ajouter = async () => {
    const resultat = await communaute.demanderAjout(pote.id);
    annoncer(
      resultat.type === "ajoute" || resultat.type === "deja"
        ? T.ajoute(prenom)
        : resultat.type === "demande"
          ? T.demandeEnvoyee(prenom)
          : resultat.type === "demandes-fermees"
            ? T.demandesFermees(prenom)
            : resultat.type === "erreur" && resultat.erreur === "compte-limite"
              ? REFUS_LIMITATION.bande
              : T.ajoutRate,
    );
  };

  // On écrit seulement à un pote de ta bande (pas bloqué)
  const ecrire = async () => {
    const conversation = await ouvrirPrive(pote.id);
    if (!conversation) {
      annoncer(T.pasDansBande(prenom));
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
      T.retirerTitre(prenom),
      T.retirerDetail,
      T.retirer,
      T.annuler,
      () => {
        communaute.retirerPote(pote.id);
        annoncer(T.retire(prenom));
      },
    );

  const bloquer = () =>
    confirmer(
      T.bloquerTitre(prenom),
      dansBande ? T.bloquerDetailBande(prenom) : T.bloquerDetail,
      T.bloquer,
      T.annuler,
      () => {
        communaute.bloquer(pote.id);
        AccessibilityInfo.announceForAccessibility(T.bloque(prenom));
      },
    );

  // Sous l'en-tête, dans cet ordre : sa demande à te suivre (s'il y en a une), Suivre, Suivre ou Ma bande, Ajouter, Écrire,
  // et le dernier message
  const lignesActions = estMoi
    ? []
    : [
        bandeDemande ? <BandeDemandeRecue key="demande" pote={pote} /> : null,
        suivreVisible ? <BoutonSuivreProfil key="suivre" cle={`personne:${pote.id}`} nom={prenom} emoji={pote.avatar} onAnnoncer={annoncer} taille="grand" /> : null,
        suivreVisible && ajoutable ? (
          <Text key="difference" className="text-center font-texte text-sm leading-5 text-gris">
            {lierPonctuation(T.difference)}
          </Text>
        ) : null,
        // Sa demande de bande : l'accepter ou la refuser (il n'est pas prévenu d'un refus)
        ajoutable && demandeBandeRecue ? (
          <View key="demande-bande" className="gap-3 rounded-2xl border-2 border-encre bg-jaune-clair p-4">
            <Text className="font-texte-gras text-base text-encre">{lierPonctuation(T.veutRejoindre(prenom))}</Text>
            <Bouton libelle={T.accepter} petit indice={T.accepterIndice(prenom)} onPress={() => void accepterDemande()} />
            <Bouton libelle={T.pasMaintenant} variante="blanc" petit indice={T.pasMaintenantIndice(prenom)} onPress={() => void retirerDemande("refuse")} />
          </View>
        ) : null,
        ajoutable && demandeBandeEnvoyee ? (
          <Bouton key="annuler-demande" libelle={T.annulerDemande} variante="blanc" indice={T.annulerDemandeIndice(prenom)} onPress={() => void retirerDemande("annule")} />
        ) : null,
        ajoutable && !demandeBandeRecue && !demandeBandeEnvoyee ? (
          <Bouton key="ajouter" libelle={T.ajouter(prenom)} variante="blanc" indice={T.ajouterIndice} onPress={() => void ajouter()} />
        ) : null,
        dansBande ? <Bouton key="ecrire" libelle={T.ecrire(prenom)} indice={T.ecrireIndice} onPress={() => void ecrire()} /> : null,
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
          accessibilityLabel={T.retour}
          hitSlop={12}
          onPress={revenir}
          className="h-10 w-10 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
      </View>

      <ScrollView className="flex-1" contentContainerClassName="gap-6 px-5 pb-10">

        <ProfilCommunautaire
          pote={pote}
          estMoi={estMoi}
          visibilite={visibilite}
          compteurs={<CompteursSuivi id={id} />}
          teSuit={relation?.meSuit ?? false}
          actions={actions}
        />

        {complet ? <ListesDuProfil auteurId={pote.id} prenom={prenom} estMoi={estMoi} /> : <EncadreComptePrive prenom={prenom} demandeEnvoyee={jeSuis === "demande"} />}

        {estMoi ? (
          <SectionReglages titre={T.partager}>
            <View className="gap-3 pt-1">
              <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.partagerTexte)}</Text>
              <CodeQrInvitation pseudo={pote.pseudo} libellePartage={T.partager} />
            </View>
          </SectionReglages>
        ) : (
          <View>
            {dansBande ? <LigneReglage emoji="👋" titre={T.retirerBande} detail={T.retirerBandeDetail} onPress={retirer} /> : null}
            <LigneReglage emoji="🚫" titre={T.bloquer} detail={T.bloquerLigneDetail} danger onPress={bloquer} />
            <LigneReglage emoji="🚩" titre={T.signaler} detail={T.signalerDetail} onPress={() => setSignalementOuvert(true)} />
          </View>
        )}
      </ScrollView>

      <Modal visible={signalementOuvert} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={() => setSignalementOuvert(false)}>
        {/* La feuille remonte au-dessus du clavier quand on écrit le pourquoi du signalement */}
        <KeyboardAvoidingView behavior="padding" style={{ flex: 1 }}>
          <Pressable accessibilityRole="button" accessibilityLabel={T.fermer} onPress={() => setSignalementOuvert(false)} style={{ minHeight: marges.top }} className="flex-1 bg-black/40" />
          <Animated.View
            accessibilityViewIsModal
            onAccessibilityEscape={() => setSignalementOuvert(false)}
            onLayout={geste.mesurerFeuille}
            style={[{ maxHeight: hauteurEcran * 0.88, flexShrink: 1 }, geste.styleFeuille]}
          >
            <View style={{ paddingBottom: marges.bottom + 12, flexShrink: 1 }} className="rounded-t-3xl border-t-2 border-encre bg-creme">
              <PoigneeFeuille geste={geste} />
              <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5">
                <SignalerContenu cible="profil" cibleId={pote.id} sujet={T.sujetSignalement(prenom)} onTermine={() => setSignalementOuvert(false)} />
              </ScrollView>
            </View>
          </Animated.View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}
