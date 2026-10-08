import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote, Sortie } from "@sos-miam/commun/types/potes";
import { RondPote } from "~/composants/potes/RondPote";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Props = {
  sortie: Sortie;
  /** Lieux que tu peux voir (sans les bars sous 18 ans), par identifiant */
  lieux: ReadonlyMap<number, Lieu>;
  /** Sortie déjà passée : un peu effacée, « C'était… » */
  passee: boolean;
  onOuvrir: (id: string) => void;
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

/** Une sortie entre potes : emoji, titre, jour et heure, qui vient, et où en est le vote (ou le lieu retenu). Lue d'un seul bloc. */
export function CarteSortie({ sortie, lieux, passee, onOuvrir }: Props) {
  const { trouverPote, bloques } = utiliserCommunaute();
  const maintenant = new Date();

  const participants = sortie.participants
    .filter((id) => !bloques.some((b) => b.id === id))
    .map(trouverPote)
    .filter((p): p is Pote => p !== null);
  const visibles = participants.slice(0, MAX_RONDS);
  const enPlus = participants.length - visibles.length;
  const organisateur = sortie.organisateur === ID_MOI ? "toi" : (trouverPote(sortie.organisateur)?.prenom ?? null);

  const lieu = sortie.lieuChoisi !== null ? lieux.get(sortie.lieuChoisi) : undefined;
  const voteEnCours = sortie.lieuChoisi === null && new Date(sortie.finVote).getTime() > maintenant.getTime();
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

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={lu}
      accessibilityHint="Ouvre la sortie : vote, lieux proposés et discussion"
      onPress={() => {
        vibrerLegerement();
        onOuvrir(sortie.id);
      }}
      className={`gap-3 rounded-carte border-2 border-encre bg-white p-4 active:opacity-80 ${passee ? "opacity-70" : ""}`}
    >
      <View className="flex-row items-center gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-2xl border-2 border-encre bg-jaune-clair">
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
        <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
      </View>

      <View className="flex-row items-center gap-3">
        <View className="flex-row pl-2">
          {visibles.map((p) => (
            <View key={p.id} className="-ml-2 rounded-full border-2 border-white">
              <RondPote pote={p} taille={TAILLE_ROND} />
            </View>
          ))}
          {enPlus > 0 ? (
            <View
              style={{ width: TAILLE_ROND + 4, height: TAILLE_ROND + 4 }}
              className="-ml-2 items-center justify-center rounded-full border-2 border-white bg-encre"
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
}
