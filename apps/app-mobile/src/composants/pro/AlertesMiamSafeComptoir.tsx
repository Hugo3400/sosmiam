import { useCallback, useEffect, useState } from "react";
import { Text, View } from "react-native";

import { MESSAGES_SERVICE_PAR_LANGUE } from "@sos-miam/commun/contenus/messages-services";
import type { AlerteComptoir } from "@sos-miam/commun/types/miam-safe";
import { Bouton } from "~/composants/interface/Bouton";
import { LIBELLES_ENDROIT_ALERTE_PAR_LANGUE } from "~/contenus/miam-safe";
import {
  CONSIGNE_ALERTE_MIAM_SAFE_COMPTOIR,
  MARQUE_ALERTE_MIAM_SAFE_COMPTOIR,
  TEXTES_ALERTES_MIAM_SAFE_COMPTOIR_PAR_LANGUE,
} from "~/contenus/textes-alertes-miam-safe-comptoir";
import { utiliserServices } from "~/hooks/utiliser-services";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const T = utiliserTextes(TEXTES_ALERTES_MIAM_SAFE_COMPTOIR_PAR_LANGUE);
  const endroits = utiliserTextes(LIBELLES_ENDROIT_ALERTE_PAR_LANGUE);
  const messagesService = utiliserTextes(MESSAGES_SERVICE_PAR_LANGUE);
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
        const ou = `${endroits[a.endroit]}${a.detail ? ` · ${a.detail}` : ""}`;
        return (
          <View
            key={a.id}
            accessibilityRole={prise ? undefined : "alert"}
            className={`gap-3 rounded-carte border-2 p-4 ${prise ? "border-ligne bg-carte" : "border-jaune bg-nuit"}`}
          >
            <Text className={`font-texte-gras text-xs ${prise ? "text-gris" : "text-jaune"}`}>
              {MARQUE_ALERTE_MIAM_SAFE_COMPTOIR} · {new Date(a.creeLe).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
              {prise ? ` · ${T.quelquUnYVa}` : a.statut === "sans-reponse" ? ` · ${T.sansReponse}` : ""}
            </Text>
            <Text className={`font-titre-gras text-2xl ${prise ? "text-encre" : "text-lait"}`}>{T.besoinAide(a.prenom)}</Text>
            <Text className={`font-texte-semi text-base ${prise ? "text-encre" : "text-lait"}`}>{ou}</Text>
            {prise ? null : (
              <>
                <Text accessibilityLanguage="fr-FR" className="font-texte text-sm leading-5 text-gris-nuit">
                  {CONSIGNE_ALERTE_MIAM_SAFE_COMPTOIR}
                </Text>
                <Bouton
                  libelle={T.onArrive}
                  variante="jaune"
                  indice={T.onArriveIndice(a.prenom)}
                  onPress={async () => {
                    const r = await miamSafe.direOnArrive(lieuId, a.id);
                    onRepondre(r.ok ? T.annonceOnArrive(a.prenom) : messagesService[r.erreur].titre);
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
