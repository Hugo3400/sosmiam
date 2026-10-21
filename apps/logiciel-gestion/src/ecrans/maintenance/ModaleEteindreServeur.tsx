import { PowerOff } from "lucide-react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { TEXTES_SERVEURS } from "~/contenus/serveurs-dev.ts";
import type { ServeurSuivi } from "~/services/serveurs.ts";

type Props = { serveur: ServeurSuivi | null; onConfirmer: () => void; onFermer: () => void };

const CONSEQUENCES: Record<string, string> = {
  "app-dev": "Expo Go ne pourra plus charger l'app tant qu'il est éteint, et Metro ne sera plus joignable par le tunnel. Pour retester sur ton téléphone, tu le rallumes d'un clic ici.",
  "site-dev": "L'adresse localhost:5190 de VS Code ne répondra plus. Le vrai site, sosmiam.fr, ne bouge pas.",
};

export function ModaleEteindreServeur({ serveur, onConfirmer, onFermer }: Props) {
  return (
    <Modale
      titre={`Éteindre ${(serveur && TEXTES_SERVEURS[serveur.id]?.nomCourt) ?? "ce serveur"} ?`}
      ouverte={serveur !== null}
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Garder allumé</Bouton>
          <Bouton variante="danger" icone={PowerOff} onClick={onConfirmer}>Éteindre</Bouton>
        </>
      }
    >
      {serveur && (
        <div className="grid gap-2 text-sm">
          <p>{CONSEQUENCES[serveur.id] ?? "Il s'arrête jusqu'à ce que tu le rallumes."}</p>
          <p className="text-gris">L'action est notée dans le journal de gestion.</p>
        </div>
      )}
    </Modale>
  );
}
