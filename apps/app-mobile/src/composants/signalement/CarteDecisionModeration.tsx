import { Text, View } from "react-native";

import { DETAILS_MOTIFS_MODERATION } from "@sos-miam/commun/contenus/motifs-moderation";
import type { CibleDecisionModeration, DecisionModerationApi } from "@sos-miam/commun/types/signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { formaterDateIso } from "~/fonctions/dates/formater-date-iso";
import { formaterDateLongue } from "~/fonctions/dates/formater-date-longue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  decision: DecisionModerationApi;
  /** « Contester » touché (seulement proposé tant que la décision est contestable) */
  onContester: () => void;
  /** L'heure de référence pour le délai de contestation */
  maintenant: Date;
};

/**
 * Le nom de chaque contenu, s'il est féminin (« Ta liste », « retirée »), et, s'il le faut, comment le dire au milieu d'une
 * phrase pour qu'on sache de quoi on parle (« ton avis sur un lieu »)
 */
const CIBLES: Readonly<Record<CibleDecisionModeration, { nom: string; feminin: boolean; dansUnePhrase?: string }>> = {
  commentaire: { nom: "commentaire", feminin: false },
  message: { nom: "message", feminin: false },
  liste: { nom: "liste", feminin: true },
  profil: { nom: "profil", feminin: false },
  sortie: { nom: "sortie", feminin: true },
  groupe: { nom: "groupe", feminin: false },
  avis: { nom: "avis", feminin: false, dansUnePhrase: "ton avis sur un lieu" },
  "reponse-avis": { nom: "réponse à un avis", feminin: true },
};

/**
 * Un avis ou la réponse d'un lieu à un avis : l'équipe les masque en décidant, à la relecture (décision du 15/10/2026). Un
 * « rien à redire » sur eux vient donc d'une contestation qui t'a donné raison : ils sont de retour en ligne.
 */
const MASQUES_A_LA_RELECTURE: readonly CibleDecisionModeration[] = ["avis", "reponse-avis"];

const FONDS_STATUT: Readonly<Record<DecisionModerationApi["statut"], string>> = { masque: "bg-jaune-clair", retenu: "bg-rose-alerte", rejete: "bg-creme" };
const EMOJIS_STATUT: Readonly<Record<DecisionModerationApi["statut"], string>> = { masque: "🙈", retenu: "🧹", rejete: "✅" };

/** « 14 octobre 2026 », ou null si la date est absente ou illisible */
const ecrireDate = (iso: string | null) => {
  if (!iso) return null;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : formaterDateLongue(formaterDateIso(date));
};

/**
 * Un profil, une sortie ou un groupe ne disparaissent pas : la modération remet par défaut ce qui posait problème (l'avatar,
 * le titre de la sortie, le titre du groupe)
 */
const REMIS_PAR_DEFAUT: Readonly<Partial<Record<CibleDecisionModeration, { auteur: string; signale: string }>>> = {
  // Décision de Hugo : un profil retenu reçoit un pseudo neutre (« miami » + 4 chiffres) et perd son avatar
  profil: {
    auteur: "L'équipe a remplacé ton pseudo par un pseudo neutre et retiré ton avatar : ils ne respectaient pas une règle de la communauté. Tu peux choisir un nouveau pseudo dans Réglages › Mes infos.",
    signale: "L'équipe t'a donné raison : son pseudo et son avatar ont été remis par défaut. Merci de veiller au grain !",
  },
  sortie: { auteur: "L'équipe a remis le titre de ta sortie par défaut : il ne respectait pas une règle de la communauté.", signale: "L'équipe t'a donné raison : le titre de la sortie a été remis par défaut. Merci de veiller au grain !" },
  groupe: { auteur: "L'équipe a effacé le titre de ton groupe : il ne respectait pas une règle de la communauté.", signale: "L'équipe t'a donné raison : le titre du groupe a été effacé. Merci de veiller au grain !" },
};

