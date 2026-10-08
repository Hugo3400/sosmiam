import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { copier } from "~/services/systeme.ts";
import type { CoffreCle } from "~/stockage/coffre-local.ts";
import { CadreConnexion } from "./CadreConnexion.tsx";

/** Après la création de la clé : la commande à lancer sur le serveur pour autoriser ce PC. */
export function EcranAutorisation({ coffre, onContinuer }: { coffre: CoffreCle; onContinuer: () => void }) {
  const [copie, setCopie] = useState(false);
  const commande = `npm run gestion:autoriser -- ${coffre.clePublique} "PC de Hugo"`;

  return (
    <CadreConnexion
      titre="Autorise ce PC sur le serveur"
      sousTitre="Dernière étape, à faire une seule fois. Le serveur ne connaîtra que la clé publique : elle sert à vérifier tes demandes, pas à en fabriquer."
    >
      <ol className="grid list-decimal gap-4 pl-5 text-[15px]">
        <li>
          Ouvre un terminal sur le serveur, <strong>toi-même</strong> (pas à travers Claude : un secret va s'afficher), dans
          <code className="mx-1 rounded bg-creme px-1.5 py-0.5 text-[13px]">/var/www/sos-miam</code>, et lance :
          <div className="mt-2 flex items-start gap-2 rounded-xl border border-ligne bg-creme p-3">
            <code className="flex-1 font-mono text-[12px] break-all">{commande}</code>
            <Bouton
              petit
              icone={copie ? Check : Copy}
              titre="Copier la commande"
              onClick={() => copier(commande).then(() => setCopie(true))}
            />
          </div>
        </li>
        <li>
          Vérifie que le serveur affiche bien l'identifiant <strong className="chiffres rounded bg-jaune-clair px-1.5 font-mono">{coffre.idPoste}</strong>.
        </li>
        <li>
          La première fois, il affiche aussi une clé de configuration : ajoute-la dans ton application d'authentification
          (Google Authenticator, Microsoft Authenticator…). C'est elle qui te donnera le code à 6 chiffres.
        </li>
      </ol>
      <Bouton variante="principal" className="mt-6 w-full" onClick={onContinuer}>C'est fait, je me connecte</Bouton>
    </CadreConnexion>
  );
}
