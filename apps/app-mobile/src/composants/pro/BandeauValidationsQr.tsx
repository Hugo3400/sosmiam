import { Text, View } from "react-native";

import { DUREE_PRESENTATION_QR_MS } from "@sos-miam/commun/regles/visites";
import type { QrAffiche, ValidationRecente } from "@sos-miam/commun/types/comptoir";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  qr: QrAffiche;
  validees: ValidationRecente[];
  maintenant: Date;
};

/** « 1:12 » avant que le QR s'éteigne tout seul */
function formaterReste(finitLe: string, maintenant: Date): string {
  const secondes = Math.max(0, Math.ceil((Date.parse(finitLe) - maintenant.getTime()) / 1000));
  return `${Math.floor(secondes / 60)}:${String(secondes % 60).padStart(2, "0")}`;
}

/**
 * Sous le QR en grand : combien de scans restent, quand il s'éteint, et les prénoms de ceux qui viennent de scanner
 * (l'équipe voit tout de suite que ça a marché, sans regarder le téléphone du client).
 */
export function BandeauValidationsQr({ qr, validees, maintenant }: Props) {
  const debutMs = Date.parse(qr.finitLe) - DUREE_PRESENTATION_QR_MS;
  const scannes = validees.filter((v) => v.mode === "comptoir" && Date.parse(v.valideLe) >= debutMs);
  const reste = formaterReste(qr.finitLe, maintenant);
  const resume = `${qr.restantes} scan${qr.restantes > 1 ? "s" : ""} restant${qr.restantes > 1 ? "s" : ""} sur ${qr.personnes} · s'éteint dans ${reste}`;

  return (
    <View className="items-center gap-3">
      <Text accessibilityLiveRegion="polite" className="text-center font-texte-gras text-lg text-encre">
        {lierPonctuation(resume)}
      </Text>
      {scannes.length > 0 ? (
        <View accessible accessibilityLabel={`Déjà scanné : ${scannes.map((v) => (v.initialeNom ? `${v.prenom} ${v.initialeNom}.` : v.prenom)).join(", ")}`} className="flex-row flex-wrap justify-center gap-2">
          {scannes.map((v) => (
            <View key={v.visiteId} className="flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-jaune px-3 py-1">
              <Text className="text-base">{v.avatar}</Text>
              <Text className="font-texte-gras text-sm text-encre">✓ {v.initialeNom ? `${v.prenom} ${v.initialeNom}.` : v.prenom}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-center font-texte text-sm text-gris">Personne n'a encore scanné.</Text>
      )}
    </View>
  );
}
