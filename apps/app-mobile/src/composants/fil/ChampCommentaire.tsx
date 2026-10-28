import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { AccessibilityInfo, ActivityIndicator, Platform, Pressable, Text, TextInput, View } from "react-native";

import { LONGUEUR_MAX_COMMENTAIRE } from "@sos-miam/commun/regles/mots-interdits";
import type { Lieu } from "@sos-miam/commun/types/lieu";
import type { Pote } from "@sos-miam/commun/types/potes";
import { PastilleAuNomDuLieu } from "~/composants/fil/PastilleAuNomDuLieu";
import { SuggestionsMentions } from "~/composants/fil/SuggestionsMentions";
import { RondPote } from "~/composants/potes/RondPote";
import { REFUS_LIMITATION_PAR_LANGUE } from "~/contenus/limitation-compte";
import { TEXTES_COMMENTAIRES_FIL_PAR_LANGUE } from "~/contenus/textes-commentaires-fil";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import type { ResultatCommentaire } from "~/hooks/utiliser-commentaires-publication";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserMonId } from "~/hooks/utiliser-mon-id";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  valeur: string;
  onChanger: (texte: string) => void;
  /** Prénom (ou nom du lieu) de la personne à qui tu réponds, null pour un nouveau commentaire */
  reponseA: string | null;
  onAnnulerReponse: () => void;
  /** Tu modifies un de tes commentaires */
  edition: boolean;
  onAnnulerEdition: () => void;
  /** Envoie (ou enregistre la modification) et rend le verdict une fois la réponse arrivée, pour un refus gentil si besoin */
  onEnvoyer: () => Promise<ResultatCommentaire>;
  /** Place sous le champ (bord du téléphone, quand le clavier est fermé) */
  margeBas: number;
  /** Le lieu de la publication quand tu le gères (tu peux écrire en son nom), sinon null */
  lieuGere: Pick<Lieu, "nom" | "emoji"> | null;
  /** Le prochain commentaire part au nom du lieu */
  commeLieu: boolean;
  onCommeLieu: (oui: boolean) => void;
  ref?: Ref<TextInput>;
};

// Le compteur apparaît quand on approche de la limite
const SEUIL_COMPTEUR = LONGUEUR_MAX_COMMENTAIRE - 100;
const MAX_SUGGESTIONS = 4;
// Une mention en train de s'écrire, juste avant le curseur : « … @le »
const MENTION_EN_COURS = /(^|\s)@([a-z0-9._]{0,20})$/i;

type TextesCommentaires = (typeof TEXTES_COMMENTAIRES_FIL_PAR_LANGUE)["fr"];

/** Le refus à dire ; « introuvable » dépend de ce que tu faisais (modifier, répondre, commenter) */
function lireRefus(verdict: Exclude<ResultatCommentaire, "ok">, edition: boolean, reponse: boolean, T: TextesCommentaires, refusLimitation: string): string {
  if (verdict === "trop-long") return T.tropLong(LONGUEUR_MAX_COMMENTAIRE);
  if (verdict === "compte-limite") return refusLimitation;
  if (verdict !== "introuvable") return T.refus[verdict];
  if (edition) return T.introuvableEdition;
  return reponse ? T.introuvableReponse : T.introuvable;
}

/** Dit un message au lecteur d'écran ; sur iPhone, après ce qu'il est en train de lire (sinon il le couperait, ou serait coupé). */
function annoncer(texte: string) {
  if (Platform.OS === "web") return;
  if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
  else AccessibilityInfo.announceForAccessibility(texte);
}

