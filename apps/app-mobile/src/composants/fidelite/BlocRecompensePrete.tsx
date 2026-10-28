import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { formaterHeureLangue } from "@sos-miam/commun/fonctions/langue/formater-heure-langue";
import type { Langue } from "@sos-miam/commun/regles/langues";
import type { CarteFidelite } from "@sos-miam/commun/types/fidelite";
import { Bouton } from "~/composants/interface/Bouton";
import { ZoneClaire } from "~/composants/theme/ZoneClaire";
import { CodeRapprochement } from "~/composants/visites/CodeRapprochement";
import { TEXTES_FIDELITE_PAR_LANGUE } from "~/contenus/textes-fidelite";
import { direDeLieuLangue } from "~/fonctions/langue/dire-de-lieu-langue";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserLangue } from "~/hooks/utiliser-langue";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  carte: CarteFidelite;
  /** Comme le voit l'équipe du lieu : « Léa M. » et l'emoji de l'avatar (jamais la photo) */
  signature: string;
  emoji: string;
  /** Une demande ou une annulation est en cours d'envoi */
  envoi: boolean;
  onDemander: () => void;
  onAnnuler: () => void;
};

/** Le code expiré disparaît de lui-même : on relit l'heure de temps en temps */
const INTERVALLE_HORLOGE = 15_000;
const majuscule = (texte: string) => texte.charAt(0).toLocaleUpperCase("fr-FR") + texte.slice(1);
/** « 21h42 » à partir d'une date ISO */
const heureDe = (iso: string, langue: Langue) => {
  const d = new Date(iso);
  return formaterHeureLangue(d.getHours(), d.getMinutes(), langue);
};

/**
 * La récompense qui t'attend sur ta carte : « Demander ma récompense » au comptoir, puis le code à montrer à l'équipe
 * (15 minutes), qui te l'offre depuis son comptoir. Jamais remise par le client seul. On peut annuler la demande.
 */
export function BlocRecompensePrete({ carte, signature, emoji, envoi, onDemander, onAnnuler }: Props) {
  const { langue } = utiliserLangue();
  const T = utiliserTextes(TEXTES_FIDELITE_PAR_LANGUE);
  const [maintenant, setMaintenant] = useState(() => Date.now());
  useEffect(() => {
    const horloge = setInterval(() => setMaintenant(Date.now()), INTERVALLE_HORLOGE);
    return () => clearInterval(horloge);
  }, []);

  const prete = carte.pretes[0];
  if (!prete) return null;
  const autres = carte.pretes.length - 1;
  const demande = carte.demande && Date.parse(carte.demande.expireLe) > maintenant ? carte.demande : null;

  if (demande) {
    return (
      <View className="gap-4 rounded-carte border-2 border-encre bg-carte p-5">
        <Text accessibilityRole="header" className="text-center font-titre-gras text-xl text-encre">
          🎁 {majuscule(prete.libelle)}
        </Text>
        <CodeRapprochement code={demande.code} prenom={signature} avatar={emoji} legende={T.codeLegende} />
        <Text className="text-center font-texte text-sm text-gris">{lierPonctuation(T.codeValable(heureDe(demande.expireLe, langue)))}</Text>
        <Bouton libelle={envoi ? T.annulation : T.annulerDemande} variante="blanc" desactive={envoi} onPress={onAnnuler} />
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-nuit">
        {T.pretTitre}
      </Text>
      <Text className="font-texte-semi text-base leading-6 text-nuit">
        {majuscule(prete.libelle)}
        {autres > 0 ? T.autres(autres) : ""}
      </Text>
      <Text className="font-texte text-sm leading-5 text-nuit">{lierPonctuation(T.auComptoir(direDeLieuLangue(carte.lieu.nom, langue), carte.lieu.nom))}</Text>
      <ZoneClaire>
        <Bouton libelle={envoi ? T.unInstant : T.demanderRecompense} variante="encre" desactive={envoi} onPress={onDemander} />
      </ZoneClaire>
    </View>
  );
}
