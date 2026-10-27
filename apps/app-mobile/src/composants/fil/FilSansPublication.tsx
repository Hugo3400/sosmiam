import { FilVide } from "~/composants/fil/FilVide";
import { FilVideAbonnements } from "~/composants/fil/FilVideAbonnements";
import { FilVidePourToi } from "~/composants/fil/FilVidePourToi";
import type { OngletFil } from "~/composants/fil/EnTeteFil";

type Props = {
  onglet: OngletFil;
  hauteur: number;
  margeHaut: number;
  margeBas: number;
  horsLigne: boolean;
  onVoirTout: () => void;
  onVoirAdresses: () => void;
  onAnnoncer: (texte: string) => void;
};

export function FilSansPublication({ onglet, hauteur, margeHaut, margeBas, horsLigne, onVoirTout, onVoirAdresses, onAnnoncer }: Props) {
  if (onglet === "abonnements") {
    return <FilVideAbonnements hauteur={hauteur} margeHaut={margeHaut} margeBas={margeBas} onVoirTout={onVoirTout} onAnnoncer={onAnnoncer} />;
  }
  if (onglet === "tous") return <FilVidePourToi hauteur={hauteur} horsLigne={horsLigne} onVoirAdresses={onVoirAdresses} />;
  return <FilVide hauteur={hauteur} onVoirTout={onVoirTout} />;
}
