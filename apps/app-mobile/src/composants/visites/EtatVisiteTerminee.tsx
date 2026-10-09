import { useRouter } from "expo-router";
import type { Ref } from "react";
import { Text, View } from "react-native";

import { LIBELLES_MODE_VALIDATION } from "@sos-miam/commun/contenus/modes-validation";
import { LIBELLES_MOTIF_REFUS_CLIENT } from "@sos-miam/commun/contenus/motifs-refus";
import { decrireEtatAvis } from "@sos-miam/commun/fonctions/visites/decrire-etat-avis";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { ResultatValidation, Visite } from "@sos-miam/commun/types/visite";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonDemanderAddition } from "~/composants/visites/BoutonDemanderAddition";
import { RangeeTampons } from "~/composants/visites/RangeeTampons";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { decrireOuvertureAvis } from "~/fonctions/visites/decrire-ouverture-avis";
import { decrireTamponVisite } from "~/fonctions/visites/decrire-tampon-visite";

type Props = {
  /** Une visite qui n'attend plus le lieu : validée, refusée, expirée, annulée ou retirée */
  resultat: ResultatValidation;
  /** Le lieu complet, pour « Redemander l'addition » ; null s'il n'est pas disponible avec ton compte */
  lieu: Lieu | null;
  /** Le titre, pour y placer le lecteur d'écran à chaque changement */
  refTitre?: Ref<Text>;
  /** « C'est une erreur » (refusée, ou validation annulée par le lieu) : ouvre la contestation */
  onContester: () => void;
};

const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];
const MOIS = ["janvier", "février", "mars", "avril", "mai", "juin", "juillet", "août", "septembre", "octobre", "novembre", "décembre"];

