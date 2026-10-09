import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { ENDROITS_ALERTE, LONGUEUR_MAX_DETAIL_ALERTE, type EndroitAlerte } from "@sos-miam/commun/regles/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { LIBELLES_ENDROIT_ALERTE } from "~/contenus/miam-safe";
import { utiliserServices } from "~/hooks/utiliser-services";

type Props = {
  lieuId: number;
  /** Après 2 minutes sans réponse : proposer de prévenir un pote */
  onPrevenirPote: () => void;
};

/** L'état de l'alerte est relu toutes les 3 secondes, jusqu'à « L'équipe arrive » ou « sans réponse » */
const RELECTURE_MS = 3000;

type Etat = "a-envoyer" | "envoyee" | "en-route" | "sans-reponse";

/**
 * Alerter le comptoir en silence, quand on ne peut pas y aller (lieux Miam Safe seulement) : où tu es, un petit détail si tu
 * veux, et l'équipe reçoit ton prénom en notification sur ses téléphones pro (jamais ton nom ni ta photo). Rien ne sonne de
 * ton côté. Sans « On arrive » au bout de 2 minutes, on te propose les secours ou un pote (et l'alerte remonte à notre équipe).
 */
export function AlerteComptoirMiamSafe({ lieuId, onPrevenirPote }: Props) {
  const { miamSafe } = utiliserServices();
  const [endroit, setEndroit] = useState<EndroitAlerte | null>(null);
  const [detail, setDetail] = useState("");
  const [etat, setEtat] = useState<Etat>("a-envoyer");
  const [alerteId, setAlerteId] = useState<number | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);

  // Envoyée : on relit son état (le serveur dit « en-route » au « On arrive » de l'équipe, « sans-reponse » après 2 minutes)
  useEffect(() => {
    if (etat !== "envoyee" || alerteId === null) return;
    const minuterie = setInterval(async () => {
      const r = await miamSafe.suivreAlerte(alerteId).catch(() => null);
      if (r?.ok && r.alerte.statut !== "envoyee") setEtat(r.alerte.statut);
    }, RELECTURE_MS);
    return () => clearInterval(minuterie);
  }, [etat, alerteId, miamSafe]);

  const envoyer = async () => {
    if (endroit === null || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const r = await miamSafe.envoyerAlerte({ lieuId, endroit, detail }).catch(() => null);
    setEnvoi(false);
    if (r?.ok) {
      setAlerteId(r.id);
      setEtat("envoyee");
    } else {
      const message = MESSAGES_SERVICE[r ? r.erreur : "hors-ligne"];
      setErreur(`${message.titre}. ${message.texte}`);
    }
  };

  if (etat === "sans-reponse") {
    return (
      <View className="gap-4">
        <Text accessibilityRole="alert" className="font-texte-gras text-lg text-encre">L'équipe n'a pas encore répondu.</Text>
        <Text className="font-texte text-base leading-6 text-gris">On a prévenu l'équipe SOS Miam. Ne reste pas seul·e : appelle les secours ou préviens un pote.</Text>
        <NumerosUrgence />
        <Bouton libelle="Prévenir un pote" variante="encre" onPress={onPrevenirPote} />
      </View>
    );
  }

  if (etat !== "a-envoyer") {
    return (
      <View className="gap-3">
        <View accessible accessibilityLiveRegion="polite" className={`gap-1 rounded-2xl p-4 ${etat === "en-route" ? "bg-jaune" : "bg-white"}`}>
          <Text className="font-texte-gras text-lg text-encre">{etat === "en-route" ? "L'équipe arrive" : "Alerte envoyée"}</Text>
          <Text className="font-texte text-base leading-6 text-encre">
            {etat === "en-route" ? "Reste où tu es, quelqu'un vient te voir discrètement." : "L'équipe reçoit ton prénom et où tu es. Rien ne sonne de ton côté."}
          </Text>
        </View>
        <Text className="font-texte text-sm leading-5 text-gris">Sans réponse dans 2 minutes, on te propose d'appeler les secours ou de prévenir un pote.</Text>
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="font-texte text-base leading-6 text-gris">L'équipe reçoit ton prénom et où tu es, jamais ton nom ni ta photo.</Text>
      <View className="flex-row flex-wrap gap-2">
        {ENDROITS_ALERTE.map((e, i) => (
          <Pastille key={e} libelle={LIBELLES_ENDROIT_ALERTE[e]} role="radio" position={i + 1} total={ENDROITS_ALERTE.length} choisi={endroit === e} onPress={() => setEndroit(e)} />
        ))}
      </View>
      <ChampTexte
        libelle="Un détail pour te trouver"
        mention="facultatif"
        valeur={detail}
        onChangeTexte={setDetail}
        placeholder="Table 12, pull vert…"
        maxLength={LONGUEUR_MAX_DETAIL_ALERTE}
      />
      <Bouton
        libelle="Envoyer en silence"
        variante="encre"
        desactive={endroit === null || envoi}
        indice={endroit === null ? "Dis d'abord où tu es" : "L'équipe du lieu reçoit l'alerte sur ses téléphones"}
        onPress={() => void envoyer()}
      />
      {erreur ? (
        <>
          <Text accessibilityRole="alert" className="font-texte-semi text-base leading-6 text-rouge-texte">{erreur}</Text>
          <NumerosUrgence />
        </>
      ) : null}
    </View>
  );
}
