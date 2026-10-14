import { useState } from "react";
import { Text, View } from "react-native";

import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { EcranReglage } from "~/composants/reglages/EcranReglage";
import { type FournisseurConnexion, NOMS_FOURNISSEURS } from "~/contenus/mes-connexions";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  fournisseur: FournisseurConnexion;
  /** Le compte a un vrai mot de passe : c'est lui qui confirme. Sinon, l'autre fournisseur (la clé qui restera) */
  avecMotDePasse: boolean;
  enCours: boolean;
  onConfirmer: (motDePasse?: string) => void;
  onAnnuler: () => void;
};

/** « Délier Apple / Google » : une dernière vérification (le mot de passe, ou une connexion avec l'autre fournisseur). */
export function VueDelierConnexion({ fournisseur, avecMotDePasse, enCours, onConfirmer, onAnnuler }: Props) {
  const [motDePasse, setMotDePasse] = useState("");
  const nom = NOMS_FOURNISSEURS[fournisseur];
  const autre = NOMS_FOURNISSEURS[fournisseur === "apple" ? "google" : "apple"];
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
        ) : (
          <>
            <Text className="font-texte text-base leading-6 text-encre">
              {lierPonctuation(`Tu n'as pas de mot de passe : confirme avec ${autre}, c'est la clé qui te restera.`)}
            </Text>
            <Bouton libelle={enCours ? "Un instant…" : `Confirmer avec ${autre}`} variante="encre" desactive={enCours} onPress={() => onConfirmer()} />
          </>
        )}
        <Bouton libelle="Finalement non" variante="blanc" onPress={onAnnuler} />
      </View>
    </EcranReglage>
  );
}
