import { memo } from "react";
import { Text, View } from "react-native";

import type { Lieu } from "@sos-miam/commun/types/lieu";
import { estLieuVerifie } from "@sos-miam/commun/fonctions/lieux/est-lieu-verifie";
import { parleDAlcool } from "@sos-miam/commun/fonctions/prevention/parle-d-alcool";
import { BadgeVerification } from "~/composants/lieux/BadgeVerification";
import { BanniereFicheLieu } from "~/composants/lieux/BanniereFicheLieu";
import { CarteLieuNonVerifie } from "~/composants/lieux/CarteLieuNonVerifie";
import { LogoLieu } from "~/composants/lieux/LogoLieu";
import { BadgesMiamSafe } from "~/composants/miam-safe/BadgesMiamSafe";
import { MentionPrevention } from "~/composants/prevention/MentionPrevention";
import { Bouton } from "~/composants/interface/Bouton";
import { BoutonSuivreProfil } from "~/composants/suivi/BoutonSuivreProfil";
import { INDICE_COMPTE_PAR_LANGUE } from "~/contenus/indice-compte";
import { TEXTES_EXPLORER_LISTE_PAR_LANGUE } from "~/contenus/textes-explorer-liste";
import { TEXTES_FICHE_LIEU_PAR_LANGUE } from "~/contenus/textes-fiche-lieu";
import { ecrireDistanceDepuis } from "~/fonctions/geo/ecrire-distance-depuis";
import { formaterDistanceLangue } from "~/fonctions/langue/formater-distance-langue";
import { formaterHeureTexteLangue } from "~/fonctions/langue/formater-heure-texte-langue";
import { ecrireQuartierVille } from "~/fonctions/lieux/ecrire-quartier-ville";
import { lireSourceImageLieu } from "~/fonctions/lieux/lire-source-image-lieu";
import { estSosEnCours } from "~/fonctions/lieux/est-sos-en-cours";
import { calculerCleSuivi } from "~/fonctions/publications/calculer-cle-suivi";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserMiamSafeLieu } from "~/hooks/utiliser-miam-safe-lieu";
import { utiliserProfil } from "~/hooks/utiliser-profil";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  lieu: Lieu;
  km: number | null;
  depuis: string | null;
  /** Hauteur de la zone de l'heure et de l'encoche, en haut de l'écran */
  margeHaut: number;
  onEnvoyer: () => void;
  /** Annonce « Tu suis maintenant… » / « Tu ne suis plus… » (une fonction stable : l'en-tête est mémorisé) */
  onAnnoncer: (texte: string) => void;
};

const TAILLE_LOGO = 76;
const AUTEUR_LIEU = { type: "lieu" } as const;

/**
 * Haut de la fiche d'un lieu, dessiné dès l'arrivée : dégradé et emoji, badges (SOS en cours, alerte), nom, infos, texte,
 * « Suivre » et « Envoyer à un pote » (Miam Safe : le bouton 🚨 en haut à droite de la fiche). Mémorisé : une rescousse ou une annonce ne le redessine pas
 * (« Suivre » lit lui-même tes suivis, il est le seul à se redessiner quand tu suis le lieu).
 */
export const EnTeteFicheLieu = memo(function EnTeteFicheLieu({ lieu, km, depuis, margeHaut, onEnvoyer, onAnnoncer }: Props) {
  // En visite, VoiceOver dit avant qu'on touche qu'il faudra un compte (comme « À la rescousse » en bas de la fiche)
  const avecCompte = utiliserProfil().profil !== null;
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_FICHE_LIEU_PAR_LANGUE);
  const L = utiliserTextes(TEXTES_EXPLORER_LISTE_PAR_LANGUE);
  const indiceCompte = utiliserTextes(INDICE_COMPTE_PAR_LANGUE);
  // Sans compte SOS Miam, un lieu ne lance pas de SOS : rien à afficher
  const verifie = estLieuVerifie(lieu);
  // Un SOS dont l'heure de fin est passée ne s'affiche plus (il ne compte plus pour les visites non plus)
  const sos = verifie && estSosEnCours(lieu) ? lieu.sos : undefined;
  const miamSafe = utiliserMiamSafeLieu(lieu.id);
  const logo = verifie ? lireSourceImageLieu(lieu, "logo") : null;
  return (
    <>
      <BanniereFicheLieu lieu={lieu} margeHaut={margeHaut} />

      <View className="gap-4 px-5 pt-5">
        {logo ? (
          <View style={{ marginTop: -(TAILLE_LOGO / 2) - 20 }}>
            <LogoLieu source={logo} taille={TAILLE_LOGO} />
          </View>
        ) : null}
        <View className="flex-row flex-wrap gap-2">
          <BadgeVerification verifie={verifie} />
          <BadgesMiamSafe miamSafe={miamSafe} />
          {sos ? (
            <Text className="overflow-hidden rounded-full border-2 border-encre bg-jaune px-3 py-1 font-texte-gras text-[13px] text-nuit">
              {L.pastilleSos(sos.places, formaterHeureTexteLangue(sos.jusqua, langue))}{sos.offre ? ` · ${sos.offre}` : ""}
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
          {lieu.info} · 📍 {ecrireQuartierVille(lieu)}
          {km === null ? "" : ` · ${depuis ? L.aDistance(ecrireDistanceDepuis(km, depuis, langue)) : formaterDistanceLangue(km, langue)}`} · {lieu.prix}
        </Text>
        <Text className="font-texte text-[17px] leading-[26px] text-encre">{lierPonctuation(lieu.texte)}</Text>
        {verifie ? null : <CarteLieuNonVerifie lieu={lieu} />}
        {/* L'un au-dessus de l'autre : côte à côte, « Envoyer à un pote » passerait sur deux lignes sur un iPhone SE */}
        <BoutonSuivreProfil cle={calculerCleSuivi(AUTEUR_LIEU, lieu.id)} nom={lieu.nom} emoji={lieu.emoji} onAnnoncer={onAnnoncer} taille="grand" />
        <Bouton
          libelle={T.envoyer}
          variante="blanc"
          petit
          indice={avecCompte ? T.envoyerIndice : indiceCompte}
          onPress={onEnvoyer}
          className="self-start"
        />
      </View>
    </>
  );
});
