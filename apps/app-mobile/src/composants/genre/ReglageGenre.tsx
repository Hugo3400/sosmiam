import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import { calculerProchainChangementGenre } from "@sos-miam/commun/fonctions/genre/calculer-prochain-changement-genre";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ChoixGenre } from "@sos-miam/commun/types/genre";
import { OptionGenre } from "~/composants/genre/OptionGenre";
import { Annonce } from "~/composants/interface/Annonce";
import { ErreurMiamis } from "~/composants/miamis/ErreurMiamis";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { OPTIONS_GENRE, OPTIONS_GENRE_PAR_LANGUE, TEXTES_GENRE_PAR_LANGUE } from "~/contenus/textes-genre";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { ecrireJourLongLangue } from "~/fonctions/langue/ecrire-jour-long-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGenreMiamis } from "~/hooks/utiliser-genre-miamis";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

const ecrireDate = (iso: string, langue: Langue) => {
  const jour = ecrireJourLongLangue(iso, langue);
  return langue === "en" ? jour : jour.toLowerCase();
};

export function ReglageGenre() {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_GENRE_PAR_LANGUE);
  const options = utiliserTextes(OPTIONS_GENRE_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const router = useRouter();
  const marges = useSafeAreaInsets();
  const couleurs = utiliserCouleurs();
  const { genre, pret, erreur, envoi, relire, choisir, effacer } = utiliserGenreMiamis();
  const { maintenantMs } = utiliserHorlogeMinute();
  const [selection, setSelection] = useState<ChoixGenre | null>(null);
  const [refusJusqua, setRefusJusqua] = useState<string | null>(null);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);
  const finAnnonce = useCallback(() => setAnnonce(null), []);
  const annoncer = useCallback((texte: string) => setAnnonce({ texte, numero: Date.now() }), []);
  const revenir = () => (router.canGoBack() ? router.back() : router.replace({ pathname: "/potes", params: { espace: "miamis" } }));

  if (!pret || erreur) {
    return (
      <EcranReglage titre={T.titre} onRetour={revenir}>
        {erreur ? <ErreurMiamis erreur={erreur} onReessayer={() => void relire()} /> : <ActivityIndicator color={couleurs.encre} className="mt-8" />}
      </EcranReglage>
    );
  }

  const enregistre = genre?.choix ?? null;
  const choix = selection ?? enregistre;
  const change = choix !== null && choix !== enregistre;
  const prochain = refusJusqua ?? calculerProchainChangementGenre(genre?.modifieLe ?? null);
  const bloque = prochain !== null && Date.parse(prochain) > maintenantMs;

  async function enregistrer() {
    if (!choix || !change) return;
    const r = await choisir(choix);
    if (r.ok) {
      setSelection(null);
      setRefusJusqua(null);
      annoncer(T.annonceEnregistre);
    } else if ("prochain" in r) {
      setSelection(null);
      setRefusJusqua(r.prochain);
      annoncer(remplirModele(messagesService["genre-trop-tot"].texte, { date: ecrireDate(r.prochain, langue) }));
    } else annoncer(T.envoiRate);
  }

  async function toutEffacer() {
    const r = await effacer();
    if (r.ok) setSelection(null);
    annoncer(r.ok ? T.annonceEfface : T.envoiRate);
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage
        titre={T.titre}
        sousTitre={T.intro}
        onRetour={revenir}
        boutonPrincipal={{
          libelle: !change && enregistre ? T.enregistre : T.enregistrer,
          onPress: () => void enregistrer(),
          desactive: !change || envoi,
          indice: change && choix !== "ne-pas-dire" ? T.indiceEnregistrer : undefined,
        }}
      >
        <View className="gap-5">
          <Text className="font-texte-gras text-base leading-6 text-encre">{lierPonctuation(T.personne)}</Text>
          {enregistre === null ? <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.rien)}</Text> : null}

          <View accessibilityRole="radiogroup" accessibilityLabel={T.legende} className="gap-2">
            {OPTIONS_GENRE.map((option, index) => (
              <OptionGenre
                key={option.id}
                nom={options[index].nom}
                effet={options[index].effet}
                choisi={choix === option.id}
                desactive={envoi || (bloque && option.id !== "ne-pas-dire" && option.id !== enregistre)}
                position={index + 1}
                total={OPTIONS_GENRE.length}
                onPress={() => setSelection(option.id)}
              />
            ))}
          </View>

          <View className="flex-row items-start gap-2.5 rounded-2xl bg-jaune-clair px-3.5 py-3">
            <Ionicons name="time-outline" size={18} color={couleurs.encre} style={{ marginTop: 1 }} />
            <Text className="flex-1 font-texte text-[13px] leading-5 text-encre">
              {lierPonctuation(bloque && prochain ? `${T.bloque(ecrireDate(prochain, langue))} ${T.toujoursPossible}` : T.regle)}
            </Text>
          </View>

          <View className="gap-1.5 rounded-2xl border border-ligne bg-carte p-3.5">
            <Text className="font-texte-gras text-sm text-encre">{lierPonctuation(T.jamaisTitre)}</Text>
            <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(T.jamaisTexte)}</Text>
          </View>

          {enregistre !== null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${T.effacer}, ${T.effacerTexte}`}
              accessibilityState={{ disabled: envoi }}
              disabled={envoi}
              onPress={() => {
                vibrerLegerement();
                void toutEffacer();
              }}
              className="min-h-14 flex-row items-center gap-3 py-2 active:opacity-70"
            >
              <Ionicons name="trash-outline" size={20} color={couleurs["rouge-texte"]} />
              <View className="flex-1">
                <Text className="font-texte-gras text-base text-rouge-texte">{T.effacer}</Text>
                <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(T.effacerTexte)}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </EcranReglage>
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
