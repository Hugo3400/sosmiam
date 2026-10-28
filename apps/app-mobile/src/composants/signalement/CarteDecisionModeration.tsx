import { Text, View } from "react-native";

import { DETAILS_MOTIFS_MODERATION_PAR_LANGUE } from "@sos-miam/commun/contenus/motifs-moderation";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { CibleDecisionModeration, DecisionModerationApi } from "@sos-miam/commun/types/signalement";
import type { Traduction } from "@sos-miam/commun/types/traduction";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_DECISIONS_MODERATION_PAR_LANGUE, type TEXTES_DECISIONS_MODERATION } from "~/contenus/textes-decisions-moderation";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { ecrireDateLongueLangue } from "~/fonctions/langue/ecrire-date-longue-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  decision: DecisionModerationApi;
  /** « Contester » touché (seulement proposé tant que la décision est contestable) */
  onContester: () => void;
  /** L'heure de référence pour le délai de contestation */
  maintenant: Date;
};

/**
 * Un avis ou la réponse d'un lieu à un avis : l'équipe les masque en décidant, à la relecture (décision du 15/10/2026). Un
 * « rien à redire » sur eux vient donc d'une contestation qui t'a donné raison : ils sont de retour en ligne.
 */
const MASQUES_A_LA_RELECTURE: readonly CibleDecisionModeration[] = ["avis", "reponse-avis"];

const FONDS_STATUT: Readonly<Record<DecisionModerationApi["statut"], string>> = { masque: "bg-jaune-clair", retenu: "bg-rose-alerte", rejete: "bg-creme" };
const EMOJIS_STATUT: Readonly<Record<DecisionModerationApi["statut"], string>> = { masque: "🙈", retenu: "🧹", rejete: "✅" };

type Textes = Traduction<typeof TEXTES_DECISIONS_MODERATION>;

/** « 14 octobre 2026 », ou null si la date est absente ou illisible */
const ecrireDate = (iso: string | null, langue: Langue) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : ecrireDateLongueLangue(formaterDateIso(date), langue);
};

/** Ce que c'était, le statut dit simplement, et la phrase qui l'explique (accordés au féminin pour une liste, une sortie ou une réponse) */
function decrire({ cible, role, statut }: DecisionModerationApi, T: Textes) {
  const { nom, feminin } = T.cibles[cible] ?? T.cibleInconnue;
  const remis = statut === "retenu" ? T.remisParDefaut[cible] : undefined;
  if (remis) return { quoi: role === "auteur" ? T.quoiAuteur(nom, feminin) : T.quoiSignale(nom, feminin), feminin, statut: T.statutRemis, phrase: remis[role === "auteur" ? "auteur" : "signale"] };
  if (role === "auteur") {
    const quoi = T.quoiAuteur(nom, feminin);
    if (statut === "masque") return { quoi, feminin, statut: T.statutMasque(feminin), phrase: T.phraseMasque(feminin) };
    if (statut === "retenu") return { quoi, feminin, statut: T.statutRetire(feminin), phrase: T.phraseRetireAuteur(feminin) };
    if (MASQUES_A_LA_RELECTURE.includes(cible)) return { quoi, feminin, statut: T.statutDeRetour, phrase: T.phraseDeRetour(feminin) };
    return { quoi, feminin, statut: T.statutRienARedire(feminin), phrase: T.phraseRienARedireAuteur(feminin) };
  }
  const quoi = T.quoiSignale(nom, feminin);
  const leContenu = T.leContenu(nom, feminin);
  if (statut === "retenu") return { quoi, feminin, statut: T.statutRetire(feminin), phrase: T.phraseRetireSignale(leContenu, feminin) };
  if (statut === "rejete") return { quoi, feminin, statut: T.statutRienARedire(feminin), phrase: T.phraseRienARedireSignale(leContenu) };
  return { quoi, feminin, statut: T.statutEnAttente, phrase: T.phraseEnAttente(leContenu) };
}

/**
 * Une décision de la modération, dans « Décisions de la modération » : ce que c'était (« Ton commentaire », « Ton avis »,
 * « Ta réponse à un avis », « Ton signalement d'un message »), le statut dit simplement, la règle des CGU en cause et
 * l'explication de l'équipe, la date, puis « Contester » tant que c'est possible, ou où en est la contestation. Jamais qui a
 * signalé.
 * VoiceOver lit la décision d'un seul tenant, puis le bouton.
 */
