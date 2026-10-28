import Ionicons from "@expo/vector-icons/Ionicons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useMemo, useState } from "react";
import { AccessibilityInfo, FlatList, KeyboardAvoidingView, Platform, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MAX_LIEUX_SONDAGE, MIN_LIEUX_SONDAGE } from "@sos-miam/commun/regles/chat";
import { LigneLieuSondage } from "~/composants/chat/LigneLieuSondage";
import { Bouton } from "~/composants/interface/Bouton";
import { Pastille } from "~/composants/interface/Pastille";
import { TEXTES_SONDAGE as T } from "~/contenus/textes-sondage";
import { calculerFinsSondage, type FinSondage } from "~/fonctions/chat/calculer-fins-sondage";
import { chercherLieuxSondage } from "~/fonctions/chat/chercher-lieux-sondage";
import { retirerEmojiAnnonce } from "~/fonctions/chat/retirer-emoji-annonce";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConversations } from "~/hooks/utiliser-conversations";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";

const FIN_PAR_DEFAUT: FinSondage["cle"] = "3h";

export default function EcranNouveauSondage() {
  const couleurs = utiliserCouleurs();
  const router = useRouter();
  const { id = "" } = useLocalSearchParams<{ id: string }>();
  const { trouverConversation, envoyerSondage } = utiliserConversations();
  const { lieux } = utiliserLieux();
  const { maintenantMs } = utiliserHorlogeMinute();
  const [texte, setTexte] = useState("");
  const [choisis, setChoisis] = useState<number[]>([]);
  const [cleFin, setCleFin] = useState<FinSondage["cle"]>(FIN_PAR_DEFAUT);
  const [souci, setSouci] = useState<string | null>(null);

  const conversation = trouverConversation(id);
  const trouves = useMemo(() => chercherLieuxSondage(lieux, texte), [lieux, texte]);
  const fins = useMemo(() => calculerFinsSondage(new Date(maintenantMs)), [maintenantMs]);
  const fin = fins.find((f) => f.cle === cleFin) ?? fins.find((f) => f.cle === FIN_PAR_DEFAUT) ?? fins[0];
  const plein = choisis.length >= MAX_LIEUX_SONDAGE;
  const pret = choisis.length >= MIN_LIEUX_SONDAGE && choisis.length <= MAX_LIEUX_SONDAGE;
  const retour = () => (router.canGoBack() ? router.back() : router.replace("/potes/messages"));

  function dire(message: string) {
    setSouci(message);
    AccessibilityInfo.announceForAccessibility(retirerEmojiAnnonce(message));
  }

  function basculer(lieuId: number) {
    setSouci(null);
    setChoisis((avant) => (avant.includes(lieuId) ? avant.filter((x) => x !== lieuId) : avant.length >= MAX_LIEUX_SONDAGE ? avant : [...avant, lieuId]));
  }

  function envoyer() {
    if (!pret) return dire(T.pasAssez);
    const aJour = calculerFinsSondage(new Date()).find((f) => f.cle === fin.cle);
    if (!aJour) {
      setCleFin(FIN_PAR_DEFAUT);
      return dire(T.finPassee);
    }
    const resultat = envoyerSondage(id, choisis, aJour.date.toISOString());
    if (resultat === "lieux") return dire(T.lieuxRefuses);
    if (resultat === "fin") return dire(T.finPassee);
    if (resultat === "interdit") return dire(conversation?.type === "groupe" ? T.pasParti : T.reserveGroupes);
    AccessibilityInfo.announceForAccessibility(retirerEmojiAnnonce(T.envoye));
    retour();
  }

  const enTete = (
    <View className="gap-3 pb-2">
      <Text accessibilityRole="header" className="font-titre text-[30px] leading-[36px] text-encre">
        {lierPonctuation(T.question)}
      </Text>
      <Text className="font-texte text-[15px] leading-[22px] text-gris">{lierPonctuation(T.explication)}</Text>
      <View className="min-h-12 flex-row items-center gap-2.5 rounded-full border-2 border-encre bg-carte px-4">
        <Ionicons name="search" size={18} color={couleurs.gris} />
        <TextInput
          accessibilityLabel={T.chercherLu}
          value={texte}
          onChangeText={setTexte}
          placeholder={T.chercher}
          placeholderTextColor={couleurs.gris}
          selectionColor={couleurs.encre}
          cursorColor={couleurs.encre}
          autoCorrect={false}
          returnKeyType="search"
          className="min-h-11 flex-1 font-texte text-[15px] text-encre"
        />
      </View>
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <KeyboardAvoidingView behavior={Platform.OS === "web" ? undefined : "padding"} style={{ flex: 1 }}>
        <View className="min-h-14 flex-row items-center px-5 pb-2 pt-2">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Retour"
            hitSlop={8}
            onPress={retour}
            className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
          >
            <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
          </Pressable>
        </View>

        {conversation && conversation.type !== "groupe" ? (
          <View className="flex-1 items-center gap-3 px-8 pt-10">
            <Text className="text-4xl">👥</Text>
            <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(T.reserveGroupes)}</Text>
          </View>
        ) : (
          <FlatList
            data={trouves}
            keyExtractor={(l) => String(l.id)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            contentContainerClassName="px-5 pb-4"
            ListHeaderComponent={enTete}
            ListEmptyComponent={<Text className="py-6 text-center font-texte text-base text-gris">{T.aucunLieu}</Text>}
            renderItem={({ item }) => {
              const choisi = choisis.includes(item.id);
              return <LigneLieuSondage lieu={item} choisi={choisi} desactive={plein && !choisi} onBasculer={() => basculer(item.id)} />;
            }}
          />
        )}

        <View className="gap-3 border-t border-ligne bg-creme px-5 pb-4 pt-3">
          <Text className="font-texte-gras text-[15px] text-encre">{T.finDuVote}</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerClassName="gap-2">
            {fins.map((f, i) => (
              <Pastille
                key={f.cle}
                libelle={f.libelle}
                role="radio"
                choisi={f.cle === fin.cle}
                position={i + 1}
                total={fins.length}
                libelleLu={`${f.libelle}, à ${f.heure}`}
                onPress={() => setCleFin(f.cle)}
              />
            ))}
          </ScrollView>
          {souci ? (
            <Text className="overflow-hidden rounded-2xl bg-rose-alerte px-4 py-2.5 font-texte-semi text-sm leading-5 text-rouge-texte">{lierPonctuation(souci)}</Text>
          ) : null}
          <Bouton libelle={T.envoyer(choisis.length)} desactive={!pret} indice={pret ? undefined : T.indiceEnvoyer} onPress={envoyer} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
