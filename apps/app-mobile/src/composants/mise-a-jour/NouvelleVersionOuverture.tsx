import { FenetreNouvelleVersion } from "~/composants/mise-a-jour/FenetreNouvelleVersion";
import type { EtatVersion } from "~/fonctions/version/decider-etat-version";
import { utiliserPropositionVersion } from "~/hooks/utiliser-proposition-version";

type Props = {
  etat: EtatVersion;
};

export function NouvelleVersionOuverture({ etat }: Props) {
  const { version, ouverte, fermer, marquerMontree } = utiliserPropositionVersion(etat);
  return <FenetreNouvelleVersion visible={ouverte && version !== null} onFermer={fermer} onMontree={marquerMontree} />;
}
