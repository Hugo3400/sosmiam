import { EcranProvisoire } from "~/composants/interface/EcranProvisoire";

/** Mes visites (provisoire). */
export default function EcranMesVisites() {
  return (
    <EcranProvisoire
      emoji="📒"
      titre="Mes visites"
      texte="Tes visites validées s'aligneront ici, mois par mois. Un joli carnet de bonnes adresses en perspective."
    />
  );
}