/** Ce que c'était, le statut dit simplement, et la phrase qui l'explique (accordés au féminin pour une liste, une sortie ou une réponse) */
function decrire({ cible, role, statut }: DecisionModerationApi) {
  const { nom, feminin } = CIBLES[cible] ?? { nom: "contenu", feminin: false };
  const e = feminin ? "e" : "";
  const il = feminin ? "elle" : "il";
  const remis = statut === "retenu" ? REMIS_PAR_DEFAUT[cible] : undefined;
  if (remis) return { quoi: role === "auteur" ? `${feminin ? "Ta" : "Ton"} ${nom}` : `Ton signalement ${feminin ? "d'une" : "d'un"} ${nom}`, feminin, statut: "Remis par défaut", phrase: remis[role === "auteur" ? "auteur" : "signale"] };
  if (role === "auteur") {
    const quoi = `${feminin ? "Ta" : "Ton"} ${nom}`;
    if (statut === "masque")
      return { quoi, feminin, statut: `Masqué${e} en attendant la modération`, phrase: `${feminin ? "Elle" : "Il"} est caché${e} pour tout le monde, le temps qu'une personne de l'équipe ${feminin ? "la" : "le"} regarde de près.` };
    if (statut === "retenu") return { quoi, feminin, statut: `Retiré${e}`, phrase: `L'équipe l'a retiré${e} : ${il} ne respectait pas une règle de la communauté.` };
    if (MASQUES_A_LA_RELECTURE.includes(cible))
      return { quoi, feminin, statut: "De retour en ligne", phrase: `Bonne nouvelle : l'équipe a tout relu, ${il} respecte les règles de la communauté. ${feminin ? "Elle" : "Il"} est de nouveau visible pour tout le monde.` };
    return { quoi, feminin, statut: `Rien à redire, ${il} reste en ligne`, phrase: `L'équipe a regardé de près : ${il} respecte les règles de la communauté.` };
  }
  const quoi = `Ton signalement ${feminin ? "d'une" : "d'un"} ${nom}`;
  const leContenu = `${feminin ? "la" : "le"} ${nom}`;
  if (statut === "retenu") return { quoi, feminin, statut: `Retiré${e}`, phrase: `L'équipe t'a donné raison : ${leContenu} est retiré${e}. Merci de veiller au grain !` };
  if (statut === "rejete")
    return { quoi, feminin, statut: `Rien à redire, ${il} reste en ligne`, phrase: `L'équipe a regardé de près : ${leContenu} respecte les règles de la communauté. Merci quand même de nous l'avoir dit !` };
  return { quoi, feminin, statut: "En attente de la modération", phrase: `Une personne de l'équipe va regarder ${leContenu} de près.` };
}

/**
 * Une décision de la modération, dans « Décisions de la modération » : ce que c'était (« Ton commentaire », « Ton avis »,
 * « Ta réponse à un avis », « Ton signalement d'un message »), le statut dit simplement, la règle des CGU en cause et
 * l'explication de l'équipe, la date, puis « Contester » tant que c'est possible, ou où en est la contestation. Jamais qui a
 * signalé.
 * VoiceOver lit la décision d'un seul tenant, puis le bouton.
 */
export function CarteDecisionModeration({ decision, onContester, maintenant }: Props) {
  const { quoi, feminin, statut, phrase } = decrire(decision);
  const quoiDansUnePhrase = (decision.role === "auteur" ? CIBLES[decision.cible]?.dansUnePhrase : undefined) ?? quoi.toLowerCase();
  // Un code que cette version de l'app ne connaît pas encore : la règle n'est pas citée, on dit seulement qu'il y en a une
  const motif = decision.motif ? (DETAILS_MOTIFS_MODERATION as Readonly<Record<string, { libelle: string; regle: string } | undefined>>)[decision.motif] : undefined;
  const regle = decision.motif ? (motif ? `${motif.libelle} : « ${motif.regle} »` : "une des règles de la communauté (nos conditions d'utilisation)") : null;
  const motivation = decision.motivation?.trim() || null;
  const date = ecrireDate(decision.decideLe);
  const ligneDate = date ? `${decision.statut === "masque" ? `Masqué${feminin ? "e" : ""}` : "Décidé"} le ${date}` : null;
  const limite = decision.contestableJusqua ? new Date(decision.contestableJusqua) : null;
  const dansLesTemps = !!limite && !Number.isNaN(limite.getTime()) && limite.getTime() > maintenant.getTime();
  const contestable = decision.contestation === "aucune" && dansLesTemps;
  const jusquau = contestable ? ecrireDate(decision.contestableJusqua) : null;

  const mention =
    decision.contestation === "envoyee"
      ? { emoji: "📮", texte: "Contestation envoyée : une autre personne de l'équipe réexamine." }
      : decision.contestation === "reexaminee"
        ? { emoji: "🔁", texte: "Réexaminée : une autre personne de l'équipe a relu ta contestation, la décision ci-dessus est la sienne." }
        : decision.contestation === "aucune" && limite && !dansLesTemps
          ? { emoji: "🕰️", texte: "Le délai pour contester (6 mois) est passé." }
          : null;

  const lu = [
    `${quoi}. ${statut}.`,
    phrase,
    regle ? `La règle en cause : ${regle}.` : null,
    motivation ? `L'explication de l'équipe : ${motivation}` : null,
    ligneDate ? `${ligneDate}.` : null,
    mention?.texte ?? null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-white p-4">
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
            <Text className="font-texte-semi text-sm text-gris">La règle en cause</Text>
            <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(regle.charAt(0).toUpperCase() + regle.slice(1))}</Text>
          </View>
        ) : null}
        {motivation ? (
          <View className="gap-1 border-l-4 border-ligne pl-3">
            <Text className="font-texte-semi text-sm text-gris">{"L'explication de l'équipe"}</Text>
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
          {jusquau ? <Text className="font-texte text-[13px] text-gris">{`Tu peux contester jusqu'au ${jusquau}.`}</Text> : null}
          <Bouton
            libelle="Contester"
            variante="blanc"
            petit
            className="self-start"
            libelleLu={`Contester la décision sur ${quoiDansUnePhrase}`}
            indice="Explique à l'équipe pourquoi tu n'es pas d'accord"
            onPress={onContester}
          />
        </View>
      ) : null}
    </View>
  );
}
