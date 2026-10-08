import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlatList, Keyboard, KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, useWindowDimensions, View } from "react-native";
import { useReducedMotion } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Commentaire } from "@sos-miam/commun/types/commentaires";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import { BlocCommentaire } from "~/composants/fil/BlocCommentaire";
import { ChampCommentaire } from "~/composants/fil/ChampCommentaire";
import { MenuCommentaire } from "~/composants/fil/MenuCommentaire";
import { Annonce } from "~/composants/interface/Annonce";
import { Bouton } from "~/composants/interface/Bouton";
import { SignalerContenu } from "~/composants/signalement/SignalerContenu";
import type { FilCommentaire } from "~/fonctions/communaute/trier-commentaires";
import { formaterNombreCourt } from "~/fonctions/texte/formater-nombre-court";
import { utiliserCommunaute, type ResultatTexte } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Props = {
  visible: boolean;
  publicationId: string;
  /** Lieu de la publication : il parle sous son nom quand il répond */
  lieu: Pick<Lieu, "nom" | "emoji">;
  onFermer: () => void;
};

/** Le commentaire sous lequel ta réponse se range (toujours du premier niveau), la personne à qui tu réponds et son nom */
type Reponse = { id: string; auteurs: string[]; nom: string };

// « il y a 5 min » se met à jour tant que la feuille est ouverte
const RAFRAICHISSEMENT = 30_000;

/**
 * Les commentaires d'une publication, dans une feuille qui monte du bas comme sur TikTok (la vidéo reste visible au-dessus) :
 * la réponse du lieu en tête, puis les plus aimés ; réponses repliables ; champ en bas avec mentions ; options de chaque commentaire.
 */