/** « mardi 7 octobre à 20h14 » (jour et heure visibles par toi seulement : le lieu, lui, ne voit jamais tes visites ailleurs) */
function decrireJour(iso: string | null): string | null {
  const date = iso ? new Date(iso) : null;
  if (!date || Number.isNaN(date.getTime())) return null;
  const jour = date.getDate() === 1 ? "1er" : String(date.getDate());
  return `${JOURS[date.getDay()]} ${jour} ${MOIS[date.getMonth()]} à ${formaterHeure(`${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`)}`;
}

/** En-tête commun à tous les états : emoji, titre (où se pose VoiceOver), lieu (s'il n'est pas déjà dans le titre), phrase */
function dessinerEnTete(emoji: string, titre: string, visite: Visite, texte: string, refTitre?: Ref<Text>) {
  return (
    <View className="items-center gap-2">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className="mb-1 h-20 w-20 items-center justify-center rounded-full border-2 border-encre bg-jaune"
      >
        <Text className="text-4xl">{emoji}</Text>
      </View>
      <Text ref={refTitre} accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
        {lierPonctuation(titre)}
      </Text>
      {titre.includes(visite.lieu.nom) ? null : (
        <View className="flex-row items-center justify-center gap-2">
          <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-base">
            {visite.lieu.emoji}
          </Text>
          <Text className="shrink text-center font-texte-semi text-base text-gris">{visite.lieu.nom}</Text>
        </View>
      )}
      <Text className="mt-1 text-center font-texte text-base leading-6 text-encre">{lierPonctuation(texte)}</Text>
    </View>
  );
}

/** Petit encadré de texte (motif du refus, contestation partie, avis…) */
function dessinerEncadre(emoji: string, texte: string) {
  return (
    <View accessible className="flex-row items-start gap-3 rounded-carte border-2 border-ligne bg-jaune-clair p-4">
      <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="text-xl">
        {emoji}
      </Text>
      <Text className="flex-1 font-texte text-[15px] leading-6 text-encre">{lierPonctuation(texte)}</Text>
    </View>
  );
}

/** « C'est une erreur » tant que la visite n'est pas contestée, puis « On regarde ça de près » */
function dessinerContestation(visite: Visite, onContester: () => void) {
  if (visite.contestee) return dessinerEncadre("🔎", "On regarde ça de près. Un humain répondra.");
  return (
    <Bouton libelle="C'est une erreur" variante="blanc" indice="Raconte-nous ce qui s'est passé, l'équipe SOS Miam relira" onPress={onContester} />
  );
}

/**
 * Une visite qui n'attend plus le lieu. Validée : le résumé (points, tampon, avis). Refusée : le motif, dit sans accuser,
 * « Redemander » et « C'est une erreur ». Expirée ou annulée : « Redemander ». Retirée par le lieu : ce qui repart, et
 * « C'est une erreur ». La célébration, elle, est montrée par l'écran juste après la validation (CelebrationVisite).
 */
export function EtatVisiteTerminee({ resultat, lieu, refTitre, onContester }: Props) {
  const router = useRouter();
  const { visite } = resultat;
  // « Redemander » : seulement pour une addition, chez un lieu qu'on peut ouvrir
  const redemander = lieu && visite.mode === "addition" ? <BoutonDemanderAddition lieu={lieu} libelle="Redemander l'addition" /> : null;

  if (visite.statut === "validee") {
    const tampon = decrireTamponVisite(resultat);
    const jour = decrireJour(visite.valideLe);
    const ouverture = decrireOuvertureAvis(visite.avis);
    const etatAvis = decrireEtatAvis(visite.avis, Date.now());
    return (
      <View className="gap-5">
        {dessinerEnTete(
          "🎉",
          "Visite validée !",
          visite,
          jour ? `${LIBELLES_MODE_VALIDATION[visite.mode]} · ${jour}` : LIBELLES_MODE_VALIDATION[visite.mode],
          refTitre,
        )}
        {visite.points > 0 || tampon ? (
          <View className="gap-4 rounded-carte border-2 border-encre bg-white p-5">
            {visite.points > 0 ? (
              <View accessible className="items-center gap-1">
                <Text className="font-titre text-4xl text-encre">+{visite.points} points</Text>
                {visite.pendantSos ? (
                  <Text className="text-center font-texte-semi text-sm text-gris">Ta visite est tombée pendant leur SOS.</Text>
                ) : null}
              </View>
            ) : null}
            {tampon ? (
              <View className={`gap-3 ${visite.points > 0 ? "border-t-2 border-dashed border-ligne pt-4" : ""}`}>
                <RangeeTampons tampons={tampon.tampons} sur={tampon.sur} />
                <Text className="text-center font-texte-semi text-base leading-6 text-encre">{lierPonctuation(tampon.texte)}</Text>
              </View>
            ) : null}
          </View>
        ) : null}
        {ouverture ? dessinerEncadre("✍️", ouverture) : null}
        {etatAvis === "donne" ? dessinerEncadre("💬", "Avis donné, merci : il compte !") : null}
        {etatAvis === "ouvert" ? (
          <Bouton
            libelle="Donner mon avis"
            variante="encre"
            indice="Ouvre ton avis sur cette visite"
            onPress={() => router.push({ pathname: "/avis/[visiteId]", params: { visiteId: String(visite.id) } })}
          />
        ) : null}
      </View>
    );
  }

  if (visite.statut === "refusee") {
    return (
      <View className="gap-5">
        {dessinerEnTete(
          "🤷",
          `${visite.lieu.nom} n'a pas validé cette fois`,
          visite,
          "Ça arrive : un code mal lu, des tables qui se mélangent…",
          refTitre,
        )}
        {visite.motifRefus ? dessinerEncadre("🧾", LIBELLES_MOTIF_REFUS_CLIENT[visite.motifRefus]) : null}
        {redemander}
        {dessinerContestation(visite, onContester)}
      </View>
    );
  }

  if (visite.statut === "retiree") {
    return (
      <View className="gap-5">
        {dessinerEnTete(
          "↩️",
          `${visite.lieu.nom} a annulé cette validation`,
          visite,
          "Les points et le tampon repartent. Une erreur ? Dis-le-nous.",
          refTitre,
        )}
        {dessinerContestation(visite, onContester)}
      </View>
    );
  }

  if (visite.statut === "expiree") {
    return (
      <View className="gap-5">
        {dessinerEnTete(
          "😴",
          "Ta demande s'est endormie",
          visite,
          "30 minutes sans réponse : le service devait être en plein rush. Redemande quand tu passes à la caisse.",
          refTitre,
        )}
        {redemander}
      </View>
    );
  }

  // Annulée (par toi)
  return (
    <View className="gap-5">
      {dessinerEnTete(
        "👋",
        "Demande annulée",
        visite,
        "Pas de souci. Si tu changes d'avis, redemande l'addition au moment de payer.",
        refTitre,
      )}
      {redemander}
    </View>
  );
}
