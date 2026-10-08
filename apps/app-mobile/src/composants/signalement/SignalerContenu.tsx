import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { SignalementContenu } from "@sos-miam/commun/types/signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { DetailsSignalement } from "~/composants/signalement/DetailsSignalement";
import { ListeRaisonsSignalement } from "~/composants/signalement/ListeRaisonsSignalement";
import type { ChoixRaisonSignalement } from "~/contenus/raisons-signalement";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import couleurs from "~/theme/couleurs";

type Props = {
  cible: SignalementContenu["cible"];
  cibleId: string;
  /** Ce qui est signalé, pour les titres : « ce commentaire », « ce message », « le profil de Léa » */
  sujet: string;
  /** Retour sans rien signaler, ou fermeture après le merci */
  onTermine: () => void;
};

/**
 * Signaler un commentaire, un message de sortie, un lieu envoyé par un pote, une liste ou un profil, à placer dans une feuille : la raison, les précisions et
 * le pourquoi (mêmes étapes que pour une publication), puis merci. Le contenu signalé disparaît pour toi.
 * À l'ouverture et à chaque étape, le lecteur d'écran est placé sur le titre.
 */
export function SignalerContenu({ cible, cibleId, sujet, onTermine }: Props) {
  const { signaler } = utiliserCommunaute();
  const [raison, setRaison] = useState<ChoixRaisonSignalement | null>(null);
  const [precision, setPrecision] = useState<string | null>(null);
  const [explication, setExplication] = useState("");
  const [envoye, setEnvoye] = useState(false);
  const titreEtape = useRef<Text>(null);
  const titreMerci = useRef<Text>(null);

  // Ce qu'on vient de toucher a disparu (le menu, une raison, « Envoyer ») : le lecteur d'écran repart du titre de la nouvelle étape.
  // Aussi à l'ouverture, que l'on vienne d'un message, d'un commentaire, d'un lieu envoyé ou d'une liste
  useEffect(() => {
    const minuterie = setTimeout(() => deplacerFocusLecteurEcran((envoye ? titreMerci : titreEtape).current), 250);
    return () => clearTimeout(minuterie);
  }, [raison, envoye]);

  if (envoye) {
    return (
      <View className="items-center gap-3 pb-2 pt-1">
        <Text ref={titreMerci} accessibilityRole="header" accessibilityLabel="Merci, c'est noté" className="text-center font-titre text-2xl text-encre">
          Merci, c'est noté 🚩
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-encre">
          {cible === "profil" ? "On va regarder ce profil de près." : "Ça n'apparaîtra plus pour toi, et on va regarder ça de près."}
        </Text>
        <Text className="text-center font-texte text-sm leading-5 text-gris">
          Pour l'instant, ton signalement est gardé sur ton téléphone : il partira à l'équipe SOS Miam dès que l'app sera reliée à notre serveur.
        </Text>
        <Bouton libelle="Fermer" onPress={onTermine} className="mt-2 self-stretch" />
      </View>
    );
  }

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={raison ? "Retour aux raisons" : "Retour"}
          hitSlop={8}
          onPress={() => (raison ? setRaison(null) : onTermine())}
          className="-ml-2 h-11 w-11 items-center justify-center rounded-full active:opacity-70"
        >
          <Ionicons name="chevron-back" size={26} color={couleurs.encre} />
        </Pressable>
        <View className="flex-1">
          <Text
            ref={titreEtape}
            accessibilityRole="header"
            accessibilityLabel={raison ? raison.titre : `Signaler ${sujet}`}
            numberOfLines={2}
            className="font-titre text-2xl text-encre"
          >
            {raison ? `${raison.emoji} ${raison.titre}` : `Signaler ${sujet}`}
          </Text>
          <Text numberOfLines={1} className="font-texte text-sm text-gris">
            {raison ? "Dis-nous-en plus, ça aide l'équipe." : "Pourquoi tu le signales ?"}
          </Text>
        </View>
      </View>
      {raison ? (
        <DetailsSignalement
          raison={raison}
          precision={precision}
          onChoisirPrecision={setPrecision}
          explication={explication}
          onChangerExplication={setExplication}
          onEnvoyer={() => {
            signaler({ cible, cibleId, raison: raison.cle, precision, explication: explication.trim() });
            setEnvoye(true);
          }}
        />
      ) : (
        <ListeRaisonsSignalement
          onChoisir={(choix) => {
            setPrecision(null);
            setRaison(choix);
          }}
        />
      )}
    </View>
  );
}
