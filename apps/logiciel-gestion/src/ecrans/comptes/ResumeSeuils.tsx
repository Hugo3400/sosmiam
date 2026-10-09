import { SlidersHorizontal } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import type { SeuilsSurveillance } from "~/services/surveillance.ts";
import { ModaleSeuils } from "./ModaleSeuils.tsx";

type Props = { seuils: SeuilsSurveillance; parDefaut: SeuilsSurveillance; onChange: () => void };

/** Les règles de la surveillance en une phrase, et le bouton pour les régler. */
export function ResumeSeuils({ seuils: s, parDefaut, onChange }: Props) {
  const [ouverte, setOuverte] = useState(false);
  const prudents = Object.entries(parDefaut).every(([cle, valeur]) => s[cle as keyof SeuilsSurveillance] === valeur);
  return (
    <Carte className="mb-5">
      <div className="flex flex-wrap items-start gap-4">
        <p className="min-w-0 flex-1 text-sm leading-relaxed">
          <span className="font-semibold">Un compte est signalé</span> au-delà de {s.parJour} visites validées dans une journée, ou à partir
          de {s.partRefusMin} % de refus sur au moins {s.decisionsMin} visites, si au moins 2 lieux différents l'ont refusé.{" "}
          <span className="font-semibold">Un lieu est signalé</span> à partir de {s.lieuxPartRefusMin} % de refus sur au moins {s.lieuxDecisionsMin} visites.{" "}
          Sur les {s.fenetreJours} derniers jours.{" "}
          <span className="text-gris">{prudents ? "Ce sont les valeurs prudentes de départ. " : ""}Rien n'est bloqué : tu regardes et tu décides.</span>
        </p>
        <Bouton petit icone={SlidersHorizontal} onClick={() => setOuverte(true)}>Régler les seuils</Bouton>
      </div>
      <ModaleSeuils ouverte={ouverte} seuils={s} parDefaut={parDefaut} onFermer={() => setOuverte(false)} onEnregistre={onChange} />
    </Carte>
  );
}
