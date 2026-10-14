import { Platform, Text } from "react-native";

import { estAdresseRelaisApple } from "@sos-miam/commun/fonctions/compte/est-adresse-relais-apple";
import type { ConnexionsCompte } from "@sos-miam/commun/types/compte-app";
import { LigneReglage } from "~/composants/reglages/LigneReglage";
import { SectionReglages } from "~/composants/reglages/SectionReglages";
import {
  aideAjouterMotDePasse,
  AVERTISSEMENT_RELAIS_APPLE,
  CHAPO_MES_CONNEXIONS,
  type FournisseurConnexion,
  messagesMesConnexions,
} from "~/contenus/mes-connexions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

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
  if (!connexions) {
    if (!lectureRatee) return null;
    return (
      <SectionReglages titre="Tes clés pour entrer">
        <LigneReglage emoji="🔌" titre={messagesMesConnexions.lectureRatee} detail="Touche pour réessayer" onPress={onRelire} />
      </SectionReglages>
    );
  }
  const detailAjout = lienEnvoye
    ? messagesMesConnexions.lienEnvoye
    : email
      ? `${aideAjouterMotDePasse(email)}${estAdresseRelaisApple(email) ? ` ${AVERTISSEMENT_RELAIS_APPLE}` : ""}`
      : "On t'envoie un lien pour le choisir (valable 24 heures).";

  const ligneFournisseur = (fournisseur: FournisseurConnexion, emoji: string, nom: string, relierIci: boolean, gesteRelier: string) => {
    if (connexions[fournisseur]) {
      return (
        <LigneReglage
          emoji={emoji}
          titre={`${nom} : relié ✅`}
          detail={enCours === fournisseur ? "Un instant…" : `Touche pour délier ${nom}`}
          onPress={() => onDelier(fournisseur)}
        />
      );
    }
    if (!relierIci) return null;
    return (
      <LigneReglage
        emoji={emoji}
        titre={`Relier mon compte ${nom}`}
        detail={enCours === fournisseur ? "Un instant…" : gesteRelier}
        onPress={() => onRelier(fournisseur)}
      />
    );
  };

  return (
    <SectionReglages titre="Tes clés pour entrer">
      <Text className="py-2 font-texte text-sm leading-5 text-gris">{lierPonctuation(CHAPO_MES_CONNEXIONS)}</Text>
      {connexions.motDePasse ? (
        <LigneReglage emoji="🔑" titre="Changer mon mot de passe" detail="Tes autres appareils seront déconnectés" onPress={onChangerMotDePasse} />
      ) : (
        <LigneReglage
          emoji="🔑"
          titre={lienEnvoye ? "Lien envoyé !" : "Ajouter un mot de passe"}
          detail={enCours === "mot-de-passe" ? "Un instant…" : detailAjout}
          onPress={onAjouterMotDePasse}
        />
      )}
      {ligneFournisseur("apple", "🍎", "Apple", Platform.OS === "ios", "Entre d'un coup de Face ID, en plus de tes autres clés")}
      {ligneFournisseur("google", "🌐", "Google", Platform.OS !== "web", "Entre en un geste avec ton compte Google")}
    </SectionReglages>
  );
}
