import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote, Sortie } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { choisirLieuGagnant } from "~/fonctions/communaute/choisir-lieu-gagnant";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Props = {
  sortie: Sortie;
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Sortie déjà passée : fond crème au lieu de blanc, « C'était… » */
  passee: boolean;
  /** L'heure de l'onglet, rafraîchie par la section : la fin du vote et « aujourd'hui » restent justes */
  maintenant: Date;
  onOuvrir: (id: string) => void;
  /** Le menu « ⋯ » (quitter, retirer de tes sorties), posé à côté de la carte ; sans lui, une simple flèche */
  onMenu?: () => void;
};

const TAILLE_ROND = 32;
const MAX_RONDS = 5;
const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

const debutDuJour = (date: Date) => new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();

/** « aujourd'hui à 20h30 », « demain à 18h », « vendredi 10 octobre à 20h30 » */
const formaterMoment = (iso: string, maintenant: Date) => {
  const date = new Date(iso);
  const heure = formaterHeure(`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`);
  // Arrondi : un changement d'heure (été, hiver) donne des journées de 23 ou 25 heures
  const ecart = Math.round((debutDuJour(date) - debutDuJour(maintenant)) / 86_400_000);
  const jour =
    ecart === 0
      ? "aujourd'hui"
      : ecart === 1
        ? "demain"
        : ecart === -1
          ? "hier"
          : `${JOURS[date.getDay()]} ${date.getDate() === 1 ? "1er" : date.getDate()} ${MOIS[date.getMonth()]}`;
  return `${jour} à ${heure}`;
};

const majuscule = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** Une sortie entre potes : emoji, titre, jour et heure, qui vient, et où en est le vote (ou le lieu retenu). Lue d'un seul bloc, avec son « ⋯ » à côté s'il y en a un. */
export function CarteSortie({ sortie, lieux, passee, maintenant, onOuvrir, onMenu }: Props) {
  const { trouverPote, bloques } = utiliserCommunaute();
  const bloquesIds = new Set(bloques.map((b) => b.id));

  const participants = sortie.participants
    .filter((id) => !bloquesIds.has(id))
    .map(trouverPote)
    .filter((p): p is Pote => p !== null);
  const visibles = participants.slice(0, MAX_RONDS);
  const enPlus = participants.length - visibles.length;
  // Une personne bloquée n'apparaît plus, même comme organisatrice
  const organisateur =
    sortie.organisateur === ID_MOI ? "toi" : bloquesIds.has(sortie.organisateur) ? null : (trouverPote(sortie.organisateur)?.prenom ?? null);

  // Comme l'écran de la sortie : fin du vote passée, le lieu le plus voté l'emporte (les propositions sont déjà filtrées)
  const voteFini = sortie.lieuChoisi !== null || new Date(sortie.finVote).getTime() <= maintenant.getTime();
  const lieuId = sortie.lieuChoisi ?? (voteFini ? choisirLieuGagnant(sortie.propositions) : null);
  const lieu = lieuId !== null ? lieux.get(lieuId) : undefined;
  const voteEnCours = !voteFini;
  const aVote = sortie.propositions.some((p) => p.votes.includes(ID_MOI));
  // « Chez Nonna Lia » → « On va chez Nonna Lia »
  const etat = lieu
    ? { emoji: "📍", texte: passee ? `Lieu retenu\u00a0: ${lieu.nom}` : `On va chez ${lieu.nom.replace(/^chez\s+/i, "")}`, fond: "bg-jaune" }
    : voteEnCours
      ? { emoji: "🗳️", texte: `Vote en cours, fin ${formaterMoment(sortie.finVote, maintenant)}`, fond: "bg-jaune-clair" }
      : { emoji: "🤷", texte: "Vote terminé, aucun lieu retenu", fond: "bg-ligne" };
  const aToiDeVoter = voteEnCours && !aVote;
  const moment = formaterMoment(sortie.quand, maintenant);
  const quand = passee ? `C'était ${moment}` : majuscule(moment);
  const messages = sortie.messages.length;

  const lu = [
    sortie.titre,
    quand,
    `${participants.length} participant${participants.length > 1 ? "s" : ""} : ${participants.map((p) => (p.id === ID_MOI ? "toi" : p.prenom)).join(", ")}`,
    organisateur ? `Organisée par ${organisateur}` : null,
    etat.texte,
    aToiDeVoter ? "À toi de voter" : null,
    messages > 0 ? `${messages} message${messages > 1 ? "s" : ""}` : null,
  ]
    .filter(Boolean)
    .join(". ");

  const carte = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint="Ouvre la sortie : vote, lieux proposés et discussion"
      onPress={() => {
        vibrerLegerement();
        onOuvrir(sortie.id);
      }}
      // Sortie passée : fond crème au lieu d'une opacité, qui ferait passer les textes gris sous le contraste lisible
      className={`gap-3 rounded-carte border-2 border-encre p-4 active:opacity-80 ${passee ? "bg-creme" : "bg-white"}`}
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
            <View key={p.id} className={`-ml-2 rounded-full border-2 ${passee ? "border-creme" : "border-white"}`}>
              <RondPote pote={p} taille={TAILLE_ROND} />
            </View>
          ))}
          {enPlus > 0 ? (
            <View
              style={{ width: TAILLE_ROND + 4, height: TAILLE_ROND + 4 }}
              className={`-ml-2 items-center justify-center rounded-full border-2 bg-encre ${passee ? "border-creme" : "border-white"}`}
            >
              <Text allowFontScaling={false} className="font-texte-gras text-xs text-jaune">
                +{enPlus}
              </Text>
            </View>
          ) : null}
        </View>
        <Text numberOfLines={1} className="flex-1 font-texte text-[13px] text-gris">
          {organisateur ? `Organisée par ${organisateur}` : ""}
          {messages > 0 ? ` · 💬 ${messages}` : ""}
        </Text>
      </View>

      <View className="flex-row flex-wrap gap-2">
        <View className={`flex-row items-center gap-1.5 rounded-full px-3 py-1.5 ${etat.fond}`}>
          <Text className="text-sm">{etat.emoji}</Text>
          <Text className="shrink font-texte-semi text-[13px] text-encre">{etat.texte}</Text>
        </View>
        {aToiDeVoter ? (
          <View className="rounded-full bg-rose-alerte px-3 py-1.5">
            <Text className="font-texte-gras text-[13px] text-rouge-texte">{"À toi de voter\u00a0!"}</Text>
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
        accessibilityLabel={`Plus d'options sur la sortie ${sortie.titre}`}
        accessibilityHint={passee ? "La retirer de tes sorties" : "La quitter"}
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
