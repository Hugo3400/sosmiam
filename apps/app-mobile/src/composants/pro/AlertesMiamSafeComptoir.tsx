import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { MESSAGES_SERVICE } from "@sos-miam/commun/contenus/messages-services";
import type { AlerteComptoir } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { LIBELLES_ENDROIT_ALERTE } from "~/contenus/miam-safe";
import { utiliserServices } from "~/hooks/utiliser-services";

type Props = {
  lieuId: number;
  /** Après « On arrive », ou si ça n'a pas marché : le comptoir l'annonce */
  onRepondre: (texte: string) => void;
};

/** Le comptoir relit ses alertes toutes les 5 secondes (en vrai, une notification urgente arrive aussi, app fermée) */
const RELECTURE_MS = 5000;

/**
 * Les alertes silencieuses Miam Safe des 2 dernières heures, en tête du comptoir : le prénom, l'endroit et le petit détail,
 * jamais le nom ni la photo. « On arrive » prévient tout de suite la personne ; sans réponse en 2 minutes, l'alerte remonte
 * à l'équipe SOS Miam. Celles déjà prises en charge restent visibles, en plus discret.
 */
export function AlertesMiamSafeComptoir({ lieuId, onRepondre }: Props) {
  const { miamSafe } = utiliserServices();
  const [alertes, setAlertes] = useState<AlerteComptoir[]>([]);

  const relire = useCallback(async () => {
    const r = await miamSafe.listerAlertesComptoir(lieuId).catch(() => null);
    if (r?.ok) setAlertes(r.alertes);
  }, [miamSafe, lieuId]);

  useEffect(() => {
    void relire();
    const minuterie = setInterval(() => void relire(), RELECTURE_MS);
    return () => clearInterval(minuterie);
  }, [relire]);

  if (alertes.length === 0) return null;

  return (
    <View className="gap-3">
      {alertes.map((a) => {
        const prise = a.statut === "en-route";
        const ou = `${LIBELLES_ENDROIT_ALERTE[a.endroit]}${a.detail ? ` · ${a.detail}` : ""}`;
        return (
          <View
            key={a.id}
            accessibilityRole={prise ? undefined : "alert"}
            className={`gap-3 rounded-carte border-2 p-4 ${prise ? "border-ligne bg-white" : "border-jaune bg-encre"}`}
          >
            <Text className={`font-texte-gras text-xs ${prise ? "text-gris" : "text-jaune"}`}>
              🛡 MIAM SAFE · {new Date(a.creeLe).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {prise ? " · quelqu'un y va" : a.statut === "sans-reponse" ? " · sans réponse depuis 2 min" : ""}
            </Text>
            <Text className={`font-titre-gras text-2xl ${prise ? "text-encre" : "text-creme"}`}>{a.prenom} a besoin d'aide</Text>
            <Text className={`font-texte-semi text-base ${prise ? "text-encre" : "text-creme"}`}>{ou}</Text>
            {prise ? null : (
              <>
                <Text className="font-texte text-sm leading-5 text-gris-nuit">Va la voir discrètement. Pas d'annonce en salle.</Text>
                <Bouton
                  libelle="On arrive"
                  variante="jaune"
                  indice={`${a.prenom} voit tout de suite que quelqu'un arrive`}
                  onPress={async () => {
                    const r = await miamSafe.direOnArrive(lieuId, a.id);
                    onRepondre(r.ok ? `🛡 ${a.prenom} sait que tu arrives` : MESSAGES_SERVICE[r.erreur].titre);
                    void relire();
                  }}
                />
              </>
            )}
          </View>
        );
      })}
    </View>
  );
}
