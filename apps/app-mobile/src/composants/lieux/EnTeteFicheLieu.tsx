import { LinearGradient } from "expo-linear-gradient";
import { memo } from "react";
import { Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { BadgeVerification } from "~/composants/lieux/BadgeVerification";
import { CarteLieuNonVerifie } from "~/composants/lieux/CarteLieuNonVerifie";
import { BadgesMiamSafe } from "~/composants/miam-safe/BadgesMiamSafe";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { INDICE_COMPTE } from "~/contenus/indice-compte";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { formaterDistance } from "~/fonctions/geo/formater-distance";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { lireMiamSafeLieu } from "~/fonctions/miam-safe/lire-miam-safe-lieu";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserProfil } from "~/hooks/utiliser-profil";

type Props = {
  lieu: Lieu;
  /** Distance du lieu depuis ta ville, en km (un nombre : l'en-tête est mémorisé) */
  km: number;
  /** Hauteur de la zone de l'heure et de l'encoche, en haut de l'écran */
  margeHaut: number;
  onEnvoyer: () => void;
  /** Annonce « Tu suis maintenant… » / « Tu ne suis plus… » (une fonction stable : l'en-tête est mémorisé) */
  onAnnoncer: (texte: string) => void;
};

// Mêmes objets à chaque rendu : rien à recalculer pour le dégradé
const DEBUT_DEGRADE = { x: 0.1, y: 0 };
const FIN_DEGRADE = { x: 0.9, y: 1 };
const AUTEUR_LIEU = { type: "lieu" } as const;

/**
 * Haut de la fiche d'un lieu, dessiné dès l'arrivée : dégradé et emoji, badges (SOS en cours, alerte), nom, infos, texte,
 * « Suivre » et « Envoyer à un pote » (Miam Safe : le bouton 🚨 en haut à droite de la fiche). Mémorisé : une rescousse ou une annonce ne le redessine pas
 * (« Suivre » lit lui-même tes suivis, il est le seul à se redessiner quand tu suis le lieu).
 */
export const EnTeteFicheLieu = memo(function EnTeteFicheLieu({ lieu, km, margeHaut, onEnvoyer, onAnnoncer }: Props) {
  // En visite, VoiceOver dit avant qu'on touche qu'il faudra un compte (comme « À la rescousse » en bas de la fiche)
  const avecCompte = utiliserProfil().profil !== null;
  // Sans compte SOS Miam, un lieu ne lance pas de SOS : rien à afficher
  const verifie = estLieuVerifie(lieu);
  // Un SOS dont l'heure de fin est passée ne s'affiche plus (il ne compte plus pour les visites non plus)
  const sos = verifie && estSosEnCours(lieu) ? lieu.sos : undefined;
  const miamSafe = lireMiamSafeLieu(lieu.id);
  return (
    <>
      <LinearGradient
        colors={lieu.couleurs}
        start={DEBUT_DEGRADE}
        end={FIN_DEGRADE}
        style={{ height: 260 + margeHaut, alignItems: "center", justifyContent: "center" }}
      >
        <Text accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={{ fontSize: 110, marginTop: margeHaut }}>
          {lieu.emoji}
        </Text>
      </LinearGradient>

      <View className="gap-4 px-5 pt-5">
        <View className="flex-row flex-wrap gap-2">
          <BadgeVerification verifie={verifie} />
          <BadgesMiamSafe miamSafe={miamSafe} />
          {sos ? (
            <Text className="overflow-hidden rounded-full border-2 border-encre bg-jaune px-3 py-1 font-texte-gras text-[13px] text-encre">
              🛟 SOS · {sos.places} place{sos.places > 1 ? "s" : ""} jusqu'à {formaterHeure(sos.jusqua)}{sos.offre ? ` · ${sos.offre}` : ""}
            </Text>
          ) : null}
          {lieu.alerte ? (
            <Text className="overflow-hidden rounded-full bg-rose-alerte px-3 py-1 font-texte-gras text-[13px] text-rouge-texte">🔥 {lieu.alerte}</Text>
          ) : null}
        </View>
        {/* Une offre qui parle d'alcool (happy hour, verre offert) : le message sanitaire juste dessous (l'encadré d'aide est plus bas) */}
        {parleDAlcool(lieu.alerte) || parleDAlcool(sos?.offre) ? <MentionPrevention /> : null}
        <Text accessibilityRole="header" className="font-titre text-[34px] leading-[38px] text-encre">
          {lieu.nom}
        </Text>
        <Text className="font-texte-moyen text-base text-gris">
          {lieu.info} · 📍 {lieu.quartier}, {lieu.ville} · {formaterDistance(km)} · {lieu.prix}
        </Text>
        <Text className="font-texte text-[17px] leading-[26px] text-encre">{lierPonctuation(lieu.texte)}</Text>
        {verifie ? null : <CarteLieuNonVerifie lieu={lieu} />}
        {/* L'un au-dessus de l'autre : côte à côte, « Envoyer à un pote » passerait sur deux lignes sur un iPhone SE */}
        <BoutonSuivreProfil cle={calculerCleSuivi(AUTEUR_LIEU, lieu.id)} nom={lieu.nom} emoji={lieu.emoji} onAnnoncer={onAnnoncer} taille="grand" />
        <Bouton
          libelle="Envoyer à un pote"
          variante="blanc"
          petit
          indice={avecCompte ? "Choisis des potes de ta bande à qui envoyer ce lieu" : INDICE_COMPTE}
          onPress={onEnvoyer}
          className="self-start"
        />
      </View>
    </>
  );
});
