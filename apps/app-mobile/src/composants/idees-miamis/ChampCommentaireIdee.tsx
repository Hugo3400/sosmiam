import { Ionicons } from "@expo/vector-icons";
import { useState, type Ref } from "react";
import { ActivityIndicator, Pressable, Text, TextInput, View } from "react-native";

import { LONGUEUR_MAX_COMMENTAIRE_IDEE } from "@sos-miam/commun/regles/communaute";
import type { ErreurService } from "@sos-miam/commun/types/erreurs-service";
import type { CommentaireIdee } from "@sos-miam/commun/types/idees";
import { nettoyerTexteSocial } from "@sos-miam/commun/validation/nettoyer-texte-social";
import { verifierTexteSocial } from "@sos-miam/commun/validation/verifier-texte-social";
import { RefusLimitationEnPlace } from "~/composants/compte/RefusLimitationEnPlace";
import { TEXTES_IDEES } from "~/contenus/textes-idees";
import { annoncerLecteurEcran } from "~/fonctions/interaction/annoncer-lecteur-ecran";
import { vibrerLegerement } from "~/fonctions/interaction/vibrer-legerement";
import { expliquerRefusCommentaireIdee } from "~/fonctions/idees-miamis/expliquer-refus-commentaire-idee";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { retirerEmoji } from "~/fonctions/texte/retirer-emoji";
import couleurs from "~/theme/couleurs";

type Props = {
  reponseA: CommentaireIdee | null;
  onAnnulerReponse: () => void;
  onEnvoyer: (texte: string, reponseA: string | null) => Promise<ErreurService | null>;
  occupe: boolean;
  margeBas: number;
  ref?: Ref<TextInput>;
};

export function ChampCommentaireIdee({ reponseA, onAnnulerReponse, onEnvoyer, occupe, margeBas, ref }: Props) {
  const [valeur, setValeur] = useState("");
  const [refus, setRefus] = useState<{ limite: boolean; texte: string } | null>(null);
  const vide = valeur.trim() === "";

  function changer(texte: string) {
    setValeur(texte);
    setRefus(null);
  }

  function montrer(nouveau: { limite: boolean; texte: string }) {
    setRefus(nouveau);
    if (!nouveau.limite) annoncerLecteurEcran(retirerEmoji(nouveau.texte));
  }

  async function envoyer() {
    if (occupe) return;
    const verdict = verifierTexteSocial(valeur, LONGUEUR_MAX_COMMENTAIRE_IDEE);
    if (verdict !== "ok") return montrer({ limite: false, texte: TEXTES_IDEES.erreursCommentaire[verdict] });
    vibrerLegerement();
    const erreur = await onEnvoyer(nettoyerTexteSocial(valeur), reponseA?.id ?? null);
    if (erreur) return montrer(expliquerRefusCommentaireIdee(erreur));
    setValeur("");
    setRefus(null);
  }

  const libelle = reponseA ? TEXTES_IDEES.reponseA(reponseA.auteur.pseudo) : TEXTES_IDEES.commentaireLibelle;

  return (
    <View style={{ paddingBottom: margeBas }} className="gap-2 border-t border-ligne bg-creme px-4 pt-2.5">
      <RefusLimitationEnPlace texte={refus?.limite ? refus.texte : null} />
      {reponseA ? (
        <View className="flex-row items-center justify-between">
          <Text numberOfLines={1} className="shrink font-texte text-[13px] text-gris">
            {TEXTES_IDEES.reponseA(reponseA.auteur.pseudo)}
          </Text>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={TEXTES_IDEES.annulerReponse}
            onPress={() => {
              setRefus(null);
              onAnnulerReponse();
            }}
            className="-mr-2 min-h-11 min-w-11 items-center justify-center active:opacity-60"
          >
            <Ionicons name="close" size={18} color={couleurs.gris} />
          </Pressable>
        </View>
      ) : null}
      <View className="flex-row items-end gap-2.5">
        <TextInput
          ref={ref}
          accessibilityLabel={refus && !refus.limite ? `${libelle}. ${retirerEmoji(refus.texte)}` : libelle}
          value={valeur}
          onChangeText={changer}
          placeholder={TEXTES_IDEES.commentairePlaceholder}
          placeholderTextColor={couleurs.gris}
          selectionColor={couleurs.encre}
          cursorColor={couleurs.encre}
          multiline
          maxLength={LONGUEUR_MAX_COMMENTAIRE_IDEE}
          autoCapitalize="sentences"
          className={`max-h-[120px] min-h-[46px] flex-1 rounded-3xl border bg-white px-4 py-3 font-texte text-[15px] text-encre ${refus && !refus.limite ? "border-rouge-texte" : "border-ligne"}`}
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={occupe ? TEXTES_IDEES.envoiEnCours : TEXTES_IDEES.publierCommentaire}
          accessibilityState={{ disabled: vide || occupe, busy: occupe }}
          disabled={vide || occupe}
          onPress={() => void envoyer()}
          className={`h-[46px] w-[46px] items-center justify-center rounded-full bg-jaune active:scale-90 ${vide ? "opacity-40" : ""}`}
        >
          {occupe ? <ActivityIndicator size="small" color={couleurs.encre} /> : <Ionicons name="arrow-forward" size={20} color={couleurs.encre} />}
        </Pressable>
      </View>
      {refus && !refus.limite ? (
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" className="font-texte-semi text-sm leading-5 text-rouge-texte">
          {lierPonctuation(refus.texte)}
        </Text>
      ) : null}
    </View>
  );
}
