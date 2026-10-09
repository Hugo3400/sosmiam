import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import type { CarteFidelite } from "@sos-miam/commun/types/fidelite";
import { Bouton } from "~/composants/interface/Bouton";
import { CodeRapprochement } from "~/composants/visites/CodeRapprochement";
import { formaterHeure } from "~/fonctions/dates/formater-heure";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { direDeLieu } from "~/fonctions/visites/dire-de-lieu";

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
const heureDe = (iso: string) => {
  const d = new Date(iso);
  return formaterHeure(`${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`);
};

/**
 * La récompense qui t'attend sur ta carte : « Demander ma récompense » au comptoir, puis le code à montrer à l'équipe
 * (15 minutes), qui te l'offre depuis son comptoir. Jamais remise par le client seul. On peut annuler la demande.
 */
export function BlocRecompensePrete({ carte, signature, emoji, envoi, onDemander, onAnnuler }: Props) {
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
      <View className="gap-4 rounded-carte border-2 border-encre bg-white p-5">
        <Text accessibilityRole="header" className="text-center font-titre-gras text-xl text-encre">
          🎁 {majuscule(prete.libelle)}
        </Text>
        <CodeRapprochement code={demande.code} prenom={signature} avatar={emoji} legende="Montre ce code à l'équipe : elle t'offre ta récompense" />
        <Text className="text-center font-texte text-sm text-gris">{lierPonctuation(`Valable jusqu'à ${heureDe(demande.expireLe)}. Après, il suffit d'en redemander un.`)}</Text>
        <Bouton libelle={envoi ? "Annulation…" : "Annuler la demande"} variante="blanc" desactive={envoi} onPress={onAnnuler} />
      </View>
    );
  }

  return (
    <View className="gap-3 rounded-carte border-2 border-encre bg-jaune p-5">
      <Text accessibilityRole="header" className="font-titre-gras text-xl text-encre">
        🎁 Ta récompense est prête !
      </Text>
      <Text className="font-texte-semi text-base leading-6 text-encre">
        {majuscule(prete.libelle)}
        {autres > 0 ? ` (et ${autres} autre${autres > 1 ? "s" : ""} derrière)` : ""}
      </Text>
      <Text className="font-texte text-sm leading-5 text-encre">{lierPonctuation(`Au comptoir ${direDeLieu(carte.lieu.nom)}, touche le bouton : un code s'affiche, l'équipe te l'offre.`)}</Text>
      <Bouton libelle={envoi ? "Un instant…" : "Demander ma récompense"} variante="encre" desactive={envoi} onPress={onDemander} />
    </View>
  );
}
