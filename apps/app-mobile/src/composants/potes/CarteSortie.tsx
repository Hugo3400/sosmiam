import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import { ecrireDateLangue } from "@sos-miam/commun/fonctions/langue/ecrire-date-langue";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import { nommerJourLangue } from "@sos-miam/commun/fonctions/langue/nommer-jour-langue";
import { choisirLieuGagnant } from "@sos-miam/commun/fonctions/sorties/choisir-lieu-gagnant";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote, Sortie } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_CARTES_SORTIES_PAR_LANGUE } from "~/contenus/textes-cartes-sorties";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  sortie: Sortie;
  /** Lieux connus de l'app, par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Sortie déjà passée : fond crème au lieu de blanc, « C'était… » */
  passee: boolean;
  /** L'heure de l'onglet, rafraîchie par la section : la fin du vote et « aujourd'hui » restent justes */
  maintenant: Date;
  onOuvrir: (id: string) => void;
  /** Le menu « ⋯ » (quitter, retirer de tes sorties), posé à côté de la carte ; sans lui, une simple flèche */
  onMenu?: () => void;
  /** Posée sur la carte (utiliserPagination) : « Voir plus » y amène le lecteur d'écran */
  refPrincipal?: (vue: View | null) => void;
};

const TAILLE_ROND = 32;
const MAX_RONDS = 5;

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** « aujourd'hui à 20h30 », « demain à 18h », « vendredi 10 octobre à 20h30 » */
const formaterMoment = (iso: string, maintenant: Date, langue: Langue) => {
  const T = choisirTextes(TEXTES_CARTES_SORTIES_PAR_LANGUE, langue).carte;
  const date = new Date(iso);
  const heure = formaterHeureLangue(date.getHours(), date.getMinutes(), langue);
  // Arrondi : un changement d'heure (été, hiver) donne des journées de 23 ou 25 heures
  const ecart = Math.round((debutDuJour(date) - debutDuJour(maintenant)) / 86_400_000);
  const jour =
    ecart === 0
      ? T.aujourdhui
      : ecart === 1
        ? T.demain
        : ecart === -1
          ? T.hier
          : T.jourDate(nommerJourLangue(date.getDay(), langue), ecrireDateLangue({ annee: date.getFullYear(), mois: date.getMonth() + 1, jour: date.getDate() }, langue, { sansAnnee: true }));
  return T.moment(jour, heure);
};

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** Une sortie entre potes : emoji, titre, jour et heure, qui vient, et où en est le vote (ou le lieu retenu). Lue d'un seul bloc, avec son « ⋯ » à côté s'il y en a un. */
export function CarteSortie({ sortie, lieux, passee, maintenant, onOuvrir, onMenu, refPrincipal }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_CARTES_SORTIES_PAR_LANGUE).carte;
  const { trouverPote, bloques } = utiliserCommunaute();
  const monId = utiliserMonId();
  const bloquesIds = new Set(bloques.map((b) => b.id));

  const participants = sortie.participants
    .filter((id) => !bloquesIds.has(id))
    .map(trouverPote)
    .filter((p): p is Pote => p !== null);
  const visibles = participants.slice(0, MAX_RONDS);
  const enPlus = participants.length - visibles.length;
  // Une personne bloquée n'apparaît plus, même comme organisatrice
  const organisateur =
    sortie.organisateur === monId ? T.toi : bloquesIds.has(sortie.organisateur) ? null : (trouverPote(sortie.organisateur)?.prenom ?? null);

  // Comme l'écran de la sortie : fin du vote passée, le lieu le plus voté l'emporte (les propositions sont déjà filtrées)
  const voteFini = sortie.lieuChoisi !== null || sortie.voteTermine === true || new Date(sortie.finVote).getTime() <= maintenant.getTime();
  // Avec un compte, nombreVotes compte aussi les votes qu'on ne te nomme pas : c'est lui qui décide
  const lieuId =
    sortie.lieuChoisi ?? (voteFini ? choisirLieuGagnant(sortie.propositions.map((p) => ({ lieuId: p.lieuId, votes: p.nombreVotes ?? p.votes.length }))) : null);
  const lieu = lieuId !== null ? lieux.get(lieuId) : undefined;
  const voteEnCours = !voteFini;
  const aVote = sortie.propositions.some((p) => p.votes.includes(monId));
  // « Chez Nonna Lia » → « On va chez Nonna Lia »
  const etat = lieu
    ? { emoji: "📍", texte: passee ? T.lieuRetenu(lieu.nom) : T.onVaChez(lieu.nom), fond: "bg-jaune", couleurTexte: "text-nuit" }
    : voteEnCours
      ? { emoji: "🗳️", texte: T.voteEnCours(formaterMoment(sortie.finVote, maintenant, langue)), fond: "bg-jaune-clair", couleurTexte: "text-encre" }
      : { emoji: "🤷", texte: T.voteTermine, fond: "bg-ligne", couleurTexte: "text-encre" };
  const aToiDeVoter = voteEnCours && !aVote;
  const moment = formaterMoment(sortie.quand, maintenant, langue);
  const quand = passee ? T.cetait(moment) : majuscule(moment);
  const messages = sortie.messages.length;
  // Compte connecté : les messages pas encore lus de sa discussion
  const nonLus = sortie.nonLus ?? 0;

  const lu = [
    sortie.titre,
    quand,
    T.participants(participants.length, participants.map((p) => (p.id === monId ? T.toi : p.prenom)).join(", ")),
    organisateur ? T.organisee(organisateur) : null,
    etat.texte,
    aToiDeVoter ? T.aToiDeVoterLu : null,
    messages > 0 ? T.messages(messages) : null,
    nonLus > 0 ? T.nonLus(nonLus) : null,
  ]
    .filter(Boolean)
    .join(". ");

  const carte = (
    <Pressable
      ref={refPrincipal}
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint={T.indiceOuvrir}
      onPress={() => {
        vibrerLegerement();
        onOuvrir(sortie.id);
      }}
      // Sortie passée : fond crème au lieu d'une opacité, qui ferait passer les textes gris sous le contraste lisible
      className={`gap-3 rounded-carte border-2 border-encre p-4 active:opacity-80 ${passee ? "bg-creme" : "bg-carte"}`}
    >
      <View className="flex-row items-center gap-3">
        <View className={`h-12 w-12 items-center justify-center rounded-2xl border-2 border-encre ${passee ? "bg-ligne" : "bg-jaune-clair"}`}>
          <Text allowFontScaling={false} className="text-2xl">
            {sortie.emoji}
          </Text>
        </View>
        <View className="flex-1 gap-0.5">
          <Text numberOfLines={2} className="font-texte-gras text-base text-encre">
            {sortie.titre}
          </Text>
          <Text numberOfLines={1} className="font-texte-moyen text-[13px] text-gris">
            {quand}
          </Text>
        </View>
        {/* Avec un « ⋯ », il prend la place de la flèche */}
        {onMenu ? <View className="w-8" /> : <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />}
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-row pl-2">
          {visibles.map((p) => (
            <View key={p.id} className={`-ml-2 rounded-full border-2 ${passee ? "border-creme" : "border-carte"}`}>
              <RondPote pote={p} taille={TAILLE_ROND} />
            </View>
          ))}
          {enPlus > 0 ? (
            <View
              style={{ width: TAILLE_ROND + 4, height: TAILLE_ROND + 4 }}
              className={`-ml-2 items-center justify-center rounded-full border-2 bg-nuit ${passee ? "border-creme" : "border-carte"}`}
            >
              <Text allowFontScaling={false} className="font-texte-gras text-xs text-jaune">
                +{enPlus}
              </Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} className="flex-1 font-texte text-[13px] text-gris">
          {organisateur ? T.organisee(organisateur) : ""}
          {messages > 0 ? ` · 💬 ${messages}` : ""}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${etat.fond}`}>
          <Text className="text-sm">{etat.emoji}</Text>
          <Text className={`shrink font-texte-semi text-[13px] ${etat.couleurTexte}`}>{etat.texte}</Text>
        </View>
        {aToiDeVoter ? (
          <View className="rounded-full bg-rose-alerte px-3 py-1.5">
            <Text className="font-texte-gras text-[13px] text-rouge-texte">{T.aToiDeVoter}</Text>
          </View>
        ) : null}
        {nonLus > 0 ? (
          <View className="flex-row items-center gap-1 rounded-full border border-encre bg-nuit px-3 py-1.5">
            <Text className="text-sm">💬</Text>
            <Text className="font-texte-gras text-[13px] text-jaune">{T.nouveaux(nonLus)}</Text>
          </View>
        ) : null}
      </View>
    </Pressable>
  );

  if (!onMenu) return carte;
  return (
    // Le menu « ⋯ » est posé à côté de la carte (pas dedans) : le lecteur d'écran les lit l'un après l'autre
    <View className="relative">
      {carte}
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={T.optionsLu(sortie.titre)}
        accessibilityHint={passee ? T.indiceRetirer : T.indiceQuitter}
        hitSlop={4}
        onPress={() => {
          vibrerLegerement();
          onMenu();
        }}
        className="absolute right-2 top-3 h-11 w-11 items-center justify-center rounded-full active:opacity-60"
      >
        <Ionicons name="ellipsis-horizontal" size={20} color={couleurs.gris} />
      </Pressable>
    </View>
  );
}
