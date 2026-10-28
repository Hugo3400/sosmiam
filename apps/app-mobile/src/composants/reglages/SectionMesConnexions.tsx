import { Platform, Text } from "react-native";

import { estAdresseRelaisApple } from "@sos-miam/commun/fonctions/compte/est-adresse-relais-apple";
import type { ConnexionsCompte } from "@sos-miam/commun/types/compte-app";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import {
  AIDE_AJOUTER_MOT_DE_PASSE_PAR_LANGUE,
  AVERTISSEMENT_RELAIS_APPLE_PAR_LANGUE,
  CHAPO_MES_CONNEXIONS_PAR_LANGUE,
  type FournisseurConnexion,
  MESSAGES_MES_CONNEXIONS_PAR_LANGUE,
  NOMS_FOURNISSEURS,
} from "~/contenus/mes-connexions";
import { TEXTES_REGLAGES_CONNEXIONS_PAR_LANGUE } from "~/contenus/textes-reglages-connexions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  connexions: ConnexionsCompte | null;
  /** Les clés n'ont pas pu être lues : une ligne pour réessayer, plutôt que rien */
  lectureRatee: boolean;
  onRelire: () => void;
  email: string | null;
  enCours: FournisseurConnexion | "mot-de-passe" | null;
  lienEnvoye: boolean;
  onChangerMotDePasse: () => void;
  onAjouterMotDePasse: () => void;
  onRelier: (fournisseur: FournisseurConnexion) => void;
  onDelier: (fournisseur: FournisseurConnexion) => void;
};

/**
 * « Tes clés pour entrer » : le mot de passe (le changer, ou en ajouter un), Apple et Google (relier, délier). Apple ne se
 * relie que depuis un iPhone, Google depuis un téléphone (pas dans l'aperçu web) ; une clé déjà reliée se délie partout.
 */
export function SectionMesConnexions({ connexions, lectureRatee, onRelire, email, enCours, lienEnvoye, onChangerMotDePasse, onAjouterMotDePasse, onRelier, onDelier }: Props) {
  const T = utiliserTextes(TEXTES_REGLAGES_CONNEXIONS_PAR_LANGUE);
  const messagesMesConnexions = utiliserTextes(MESSAGES_MES_CONNEXIONS_PAR_LANGUE);
  const aideAjouterMotDePasse = utiliserTextes(AIDE_AJOUTER_MOT_DE_PASSE_PAR_LANGUE);
  const avertissementRelaisApple = utiliserTextes(AVERTISSEMENT_RELAIS_APPLE_PAR_LANGUE);
  const chapo = utiliserTextes(CHAPO_MES_CONNEXIONS_PAR_LANGUE);
  if (!connexions) {
    if (!lectureRatee) return null;
    return (
      <SectionReglages titre={T.titre}>
        <LigneReglage emoji="🔌" titre={messagesMesConnexions.lectureRatee} detail={T.toucherPourReessayer} onPress={onRelire} />
      </SectionReglages>
    );
  }
  const detailAjout = lienEnvoye
    ? messagesMesConnexions.lienEnvoye
    : email
      ? `${aideAjouterMotDePasse(email)}${estAdresseRelaisApple(email) ? ` ${avertissementRelaisApple}` : ""}`
      : T.ajoutSansEmail;

  const ligneFournisseur = (fournisseur: FournisseurConnexion, emoji: string, nom: string, relierIci: boolean, gesteRelier: string) => {
    if (connexions[fournisseur]) {
      return (
        <LigneReglage
          emoji={emoji}
          titre={T.relie(nom)}
          detail={enCours === fournisseur ? T.unInstant : T.delierDetail(nom)}
          onPress={() => onDelier(fournisseur)}
        />
      );
    }
    if (!relierIci) return null;
    return (
      <LigneReglage
        emoji={emoji}
        titre={T.relierMonCompte(nom)}
        detail={enCours === fournisseur ? T.unInstant : gesteRelier}
        onPress={() => onRelier(fournisseur)}
      />
    );
  };

  return (
    <SectionReglages titre={T.titre}>
      <Text className="py-2 font-texte text-sm leading-5 text-gris">{lierPonctuation(chapo)}</Text>
      {connexions.motDePasse ? (
        <LigneReglage emoji="🔑" titre={T.changerMotDePasse} detail={T.changerMotDePasseDetail} onPress={onChangerMotDePasse} />
      ) : (
        <LigneReglage
          emoji="🔑"
          titre={lienEnvoye ? T.lienEnvoye : T.ajouterMotDePasse}
          detail={enCours === "mot-de-passe" ? T.unInstant : detailAjout}
          onPress={onAjouterMotDePasse}
        />
      )}
      {ligneFournisseur("apple", "🍎", NOMS_FOURNISSEURS.apple, Platform.OS === "ios", T.gesteApple)}
      {ligneFournisseur("google", "🌐", NOMS_FOURNISSEURS.google, Platform.OS !== "web", T.gesteGoogle)}
    </SectionReglages>
  );
}
