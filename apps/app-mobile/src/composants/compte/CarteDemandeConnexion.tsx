import { useEffect, useRef } from "react";
import { Text, View } from "react-native";

import type { DemandeConnexionQr, OrigineConnexionQr } from "@sos-miam/commun/types/connexion-qr";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_CONNEXION_QR_PAR_LANGUE } from "~/contenus/connexion-qr";
import { TEXTES_CONNECTER_APPAREIL_PAR_LANGUE } from "~/contenus/textes-connecter-appareil";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { ecrireHeureLangue } from "~/fonctions/langue/ecrire-heure-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** L'hôte réel qui a demandé, tel quel (un faux site ne peut pas se faire passer pour sosmiam.fr) ; l'app : rien de plus, le nom de l'appareil le dit déjà */
const ecrireOrigine = (origine: OrigineConnexionQr) => (origine === "app" ? null : origine);

/** Les secondes restantes que VoiceOver et TalkBack disent à voix haute (pas chaque seconde : ça couvrirait la carte) */
const PALIERS_ANNONCES = [30, 10];

type Props = {
  demande: DemandeConnexionQr;
  secondesRestantes: number;
  /** La réponse qui part (le bouton touché), ou null */
  envoi: "accepte" | "refuse" | null;
  souci: string | null;
  onRefuser: () => void;
  onAccepter: () => void;
};

/**
 * « Quelqu'un veut se connecter à TON compte » : le temps qui reste, en haut ; l'appareil, l'hôte réel qui a demandé
 * (sosmiam.fr, pro.sosmiam.fr ou l'app) et l'heure, en gros ; la mise en garde contre les QR et les liens envoyés par un
 * escroc ; « Refuser » en bouton principal.
 */
export function CarteDemandeConnexion({ demande, secondesRestantes, envoi, souci, onRefuser, onAccepter }: Props) {
  const T = utiliserTextes(TEXTES_CONNECTER_APPAREIL_PAR_LANGUE).carte;
  const textesConnexionQr = utiliserTextes(TEXTES_CONNEXION_QR_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const origine = ecrireOrigine(demande.origine);
  const heure = ecrireHeureLangue(demande.creeLe, langue);

  // Le plus petit palier déjà dit : chacun ne se dit qu'une fois
  const palierDit = useRef(Infinity);
  useEffect(() => {
    const atteints = PALIERS_ANNONCES.filter((palier) => secondesRestantes > 0 && secondesRestantes <= palier);
    if (atteints.length === 0) return;
    const palier = Math.min(...atteints);
    if (palier >= palierDit.current) return;
    palierDit.current = palier;
    annoncerLecteurEcran(textesConnexionQr.plusQue(secondesRestantes));
  }, [secondesRestantes, textesConnexionQr]);

  // Face ID annulé (ou un autre souci) : dit à voix haute, sinon on croirait que ça part
  useEffect(() => {
    if (souci) annoncerLecteurEcran(souci);
  }, [souci]);

  return (
    <View className="gap-5">
      <Text className="self-center rounded-full bg-jaune-clair px-4 py-1 text-center font-texte-semi text-sm text-encre">
        {envoi !== null ? T.reponsePart : secondesRestantes > 0 ? textesConnexionQr.tempsRestant(secondesRestantes) : T.unInstant}
      </Text>

      <View
        accessible
        accessibilityLabel={T.demandeLue(demande.appareil, origine, heure)}
        className="gap-2 rounded-carte border-2 border-encre bg-carte p-5"
      >
        <Text className="text-4xl">{demande.cible === "app" ? "📱" : "💻"}</Text>
        <Text className="font-texte-semi text-base text-gris">{T.quelquUn}</Text>
        <Text className="font-titre text-2xl leading-8 text-encre">{demande.appareil}</Text>
        {origine ? <Text className="font-texte-gras text-base text-encre">{origine}</Text> : null}
        <Text className="font-texte text-sm text-gris">{T.demandeA(heure)}</Text>
      </View>

      <Text accessibilityRole="header" className="font-titre text-2xl leading-8 text-encre">
        {textesConnexionQr.questionConfirmer}
      </Text>
      <View className="flex-row gap-3 rounded-2xl border-2 border-rouge-texte bg-carte px-4 py-3">
        <Text accessibilityElementsHidden importantForAccessibility="no" className="text-xl">
          ⚠️
        </Text>
        <Text className="flex-1 font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(textesConnexionQr.attention)}</Text>
      </View>

      {souci ? <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(souci)}</Text> : null}

      <Bouton libelle={envoi === "refuse" ? T.unInstant : textesConnexionQr.refuser} onPress={onRefuser} desactive={envoi !== null} />
      <Bouton libelle={envoi === "accepte" ? T.unInstant : textesConnexionQr.accepter} variante="blanc" onPress={onAccepter} desactive={envoi !== null} />
    </View>
  );
}
