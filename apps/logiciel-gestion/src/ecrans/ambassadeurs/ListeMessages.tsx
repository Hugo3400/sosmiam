import { MessageSquarePlus, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerMessages, supprimerMessage } from "~/services/ambassadeurs.ts";
import { ModaleMessage } from "./ModaleMessage.tsx";

/** Les messages envoyés depuis le logiciel vers l'espace ambassadeur, avec combien les ont lus. */
export function ListeMessages({ onOuvrirCompte, tour }: { onOuvrirCompte: (compteId: number) => void; tour: number }) {
  const [ecriture, setEcriture] = useState(false);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerMessages, [tour]);

  return (
    <Carte sansMarge titre="Messages" actions={<Bouton petit variante="principal" icone={MessageSquarePlus} onClick={() => setEcriture(true)}>Nouveau message</Bouton>}>
      <div className="px-5 pt-3"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.length === 0 && (
        <EtatVide emoji="💌" titre="Pas encore de message">
          Un mot à tous les ambassadeurs (le programme du mois, un grand merci) ou à une seule personne : il arrive dans son espace.
        </EtatVide>
      )}
      {donnees && donnees.length > 0 && (
        <ul>
          {donnees.map((message) => (
            <li key={message.id} className="grid gap-1 border-b border-ligne/70 px-5 py-3 text-sm last:border-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-semibold">{message.titre}</span>
                {message.compte ? (
                  <button type="button" className="hover:underline" onClick={() => onOuvrirCompte(message.compte!.id)}><Badge>Pour {message.compte.prenom}</Badge></button>
                ) : (
                  <Badge ton="jaune">À tous</Badge>
                )}
                <span className="chiffres text-gris">Lu par {message._count.lectures} / {message.destinataires}</span>
                <span className="ml-auto text-gris">{formaterDate(message.creeLe, true)}</span>
                <Bouton
                  petit
                  variante="discret"
                  icone={Trash2}
                  titre="Retirer le message"
                  onClick={() => window.confirm(`Retirer « ${message.titre} » ? Il disparaît de ${message.compte ? "son espace" : "l'espace de tout le monde"}.`) && void supprimerMessage(message.id).then(recharger, recharger)}
                />
              </div>
              <p className="line-clamp-3 whitespace-pre-line text-gris">{message.texte}</p>
            </li>
          ))}
        </ul>
      )}
      {ecriture && <ModaleMessage onFermer={() => setEcriture(false)} onEnvoye={() => { setEcriture(false); recharger(); }} />}
    </Carte>
  );
}