/** Le champ en bas de la feuille des commentaires : réponse ou modification en cours, mentions de tes potes avec « @ », compteur, envoi. */
export function ChampCommentaire(props: Props) {
  const couleurs = utiliserCouleurs();
  const T = utiliserTextes(TEXTES_COMMENTAIRES_FIL_PAR_LANGUE);
  const refusLimitation = utiliserTextes(REFUS_LIMITATION_PAR_LANGUE).commentaire;
  const { valeur, onChanger, reponseA, onAnnulerReponse, edition, onAnnulerEdition, onEnvoyer, margeBas, lieuGere, commeLieu, onCommeLieu, ref } = props;
  const { moi, potes } = utiliserCommunaute();
  const monId = utiliserMonId();
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  // Envoi parti, réponse pas encore arrivée : le bouton tourne, un deuxième appui ne renvoie rien
  const [occupe, setOccupe] = useState(false);
  const envoiEnCours = useRef(false);
  const longueur = valeur.length;
  const vide = valeur.trim() === "";
  // Au nom du lieu : pas pour une modification (l'auteur ne change pas)
  const auNomDuLieu = !!lieuGere && commeLieu && !edition;

  // Mention en cours juste avant le curseur : on propose tes potes dont le pseudo ou le prénom commence pareil
  const curseur = Math.min(selection?.end ?? longueur, longueur);
  const enCours = MENTION_EN_COURS.exec(valeur.slice(0, curseur));
  const recherche = enCours ? normaliserRecherche(enCours[2]) : null;
  const suggestions = useMemo(() => {
    if (recherche === null) return [];
    return potes
      .filter((p) => p.id !== monId && p.pseudo && (p.pseudo.startsWith(recherche) || normaliserRecherche(p.prenom).startsWith(recherche)))
      .slice(0, MAX_SUGGESTIONS);
  }, [potes, recherche, monId]);

  // Les potes à mentionner s'affichent au-dessus du champ, donc avant lui pour le lecteur d'écran : on le dit quand ils apparaissent
  // (pas à chaque lettre tapée ensuite)
  const avaitSuggestions = useRef(false);
  useEffect(() => {
    const nombre = suggestions.length;
    if (nombre > 0 && !avaitSuggestions.current) annoncer(T.mentionsProposees(nombre));
    avaitSuggestions.current = nombre > 0;
  }, [suggestions.length, T]);

  function changer(texte: string) {
    setErreur(null);
    onChanger(texte);
  }

  function mentionner(pote: Pote) {
    if (!enCours) return;
    const debut = curseur - enCours[2].length;
    changer(`${valeur.slice(0, debut)}${pote.pseudo} ${valeur.slice(curseur)}`);
    setSelection(null);
  }

  async function envoyer() {
    if (vide || envoiEnCours.current) return;
    vibrerLegerement();
    envoiEnCours.current = true;
    setOccupe(true);
    const contexte = { edition, reponse: !!reponseA };
    const verdict = await onEnvoyer().catch((): ResultatCommentaire => "reseau");
    envoiEnCours.current = false;
    setOccupe(false);
    if (verdict === "ok") {
      setErreur(null);
      return;
    }
    // Le texte reste dans le champ : on corrige, ou on réessaie
    const texte = lierPonctuation(lireRefus(verdict, contexte.edition, contexte.reponse, T, refusLimitation));
    setErreur(texte);
    // Annoncé à chaque refus, même identique au précédent (le texte affiché, lui, ne change pas)
    annoncer(retirerEmoji(texte));
  }

  const bandeau = edition ? T.modification : reponseA ? T.reponseA(reponseA) : null;
  const libelleChamp = `${edition ? T.champEdition : reponseA ? T.champReponse(reponseA) : T.champ}${auNomDuLieu ? T.champAuNomDuLieu : ""}`;
  const indication = auNomDuLieu ? T.indicationLieu(lieuGere.nom) : reponseA && !edition ? T.indicationReponse(reponseA) : T.indication;
  const erreurLue = erreur ? retirerEmoji(erreur) : null;
  const compteurVisible = longueur >= SEUIL_COMPTEUR;

  return (
    <View style={{ paddingBottom: margeBas }} className="border-t border-ligne bg-creme px-4 pt-2">
      {suggestions.length > 0 ? <SuggestionsMentions potes={suggestions} onChoisir={mentionner} /> : null}

      {bandeau ? (
        <View className="flex-row items-center justify-between">
          <Text numberOfLines={1} className="shrink font-texte text-[13px] text-gris">
            {edition ? bandeau : (
              <>
                {T.reponseADebut}
                <Text className="font-texte-gras text-encre">{reponseA}</Text>
              </>
            )}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={edition ? T.annulerModification : T.nePlusRepondre(reponseA ?? "")}
            onPress={() => {
              setErreur(null);
              if (edition) onAnnulerEdition();
              else onAnnulerReponse();
            }}
            className="-mr-2 min-h-11 min-w-11 items-center justify-center active:opacity-60"
          >
            <Ionicons name="close" size={18} color={couleurs.gris} />
          </Pressable>
        </View>
      ) : null}

      {lieuGere && !edition ? <PastilleAuNomDuLieu lieu={lieuGere} active={commeLieu} onBasculer={onCommeLieu} /> : null}

      <View className="flex-row items-end gap-2">
        <View className="mb-1">
          {auNomDuLieu ? (
            <View
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
              style={{ width: 36, height: 36, borderRadius: 18 }}
              className="items-center justify-center border-2 border-encre bg-jaune"
            >
              <Text allowFontScaling={false} style={{ fontSize: 18, lineHeight: 23 }}>
                {lieuGere.emoji}
              </Text>
            </View>
          ) : (
            <RondPote pote={moi} taille={36} />
          )}
        </View>
        <TextInput
          ref={ref}
          // Le refus fait partie du libellé : en revenant sur le champ, on sait encore ce qui coince
          accessibilityLabel={erreurLue ? `${libelleChamp}. ${erreurLue}` : libelleChamp}
          accessibilityHint={T.indiceMention}
          value={valeur}
          onChangeText={changer}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          placeholder={indication}
          placeholderTextColor={couleurs.gris}
          selectionColor={couleurs.encre}
          cursorColor={couleurs.encre}
          multiline
          maxLength={LONGUEUR_MAX_COMMENTAIRE}
          autoCapitalize="sentences"
          className={`max-h-[120px] min-h-11 flex-1 rounded-3xl border-2 bg-carte px-4 py-2.5 font-texte text-base text-encre ${erreur ? "border-rouge-texte" : "border-encre"}`}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={occupe ? T.envoiEnCours : edition ? T.enregistrer : T.envoyer}
          accessibilityState={{ disabled: vide || occupe, busy: occupe }}
          disabled={vide || occupe}
          onPress={() => void envoyer()}
          className={`mb-0.5 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:scale-90 ${vide ? "opacity-40" : ""}`}
        >
          {occupe ? <ActivityIndicator size="small" color={couleurs.nuit} /> : <Ionicons name={edition ? "checkmark" : "arrow-up"} size={22} color={couleurs.nuit} />}
        </Pressable>
      </View>

      {erreur || compteurVisible ? (
        <View className="mt-1 flex-row items-start justify-between gap-3 pl-11">
          <Text accessibilityLabel={erreurLue ?? undefined} className="flex-1 font-texte-semi text-sm text-rouge-texte">
            {erreur ?? ""}
          </Text>
          {compteurVisible ? (
            <Text
              accessibilityLabel={T.compteurLu(longueur, LONGUEUR_MAX_COMMENTAIRE)}
              className={`font-texte-semi text-xs ${longueur >= LONGUEUR_MAX_COMMENTAIRE ? "text-rouge-texte" : "text-gris"}`}
            >
              {longueur}/{LONGUEUR_MAX_COMMENTAIRE}
            </Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
