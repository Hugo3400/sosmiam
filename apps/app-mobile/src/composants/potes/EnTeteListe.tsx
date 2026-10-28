import { Pressable, Text, View } from "react-native";

import { choisirTextes } from "@sos-miam/commun/fonctions/langue/choisir-textes";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { ListePartagee, Pote } from "@sos-miam/commun/types/potes";
import { Bouton } from "~/composants/interface/Bouton";
import { RondPote } from "~/composants/potes/RondPote";
import { TEXTES_LISTES_PARTAGEES_PAR_LANGUE } from "~/contenus/textes-listes-partagees";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { listerPrenomsLangue } from "~/fonctions/langue/lister-prenoms-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  liste: ListePartagee;
  /** L'auteur de la liste (toi : identifiant « moi »), ou null s'il n'est plus connu */
  auteur: Pote | null;
  /** Tu en es l'auteur */
  estAMoi: boolean;
  /** Abonnés connus et pas bloqués (toi compris si tu la suis). Compte connecté : null, le serveur ne donne que leur nombre */
  abonnes: Pote[] | null;
  /** Combien la suivent (compterAbonnesListe), quand on ne les connaît pas */
  nombreAbonnes: number;
  /** Ceux qui la remplissent avec l'auteur (acceptés, pas bloqués) */
  coAuteurs: Pote[];
  /** Nombre d'adresses de la liste encore dans l'app */
  nombreLieux: number;
  /** Vrai si tu suis la liste ; null pour ta propre liste (on ne suit pas sa liste) */
  suivie: boolean | null;
  onBasculerSuivi: () => void;
  onOuvrirAuteur: (id: string) => void;
};

const TAILLE_EMOJI = 88;
// Avatars d'abonnés montrés en pile, le reste est compté dans la phrase
const MAX_AVATARS = 4;

/** « toi, Léa et Tom » ; au-delà de 3, « toi, Léa et 3 autres » (monId : ton identifiant) */
function nommerAbonnes(abonnes: Pote[], monId: string, langue: Langue): string {
  const T = choisirTextes(TEXTES_LISTES_PARTAGEES_PAR_LANGUE, langue).enTete;
  const noms = abonnes.map((p) => (p.id === monId ? T.toi : p.prenom));
  if (noms.length <= 3) return listerPrenomsLangue(noms, langue);
  return T.etAutres(noms.slice(0, 2).join(", "), noms.length - 2);
}

/**
 * Le haut d'une liste partagée : son emoji, son titre, sa description, qui l'a faite et qui la remplit avec lui, qui la suit
 * (leurs têtes quand on les connaît, sinon leur nombre), si elle est réservée à la bande, et le bouton pour la suivre.
 */
/** Compte connecté, où l'on ne connaît que le nombre : « Suivie par 12 personnes », « Suivie par toi et 3 autres » */
function compterAbonnes(nombre: number, suivie: boolean, langue: Langue): string {
  const T = choisirTextes(TEXTES_LISTES_PARTAGEES_PAR_LANGUE, langue).enTete;
  if (nombre === 0) return T.personne;
  if (suivie) return nombre === 1 ? T.suivieParToi : T.suivieParToiEt(nombre - 1);
  return T.suivieParNombre(nombre);
}

export function EnTeteListe({ liste, auteur, estAMoi, abonnes, nombreAbonnes, coAuteurs, nombreLieux, suivie, onBasculerSuivi, onOuvrirAuteur }: Props) {
  const monId = utiliserMonId();
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_LISTES_PARTAGEES_PAR_LANGUE).enTete;
  // Toi d'abord, puis les autres dans l'ordre de la liste
  const abonnesRanges = abonnes ? [...abonnes].sort((a, b) => Number(b.id === monId) - Number(a.id === monId)) : [];
  const phraseAbonnes = abonnes
    ? abonnesRanges.length === 0
      ? T.personne
      : T.suiviePar(nommerAbonnes(abonnesRanges, monId, langue))
    : compterAbonnes(nombreAbonnes, suivie === true, langue);
  const adresses = T.adresses(nombreLieux);
  const remplie = coAuteurs.length > 0 ? T.remplieAvec(listerPrenomsLangue(coAuteurs.map((p) => (p.id === monId ? T.toi : p.prenom)), langue)) : null;
  const pourLaBande = liste.visibilite === "bande";

  return (
    <View className="items-center gap-3">
      <View
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        style={{ width: TAILLE_EMOJI, height: TAILLE_EMOJI }}
        className="items-center justify-center rounded-3xl border-2 border-encre bg-jaune-clair"
      >
        {/* Taille fixe : l'emoji reste dans sa case même avec un grand texte dans les réglages du téléphone */}
        <Text allowFontScaling={false} style={{ fontSize: 46, lineHeight: 58 }}>
          {liste.emoji}
        </Text>
      </View>

      <Text accessibilityRole="header" className="text-center font-titre text-3xl text-encre">
        {liste.titre}
      </Text>
      {liste.description ? (
        <Text className="text-center font-texte text-base leading-6 text-gris">{lierPonctuation(liste.description)}</Text>
      ) : null}

      {auteur ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={estAMoi ? T.faiteParToi : T.listeDe(auteur.prenom, auteur.pseudo)}
          accessibilityHint={estAMoi ? T.indiceMoi : T.indicePote(auteur.prenom)}
          onPress={() => {
            vibrerLegerement();
            onOuvrirAuteur(auteur.id);
          }}
          className="min-h-11 flex-row items-center gap-2 rounded-full border-2 border-encre bg-carte py-1 pl-1 pr-4 active:opacity-70"
        >
          <RondPote pote={auteur} taille={32} />
          <Text className="font-texte-semi text-[15px] text-encre">{estAMoi ? T.parToi : T.par(auteur.prenom)}</Text>
          {!estAMoi && auteur.pseudo ? <Text className="font-texte text-sm text-gris">@{auteur.pseudo}</Text> : null}
        </Pressable>
      ) : null}

      {remplie ? <Text className="text-center font-texte-moyen text-sm text-encre">{lierPonctuation(`✍️ ${remplie}`)}</Text> : null}

      <View
        accessible
        accessibilityLabel={`${adresses}. ${phraseAbonnes}.${pourLaBande ? T.bandeSeulementLu : ""}`}
        className="flex-row flex-wrap items-center justify-center gap-x-2 gap-y-1"
      >
        <Text className="font-texte-moyen text-sm text-gris">📍 {adresses}</Text>
        <Text className="font-texte text-sm text-gris">·</Text>
        {abonnesRanges.length > 0 ? (
          <View className="flex-row pl-1.5">
            {abonnesRanges.slice(0, MAX_AVATARS).map((p) => (
              <View key={p.id} className="-ml-1.5">
                <RondPote pote={p} taille={24} />
              </View>
            ))}
          </View>
        ) : null}
        <Text className="font-texte-moyen text-sm text-gris">{phraseAbonnes}</Text>
        {pourLaBande ? (
          <>
            <Text className="font-texte text-sm text-gris">·</Text>
            <Text className="font-texte-moyen text-sm text-gris">{T.pourLaBande}</Text>
          </>
        ) : null}
      </View>

      {suivie !== null ? (
        <Bouton
          libelle={suivie ? T.nePlusSuivre : T.suivre}
          variante={suivie ? "blanc" : "jaune"}
          petit
          indice={suivie ? T.indiceNePlusSuivre : T.indiceSuivre}
          onPress={onBasculerSuivi}
          className="mt-1"
        />
      ) : null}
    </View>
  );
}
