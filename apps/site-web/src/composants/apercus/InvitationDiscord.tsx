import type { ReactNode } from "react";

import { EnPreparation } from "~/composants/apercus/EnPreparation";
import { Bouton } from "~/composants/interface/Bouton";
import { TitreSection } from "~/composants/interface/TitreSection";
import { Section } from "~/composants/mise-en-page/Section";
import { liensPublics } from "~/contenus/liens-publics";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type Props = {
  titre: string;
  texte: string;
  bouton: string;
  /** Une ligne de plus sous le bouton (facultative) */
  rappel?: string;
  /** Un lien de plus à côté du bouton (retour aux aperçus…) */
  autreLien?: ReactNode;
};

/**
 * Bas d'un aperçu : on demande l'avis des Miamis sur le Discord (le lien de contenus/liens-publics.ts, rien d'autre),
 * puis on redit que tout est en préparation.
 */
export function InvitationDiscord({ titre, texte, bouton, rappel, autreLien }: Props) {
  const discord = liensPublics.find((lien) => lien.reseau === "discord")?.adresse;
  return (
    <Section fond="jaune" etroit>
      <div className="flex flex-col items-center text-center">
        <p className="mb-4 text-5xl" aria-hidden="true">💬</p>
        <TitreSection chapo={lierPonctuation(texte)}>{lierPonctuation(titre)}</TitreSection>
        <div className="-mt-4 flex flex-wrap items-center justify-center gap-4">
          {discord && <Bouton href={discord} variante="blanc">{lierPonctuation(bouton)}</Bouton>}
          {autreLien}
        </div>
        <EnPreparation surJaune className="mt-10" />
        {rappel && <p className="mt-3 max-w-md text-[.95rem] font-semibold">{lierPonctuation(rappel)}</p>}
      </div>
    </Section>
  );
}
