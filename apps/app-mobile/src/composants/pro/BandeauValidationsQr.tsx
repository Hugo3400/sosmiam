import { Text, View } from "react-native";

import { DUREE_PRESENTATION_QR_MS } from "@sos-miam/commun/regles/visites";
import type { QrAffiche, ValidationRecente } from "@sos-miam/commun/types/comptoir";
import { EmojiOuMiami } from "~/composants/profil/EmojiOuMiami";
import { TEXTES_QR_COMPTOIR_PAR_LANGUE } from "~/contenus/textes-qr-comptoir";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

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
  const T = utiliserTextes(TEXTES_QR_COMPTOIR_PAR_LANGUE);
  const debutMs = Date.parse(qr.finitLe) - DUREE_PRESENTATION_QR_MS;
  const scannes = validees.filter((v) => v.mode === "comptoir" && Date.parse(v.valideLe) >= debutMs);
  const reste = formaterReste(qr.finitLe, maintenant);
  const resume = T.resume(qr.restantes, qr.personnes, reste);

  return (
    <View className="items-center gap-3">
      <Text accessibilityLiveRegion="polite" className="text-center font-texte-gras text-lg text-encre">
        {lierPonctuation(resume)}
      </Text>
      {scannes.length > 0 ? (
        <View accessible accessibilityLabel={T.dejaScanne(scannes.map((v) => (v.initialeNom ? `${v.prenom} ${v.initialeNom}.` : v.prenom)).join(", "))} className="flex-row flex-wrap justify-center gap-2">
          {scannes.map((v) => (
            <View key={v.visiteId} className="flex-row items-center gap-1.5 rounded-full border-2 border-encre bg-jaune px-3 py-1">
              <EmojiOuMiami valeur={v.avatar} taille={20} className="text-base" />
              <Text className="font-texte-gras text-sm text-nuit">✓ {v.initialeNom ? `${v.prenom} ${v.initialeNom}.` : v.prenom}</Text>
            </View>
          ))}
        </View>
      ) : (
        <Text className="text-center font-texte text-sm text-gris">{T.personne}</Text>
      )}
    </View>
  );
}
