import Ionicons from "@expo/vector-icons/Ionicons";
import { Pressable, Text, View } from "react-native";

import { CALENDRIER_PAR_LANGUE } from "@sos-miam/commun/contenus/calendrier";
import { LIBELLES_MODE_VALIDATION_PAR_LANGUE } from "@sos-miam/commun/contenus/modes-validation";
import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import { decrireEtatAvis } from "@sos-miam/commun/fonctions/visites/decrire-etat-avis";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { Visite } from "@sos-miam/commun/types/visite";
import { EtiquettesReglement } from "~/composants/visites/EtiquettesReglement";
import { TEXTES_MES_VISITES_PAR_LANGUE } from "~/contenus/textes-mes-visites";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { decrireReglementLangue } from "~/fonctions/langue/decrire-reglement-langue";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  visite: Visite;
  /** Toute la carte se touche (en général : ouvre /visite/[id]) */
  onPress: () => void;
};

type Ton = "jaune" | "encre" | "blanc" | "rose" | "doux";
/** Une petite étiquette sous le nom : ce qu'on voit, et ce que lit VoiceOver */
type Puce = { texte: string; lu: string; ton: Ton };

const FONDS: Record<Ton, string> = {
  jaune: "border-encre bg-jaune",
  encre: "border-encre bg-nuit",
  blanc: "border-encre bg-carte",
  rose: "border-rouge-texte bg-rose-alerte",
  doux: "border-ligne bg-creme",
};
const TEXTES: Record<Ton, string> = {
  jaune: "text-nuit",
  encre: "text-jaune",
  blanc: "text-encre",
  rose: "text-rouge-texte",
  doux: "text-gris",
};

type Textes = typeof TEXTES_MES_VISITES_PAR_LANGUE.fr;

/** « mar. 7 oct. · 20h14 » à l'écran, « mardi 7 octobre à 20h14 » pour VoiceOver (l'année seulement si ce n'est pas celle-ci) */
function decrireMoment(iso: string, T: Textes, langue: Langue): { court: string; lu: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { court: "", lu: "" };
  const calendrier = CALENDRIER_PAR_LANGUE[langue];
  const annee = date.getFullYear() === new Date().getFullYear() ? "" : ` ${date.getFullYear()}`;
  const heure = formaterHeureLangue(date.getHours(), date.getMinutes(), langue);
  return {
    court: T.momentCourt(calendrier.joursCourts[date.getDay()], date.getDate(), calendrier.moisCourts[date.getMonth()], annee, heure),
    lu: T.momentLu(calendrier.jours[date.getDay()], date.getDate(), calendrier.mois[date.getMonth()], annee, heure),
  };
}

/** Les étiquettes de la visite : points et tampon, où en est l'avis, et ce qui n'a pas marché */
function listerPuces(visite: Visite, T: Textes): Puce[] {
  const puces: Puce[] = [];
  const contestation: Puce = { ...T.contestee, ton: "blanc" };
  switch (visite.statut) {
    case "demandee":
      puces.push({ ...T.enAttente, ton: "jaune" });
      break;
    case "validee": {
      if (visite.points > 0) {
        puces.push({
          texte: T.pointsTexte(visite.points, visite.pendantSos),
          lu: T.pointsLu(visite.points, visite.pendantSos),
          ton: "jaune",
        });
      }
      if (visite.tampon) puces.push({ ...T.tampon, ton: "blanc" });
      const avis = decrireEtatAvis(visite.avis, Date.now());
      if (avis === "ouvert") puces.push({ ...T.avisOuvert, ton: "encre" });
      else if (avis === "donne") puces.push({ ...T.avisDonne, ton: "blanc" });
      else if (avis === "a-venir") puces.push({ ...T.avisBientot, ton: "doux" });
      break;
    }
    case "refusee":
      puces.push(visite.contestee ? contestation : { ...T.refusee, ton: "rose" });
      break;
    case "retiree":
      puces.push(visite.contestee ? contestation : { ...T.retiree, ton: "rose" });
      break;
    case "annulee":
      puces.push({ ...T.annulee, ton: "doux" });
      break;
    case "expiree":
      puces.push({ ...T.expiree, ton: "doux" });
      break;
  }
  return puces;
}

