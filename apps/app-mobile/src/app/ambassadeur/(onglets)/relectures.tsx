import { useFocusEffect } from "expo-router";
import { useCallback, useState } from "react";
import { ActivityIndicator, ScrollView, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import type { AvisARelire, VerdictRelecture } from "@sos-miam/commun/types/avis";
import { CarteAvisARelire } from "~/composants/ambassadeur/CarteAvisARelire";
import { FeuilleMotifLouche } from "~/composants/ambassadeur/FeuilleMotifLouche";
import { Annonce } from "~/composants/interface/Annonce";
import { EnTeteMode } from "~/composants/modes/EnTeteMode";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireEchecVisite } from "~/fonctions/visites/decrire-echec-visite";
import { utiliserServices } from "~/hooks/utiliser-services";
import couleurs from "~/theme/couleurs";

const MERCI: Record<VerdictRelecture["type"], string> = {
  ok: "Merci ! Avis relu.",
  louche: "Merci ! L'équipe y jette un œil.",
  deporte: "C'est noté : un autre ambassadeur le relira.",
};

const DEJA_RELU = "Trois ambassadeurs l'ont déjà relu pendant ce temps : merci quand même !";

/** Les avis à relire, sans leur auteur : « Ça me va », « Ça me paraît louche » (avec un motif) ou « Je passe mon tour ». */
export default function EcranRelectures() {
  const { ambassadeur } = utiliserServices();
  const [avis, setAvis] = useState<AvisARelire[] | null>(null);
  const [echec, setEchec] = useState<string | null>(null);
  const [louche, setLouche] = useState<number | null>(null);
  const [enCours, setEnCours] = useState(false);
  const [annonce, setAnnonce] = useState<{ texte: string; numero: number } | null>(null);

  useFocusEffect(
    useCallback(() => {
      let actif = true;
      ambassadeur.listerAvisARelire().then((r) => {
        if (!actif) return;
        if (r.ok) setAvis(r.avis);
        else setEchec(decrireEchecVisite(r.erreur, r.details).texte);
      });
      return () => {
        actif = false;
      };
    }, [ambassadeur]),
  );

  async function juger(avisId: number, verdict: VerdictRelecture) {
    setEnCours(true);
    const r = await ambassadeur.donnerVerdict(avisId, verdict);
    setEnCours(false);
    if (!r.ok && r.erreur === "introuvable") {
      setAvis((liste) => liste?.filter((a) => a.id !== avisId) ?? null);
      return setAnnonce({ texte: DEJA_RELU, numero: Date.now() });
    }
    if (!r.ok) return setAnnonce({ texte: decrireEchecVisite(r.erreur, r.details).texte, numero: Date.now() });
    vibrerLegerement();
    setAvis((liste) => liste?.filter((a) => a.id !== avisId) ?? null);
    setAnnonce({ texte: MERCI[verdict.type], numero: Date.now() });
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: couleurs.creme }} edges={["top"]}>
      <ScrollView contentContainerClassName="gap-5 px-5 pb-10 pt-3">
        <EnTeteMode mode="ambassadeur" titre="Relectures" sousTitre="Ton avis compte, l'équipe tranche" />
        {echec ? (
          <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation(echec)}</Text>
        ) : avis === null ? (
          <ActivityIndicator color={couleurs.encre} />
        ) : avis.length === 0 ? (
          <Text className="font-texte text-base leading-6 text-gris">{lierPonctuation("Aucun avis à relire : tout est nickel. Reviens plus tard, on t'en garde au chaud.")}</Text>
        ) : (
          <View className="gap-4">
            {avis.map((a) => (
              <CarteAvisARelire
                key={a.id}
                avis={a}
                desactive={enCours}
                onOk={() => void juger(a.id, { type: "ok" })}
                onLouche={() => setLouche(a.id)}
                onPasser={() => void juger(a.id, { type: "deporte" })}
              />
            ))}
          </View>
        )}
      </ScrollView>
      <FeuilleMotifLouche
        visible={louche !== null}
        onFermer={() => setLouche(null)}
        onChoisir={(motif) => {
          const id = louche;
          setLouche(null);
          if (id !== null) void juger(id, { type: "louche", motif });
        }}
      />
      <Annonce annonce={annonce} haut={8} onFin={() => setAnnonce(null)} />
    </SafeAreaView>
  );
}
