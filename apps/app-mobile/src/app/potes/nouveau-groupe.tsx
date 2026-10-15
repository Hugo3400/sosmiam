import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { LONGUEUR_MAX_TITRE_GROUPE, MAX_PARTICIPANTS_GROUPE } from "@sos-miam/commun/regles/chat";
import { contientMotInterdit } from "@sos-miam/commun/validation/contient-mot-interdit";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { BandeauDemoPotes } from "~/composants/potes/BandeauDemoPotes";
import { ChoixEmojiSortie } from "~/composants/potes/ChoixEmojiSortie";
import { ChoixParticipants } from "~/composants/potes/ChoixParticipants";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import { REFUS_LIMITATION } from "~/contenus/limitation-compte";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import couleurs from "~/theme/couleurs";

type Erreurs = { titre?: string; membres?: string };

/** Créer un groupe : un nom et un emoji, puis les potes de ta bande à y inviter. */
export default function NouveauGroupe() {
  const router = useRouter();
  const { potes } = utiliserCommunaute();
  const { creerGroupe } = utiliserConversations();
  const [titre, setTitre] = useState("");
  const [emoji, setEmoji] = useState("🍽️");
  const [membres, setMembres] = useState<string[]>([]);
  const [erreurs, setErreurs] = useState<Erreurs>({});
  // Un seul groupe par toucher (le serveur répond en un instant, mais un double appui ne doit pas en créer deux)
  const [enCours, setEnCours] = useState(false);

  const choisis = potes.filter((p) => membres.includes(p.id));

  function basculer(id: string) {
    setMembres((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
    setErreurs((e) => ({ ...e, membres: undefined }));
  }

  async function creer() {
    if (enCours) return;
    const propre = titre.trim();
    const trouvees: Erreurs = {};
    if (propre === "") trouvees.titre = "Donne un nom à ton groupe, même « Les affamés » fait l'affaire.";
    else if (propre.length > LONGUEUR_MAX_TITRE_GROUPE) trouvees.titre = `${LONGUEUR_MAX_TITRE_GROUPE} caractères au plus : fais court et gourmand.`;
    else if (contientMotInterdit(propre)) trouvees.titre = "Un mot de ce nom ne passe pas chez nous. Tu reformules gentiment ?";
    if (choisis.length === 0) trouvees.membres = "Ajoute au moins un pote : un groupe tout seul, c'est un journal intime.";

    if (Object.keys(trouvees).length === 0) {
      setEnCours(true);
      const resultat = await creerGroupe(propre, emoji, choisis.map((p) => p.id));
      setEnCours(false);
      if ("id" in resultat) {
        router.replace({ pathname: "/potes/discussion/[id]", params: { id: resultat.id } });
        return;
      }
      if (resultat.erreur === "titre") trouvees.titre = `Ce nom ne passe pas : ${LONGUEUR_MAX_TITRE_GROUPE} caractères au plus, et des mots gentils.`;
      else if (resultat.erreur === "participants") trouvees.membres = `Choisis entre 1 et ${MAX_PARTICIPANTS_GROUPE - 1} potes de ta bande.`;
      else if (resultat.erreur === "compte-limite") trouvees.membres = REFUS_LIMITATION.groupe;
      else trouvees.membres = "Le groupe n'a pas pu être créé (le réseau, sûrement). Réessaie dans un instant !";
    }

    setErreurs(trouvees);
    // Le champ du nom annonce déjà sa propre erreur ; sinon, on lit celle des membres
    if (!trouvees.titre && trouvees.membres) AccessibilityInfo.announceForAccessibility(trouvees.membres);
  }

  const erreurBas = erreurs.titre ?? erreurs.membres;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      {/* « padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre pour le clavier */}
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center px-5 pb-3 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={() => (router.canGoBack() ? router.back() : router.replace("/potes/messages"))}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-white active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerClassName="px-5 pb-8" keyboardShouldPersistTaps="handled">
          <Text accessibilityRole="header" className="font-titre text-[32px] leading-[36px] text-encre">
            Nouveau groupe
          </Text>
          <Text className="mb-4 mt-2 font-texte text-base leading-6 text-gris">
            {lierPonctuation("La team brunch, les fans de tielle ou toute la bande : un groupe, et vous papotez tous ensemble.")}
          </Text>
          <View className="mb-6">
            <BandeauDemoPotes />
          </View>

          <SectionReglages titre="Le nom">
            <View className="gap-4 pt-2">
              <ChampTexte
                libelle="Le nom du groupe"
                valeur={titre}
                onChangeTexte={(texte) => {
                  setTitre(texte);
                  if (erreurs.titre) setErreurs((e) => ({ ...e, titre: undefined }));
                }}
                placeholder="Les affamés du jeudi"
                maxLength={LONGUEUR_MAX_TITRE_GROUPE}
                returnKeyType="done"
                aide={`${titre.length}/${LONGUEUR_MAX_TITRE_GROUPE} caractères`}
                erreur={erreurs.titre}
              />
              <ChoixEmojiSortie choisi={emoji} onChoisir={setEmoji} libelle="Emoji du groupe" />
            </View>
          </SectionReglages>

          <SectionReglages titre="Avec qui ?">
            <Text className="mb-1 font-texte text-sm leading-5 text-gris">
              {lierPonctuation(`Jusqu'à ${MAX_PARTICIPANTS_GROUPE - 1} potes de ta bande (${MAX_PARTICIPANTS_GROUPE} avec toi).`)}
            </Text>
            <ChoixParticipants potes={potes} choisis={membres} max={MAX_PARTICIPANTS_GROUPE - 1} onBasculer={basculer} erreur={erreurs.membres} indiceMax={`${MAX_PARTICIPANTS_GROUPE - 1} potes au plus dans un groupe, toi en plus`} />
          </SectionReglages>
        </ScrollView>

        <View className="gap-3 border-t border-ligne bg-creme px-5 pb-4 pt-3">
          {erreurBas ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(erreurBas)}</Text>
          ) : null}
          <Bouton libelle={enCours ? "Un instant…" : "Créer le groupe"} desactive={enCours} onPress={() => void creer()} indice="Tes potes choisis pourront discuter tous ensemble" />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
