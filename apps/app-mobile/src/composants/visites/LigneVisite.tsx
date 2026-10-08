import { Ionicons } from "@expo/vector-icons";
import { Pressable, Text, View } from "react-native";

import { LIBELLES_MODE_VALIDATION } from "@sos-miam/commun/contenus/modes-validation";
import { decrireEtatAvis } from "@sos-miam/commun/fonctions/visites/decrire-etat-avis";
import type { ModeValidation, Visite } from "@sos-miam/commun/types/visite";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import couleurs from "~/theme/couleurs";

type Props = {
  visite: Visite;
  /** Toute la carte se touche (en général : ouvre /visite/[id]) */
  onPress: () => void;
};

type Ton = "jaune" | "encre" | "blanc" | "rose" | "doux" | "demo";
/** Une petite étiquette sous le nom : ce qu'on voit, et ce que lit VoiceOver */
type Puce = { texte: string; lu: string; ton: Ton };

const FONDS: Record<Ton, string> = {
  jaune: "border-encre bg-jaune",
  encre: "border-encre bg-encre",
  blanc: "border-encre bg-white",
  rose: "border-rouge-texte bg-rose-alerte",
  doux: "border-ligne bg-creme",
  demo: "border-dashed border-gris/50 bg-white",
};
const TEXTES: Record<Ton, string> = {
  jaune: "text-encre",
  encre: "text-jaune",
  blanc: "text-encre",
  rose: "text-rouge-texte",
  doux: "text-gris",
  demo: "text-gris",
};

/** Ce qui a été tenté quand la visite n'a pas (ou plus) été validée : on ne dit pas « Addition réglée » d'une addition refusée */
const MODE_TENTE: Record<ModeValidation, string> = { addition: "Addition demandée", comptoir: "QR du comptoir", reservation: "Réservation" };

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const JOURS_COURTS = ["dim.", "lun.", "mar.", "mer.", "jeu.", "ven.", "sam."];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];
const MOIS_COURTS = ["janv.", "févr.", "mars", "avr.", "mai", "juin", "juil.", "août", "sept.", "oct.", "nov.", "déc."];

/** « mar. 7 oct. · 20h14 » à l'écran, « mardi 7 octobre à 20h14 » pour VoiceOver (l'année seulement si ce n'est pas celle-ci) */
function decrireMoment(iso: string): { court: string; lu: string } {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return { court: "", lu: "" };
  const jour = date.getDate() === 1 ? "1er" : String(date.getDate());
  const annee = date.getFullYear() === new Date().getFullYear() ? "" : ` ${date.getFullYear()}`;
  const heure = formaterHeure(`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`);
  return {
    court: `${JOURS_COURTS[date.getDay()]} ${jour} ${MOIS_COURTS[date.getMonth()]}${annee} · ${heure}`,
    lu: `${JOURS[date.getDay()]} ${jour} ${MOIS[date.getMonth()]}${annee} à ${heure}`,
  };
}

/** Les étiquettes de la visite : points et tampon, où en est l'avis, ce qui n'a pas marché, et « Démo » */
function listerPuces(visite: Visite): Puce[] {
  const puces: Puce[] = [];
  const contestation: Puce = { texte: "🔎 Contestée · on regarde", lu: "Contestée : on regarde ça de près", ton: "blanc" };
  switch (visite.statut) {
    case "demandee":
      puces.push({ texte: "🧾 En attente au comptoir", lu: "En attente au comptoir", ton: "jaune" });
      break;
    case "validee": {
      if (visite.points > 0) {
        puces.push({
          texte: `+${visite.points}${visite.pendantSos ? " · SOS" : ""}`,
          lu: `plus ${visite.points} points${visite.pendantSos ? ", pendant leur SOS" : ""}`,
          ton: "jaune",
        });
      }
      if (visite.tampon) puces.push({ texte: "🎟️ Tampon", lu: "un tampon sur ta carte", ton: "blanc" });
      const avis = decrireEtatAvis(visite.avis, Date.now());
      if (avis === "ouvert") puces.push({ texte: "✍️ Donner mon avis", lu: "Ton avis t'attend", ton: "encre" });
      else if (avis === "donne") puces.push({ texte: "💬 Avis donné", lu: "Avis donné, merci", ton: "blanc" });
      else if (avis === "a-venir") puces.push({ texte: "🕐 Avis bientôt", lu: "Ton avis s'ouvre bientôt", ton: "doux" });
      break;
    }
    case "refusee":
      puces.push(visite.contestee ? contestation : { texte: "Pas validée · C'est une erreur ?", lu: "Pas validée. C'est une erreur ?", ton: "rose" });
      break;
    case "retiree":
      puces.push(
        visite.contestee ? contestation : { texte: "Annulée par le lieu · C'est une erreur ?", lu: "Validation annulée par le lieu. C'est une erreur ?", ton: "rose" },
      );
      break;
    case "annulee":
      puces.push({ texte: "Demande annulée", lu: "Demande annulée", ton: "doux" });
      break;
    case "expiree":
      puces.push({ texte: "😴 Demande endormie", lu: "Demande endormie, sans réponse à temps", ton: "doux" });
      break;
  }
  if (visite.demo) puces.push({ texte: "🧪 Démo", lu: "Démo", ton: "demo" });
  return puces;
}

/**
 * Une visite, en carte : l'emoji et le nom du lieu, le jour et l'heure (visibles seulement par toi), la façon de valider,
 * puis les étiquettes (« +15 », « Tampon », « Donner mon avis », « Avis donné », « Pas validée · C'est une erreur ? », « Démo »).
 * Une demande annulée ou endormie reste en retrait. Un seul élément pour VoiceOver, qui lit tout d'une traite.
 */
export function LigneVisite({ visite, onPress }: Props) {
  // Une validation annulée ensuite par le lieu a bien été réglée : on garde « Addition réglée »
  const aEteValidee = visite.statut === "validee" || visite.statut === "retiree";
  const enRetrait = visite.statut === "annulee" || visite.statut === "expiree";
  const moment = decrireMoment(visite.valideLe ?? visite.creeLe);
  const mode = aEteValidee ? LIBELLES_MODE_VALIDATION[visite.mode] : MODE_TENTE[visite.mode];
  const puces = listerPuces(visite);
  // Une phrase par morceau, chacune avec sa majuscule : VoiceOver marque une petite pause entre elles
  const libelle = [visite.lieu.nom, [moment.lu, mode.toLocaleLowerCase("fr-FR")].filter(Boolean).join(", "), ...puces.map((p) => p.lu)]
    .map((morceau) => morceau.charAt(0).toLocaleUpperCase("fr-FR") + morceau.slice(1))
    .join(". ");
  const fondRond = visite.statut === "validee" ? "bg-jaune" : visite.statut === "demandee" ? "bg-jaune-clair" : enRetrait ? "bg-creme" : "bg-white";

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={libelle}
      accessibilityHint="Ouvre ta visite"
      onPress={() => {
        vibrerLegerement();
        onPress();
      }}
      className={`min-h-16 flex-row items-center gap-3 rounded-carte border-2 bg-white px-3 py-3 active:opacity-70 ${enRetrait ? "border-ligne" : "border-encre"}`}
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
