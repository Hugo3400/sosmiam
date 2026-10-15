import { useEffect, useState } from "react";
import { Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import { DELAI_RELANCE_ALERTE_SECONDES, ENDROITS_ALERTE, LONGUEUR_MAX_DETAIL_ALERTE, type EndroitAlerte } from "@sos-miam/commun/regles/miam-safe";
import type { StatutAlerteMiamSafe } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { ChampTexte } from "~/composants/interface/ChampTexte";
import { Pastille } from "~/composants/interface/Pastille";
import { NumerosUrgence } from "~/composants/miam-safe/NumerosUrgence";
import { LIBELLES_ENDROIT_ALERTE } from "~/contenus/miam-safe";
import { utiliserServices } from "~/hooks/utiliser-services";
import {
  garderAlerteMiamSafe, lireAlerteGardeeMiamSafe, noterStatutAlerteMiamSafe, oublierAlerteMiamSafe, type AlerteGardeeMiamSafe,
} from "~/services/memoire-alertes-miam-safe";
import { oublierMiamSafeLieu } from "~/services/memoire-miam-safe-lieux";

type Props = { lieuId: number; onPrevenirPote: () => void };

const RELECTURE_MS = 3000;
const RELECTURE_SANS_REPONSE_MS = 10_000;
const MINUTES_RELANCE = DELAI_RELANCE_ALERTE_SECONDES / 60;
const SOUCI_EQUIPE = "Le souci vient de l'équipe ? Appelle plutôt un proche ou les secours.";

function decrireEnvoi(telephones: number | null): string {
  if (telephones === null) return "Elle est partie vers l'équipe du lieu, avec ton prénom et où tu es. Rien ne sonne de ton côté.";
  return `Elle est partie sur ${telephones} téléphone${telephones > 1 ? "s" : ""} de l'équipe, avec ton prénom et où tu es. Rien ne sonne de ton côté.`;
}

export function AlerteComptoirMiamSafe({ lieuId, onPrevenirPote }: Props) {
  const { miamSafe, source } = utiliserServices();
  const [alerte, setAlerte] = useState<AlerteGardeeMiamSafe | null>(() => lireAlerteGardeeMiamSafe(source, lieuId));
  const [endroit, setEndroit] = useState<EndroitAlerte | null>(null);
  const [detail, setDetail] = useState("");
  const [erreur, setErreur] = useState<string | null>(null);
  const [envoi, setEnvoi] = useState(false);
  const etat = alerte?.statut ?? "a-envoyer";

  useEffect(() => {
    if (!alerte || alerte.statut === "en-route") return;
    const { id, statut: actuel } = alerte;
    const changer = (statut: StatutAlerteMiamSafe) => {
      noterStatutAlerteMiamSafe(source, lieuId, id, statut);
      setAlerte((a) => (a?.id === id ? { ...a, statut } : a));
    };
    let actif = true;
    const suivre = async () => {
      const r = await miamSafe.suivreAlerte(id).catch(() => null);
      if (!actif || !r?.ok) return;
      if (r.alerte.statut === "en-route" || (r.alerte.statut === "sans-reponse" && actuel === "envoyee")) changer(r.alerte.statut);
    };
    if (Date.now() - alerte.envoyeeLe > RELECTURE_MS) void suivre();
    const relecture = setInterval(() => void suivre(), actuel === "envoyee" ? RELECTURE_MS : RELECTURE_SANS_REPONSE_MS);
    const reste = alerte.envoyeeLe + DELAI_RELANCE_ALERTE_SECONDES * 1000 - Date.now();
    const relance = actuel === "envoyee" ? setTimeout(() => changer("sans-reponse"), Math.max(0, reste)) : null;
    return () => {
      actif = false;
      clearInterval(relecture);
      if (relance) clearTimeout(relance);
    };
  }, [alerte, miamSafe, source, lieuId]);

  const envoyer = async () => {
    if (endroit === null || envoi) return;
    setEnvoi(true);
    setErreur(null);
    const r = await miamSafe.envoyerAlerte({ lieuId, endroit, detail }).catch(() => null);
    setEnvoi(false);
    if (r?.ok) {
      const nouvelle: AlerteGardeeMiamSafe = { id: r.id, envoyeeLe: Date.now(), telephones: typeof r.telephones === "number" ? r.telephones : null, statut: "envoyee" };
      garderAlerteMiamSafe(source, lieuId, nouvelle);
      setAlerte(nouvelle);
      return;
    }
    if (r?.erreur === "pas-miam-safe") oublierMiamSafeLieu(lieuId);
    const message = MESSAGES_SERVICE[r ? r.erreur : "hors-ligne"];
    setErreur(`${message.titre}. ${message.texte}`);
  };

  const recommencer = () => {
    oublierAlerteMiamSafe(source, lieuId);
    setAlerte(null);
    setEndroit(null);
    setDetail("");
  };

  if (etat === "sans-reponse") {
    return (
      <View className="gap-4">
        <Text accessibilityRole="alert" className="font-texte-gras text-lg text-encre">L'équipe n'a pas encore répondu.</Text>
        <Text className="font-texte text-base leading-6 text-gris">L'alerte est remontée à l'équipe SOS Miam. Ne reste pas seul·e : préviens un pote, ou appelle les secours.</Text>
        <Bouton libelle="Prévenir un pote" variante="encre" onPress={onPrevenirPote} />
        <NumerosUrgence />
      </View>
    );
  }

  if (alerte && etat === "envoyee" && alerte.telephones === 0) {
    return (
      <View className="gap-4">
        <View accessible accessibilityRole="alert" className="gap-2 rounded-2xl bg-tomate p-4">
          <Text className="font-texte-gras text-base text-encre">⚠️ L'équipe n'a rien reçu</Text>
          <Text className="font-texte text-base leading-6 text-encre">
            Aucun téléphone de l'équipe n'a reçu l'alerte. Va voir quelqu'un de l'équipe si tu peux, ou préviens un pote.
          </Text>
        </View>
        <Bouton libelle="Prévenir un pote" variante="encre" onPress={onPrevenirPote} />
        <NumerosUrgence />
      </View>
    );
  }

  if (alerte) {
    const enRoute = etat === "en-route";
    return (
      <View className="gap-3">
        <View accessible accessibilityLiveRegion="polite" className={`gap-1 rounded-2xl p-4 ${enRoute ? "bg-jaune" : "bg-white"}`}>
          <Text className="font-texte-gras text-lg text-encre">{enRoute ? "L'équipe arrive" : "Alerte envoyée"}</Text>
          <Text className="font-texte text-base leading-6 text-encre">
            {enRoute ? "Reste où tu es, quelqu'un vient te voir discrètement." : decrireEnvoi(alerte.telephones)}
          </Text>
        </View>
        {enRoute ? (
          <Bouton libelle="Nouvelle alerte" variante="blanc" petit indice="Si tu as encore besoin de l'équipe" onPress={recommencer} />
        ) : (
          <Text className="font-texte text-sm leading-5 text-gris">
            Sans réponse dans {MINUTES_RELANCE} minutes, on te propose d'appeler les secours ou de prévenir un pote.
          </Text>
        )}
      </View>
    );
  }

  return (
    <View className="gap-4">
      <Text className="font-texte text-base leading-6 text-gris">L'alerte donne à l'équipe ton prénom et où tu es, jamais ton nom ni ta photo.</Text>
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
        libelle={envoi ? "Envoi…" : "Envoyer en silence"}
        variante="encre"
        desactive={endroit === null || envoi}
        indice={endroit === null ? "Dis d'abord où tu es" : "L'équipe du lieu reçoit l'alerte sur ses téléphones"}
        onPress={() => void envoyer()}
      />
      <Text className="text-center font-texte text-sm leading-5 text-gris">{SOUCI_EQUIPE}</Text>
      {erreur ? (
        <>
          <Text accessibilityRole="alert" className="font-texte-semi text-base leading-6 text-rouge-texte">{erreur}</Text>
          <Bouton libelle="Prévenir un pote" variante="encre" onPress={onPrevenirPote} />
          <NumerosUrgence />
        </>
      ) : null}
    </View>
  );
}
