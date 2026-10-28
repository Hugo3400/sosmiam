import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE_PAR_LANGUE, type MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { CharteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { EngagementsCharteMiamSafe } from "~/composants/pro/EngagementsCharteMiamSafe";
import { EtatCharteMiamSafe } from "~/composants/pro/EtatCharteMiamSafe";
import { TEXTES_ECRAN_MIAM_SAFE_PRO_PAR_LANGUE } from "~/contenus/textes-ecran-pro-miam-safe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";
import { oublierMiamSafeLieu } from "~/services/memoire-miam-safe-lieux";

type Geste = "signer" | "quitter";

type MessagesService = (typeof MESSAGES_SERVICE_PAR_LANGUE)["fr"];

function ecrireErreur(erreur: keyof typeof MESSAGES_SERVICE | null, messages: MessagesService): string {
  const message = messages[erreur ?? "hors-ligne"];
  return `${message.titre}. ${message.texte}`;
}

export default function EcranMiamSafePro() {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_ECRAN_MIAM_SAFE_PRO_PAR_LANGUE);
  const messages = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const { miamSafe } = utiliserServices();
  const lieuId = lieuPro?.id ?? null;
  const gerant = lieuPro?.role === "gerant";
  const [charte, setCharte] = useState<CharteMiamSafe | null | undefined>(undefined);
  const [erreurLecture, setErreurLecture] = useState<string | null>(null);
  const [engagement, setEngagement] = useState(false);
  const [envoi, setEnvoi] = useState(false);
  const [resultat, setResultat] = useState<{ ok: boolean; texte: string } | null>(null);
  const [confirmation, setConfirmation] = useState(false);
  const [lecture, setLecture] = useState(0);

  useEffect(() => {
    if (lieuId === null) return;
    let actif = true;
    miamSafe
      .lireCharte(lieuId)
      .catch(() => null)
      .then((r) => {
        if (!actif) return;
        setCharte(r?.ok ? r.charte : null);
        setErreurLecture(r?.ok ? null : ecrireErreur(r ? r.erreur : null, messages));
      });
    return () => {
      actif = false;
    };
  }, [miamSafe, lieuId, lecture, messages]);

  const relire = () => {
    setCharte(undefined);
    setLecture((n) => n + 1);
  };

  const agir = async (geste: Geste) => {
    if (lieuId === null || envoi) return;
    setEnvoi(true);
    setResultat(null);
    const r = await (geste === "signer" ? miamSafe.signerCharte(lieuId) : miamSafe.quitterCharte(lieuId)).catch(() => null);
    setEnvoi(false);
    if (r?.ok) {
      setCharte(r.charte);
      setEngagement(false);
      oublierMiamSafeLieu(lieuId);
      setResultat({ ok: true, texte: T.reussites[geste] });
      return;
    }
    setResultat({ ok: false, texte: ecrireErreur(r ? r.erreur : null, messages) });
    if (r?.erreur === "charte-retiree") relire();
  };

  const signable = charte !== undefined && charte !== null && !charte.signee && !charte.retireeParEquipe;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={T.retour}
          hitSlop={8}
          onPress={fermer}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {T.titre}
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2">
        <Text className="font-texte text-base leading-6 text-gris">
          {lierPonctuation(T.intro)}
        </Text>

        <EtatCharteMiamSafe charte={lieuId === null ? null : charte} erreur={lieuId === null ? T.sansLieu : erreurLecture} onReessayer={relire} />

        <EngagementsCharteMiamSafe />

        {!gerant ? (
          <View accessible className="rounded-2xl border-2 border-dashed border-encre bg-carte p-4">
            <Text className="font-texte-semi text-base leading-6 text-encre">{T.reserveGerant}</Text>
          </View>
        ) : signable ? (
          <View className="gap-4 rounded-2xl bg-carte px-4 pb-4">
            <Interrupteur titre={T.engagement} valeur={engagement} onChanger={setEngagement} />
            <Bouton
              libelle={envoi ? T.signature : T.signer}
              variante="encre"
              desactive={!engagement || envoi}
              indice={engagement ? T.signerIndice : T.signerIndiceSansEngagement}
              onPress={() => void agir("signer")}
            />
          </View>
        ) : charte?.signee ? (
          <View className="gap-3">
            <Text className="font-texte text-sm leading-5 text-gris">
              {lierPonctuation(T.avertissementQuitter)}
            </Text>
            <Bouton libelle={envoi ? T.enCours : T.quitter} variante="blanc" desactive={envoi} onPress={() => setConfirmation(true)} />
          </View>
        ) : null}

        {resultat ? (
          <Text accessibilityRole="alert" className={`font-texte-semi text-base leading-6 ${resultat.ok ? "text-encre" : "text-rouge-texte"}`}>
            {lierPonctuation(resultat.texte)}
          </Text>
        ) : null}
      </ScrollView>

      <FeuilleConfirmation
        visible={confirmation}
        emoji="🛡️"
        titre={T.quitterTitre}
        detail={T.avertissementQuitter}
        libelleConfirmer={T.quitter}
        libelleRester={T.rester}
        indiceRester={T.resterIndice}
        onConfirmer={() => void agir("quitter")}
        onFermer={() => setConfirmation(false)}
      />
    </SafeAreaView>
  );
}
