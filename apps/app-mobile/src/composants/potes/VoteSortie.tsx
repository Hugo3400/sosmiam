import { useRouter } from "expo-router";
import { useState } from "react";
import { AccessibilityInfo, Linking, Platform, Text, View } from "react-native";

import { MAX_PROPOSITIONS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote, PropositionSortie, Sortie } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { LieuChoisiSortie } from "~/composants/potes/LieuChoisiSortie";
import { PropositionVote } from "~/composants/potes/PropositionVote";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_VOTE_SORTIE_PAR_LANGUE } from "~/contenus/textes-vote-sortie";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserLieux } from "~/hooks/utiliser-lieux";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";
import { utiliserPublications } from "~/hooks/utiliser-publications";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  sortie: Sortie;
  /** Vote terminé (fin passée, ou terminé par l'organisateur) */
  voteFini: boolean;
  /** Lieu retenu quand le vote est fini */
  lieuChoisi: number | null;
  /** Fin du vote, déjà écrite : « demain à 18h » */
  finVote: string;
  /** Petit message en haut de l'écran (aussi lu par le lecteur d'écran) */
  onAnnoncer: (texte: string) => void;
  /** Demande de terminer le vote (l'écran confirme) */
  onTerminer: () => void;
};

/** Tous les votes d'un lieu : avec un compte, nombreVotes compte aussi ceux qu'on ne te nomme pas (c'est lui qui décide) */
const compterVotes = (p: PropositionSortie) => p.nombreVotes ?? p.votes.length;

/** Ouvre l'itinéraire vers un lieu : Plans sur iPhone, Google Maps ailleurs (par sa position quand on la connaît). */
function ouvrirItineraire(lieu: Lieu) {
  const destination = lieu.position ? `${lieu.position.latitude},${lieu.position.longitude}` : `${lieu.nom}, ${lieu.ville}`;
  const adresse =
    Platform.OS === "ios"
      ? `https://maps.apple.com/?daddr=${encodeURIComponent(destination)}`
      : `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(destination)}`;
  Linking.openURL(adresse).catch(() => {});
}

/** La partie « Le vote » d'une sortie : les lieux proposés et leurs votes, proposer un lieu, terminer le vote, puis le lieu retenu. */
export function VoteSortie({ sortie, voteFini, lieuChoisi, finVote, onAnnoncer, onTerminer }: Props) {
  const router = useRouter();
  const T = utiliserTextes(TEXTES_VOTE_SORTIE_PAR_LANGUE).vote;
  const REFUS = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE);
  const { trouverPote, voter, proposerLieu, bloques } = utiliserCommunaute();
  const monId = utiliserMonId();
  const { estMasquee } = utiliserActivite();
  const { publications: toutesLesPublications } = utiliserPublications();
  const { trouverLieu } = utiliserLieux();
  const depart = utiliserPointDeDepart();
  const [choixOuvert, setChoixOuvert] = useState(false);

  const publications = toutesLesPublications.filter((p) => !estMasquee(p.id));
  const bloquesIds = new Set(bloques.map((b) => b.id));
  const organisateur = sortie.organisateur === monId;
  const complet = sortie.propositions.length >= MAX_PROPOSITIONS_SORTIE;

  // Vote fini : le lieu retenu en tête, puis les autres du plus voté au moins voté
  const propositions = voteFini
    ? [...sortie.propositions].sort((a, b) => Number(b.lieuId === lieuChoisi) - Number(a.lieuId === lieuChoisi) || compterVotes(b) - compterVotes(a))
    : sortie.propositions;
  const gagnant = lieuChoisi !== null ? trouverLieu(lieuChoisi) : undefined;
  const propositionGagnante = sortie.propositions.find((p) => p.lieuId === lieuChoisi);
  const ouvrirFiche = (id: number) => router.push({ pathname: "/lieu/[id]", params: { id: String(id) } });

  function basculerVote(lieu: Lieu, aVote: boolean) {
    voter(sortie.id, lieu.id);
    AccessibilityInfo.announceForAccessibility(aVote ? T.voteRetire(lieu.nom) : T.voteFait(lieu.nom));
  }

  function proposer(lieuId: number) {
    const lieu = trouverLieu(lieuId);
    // Affiché tout de suite ; si le serveur refuse, la proposition repart et on dit pourquoi
    const resultat = proposerLieu(sortie.id, lieuId, (erreur) =>
      onAnnoncer(erreur === "compte-limite" ? REFUS.sortie : T.echec(lieu?.nom ?? T.ceLieu)),
    );
    if (resultat === "ok") {
      setChoixOuvert(false);
      onAnnoncer(T.propose(lieu?.nom ?? T.lieu));
    } else if (resultat === "deja") onAnnoncer(T.deja);
    else if (resultat === "max") onAnnoncer(T.max(MAX_PROPOSITIONS_SORTIE));
    else onAnnoncer(T.impossible);
  }

  return (
    <View className="gap-4">
      {voteFini && gagnant ? (
        <LieuChoisiSortie
          lieu={gagnant}
          image={trouverVignetteLieu(gagnant.id, publications)}
          km={calculerKmLieu(gagnant, depart)}
          votes={propositionGagnante ? compterVotes(propositionGagnante) : 0}
          onFiche={() => ouvrirFiche(gagnant.id)}
          onItineraire={() => ouvrirItineraire(gagnant)}
        />
      ) : null}

      <View className="gap-1">
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {voteFini ? T.resultats : T.enLice}
        </Text>
        <Text className="font-texte text-[15px] leading-[22px] text-gris">
          {lierPonctuation(voteFini ? T.termine : T.consigne(finVote))}
        </Text>
      </View>

      {propositions.length === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {lierPonctuation(voteFini ? T.aucunTermine : T.aucun)}
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {propositions.map((p) => {
            const lieu = trouverLieu(p.lieuId);
            if (!lieu) return null;
            const aVote = p.votes.includes(monId);
            const votants = p.votes.filter((id) => !bloquesIds.has(id)).map(trouverPote).filter((v): v is Pote => v !== null);
            return (
              <PropositionVote
                key={p.lieuId}
                lieu={lieu}
                km={calculerKmLieu(lieu, depart)}
                image={trouverVignetteLieu(lieu.id, publications)}
                proposePar={bloquesIds.has(p.proposePar) ? null : trouverPote(p.proposePar)}
                votes={compterVotes(p)}
                votants={votants}
                aVote={aVote}
                termine={voteFini}
                gagnant={p.lieuId === lieuChoisi}
                onVoter={() => basculerVote(lieu, aVote)}
                onOuvrir={() => ouvrirFiche(lieu.id)}
              />
            );
          })}
        </View>
      )}

      {voteFini ? null : (
        <View className="gap-3">
          <Bouton
            libelle={complet ? T.complet(MAX_PROPOSITIONS_SORTIE) : T.proposer}
            variante="blanc"
            desactive={complet}
            indice={complet ? undefined : T.proposerIndice}
            onPress={() => setChoixOuvert(true)}
          />
          {organisateur ? <Bouton libelle={T.terminer} variante="encre" indice={T.terminerIndice} onPress={onTerminer} /> : null}
        </View>
      )}

      <ChoixLieu
        visible={choixOuvert}
        titre={T.proposer}
        dejaChoisis={sortie.propositions.map((p) => p.lieuId)}
        onChoisir={proposer}
        onFermer={() => setChoixOuvert(false)}
      />
    </View>
  );
}
