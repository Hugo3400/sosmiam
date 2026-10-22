import { Cpu, LineChart, SquareTerminal } from "lucide-react";
import { useEffect } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireMachines } from "~/services/machines.ts";
import { CarteMachine } from "./CarteMachine.tsx";
import { TuilesMachine } from "./TuilesMachine.tsx";
import type { OngletMaintenance } from "~/contenus/onglets-maintenance.ts";

export function OngletMachines({ tour, allerA }: { tour: number; allerA: (onglet: OngletMaintenance) => void }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireMachines, [tour]);
  useEffect(() => {
    const minuteur = setInterval(recharger, 60_000);
    return () => clearInterval(minuteur);
  }, [recharger]);

  if (!donnees && chargement) return <Chargement />;
  if (!donnees) return <MessageErreur erreur={erreur} reessayer={recharger} />;
  return (
    <div className="grid gap-5">
      <MessageErreur erreur={erreur} reessayer={recharger} />
      <div className="grid gap-2">
        <h2 className="text-lg font-extrabold">Les machines</h2>
        <p className="text-[13px] text-gris">{donnees.machines.length > 1 ? "Clique sur une machine pour voir ses détails." : "Une seule machine pour l'instant : le VPS fait tout."}</p>
        <div className="flex flex-wrap gap-4">{donnees.machines.map((machine) => <CarteMachine key={machine.id} machine={machine} />)}</div>
      </div>
      {donnees.machines.map((machine) => (
        <div key={machine.id} className="grid gap-3">
          <h2 className="text-lg font-extrabold">{machine.nom}, maintenant</h2>
          {machine.maintenant ? (
            <TuilesMachine maintenant={machine.maintenant} />
          ) : (
            <EtatVide emoji="⏱️" titre="Premier relevé en cours">L'API mesure la machine une fois par minute. Les chiffres arrivent dans quelques secondes.</EtatVide>
          )}
        </div>
      ))}
      <div className="flex flex-wrap gap-2">
        <Bouton petit icone={LineChart} onClick={() => allerA("courbes")}>Voir les courbes</Bouton>
        <Bouton petit icone={Cpu} onClick={() => allerA("systeme")}>Voir les services</Bouton>
        <Bouton petit icone={SquareTerminal} onClick={() => allerA("journaux")}>Lire les journaux</Bouton>
      </div>
    </div>
  );
}
