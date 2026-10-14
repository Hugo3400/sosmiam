import { useState } from "react";
import { Platform, Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { type FournisseurConnexion, messagesMesConnexions, NOMS_FOURNISSEURS } from "~/contenus/mes-connexions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  fournisseur: FournisseurConnexion;
  /** Le compte a un vrai mot de passe : c'est lui qui confirme. Sinon, l'autre fournisseur (la clé qui restera) */
  avecMotDePasse: boolean;
  enCours: boolean;
  /** Le lien pour ajouter un mot de passe est déjà parti */
  lienEnvoye: boolean;
  onConfirmer: (motDePasse?: string) => void;
  onAjouterMotDePasse: () => void;
  onAnnuler: () => void;
};

/**
 * « Délier Apple / Google » : une dernière vérification (le mot de passe, ou une connexion avec l'autre fournisseur). Si
 * l'autre fournisseur ne se lance pas ici (Apple hors iPhone, Google dans l'aperçu web), on ne le lance pas : on propose
 * d'ajouter un mot de passe d'abord.
 */
export function VueDelierConnexion({ fournisseur, avecMotDePasse, enCours, lienEnvoye, onConfirmer, onAjouterMotDePasse, onAnnuler }: Props) {
  const [motDePasse, setMotDePasse] = useState("");
  const nom = NOMS_FOURNISSEURS[fournisseur];
  const autreFournisseur: FournisseurConnexion = fournisseur === "apple" ? "google" : "apple";
  const autre = NOMS_FOURNISSEURS[autreFournisseur];
  const autreIci = autreFournisseur === "apple" ? Platform.OS === "ios" : Platform.OS !== "web";
  return (
    <EcranReglage titre={`Délier ${nom}`} sousTitre={`${nom} ne t'ouvrira plus la porte de SOS Miam. Tes autres clés, elles, marchent toujours.`}>
      <View className="gap-5">
        {avecMotDePasse ? (
          <>
            <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation("Pour confirmer que c'est bien toi, ton mot de passe :")}</Text>
            <ChampTexte
              libelle="Ton mot de passe"
              valeur={motDePasse}
              onChangeTexte={setMotDePasse}
              secureTextEntry
              autoCapitalize="none"
              textContentType="password"
            />
            <Bouton
              libelle={enCours ? "Un instant…" : `Délier ${nom}`}
              variante="encre"
              desactive={motDePasse === "" || enCours}
              onPress={() => onConfirmer(motDePasse)}
            />
          </>
        ) : autreIci ? (
          <>
            <Text className="font-texte text-base leading-6 text-encre">
              {lierPonctuation(`Tu n'as pas de mot de passe : confirme avec ${autre}, c'est la clé qui te restera.`)}
            </Text>
            <Bouton libelle={enCours ? "Un instant…" : `Confirmer avec ${autre}`} variante="encre" desactive={enCours} onPress={() => onConfirmer()} />
          </>
        ) : (
          <>
            <Text className="font-texte text-base leading-6 text-encre">{lierPonctuation(messagesMesConnexions.confirmationImpossibleIci(nom, autre))}</Text>
            <Bouton libelle={lienEnvoye ? "Lien envoyé !" : "Ajouter un mot de passe"} variante="encre" desactive={enCours || lienEnvoye} onPress={onAjouterMotDePasse} />
          </>
        )}
        <Bouton libelle="Finalement non" variante="blanc" onPress={onAnnuler} />
      </View>
    </EcranReglage>
  );
}