export function FeuilleCommentaires({ visible, publicationId, lieu, onFermer }: Props) {
  const marges = useSafeAreaInsets();
  const { height: hauteurEcran } = useWindowDimensions();
  const animationsReduites = useReducedMotion();
  const communaute = utiliserCommunaute();
  const { trouverPote } = communaute;
  const champ = useRef<TextInput>(null);
  const liste = useRef<FlatList<FilCommentaire>>(null);
  const [texte, setTexte] = useState("");
  const [reponse, setReponse] = useState<Reponse | null>(null);
  const [edition, setEdition] = useState<string | null>(null);
  const [deplies, setDeplies] = useState<Record<string, boolean>>({});
  const [options, setOptions] = useState<Commentaire | null>(null);
  const [signale, setSignale] = useState<Commentaire | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const [clavierOuvert, setClavierOuvert] = useState(false);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  // Ordre des commentaires à l'ouverture : un J'aime ne fait pas sauter un commentaire sous ton doigt
  const [rangs, setRangs] = useState<Map<string, number> | null>(null);

  // À chaque ouverture, on repart de la liste (le brouillon reste, sauf une modification en cours)
  const [ouvert, setOuvert] = useState(visible);
  if (visible !== ouvert) {
    setOuvert(visible);
    if (visible) {
      setOptions(null);
      setSignale(null);
      setReponse(null);
      if (edition) setTexte("");
      setEdition(null);
      setRangs(null);
    }
  }

  useEffect(() => {
    if (!visible) return;
    setMaintenant(Date.now());
    const minuterie = setInterval(() => setMaintenant(Date.now()), RAFRAICHISSEMENT);
    return () => clearInterval(minuterie);
  }, [visible]);

  // Clavier ouvert : il cache déjà le bord du téléphone, pas besoin de laisser sa place sous le champ
  useEffect(() => {
    const montre = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillShow" : "keyboardDidShow", () => setClavierOuvert(true));
    const cache = Keyboard.addListener(Platform.OS === "ios" ? "keyboardWillHide" : "keyboardDidHide", () => setClavierOuvert(false));
    return () => {
      montre.remove();
      cache.remove();
    };
  }, []);

  const annoncer = (message: string) => setAnnonce({ texte: message, numero: Date.now() });
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const nomDe = (auteur: string) => (auteur === "lieu" ? lieu.nom : (trouverPote(auteur)?.prenom ?? "Quelqu'un"));

  const nombre = communaute.nombreCommentaires(publicationId);
  const fils = communaute.commentairesDe(publicationId);
  if (rangs === null && communaute.pret) setRangs(new Map(fils.map((f, index) => [f.commentaire.id, index])));
  // Le lieu reste en tête, puis ce qui est arrivé depuis l'ouverture (tes commentaires tout frais, en haut pour que tu les voies),
  // puis les autres dans l'ordre de l'ouverture (plus aimés, plus récents)
  const rang = (f: FilCommentaire) => rangs?.get(f.commentaire.id) ?? -1;
  const connus = rangs ? fils.filter((f) => rang(f) >= 0).sort((a, b) => rang(a) - rang(b)) : fils;
  const nouveaux = rangs ? fils.filter((f) => rang(f) < 0).sort((a, b) => b.commentaire.date.localeCompare(a.commentaire.date)) : [];
  const ordonnes = [...connus.filter((f) => f.commentaire.auteur === "lieu"), ...nouveaux, ...connus.filter((f) => f.commentaire.auteur !== "lieu")];

  function repondre(commentaire: Commentaire, fil: Commentaire) {
    let brouillon = edition ? "" : texte;
    setEdition(null);
    setReponse({ id: fil.id, auteurs: [fil.auteur, commentaire.auteur], nom: nomDe(commentaire.auteur) });
    // Réponse à une réponse : tout se range sous le même commentaire, alors on mentionne la personne
    const pote = commentaire.id !== fil.id && commentaire.auteur !== ID_MOI ? trouverPote(commentaire.auteur) : null;
    if (pote?.pseudo && !brouillon.includes(`@${pote.pseudo}`)) brouillon = `@${pote.pseudo} ${brouillon}`;
    setTexte(brouillon);
    champ.current?.focus();
  }

  function modifier(commentaire: Commentaire) {
    setOptions(null);
    setReponse(null);
    setEdition(commentaire.id);
    setTexte(commentaire.texte);
    champ.current?.focus();
  }

  function envoyer(): ResultatTexte {
    if (edition) {
      const verdict = communaute.modifierCommentaire(edition, texte);
      if (verdict !== "ok") return verdict;
      setEdition(null);
      setTexte("");
      Keyboard.dismiss();
      annoncer("C'est corrigé ✏️");
      return verdict;
    }
    const verdict = communaute.commenter(publicationId, texte, reponse?.id);
    if (verdict !== "ok") return verdict;
    if (reponse) setDeplies((d) => ({ ...d, [reponse.id]: true }));
    else liste.current?.scrollToOffset({ offset: 0, animated: true });
    setReponse(null);
    setTexte("");
    Keyboard.dismiss();
    annoncer(reponse ? "Réponse envoyée 💬" : "Commentaire envoyé 💬");
    return verdict;
  }

  function supprimer(commentaire: Commentaire) {
    setOptions(null);
    communaute.supprimerCommentaire(commentaire.id);
    if (edition === commentaire.id) {
      setEdition(null);
      setTexte("");
    }
    if (reponse?.id === commentaire.id) setReponse(null);
    annoncer("Commentaire supprimé 🗑️");
  }

  function bloquer(commentaire: Commentaire) {
    const nom = nomDe(commentaire.auteur);
    setOptions(null);
    communaute.bloquer(commentaire.auteur);
    if (reponse?.auteurs.includes(commentaire.auteur)) setReponse(null);
    annoncer(`C'est fait, tu ne verras plus ${nom} ici 🚫`);
  }

  function signaler(commentaire: Commentaire) {
    setOptions(null);
    Keyboard.dismiss();
    setSignale(commentaire);
  }

  function finSignalement() {
    if (signale && reponse?.id === signale.id) setReponse(null);
    setSignale(null);
  }

  // Retour Android et geste d'échappement de VoiceOver : on ferme d'abord ce qui est par-dessus
  function reculer() {
    if (options) setOptions(null);
    else if (signale) finSignalement();
    else onFermer();
  }

  const titre = nombre === 0 ? "Commentaires" : `${formaterNombreCourt(nombre)} commentaire${nombre > 1 ? "s" : ""}`;

  return (
    <Modal visible={visible} transparent animationType={animationsReduites ? "fade" : "slide"} onRequestClose={reculer}>
      {/* « padding » sur les deux systèmes : en bord à bord, Android ne redimensionne plus la fenêtre pour le clavier */}
      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        accessibilityElementsHidden={!!options}
        importantForAccessibility={options ? "no-hide-descendants" : "auto"}
      >
        {/* Le haut reste transparent : la vidéo continue au-dessus, comme sur TikTok */}
        <Pressable accessibilityRole="button" accessibilityLabel="Fermer les commentaires" onPress={onFermer} style={{ minHeight: marges.top }} className="flex-1 bg-black/20" />
        <View
          accessibilityViewIsModal
          onAccessibilityEscape={reculer}
          // flexShrink : clavier ouvert, la feuille rétrécit et la liste avec, le champ reste juste au-dessus du clavier
          style={{ height: hauteurEcran * 0.7, flexShrink: 1 }}
          className="rounded-t-3xl border-t-2 border-encre bg-creme pt-3"
        >
          <View className="mb-1 h-1.5 w-12 self-center rounded-full bg-ligne" />

          {signale ? (
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="px-5 pt-2" contentContainerStyle={{ paddingBottom: marges.bottom + 16 }}>
              <SignalerContenu
                cible="commentaire"
                cibleId={signale.id}
                sujet={signale.auteur === "lieu" ? `le commentaire de ${lieu.nom}` : `le commentaire de ${nomDe(signale.auteur)}`}
                onTermine={finSignalement}
              />
            </ScrollView>
          ) : (
            <>
              <View className="flex-row items-center px-3">
                <View className="w-11" />
                <Text accessibilityRole="header" className="flex-1 text-center font-texte-gras text-base text-encre">
                  {titre}
                </Text>
                <Pressable accessibilityRole="button" accessibilityLabel="Fermer les commentaires" onPress={onFermer} className="h-11 w-11 items-center justify-center active:opacity-60">
                  <Ionicons name="close" size={24} color={couleurs.encre} />
                </Pressable>
              </View>
              <Text className="mx-5 mb-1 text-center font-texte text-xs leading-4 text-gris">
                🧪 Potes d'exemple : tes vrais potes arriveront avec les comptes. D'ici là, tes commentaires restent sur ton téléphone.
              </Text>

              <FlatList
                ref={liste}
                data={ordonnes}
                keyExtractor={(f) => f.commentaire.id}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode={Platform.OS === "ios" ? "interactive" : "on-drag"}
                contentContainerClassName="px-5 pb-4 pt-1"
                contentContainerStyle={{ flexGrow: 1 }}
                ListEmptyComponent={
                  <View className="flex-1 items-center justify-center gap-2 px-4 py-8">
                    <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-5xl">
                      💬
                    </Text>
                    <Text accessibilityRole="header" className="text-center font-titre text-xl text-encre">
                      Sois le premier à commenter
                    </Text>
                    <Text className="text-center font-texte text-sm leading-5 text-gris">
                      Un mot gentil, une question sur le plat, une envie d'y filer ce soir : lance la conversation !
                    </Text>
                    <Bouton libelle="Écrire un commentaire" variante="blanc" petit onPress={() => champ.current?.focus()} className="mt-2" />
                  </View>
                }
                renderItem={({ item }) => (
                  <BlocCommentaire
                    fil={item}
                    lieu={lieu}
                    maintenant={maintenant}
                    // Par défaut, les réponses du lieu se montrent tout de suite
                    deplie={deplies[item.commentaire.id] ?? item.reponses.some((r) => r.auteur === "lieu")}
                    onBasculer={(id) => setDeplies((d) => ({ ...d, [id]: !(d[id] ?? item.reponses.some((r) => r.auteur === "lieu")) }))}
                    onRepondre={repondre}
                    onOptions={(c) => {
                      Keyboard.dismiss();
                      setOptions(c);
                    }}
                  />
                )}
              />

              <ChampCommentaire
                ref={champ}
                valeur={texte}
                onChanger={setTexte}
                reponseA={reponse?.nom ?? null}
                onAnnulerReponse={() => setReponse(null)}
                edition={edition !== null}
                onAnnulerEdition={() => {
                  setEdition(null);
                  setTexte("");
                }}
                onEnvoyer={envoyer}
                margeBas={clavierOuvert ? 8 : marges.bottom + 8}
              />
            </>
          )}
        </View>
      </KeyboardAvoidingView>

      <MenuCommentaire
        commentaire={options}
        nomAuteur={options ? nomDe(options.auteur) : ""}
        onModifier={modifier}
        onSupprimer={supprimer}
        onSignaler={signaler}
        onBloquer={bloquer}
        onFermer={() => setOptions(null)}
      />
      <Annonce annonce={annonce} haut={marges.top + 12} onFin={finAnnonce} />
    </Modal>
  );
}
