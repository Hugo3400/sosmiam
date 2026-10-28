import { useState } from "react";
import { Platform, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { type FournisseurConnexion, MESSAGES_MES_CONNEXIONS_PAR_LANGUE, NOMS_FOURNISSEURS } from "~/contenus/mes-connexions";
import { TEXTES_REGLAGES_CONNEXIONS_PAR_LANGUE } from "~/contenus/textes-reglages-connexions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  fournisseur: FournisseurConnexion;
  avecMotDePasse: boolean;
  enCours: boolean;
  lienEnvoye: boolean;
  onConfirmer: (motDePasse?: string) => void;
  onAjouterMotDePasse: () => void;
  onAnnuler: () => void;
};

export function VueRelierConnexion({ fournisseur, avecMotDePasse, enCours, lienEnvoye, onConfirmer, onAjouterMotDePasse, onAnnuler }: Props) {
  const T = utiliserTextes(TEXTES_REGLAGES_CONNEXIONS_PAR_LANGUE);
  const messagesMesConnexions = utiliserTextes(MESSAGES_MES_CONNEXIONS_PAR_LANGUE);
  const [motDePasse, setMotDePasse] = useState("");
  const nom = NOMS_FOURNISSEURS[fournisseur];
  const autreFournisseur: FournisseurConnexion = fournisseur === "apple" ? "google" : "apple";
  const autre = NOMS_FOURNISSEURS[autreFournisseur];
  const autreIci = autreFournisseur === "apple" ? Platform.OS === "ios" : Platform.OS !== "web";
  return (
    <EcranReglage titre={T.relier.titre(nom)} sousTitre={T.relier.sousTitre(nom)}>
      <View className="gap-5">
        {avecMotDePasse ? (
          <>
            <Text className="font-texte text-base leading-6 text-encre">
              {lierPonctuation(T.relier.avecMotDePasse(nom))}
            </Text>
            <ChampTexte
              libelle={T.tonMotDePasse}
              valeur={motDePasse}
              onChangeTexte={setMotDePasse}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
            />
            <Bouton
              libelle={enCours ? T.unInstant : T.relier.titre(nom)}
              variante="encre"
              desactive={motDePasse === "" || enCours}
              onPress={() => onConfirmer(motDePasse)}
            />
          </>
        ) : autreIci ? (
          <>
            <Text className="font-texte text-base leading-6 text-encre">
              {lierPonctuation(T.relier.sansMotDePasse(nom, autre))}
            </Text>
            <Bouton libelle={enCours ? T.unInstant : T.confirmerAvec(autre)} variante="encre" desactive={enCours} onPress={() => onConfirmer()} />
          </>
        ) : (
          <>
            <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(messagesMesConnexions.confirmationImpossibleIci(nom, autre, "relier"))}</Text>
            <Bouton libelle={lienEnvoye ? T.lienEnvoye : T.ajouterMotDePasse} variante="encre" desactive={enCours || lienEnvoye} onPress={onAjouterMotDePasse} />
          </>
        )}
        <Bouton libelle={T.finalementNon} variante="blanc" onPress={onAnnuler} />
      </View>
    </EcranReglage>
  );
}
