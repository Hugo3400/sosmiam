import { Ionicons } from "@expo/vector-icons";
import { useEffect, useMemo, useRef, useState, type Ref } from "react";
import { AccessibilityInfo, Platform, Pressable, Text, TextInput, View } from "react-native";

import { ID_MOI } from "@sos-miam/commun/regles/potes";
import { LONGUEUR_MAX_COMMENTAIRE } from "@sos-miam/commun/regles/mots-interdits";
import type { Pote } from "@sos-miam/commun/types/potes";
import { SuggestionsMentions } from "~/composants/fil/SuggestionsMentions";
import { RondPote } from "~/composants/potes/RondPote";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { normaliserRecherche } from "~/fonctions/texte/normaliser-recherche";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import { utiliserCommunaute, type ResultatTexte } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Props = {
  valeur: string;
  onChanger: (texte: string) => void;
  /** Prénom (ou nom du lieu) de la personne à qui tu réponds, null pour un nouveau commentaire */
  reponseA: string | null;
  onAnnulerReponse: () => void;
  /** Tu modifies un de tes commentaires */
  edition: boolean;
  onAnnulerEdition: () => void;
  /** Envoie (ou enregistre la modification) et renvoie le verdict, pour un refus gentil si besoin */
  onEnvoyer: () => ResultatTexte;
  /** Place sous le champ (bord du téléphone, quand le clavier est fermé) */
  margeBas: number;
  ref?: Ref<TextInput>;
};

// Le compteur apparaît quand on approche de la limite
const SEUIL_COMPTEUR = LONGUEUR_MAX_COMMENTAIRE - 100;
const MAX_SUGGESTIONS = 4;
// Une mention en train de s'écrire, juste avant le curseur : « … @le »
const MENTION_EN_COURS = /(^|\s)@([a-z0-9._]{0,20})$/i;

const refus: Record<Exclude<ResultatTexte, "ok">, string> = {
  "mot-interdit": "On garde ça bienveillant ici 💛",
  "trop-long": `Un poil trop long : ${LONGUEUR_MAX_COMMENTAIRE} caractères maximum ✂️`,
  vide: "Écris quelques mots avant d'envoyer 😉",
};

/** Dit un message au lecteur d'écran ; sur iPhone, après ce qu'il est en train de lire (sinon il le couperait, ou serait coupé). */
function annoncer(texte: string) {
  if (Platform.OS === "web") return;
  if (Platform.OS === "ios") AccessibilityInfo.announceForAccessibilityWithOptions(texte, { queue: true });
  else AccessibilityInfo.announceForAccessibility(texte);
}

/** Le champ en bas de la feuille des commentaires : réponse ou modification en cours, mentions de tes potes avec « @ », compteur, envoi. */
export function ChampCommentaire({ valeur, onChanger, reponseA, onAnnulerReponse, edition, onAnnulerEdition, onEnvoyer, margeBas, ref }: Props) {
  const { moi, potes } = utiliserCommunaute();
  const [selection, setSelection] = useState<{ start: number; end: number } | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const longueur = valeur.length;
  const vide = valeur.trim() === "";

  // Mention en cours juste avant le curseur : on propose tes potes dont le pseudo ou le prénom commence pareil
  const curseur = Math.min(selection?.end ?? longueur, longueur);
  const enCours = MENTION_EN_COURS.exec(valeur.slice(0, curseur));
  const recherche = enCours ? normaliserRecherche(enCours[2]) : null;
  const suggestions = useMemo(() => {
    if (recherche === null) return [];
    return potes
      .filter((p) => p.id !== ID_MOI && p.pseudo && (p.pseudo.startsWith(recherche) || normaliserRecherche(p.prenom).startsWith(recherche)))
      .slice(0, MAX_SUGGESTIONS);
  }, [potes, recherche]);

  // Les potes à mentionner s'affichent au-dessus du champ, donc avant lui pour le lecteur d'écran : on le dit quand ils apparaissent
  // (pas à chaque lettre tapée ensuite)
  const avaitSuggestions = useRef(false);
  useEffect(() => {
    const nombre = suggestions.length;
    if (nombre > 0 && !avaitSuggestions.current) annoncer(`${nombre} pote${nombre > 1 ? "s" : ""} à mentionner, juste au-dessus du champ`);
    avaitSuggestions.current = nombre > 0;
  }, [suggestions.length]);

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

  function envoyer() {
    if (vide) return;
    vibrerLegerement();
    const verdict = onEnvoyer();
    if (verdict === "ok") {
      setErreur(null);
      return;
    }
    setErreur(refus[verdict]);
    // Annoncé à chaque refus, même identique au précédent (le texte affiché, lui, ne change pas)
    annoncer(retirerEmoji(refus[verdict]));
  }

  const bandeau = edition ? "Modification de ton commentaire" : reponseA ? `Réponse à ${reponseA}` : null;
  const libelleChamp = edition ? "Ton commentaire, en modification" : reponseA ? `Ta réponse à ${reponseA}` : "Ton commentaire";
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
                Réponse à <Text className="font-texte-gras text-encre">{reponseA}</Text>
              </>
            )}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={edition ? "Annuler la modification" : `Ne plus répondre à ${reponseA}`}
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

      <View className="flex-row items-end gap-2">
        <View className="mb-1">
          <RondPote pote={moi} taille={36} />
        </View>
        <TextInput
          ref={ref}
          // Le refus fait partie du libellé : en revenant sur le champ, on sait encore ce qui coince
          accessibilityLabel={erreurLue ? `${libelleChamp}. ${erreurLue}` : libelleChamp}
          accessibilityHint="Tape @ pour mentionner un pote"
          value={valeur}
          onChangeText={changer}
          onSelectionChange={(e) => setSelection(e.nativeEvent.selection)}
          placeholder={reponseA && !edition ? `Réponds à ${reponseA}…` : "Ajoute un commentaire…"}
          placeholderTextColor={couleurs.gris}
          selectionColor={couleurs.encre}
          cursorColor={couleurs.encre}
          multiline
          maxLength={LONGUEUR_MAX_COMMENTAIRE}
          autoCapitalize="sentences"
          className={`max-h-[120px] min-h-11 flex-1 rounded-3xl border-2 bg-white px-4 py-2.5 font-texte text-base text-encre ${erreur ? "border-rouge-texte" : "border-encre"}`}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={edition ? "Enregistrer la modification" : "Envoyer"}
          accessibilityState={{ disabled: vide }}
          disabled={vide}
          onPress={envoyer}
          className={`mb-0.5 h-11 w-11 items-center justify-center rounded-full border-2 border-encre bg-jaune active:scale-90 ${vide ? "opacity-40" : ""}`}
        >
          <Ionicons name={edition ? "checkmark" : "arrow-up"} size={22} color={couleurs.encre} />
        </Pressable>
      </View>

      {erreur || compteurVisible ? (
        <View className="mt-1 flex-row items-start justify-between gap-3 pl-11">
          <Text accessibilityLabel={erreurLue ?? undefined} className="flex-1 font-texte-semi text-sm text-rouge-texte">
            {erreur ?? ""}
          </Text>
          {compteurVisible ? (
            <Text
              accessibilityLabel={`${longueur} caractères sur ${LONGUEUR_MAX_COMMENTAIRE}`}
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
