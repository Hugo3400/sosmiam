import Ionicons from "@expo/vector-icons/Ionicons";
import { useEffect, useRef, useState } from "react";
import { Pressable, Text, View } from "react-native";

import type { SignalementContenu } from "@sos-miam/commun/types/signalement";
import { Bouton } from "~/composants/interface/Bouton";
import { DetailsSignalement } from "~/composants/signalement/DetailsSignalement";
import { ListeRaisonsSignalement } from "~/composants/signalement/ListeRaisonsSignalement";
import type { ChoixRaisonSignalement } from "~/contenus/raisons-signalement";
import { TEXTES_SIGNALEMENT_PAR_LANGUE } from "~/contenus/textes-signalement";
import { deplacerFocusLecteurEcran } from "~/fonctions/interaction/deplacer-focus-lecteur-ecran";
import { traduireRaisonSignalement } from "~/fonctions/signalement/traduire-raison-signalement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserCommunaute } from "~/hooks/utiliser-communaute";
import { utiliserCouleurs } from "~/hooks/utiliser-couleurs";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  cible: SignalementContenu["cible"];
  cibleId: string;
  /** Ce qui est signalé, pour les titres : « ce commentaire », « ce message », « le profil de Léa » */
  sujet: string;
  /** Retour sans rien signaler, ou fermeture après le merci */
  onTermine: () => void;
};

/** Ce qui disparaît de ton écran dès le signalement ; un profil, une sortie ou un groupe restent visibles jusqu'à la décision */
const CIBLES_CACHEES: readonly SignalementContenu["cible"][] = ["commentaire", "message", "liste", "recommandation"];

/**
 * Signaler un commentaire, un message, un lieu envoyé par un pote, une liste, un profil, une sortie ou un groupe, à placer
 * dans une feuille : la raison, les précisions et le pourquoi (mêmes étapes que pour une publication), puis merci. Avec un
 * compte, le signalement part à l'équipe, qui dira sa décision (Réglages › Décisions de la modération) ; sans compte, il
 * reste sur le téléphone. À l'ouverture et à chaque étape, le lecteur d'écran est placé sur le titre.
 */
export function SignalerContenu({ cible, cibleId, sujet, onTermine }: Props) {
  const couleurs = utiliserCouleurs();
  const { signaler, source } = utiliserCommunaute();
  const T = utiliserTextes(TEXTES_SIGNALEMENT_PAR_LANGUE);
  const { langue } = utiliserLangue();
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
    // Avec un compte, le signalement est parti au serveur ; sans compte, il reste sur le téléphone
    const avecCompte = source === "compte";
    const cache = CIBLES_CACHEES.includes(cible);
    const titre = avecCompte ? T.merciOnRegarde : T.merciNote;
    return (
      <View className="items-center gap-3 pb-2 pt-1">
        <Text ref={titreMerci} accessibilityRole="header" accessibilityLabel={titre} className="text-center font-titre text-2xl text-encre">
          {titre} 🚩
        </Text>
        <Text className="text-center font-texte text-base leading-6 text-encre">
          {avecCompte ? (cache ? T.dejaDisparu : T.equipeDira) : cible === "profil" ? T.profilDePres : T.nApparaitraPlus}
        </Text>
        <Text className="text-center font-texte text-sm leading-5 text-gris">
          {lierPonctuation(avecCompte ? T.ouRetrouver(cache) : T.gardeSurTelephone)}
        </Text>
        <Bouton libelle={T.fermer} onPress={onTermine} className="mt-2 self-stretch" />
      </View>
    );
  }

  const raisonAffichee = raison ? traduireRaisonSignalement(raison, langue) : null;

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={raison ? T.retourRaisons : T.retour}
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
            accessibilityLabel={raisonAffichee ? raisonAffichee.titre : T.signaler(sujet)}
            numberOfLines={2}
            className="font-titre text-2xl text-encre"
          >
            {raisonAffichee ? `${raisonAffichee.emoji} ${raisonAffichee.titre}` : T.signaler(sujet)}
          </Text>
          <Text numberOfLines={1} className="font-texte text-sm text-gris">
            {raison ? T.disNousEnPlus : T.pourquoiTuLeSignales}
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
