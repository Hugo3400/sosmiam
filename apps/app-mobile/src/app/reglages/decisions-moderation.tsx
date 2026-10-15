import { useState } from "react";
import { ActivityIndicator, Pressable, Text, View } from "react-native";

import type { DecisionModerationApi } from "@sos-miam/commun/types/signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { CarteDecisionModeration } from "~/composants/signalement/CarteDecisionModeration";
import { FeuilleContesterDecision } from "~/composants/signalement/FeuilleContesterDecision";
import { MessageDecisionsModeration } from "~/composants/signalement/MessageDecisionsModeration";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCompteRequis } from "~/hooks/utiliser-compte-requis";
import { utiliserDecisionsModeration } from "~/hooks/utiliser-decisions-moderation";
import { utiliserSourceSociale } from "~/hooks/utiliser-source-sociale";
import couleurs from "~/theme/couleurs";

/** Des refus qui disent que la liste n'est plus à jour (déjà contestée ailleurs, délai passé, décision changée) : on la relit */
const REFUS_A_RELIRE = ["deja-contestee", "contestation-hors-delai", "decision-inconnue"];

/**
 * Réglages › Décisions de la modération (règlement européen sur les services numériques) : une carte par décision sur tes
 * contenus et sur tes signalements, avec la règle en cause, l'explication de l'équipe et « Contester » pendant 6 mois.
 * Jamais qui a signalé. Ouvert aussi depuis la cloche (contenu masqué, retiré, signalement examiné). Démo et visite : ce
 * qui arrivera ici avec un compte.
 */
export default function DecisionsModeration() {
  const source = utiliserSourceSociale();
  const moderation = utiliserDecisionsModeration();
  const exigerCompte = utiliserCompteRequis();
  const [contestee, setContestee] = useState<DecisionModerationApi | null>(null);
  const [feuilleVisible, setFeuilleVisible] = useState(false);
  const [relecture, setRelecture] = useState(false);
  const maintenant = new Date();
  const { decisions } = moderation;

  async function relire() {
    if (relecture) return;
    setRelecture(true);
    await moderation.relire().catch(() => false);
    setRelecture(false);
  }

  async function contester(id: string, texte: string) {
    const r = await moderation.contester(id, texte);
    if (r && REFUS_A_RELIRE.includes(r)) void moderation.relire();
    return r;
  }

  function contenu() {
    if (source === "demo" || source === "visite") {
      return (
        <MessageDecisionsModeration
          emoji="🛡️"
          titre="Ici, la modération te répond"
          texte={
            source === "demo"
              ? "En démo, rien ne part à l'équipe, donc rien à décider. Avec un compte, c'est ici qu'arrivent les décisions sur tes contenus et sur tes signalements : la règle en cause, l'explication de l'équipe, et de quoi contester pendant 6 mois."
              : "C'est ici qu'arrivent les décisions de l'équipe sur tes contenus et sur tes signalements : la règle en cause, son explication, et de quoi contester pendant 6 mois. Pour ça, il te faut un compte."
          }
        >
          {source === "visite" ? (
            <Bouton libelle="Créer mon compte" petit className="mt-3" indice="Ouvre la création de ton compte" onPress={() => void exigerCompte("signaler")} />
          ) : null}
        </MessageDecisionsModeration>
      );
    }
    if (source === "attente" || !moderation.pret || (relecture && decisions.length === 0)) {
      return (
        <View accessible accessibilityLabel="Les décisions arrivent" className="items-center gap-3 py-10">
          <ActivityIndicator size="large" color={couleurs.encre} />
          <Text className="text-center font-texte text-sm text-gris">{relecture ? "On retente…" : "On rassemble les décisions…"}</Text>
        </View>
      );
    }
    if (moderation.ratee && decisions.length === 0) {
      return (
        <MessageDecisionsModeration emoji="📡" titre="Les décisions sont restées en cuisine" texte="La connexion fait des siennes, rien de grave. Vérifie ton réseau, et on retente ?">
          <Bouton libelle="Réessayer" variante="blanc" petit className="mt-3" indice="Relit les décisions de la modération" onPress={() => void relire()} />
        </MessageDecisionsModeration>
      );
    }
    if (decisions.length === 0) {
      return (
        <MessageDecisionsModeration
          emoji="🌿"
          titre="Tout est calme par ici"
          texte="Aucune décision de la modération sur tes contenus ni sur tes signalements. Si l'équipe en prend une un jour, tu la trouveras ici, avec la règle en cause et son explication."
        />
      );
    }
    return (
      <View className="gap-4">
        {moderation.ratee ? (
          <View accessibilityLiveRegion="polite" className="flex-row items-center gap-2 rounded-2xl border-2 border-dashed border-gris/60 py-1 pl-3 pr-1">
            <Text className="flex-1 font-texte text-[13px] leading-[18px] text-gris">{lierPonctuation("📡 Pas pu rafraîchir : tu vois les décisions d'avant.")}</Text>
            {relecture ? (
              <ActivityIndicator size="small" color={couleurs.gris} accessibilityLabel="On retente" style={{ marginHorizontal: 16 }} />
            ) : (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Réessayer"
                onPress={() => {
                  vibrerLegerement();
                  void relire();
                }}
                className="min-h-11 justify-center px-3 active:opacity-60"
              >
                <Text className="font-texte-gras text-[13px] text-encre">Réessayer</Text>
              </Pressable>
            )}
          </View>
        ) : null}
        {decisions.map((decision) => (
          <CarteDecisionModeration
            key={decision.id}
            decision={decision}
            maintenant={maintenant}
            onContester={() => {
              setContestee(decision);
              setFeuilleVisible(true);
            }}
          />
        ))}
        <Text className="mt-2 font-texte text-sm leading-5 text-gris">
          {lierPonctuation(
            "On ne te dit jamais qui a signalé, et personne ne saura que tu as signalé. Une contestation est relue par une autre personne de l'équipe que celle qui a décidé.",
          )}
        </Text>
      </View>
    );
  }

  return (
    <>
      <EcranReglage titre="Décisions de la modération" sousTitre="Ce que l'équipe a décidé sur tes contenus et sur tes signalements, et pourquoi.">
        {contenu()}
      </EcranReglage>
      <FeuilleContesterDecision
        visible={feuilleVisible}
        decisionId={contestee?.id ?? null}
        onContester={contester}
        onFermer={() => setFeuilleVisible(false)}
      />
    </>
  );
}
