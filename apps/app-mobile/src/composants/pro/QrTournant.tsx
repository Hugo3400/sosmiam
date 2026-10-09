import { View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { AnneauCompteARebours } from "~/composants/pro/AnneauCompteARebours";
import couleurs from "~/theme/couleurs";

type Props = {
  /** Le texte du QR de la fenêtre en cours (il change toutes les 30 s) */
  texte: string;
  fenetre: number;
  changeDansMs: number;
  dureeMs: number;
  /** Côté de l'ensemble (anneau compris), en points */
  taille: number;
};

/**
 * Le QR du comptoir, noir sur blanc, dans un anneau qui se vide jusqu'au prochain changement. Marge blanche généreuse
 * autour du QR : les appareils photo le lisent mieux, même sur un écran un peu sale.
 */
export function QrTournant({ texte, fenetre, changeDansMs, dureeMs, taille }: Props) {
  const tailleQr = Math.round(taille * 0.66);
  return (
    <View style={{ width: taille, height: taille }} className="items-center justify-center">
      <AnneauCompteARebours taille={taille} changeDansMs={changeDansMs} dureeMs={dureeMs} fenetre={fenetre} />
      <View className="rounded-3xl bg-white p-4">
        <QRCode value={texte} size={tailleQr} color={couleurs.encre} backgroundColor="#FFFFFF" ecl="M" />
      </View>
    </View>
  );
}