/**
 * Une visite, en carte : l'emoji et le nom du lieu, le jour et l'heure (visibles seulement par toi), la façon de valider,
 * puis les étiquettes (« +15 », « Tampon », « Donner mon avis », « Avis donné », « Pas validée · C'est une erreur ? »).
 * Une demande annulée ou endormie reste en retrait. Un seul élément pour VoiceOver, qui lit tout d'une traite.
 */
export function LigneVisite({ visite, onPress }: Props) {
  const couleurs = utiliserCouleurs();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_MES_VISITES_PAR_LANGUE);
  const modes = utiliserTextes(LIBELLES_MODE_VALIDATION_PAR_LANGUE);
  // Une validation annulée ensuite par le lieu a bien été réglée : on garde « Addition réglée »
  const aEteValidee = visite.statut === "validee" || visite.statut === "retiree";
  const enRetrait = visite.statut === "annulee" || visite.statut === "expiree";
  const moment = decrireMoment(visite.valideLe ?? visite.creeLe, T, langue);
  // Ce qui a été tenté quand la visite n'a pas (ou plus) été validée : on ne dit pas « Addition réglée » d'une addition refusée
  const mode = aEteValidee ? modes[visite.mode] : T.modesTentes[visite.mode];
  const modeLu = langue === "en" ? mode.charAt(0).toLowerCase() + mode.slice(1) : mode.toLocaleLowerCase("fr-FR");
  const puces = listerPuces(visite, T);
  // Payée, avec réduction ou offerte, et ses avantages (seulement pour une visite validée)
  const reglement = aEteValidee ? decrireReglementLangue(visite.reglement, "client", langue) : null;
  // Une phrase par morceau, chacune avec sa majuscule : VoiceOver marque une petite pause entre elles
  const libelle = [
    visite.lieu.nom,
    [moment.lu, modeLu].filter(Boolean).join(", "),
    ...(reglement ? [[reglement.titre, ...reglement.etiquettesLues].join(", ")] : []),
    ...puces.map((p) => p.lu),
  ]
    .map((morceau) => morceau.charAt(0).toLocaleUpperCase("fr-FR") + morceau.slice(1))
    .join(". ");
  const fondRond = visite.statut === "validee" ? "bg-jaune" : visite.statut === "demandee" ? "bg-jaune-clair" : enRetrait ? "bg-creme" : "bg-carte";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint={T.ouvrirIndice}
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-16 flex-row items-center gap-3 rounded-carte border-2 bg-carte px-3 py-3 active:opacity-70 ${enRetrait ? "border-ligne" : "border-encre"}`}
    >
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={`h-12 w-12 items-center justify-center rounded-full border-2 ${enRetrait ? "border-ligne" : "border-encre"} ${fondRond}`}
      >
        <Text allowFontScaling={false} style={{ fontSize: 24, lineHeight: 30 }}>
          {visite.lieu.emoji}
        </Text>
      </View>

      <View className="flex-1 gap-0.5">
        <Text numberOfLines={2} className={`font-texte-gras text-base ${enRetrait ? "text-gris" : "text-encre"}`}>
          {visite.lieu.nom}
        </Text>
        <Text className="font-texte text-[13px] leading-[18px] text-gris">{[moment.court, mode].filter(Boolean).join(" · ")}</Text>
        {aEteValidee ? (
          <View className="mt-1.5">
            <EtiquettesReglement reglement={visite.reglement} pour="client" taille="petite" />
          </View>
        ) : null}
        {puces.length > 0 ? (
          <View className="mt-1.5 flex-row flex-wrap gap-1.5">
            {puces.map((puce) => (
              <View key={puce.texte} className={`rounded-full border px-2.5 py-1 ${FONDS[puce.ton]}`}>
                <Text className={`font-texte-semi text-[12px] ${TEXTES[puce.ton]}`}>{puce.texte}</Text>
              </View>
            ))}
          </View>
        ) : null}
      </View>

      <Ionicons name="chevron-forward" size={18} color={couleurs.gris} />
    </Pressable>
  );
}
