import Ionicons from "@expo/vector-icons/Ionicons";
import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { calculerProchainChangementGenre } from "@sos-miam/commun/fonctions/genre/calculer-prochain-changement-genre";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { ChoixGenre } from "@sos-miam/commun/types/genre";
import { OptionGenre } from "~/composants/genre/OptionGenre";
import { Annonce } from "~/composants/interface/Annonce";
import { ErreurMiamis } from "~/composants/miamis/ErreurMiamis";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { OPTIONS_GENRE, TEXTES_GENRE } from "~/contenus/textes-genre";
import { ecrireJourLong } from "~/fonctions/dates/ecrire-jour-long";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserGenreMiamis } from "~/hooks/utiliser-genre-miamis";
import { utiliserHorlogeMinute } from "~/hooks/utiliser-horloge-minute";

const ecrireDate = (iso: string) => ecrireJourLong(iso).toLowerCase();

export function ReglageGenre() {
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
      <EcranReglage titre={TEXTES_GENRE.titre} onRetour={revenir}>
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
      annoncer(TEXTES_GENRE.annonceEnregistre);
    } else if ("prochain" in r) {
      setSelection(null);
      setRefusJusqua(r.prochain);
      annoncer(remplirModele(MESSAGES_SERVICE["genre-trop-tot"].texte, { date: ecrireDate(r.prochain) }));
    } else annoncer(TEXTES_GENRE.envoiRate);
  }

  async function toutEffacer() {
    const r = await effacer();
    if (r.ok) setSelection(null);
    annoncer(r.ok ? TEXTES_GENRE.annonceEfface : TEXTES_GENRE.envoiRate);
  }

  return (
    <View style={{ flex: 1, backgroundColor: couleurs.creme }}>
      <EcranReglage
        titre={TEXTES_GENRE.titre}
        sousTitre={TEXTES_GENRE.intro}
        onRetour={revenir}
        boutonPrincipal={{
          libelle: !change && enregistre ? TEXTES_GENRE.enregistre : TEXTES_GENRE.enregistrer,
          onPress: () => void enregistrer(),
          desactive: !change || envoi,
          indice: change && choix !== "ne-pas-dire" ? TEXTES_GENRE.indiceEnregistrer : undefined,
        }}
      >
        <View className="gap-5">
          <Text className="font-texte-gras text-base leading-6 text-encre">{lierPonctuation(TEXTES_GENRE.personne)}</Text>
          {enregistre === null ? <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_GENRE.rien)}</Text> : null}

          <View accessibilityRole="radiogroup" accessibilityLabel={TEXTES_GENRE.legende} className="gap-2">
            {OPTIONS_GENRE.map((option, index) => (
              <OptionGenre
                key={option.id}
                nom={option.nom}
                effet={option.effet}
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
              {lierPonctuation(bloque && prochain ? `${TEXTES_GENRE.bloque(ecrireDate(prochain))} ${TEXTES_GENRE.toujoursPossible}` : TEXTES_GENRE.regle)}
            </Text>
          </View>

          <View className="gap-1.5 rounded-2xl border border-ligne bg-carte p-3.5">
            <Text className="font-texte-gras text-sm text-encre">{lierPonctuation(TEXTES_GENRE.jamaisTitre)}</Text>
            <Text className="font-texte text-[13px] leading-5 text-gris">{lierPonctuation(TEXTES_GENRE.jamaisTexte)}</Text>
          </View>

          {enregistre !== null ? (
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`${TEXTES_GENRE.effacer}, ${TEXTES_GENRE.effacerTexte}`}
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
                <Text className="font-texte-gras text-base text-rouge-texte">{TEXTES_GENRE.effacer}</Text>
                <Text className="font-texte text-sm leading-5 text-gris">{lierPonctuation(TEXTES_GENRE.effacerTexte)}</Text>
              </View>
            </Pressable>
          ) : null}
        </View>
      </EcranReglage>
      <Annonce annonce={annonce} haut={marges.top + 60} onFin={finAnnonce} />
    </View>
  );
}
