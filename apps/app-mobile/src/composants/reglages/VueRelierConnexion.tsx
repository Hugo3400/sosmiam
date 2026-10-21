import { useState } from "react";
import { Platform, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { type FournisseurConnexion, messagesMesConnexions, NOMS_FOURNISSEURS } from "~/contenus/mes-connexions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

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
  const [motDePasse, setMotDePasse] = useState("");
  const nom = NOMS_FOURNISSEURS[fournisseur];
  const autreFournisseur: FournisseurConnexion = fournisseur === "apple" ? "google" : "apple";
  const autre = NOMS_FOURNISSEURS[autreFournisseur];
  const autreIci = autreFournisseur === "apple" ? Platform.OS === "ios" : Platform.OS !== "web";
  return (
    <EcranReglage titre={`Relier ${nom}`} sousTitre={`Une clé de plus à ton trousseau : tu pourras entrer avec ${nom}. Ton adresse e-mail SOS Miam, elle, ne bouge pas.`}>
      <View className="gap-5">
        {avecMotDePasse ? (
          <>
            <Text className="font-texte text-base leading-6 text-encre">
              {lierPonctuation(`Avant d'ajouter une clé, on vérifie que c'est bien toi : ton mot de passe, puis ${nom} s'ouvre.`)}
            </Text>
            <ChampTexte
              libelle="Ton mot de passe"
              valeur={motDePasse}
              onChangeTexte={setMotDePasse}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
            />
            <Bouton
              libelle={enCours ? "Un instant…" : `Relier ${nom}`}
              variante="encre"
              desactive={motDePasse === "" || enCours}
              onPress={() => onConfirmer(motDePasse)}
            />
          </>
        ) : autreIci ? (
          <>
            <Text className="font-texte text-base leading-6 text-encre">
              {lierPonctuation(`Tu n'as pas de mot de passe : confirme d'abord avec ${autre}, ta clé actuelle. Juste après, ${nom} s'ouvre pour le relier.`)}
            </Text>
            <Bouton libelle={enCours ? "Un instant…" : `Confirmer avec ${autre}`} variante="encre" desactive={enCours} onPress={() => onConfirmer()} />
          </>
        ) : (
          <>
            <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(messagesMesConnexions.confirmationImpossibleIci(nom, autre, "relier"))}</Text>
            <Bouton libelle={lienEnvoye ? "Lien envoyé !" : "Ajouter un mot de passe"} variante="encre" desactive={enCours || lienEnvoye} onPress={onAjouterMotDePasse} />
          </>
        )}
        <Bouton libelle="Finalement non" variante="blanc" onPress={onAnnuler} />
      </View>
    </EcranReglage>
  );
}