export function CarteDecisionModeration({ decision, onContester, maintenant }: Props) {
  const T = utiliserTextes(TEXTES_DECISIONS_MODERATION_PAR_LANGUE);
  const motifs = utiliserTextes(DETAILS_MOTIFS_MODERATION_PAR_LANGUE);
  const { langue } = utiliserLangue();
  const { quoi, feminin, statut, phrase } = decrire(decision, T);
  const quoiDansUnePhrase = (decision.role === "auteur" ? T.cibles[decision.cible]?.dansUnePhrase : undefined) ?? quoi.toLowerCase();
  // Un code que cette version de l'app ne connaît pas encore : la règle n'est pas citée, on dit seulement qu'il y en a une
  const motif = decision.motif ? (motifs as Readonly<Record<string, { libelle: string; regle: string } | undefined>>)[decision.motif] : undefined;
  const regle = decision.motif ? (motif ? T.regle(motif.libelle, motif.regle) : T.regleInconnue) : null;
  const motivation = decision.motivation?.trim() || null;
  const date = ecrireDate(decision.decideLe, langue);
  const ligneDate = date ? (decision.statut === "masque" ? T.masqueLe(date, feminin) : T.decideLe(date)) : null;
  const limite = decision.contestableJusqua ? new Date(decision.contestableJusqua) : null;
  const dansLesTemps = !!limite && !Number.isNaN(limite.getTime()) && limite.getTime() > maintenant.getTime();
  const contestable = decision.contestation === "aucune" && dansLesTemps;
  const jusquau = contestable ? ecrireDate(decision.contestableJusqua, langue) : null;

  const mention =
    decision.contestation === "envoyee"
      ? { emoji: "📮", texte: T.mentionEnvoyee }
      : decision.contestation === "reexaminee"
        ? { emoji: "🔁", texte: T.mentionReexaminee }
        : decision.contestation === "aucune" && limite && !dansLesTemps
          ? { emoji: "🕰️", texte: T.mentionDelaiPasse }
          : null;

  const lu = [
    `${quoi}. ${statut}.`,
    phrase,
    regle ? T.luRegle(regle) : null,
    motivation ? T.luExplication(motivation) : null,
    ligneDate ? `${ligneDate}.` : null,
    mention?.texte ?? null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-carte p-4">
      <View accessible accessibilityLabel={lierPonctuation(lu)} className="gap-3">
        <View className="gap-2">
          <Text className="font-texte-gras text-base text-encre">{quoi}</Text>
          <View className={`flex-row items-center gap-1.5 self-start rounded-full border-2 border-encre px-3 py-1 ${FONDS_STATUT[decision.statut]}`}>
            <Text className="text-sm">{EMOJIS_STATUT[decision.statut]}</Text>
            <Text className="flex-shrink font-texte-semi text-sm text-encre">{statut}</Text>
          </View>
        </View>
        <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(phrase)}</Text>

        {regle ? (
          <View className="gap-1 border-l-4 border-jaune pl-3">
            <Text className="font-texte-semi text-sm text-gris">{T.regleTitre}</Text>
            <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(regle.charAt(0).toUpperCase() + regle.slice(1))}</Text>
          </View>
        ) : null}
        {motivation ? (
          <View className="gap-1 border-l-4 border-ligne pl-3">
            <Text className="font-texte-semi text-sm text-gris">{T.explicationTitre}</Text>
            <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(motivation)}</Text>
          </View>
        ) : null}

        {ligneDate ? <Text className="font-texte text-[13px] text-gris">{ligneDate}</Text> : null}
        {mention ? (
          <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(`${mention.emoji} ${mention.texte}`)}</Text>
        ) : null}
      </View>

      {contestable ? (
        <View className="gap-2">
          {jusquau ? <Text className="font-texte text-[13px] text-gris">{T.contesterJusquau(jusquau)}</Text> : null}
          <Bouton
            libelle={T.contester}
            variante="blanc"
            petit
            className="self-start"
            libelleLu={T.contesterDecisionLu(quoiDansUnePhrase)}
            indice={T.contesterIndice}
            onPress={onContester}
          />
        </View>
      ) : null}
    </View>
  );
}
