import { useRouter } from "expo-router";
import { useCallback, useState } from "react";
import { AccessibilityInfo, Linking, Platform, Pressable, Text, View } from "react-native";

import { ID_MOI, MAX_PROPOSITIONS_SORTIE } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote, Sortie } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { ChoixLieu } from "~/composants/potes/ChoixLieu";
import { LieuChoisiSortie } from "~/composants/potes/LieuChoisiSortie";
import { PropositionVote } from "~/composants/potes/PropositionVote";
import { lieuxExemples } from "~/contenus/lieux-exemples";
import { publicationsExemples } from "~/contenus/publications-exemples";
import { calculerKmLieu } from "~/fonctions/lieux/calculer-km-lieu";
import { trouverVignetteLieu } from "~/fonctions/publications/trouver-vignette-lieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserActivite } from "~/hooks/utiliser-activite";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserPointDeDepart } from "~/hooks/utiliser-point-de-depart";

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
  /** Demande de quitter la sortie (l'écran confirme) */
  onQuitter: () => void;
};

const parLieu = new Map(lieuxExemples.map((l) => [l.id, l]));

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
export function VoteSortie({ sortie, voteFini, lieuChoisi, finVote, onAnnoncer, onTerminer, onQuitter }: Props) {
  const router = useRouter();
  const { trouverPote, voter, proposerLieu, lieuPermisDansSortie, bloques } = utiliserCommunaute();
  const { estMasquee } = utiliserActivite();
  const depart = utiliserPointDeDepart();
  const [choixOuvert, setChoixOuvert] = useState(false);

  const participants = sortie.participants;
  const permis = useCallback((lieu: Lieu) => lieuPermisDansSortie(lieu.id, participants), [lieuPermisDansSortie, participants]);
  const publications = publicationsExemples.filter((p) => !estMasquee(p.id));
  const bloquesIds = new Set(bloques.map((b) => b.id));
  const organisateur = sortie.organisateur === ID_MOI;
  const avecMineur = participants.some((id) => trouverPote(id)?.mineur);
  const complet = sortie.propositions.length >= MAX_PROPOSITIONS_SORTIE;

  // Vote fini : le lieu retenu en tête, puis les autres du plus voté au moins voté
  const propositions = voteFini
    ? [...sortie.propositions].sort((a, b) => Number(b.lieuId === lieuChoisi) - Number(a.lieuId === lieuChoisi) || b.votes.length - a.votes.length)
    : sortie.propositions;
  const gagnant = lieuChoisi !== null ? parLieu.get(lieuChoisi) : undefined;
  const ouvrirFiche = (id: number) => router.push({ pathname: "/lieu/[id]", params: { id: String(id) } });

  function basculerVote(lieu: Lieu, aVote: boolean) {
    voter(sortie.id, lieu.id);
    AccessibilityInfo.announceForAccessibility(aVote ? `Vote retiré pour ${lieu.nom}` : `Tu votes pour ${lieu.nom}`);
  }

  function proposer(lieuId: number) {
    const lieu = parLieu.get(lieuId);
    const resultat = proposerLieu(sortie.id, lieuId);
    if (resultat === "ok") {
      setChoixOuvert(false);
      onAnnoncer(`📍 ${lieu?.nom ?? "Lieu"} proposé, et ton vote est déjà dedans !`);
    } else if (resultat === "deja") onAnnoncer("Ce lieu est déjà dans la course 😉");
    else if (resultat === "max") onAnnoncer(`Déjà ${MAX_PROPOSITIONS_SORTIE} lieux en lice : départagez-les d'abord !`);
    else onAnnoncer("Ce lieu n'est pas possible pour cette sortie, essaie-en un autre.");
  }

  return (
    <View className="gap-4">
      {voteFini && gagnant ? (
        <LieuChoisiSortie
          lieu={gagnant}
          image={trouverVignetteLieu(gagnant.id, publications)}
          km={calculerKmLieu(gagnant, depart)}
          votes={sortie.propositions.find((p) => p.lieuId === gagnant.id)?.votes.length ?? 0}
          onFiche={() => ouvrirFiche(gagnant.id)}
          onItineraire={() => ouvrirItineraire(gagnant)}
        />
      ) : null}

      <View className="gap-1">
        <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
          {voteFini ? "Les résultats" : "Les lieux en lice"}
        </Text>
        <Text className="font-texte text-[15px] leading-[22px] text-gris">
          {lierPonctuation(voteFini ? "Le vote est terminé, voilà ce que la bande a choisi." : `Vote pour autant de lieux que tu veux. Fin du vote ${finVote}.`)}
        </Text>
      </View>

      {propositions.length === 0 ? (
        <View className="items-center gap-2 rounded-carte border-2 border-dashed border-ligne px-6 py-6">
          <Text className="text-center font-texte text-base leading-6 text-gris">
            {lierPonctuation(voteFini ? "Aucun lieu n'a été proposé : il faudra improviser !" : "Aucun lieu pour l'instant : lance la course en proposant le premier.")}
          </Text>
        </View>
      ) : (
        <View className="gap-3">
          {propositions.map((p) => {
            const lieu = parLieu.get(p.lieuId);
            if (!lieu) return null;
            const aVote = p.votes.includes(ID_MOI);
            const votants = p.votes.filter((id) => !bloquesIds.has(id)).map(trouverPote).filter((v): v is Pote => v !== null);
            return (
              <PropositionVote
                key={p.lieuId}
                lieu={lieu}
                km={calculerKmLieu(lieu, depart)}
                image={trouverVignetteLieu(lieu.id, publications)}
                proposePar={bloquesIds.has(p.proposePar) ? null : trouverPote(p.proposePar)}
                votes={p.votes.length}
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
          {avecMineur ? (
            <Text className="font-texte text-sm leading-5 text-gris">
              {lierPonctuation("🧃 Pas de bar pour cette sortie : tout le monde n'a pas encore 18 ans.")}
            </Text>
          ) : null}
          <Bouton
            libelle={complet ? `${MAX_PROPOSITIONS_SORTIE} lieux en lice, c'est complet` : "Proposer un lieu"}
            variante="blanc"
            desactive={complet}
            indice={complet ? undefined : "Choisis un lieu à ajouter au vote"}
            onPress={() => setChoixOuvert(true)}
          />
          {organisateur ? <Bouton libelle="Terminer le vote" variante="encre" indice="Le lieu qui a le plus de votes l'emporte" onPress={onTerminer} /> : null}
        </View>
      )}

      <Pressable accessibilityRole="button" onPress={onQuitter} hitSlop={4} className="mt-2 min-h-11 items-center justify-center self-center px-4 active:opacity-70">
        <Text className="font-texte-semi text-base text-rouge-texte underline">Quitter la sortie</Text>
      </Pressable>

      <ChoixLieu
        visible={choixOuvert}
        titre="Proposer un lieu"
        dejaChoisis={sortie.propositions.map((p) => p.lieuId)}
        permis={permis}
        onChoisir={proposer}
        onFermer={() => setChoixOuvert(false)}
      />
    </View>
  );
}
