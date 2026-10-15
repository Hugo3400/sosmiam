import { Text, View } from "react-native";

import { DETAILS_MOTIFS_MODERATION } from "@sos-miam/commun/contenus/motifs-moderation";
import { remplirModele } from "@sos-miam/commun/fonctions/texte/remplir-modele";
import type { LimitationCompteApi } from "@sos-miam/commun/types/limitation-compte";
import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_LIMITATION as t } from "~/contenus/limitation-compte";
import { decrireFinLimitation } from "~/fonctions/compte/decrire-fin-limitation";
import { ecrireMomentLong } from "~/fonctions/dates/ecrire-moment-long";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  limitation: LimitationCompteApi;
  /** L'heure de référence (une limitation qui finit pendant qu'on lit devient « était limité ») */
  maintenant: Date;
  /** « Contester » touché (seulement proposé si peutContester) */
  onContester: () => void;
};

type Etat = "active" | "a-venir" | "finie";

/** En cours, à venir (l'API rend aussi celle qui commence plus tard), ou finie / levée depuis la lecture */
function lireEtat(l: LimitationCompteApi, maintenant: Date): Etat {
  const fin = l.fin ? new Date(l.fin).getTime() : null;
  if (fin !== null && !Number.isNaN(fin) && fin <= maintenant.getTime()) return "finie";
  if (l.active) return "active";
  const debut = new Date(l.debut).getTime();
  return !Number.isNaN(debut) && debut > maintenant.getTime() ? "a-venir" : "finie";
}

const capitale = (texte: string) => texte.charAt(0).toUpperCase() + texte.slice(1);

/** Un bloc de la carte (titre en petit, texte), lu d'un seul tenant par VoiceOver */
function Bloc({ titre, texte, encadre = false }: { titre: string; texte: string; encadre?: boolean }) {
  return (
    <View accessible accessibilityLabel={lierPonctuation(`${titre} : ${texte}`)} className="gap-1">
      <Text className="font-texte-semi text-sm text-gris">{titre}</Text>
      <Text
        className={`font-texte text-[15px] leading-[22px] text-encre ${encadre ? "rounded-2xl border-2 border-encre bg-white px-3 py-2.5" : ""}`}
      >
        {lierPonctuation(texte)}
      </Text>
    </View>
  );
}

/**
 * « Ton compte est limité », en tête de « Décisions de la modération » : jusqu'à quand (ou « jusqu'à nouvel ordre »), la
 * règle des CGU en cause et l'explication de l'équipe, ce qui attend la fin et ce qui marche comme d'habitude, puis
 * « Contester » (une fois, pendant la limitation) ou l'état de la contestation. Avec dignité : on explique, on ne fait pas
 * la morale. « Va être limité » si elle commence plus tard, « était limité » si elle a pris fin.
 */
export function CarteLimitationCompte({ limitation, maintenant, onContester }: Props) {
  const etat = lireEtat(limitation, maintenant);
  const fin = decrireFinLimitation(limitation.fin);
  const debut = ecrireMomentLong(limitation.debut);
  const titre = etat === "active" ? t.titre : etat === "a-venir" ? t.titreAVenir : t.titreFinie;
  const intro = etat === "active" ? remplirModele(t.intro, { fin }) : etat === "a-venir" ? remplirModele(t.introAVenir, { debut: debut ?? "bientôt", fin }) : t.introFinie;
  const pastille = etat === "active" ? { emoji: "⏸️", texte: capitale(fin) } : etat === "a-venir" ? { emoji: "🗓️", texte: debut ? `À partir du ${debut}` : "Bientôt" } : { emoji: "✅", texte: "C'est fini" };

  // Un code que cette version de l'app ne connaît pas encore : on dit seulement qu'il y a une règle
  const motif = (DETAILS_MOTIFS_MODERATION as Readonly<Record<string, { libelle: string; regle: string } | undefined>>)[limitation.motif];
  const regle = motif ? `${motif.libelle} : « ${motif.regle} »` : t.regleInconnue;
  const motivation = limitation.motivation?.trim() || null;

  const contesteLe = ecrireMomentLong(limitation.contesteLe);
  const reexamineLe = ecrireMomentLong(limitation.reexamineLe);
  const contestation = limitation.contestation?.trim() || null;
  const contestable = etat === "active" && limitation.peutContester;
  const suiteContestation = reexamineLe
    ? remplirModele(etat === "active" ? t.contestationMaintenue : t.contestationRelue, { date: reexamineLe })
    : t.contestationEnAttente;

  return (
    <View className={`gap-4 rounded-carte border-2 border-encre p-4 ${etat === "finie" ? "bg-white" : "bg-jaune-clair"}`}>
      <View accessible accessibilityLabel={lierPonctuation(`${titre}. ${pastille.texte}. ${intro}`)} className="gap-2">
        <Text accessibilityRole="header" className="font-titre text-xl text-encre">
          {lierPonctuation(titre)}
        </Text>
        <View className="flex-row items-center gap-1.5 self-start rounded-full border-2 border-encre bg-white px-3 py-1">
          <Text className="text-sm">{pastille.emoji}</Text>
          <Text className="flex-shrink font-texte-semi text-sm text-encre">{lierPonctuation(pastille.texte)}</Text>
        </View>
        <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(intro)}</Text>
      </View>

      <Bloc titre={t.regle} texte={regle} />
      {motivation ? <Bloc titre={t.explication} texte={motivation} encadre /> : null}
      {etat !== "finie" ? (
        <>
          <Bloc titre={t.coupeTitre} texte={t.coupe} />
          <Bloc titre={t.resteTitre} texte={t.reste} />
        </>
      ) : null}

      {contestable || contestation || etat === "a-venir" ? (
        <View className="gap-2 border-t-2 border-dashed border-encre pt-4">
          <Text accessibilityRole="header" className="font-texte-gras text-base text-encre">
            {lierPonctuation(t.contesterTitre)}
          </Text>
          {contestation ? (
            <View accessible className="gap-2">
              <Text className="font-texte text-[15px] leading-[22px] text-encre">
                {lierPonctuation(`📮 ${contesteLe ? remplirModele(t.contestationEnvoyee, { date: contesteLe }) : t.contestationEnvoyeeSansDate}`)}
              </Text>
              <Text className="rounded-2xl border-2 border-encre bg-white px-3 py-2.5 font-texte text-[15px] leading-[22px] text-encre">{contestation}</Text>
              <Text className="font-texte-semi text-sm leading-5 text-encre">{lierPonctuation(`${reexamineLe ? "🔁" : "⏳"} ${suiteContestation}`)}</Text>
            </View>
          ) : contestable ? (
            <>
              <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(t.contester)}</Text>
              <Bouton
                libelle="Contester"
                variante="blanc"
                petit
                className="self-start"
                libelleLu="Contester la limitation de ton compte"
                indice="Explique à l'équipe pourquoi tu n'es pas d'accord"
                onPress={onContester}
              />
            </>
          ) : (
            <Text className="font-texte text-[15px] leading-[22px] text-encre">{lierPonctuation(t.contestationAVenir)}</Text>
          )}
        </View>
      ) : null}
    </View>
  );
}
