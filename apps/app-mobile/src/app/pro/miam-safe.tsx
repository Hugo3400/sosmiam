import { Ionicons } from "@expo/vector-icons";
import { useEffect, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { CharteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { FeuilleConfirmation } from "~/composants/interface/FeuilleConfirmation";
import { Interrupteur } from "~/composants/interface/Interrupteur";
import { BandeauDemoPro } from "~/composants/pro/BandeauDemoPro";
import { EngagementsCharteMiamSafe } from "~/composants/pro/EngagementsCharteMiamSafe";
import { EtatCharteMiamSafe } from "~/composants/pro/EtatCharteMiamSafe";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserFermerPile } from "~/hooks/utiliser-fermer-pile";
import { utiliserModes } from "~/hooks/utiliser-modes";
import { utiliserOutilsDemo, utiliserServices } from "~/hooks/utiliser-services";
import { oublierMiamSafeLieu } from "~/services/memoire-miam-safe-lieux";

type Geste = "signer" | "quitter";

const REUSSITES: Record<Geste, string> = {
  signer: "C'est signé ! Le badge Miam Safe apparaît sur ta fiche. Merci à toute ton équipe.",
  quitter: "Tu as quitté la charte. Le badge disparaît de ta fiche.",
};

function ecrireErreur(erreur: keyof typeof MESSAGES_SERVICE | null): string {
  const message = MESSAGES_SERVICE[erreur ?? "hors-ligne"];
  return `${message.titre}. ${message.texte}`;
}

export default function EcranMiamSafePro() {
  const couleurs = utiliserCouleurs();
  const fermer = utiliserFermerPile();
  const { lieuPro } = utiliserModes();
  const { miamSafe } = utiliserServices();
  const demo = utiliserOutilsDemo() !== null;
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
        setErreurLecture(r?.ok ? null : ecrireErreur(r ? r.erreur : null));
      });
    return () => {
      actif = false;
    };
  }, [miamSafe, lieuId, lecture]);

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
      setResultat({ ok: true, texte: REUSSITES[geste] });
      return;
    }
    setResultat({ ok: false, texte: ecrireErreur(r ? r.erreur : null) });
    if (r?.erreur === "charte-retiree") relire();
  };

  const signable = charte !== undefined && charte !== null && !charte.signee && !charte.retireeParEquipe;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top", "bottom"]}>
      <View className="min-h-14 flex-row items-center gap-3 px-5 pb-2 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Retour"
          hitSlop={8}
          onPress={fermer}
          className="h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-carte active:opacity-80"
        >
          <Ionicons name="arrow-back" size={20} color={couleurs.encre} />
        </Pressable>
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          Miam Safe
        </Text>
      </View>

      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-2">
        <Text className="font-texte text-base leading-6 text-gris">
          {lierPonctuation("Quand un client ne se sent pas en sécurité, il sait qu'il peut compter sur ton équipe. Le badge Miam Safe le dit sur ta fiche, gratuitement.")}
        </Text>
        {demo && lieuPro ? <BandeauDemoPro nomLieu={lieuPro.nom} /> : null}

        <EtatCharteMiamSafe charte={lieuId === null ? null : charte} erreur={lieuId === null ? "Ouvre le mode pro de ton lieu pour voir sa charte." : erreurLecture} onReessayer={relire} />

        <EngagementsCharteMiamSafe />

        {!gerant ? (
          <View accessible className="rounded-2xl border-2 border-dashed border-encre bg-carte p-4">
            <Text className="font-texte-semi text-base leading-6 text-encre">Seul le gérant signe ou quitte la charte.</Text>
          </View>
        ) : signable ? (
          <View className="gap-4 rounded-2xl bg-carte px-4 pb-4">
            <Interrupteur titre="J'ai lu la charte, et mon équipe s'engage à la respecter" valeur={engagement} onChanger={setEngagement} />
            <Bouton
              libelle={envoi ? "Signature…" : "Signer la charte"}
              variante="encre"
              desactive={!engagement || envoi}
              indice={engagement ? "Le badge Miam Safe apparaît sur ta fiche" : "Allume d'abord l'engagement de ton équipe"}
              onPress={() => void agir("signer")}
            />
          </View>
        ) : charte?.signee ? (
          <View className="gap-3">
            <Text className="font-texte text-sm leading-5 text-gris">
              {lierPonctuation("Le badge disparaîtra de ta fiche, et les alertes silencieuses ne pourront plus t'être envoyées.")}
            </Text>
            <Bouton libelle={envoi ? "Un instant…" : "Quitter la charte"} variante="blanc" desactive={envoi} onPress={() => setConfirmation(true)} />
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
        emoji="🛡"
        titre="Quitter la charte Miam Safe ?"
        detail="Le badge disparaîtra de ta fiche, et les alertes silencieuses ne pourront plus t'être envoyées."
        libelleConfirmer="Quitter la charte"
        libelleRester="Je reste"
        indiceRester="Ton lieu garde la charte et son badge"
        onConfirmer={() => void agir("quitter")}
        onFermer={() => setConfirmation(false)}
      />
    </SafeAreaView>
  );
}
