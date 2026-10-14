import { Plus, RotateCw, Trash2 } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { decrireRegleDefi } from "~/fonctions/defis/decrire-regle-defi.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { listerDefis, modifierDefi, supprimerDefi, type DefiGestion } from "~/services/defis.ts";
import { ModaleDefi } from "./ModaleDefi.tsx";

const periode = (d: DefiGestion) => `du ${formaterDate(`${d.debut}T12:00:00Z`)}${d.fin ? ` au ${formaterDate(`${d.fin}T12:00:00Z`)}` : ", sans fin"}`;

/**
 * Les défis de l'app (décidé par Hugo le 14 octobre 2026) : le serveur compte l'avancée de chacun et crédite les points une
 * seule fois. Ici : créer, modifier, publier ou garder en brouillon, et voir combien l'ont réussi.
 */
export function EcranDefis() {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(listerDefis, []);
  const [ouvert, setOuvert] = useState<DefiGestion | "nouveau" | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function agir(action: () => Promise<unknown>, reussite: string) {
    setMessage(null);
    try {
      await action();
      setMessage(reussite);
      recharger();
    } catch (probleme) {
      const api = probleme instanceof ErreurApi ? probleme : null;
      setMessage(api?.code === "defi-deja-reussi" ? "Quelqu'un l'a déjà réussi : il ne se supprime plus. Dépublie-le plutôt." : expliquerErreur(api));
    }
  }

  return (
    <>
      <EnTeteEcran
        titre="Défis"
        sousTitre="Les défis de l'app : le serveur compte l'avancée de chacun (jours de Paris, dernier jour compris) et donne les points une seule fois. Jamais de défi pour aller au bar."
        actions={
          <>
            <Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>
            <Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Nouveau défi</Bouton>
          </>
        }
      />
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {message && <p role="status" className="mb-4 text-sm font-semibold">{message}</p>}
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.length === 0 && <Carte><EtatVide emoji="🎯" titre="Pas encore de défi">Crée le premier : il reste en brouillon tant que tu ne le publies pas.</EtatVide></Carte>}
      <ul className="grid gap-3 xl:grid-cols-2">
        {donnees?.map((defi) => (
          <li key={defi.id} className={`grid gap-2 rounded-carte border bg-white p-4 ${defi.publie ? "border-ligne" : "border-dashed border-gris/60"}`}>
            <div className="flex flex-wrap items-center gap-2">
              <button type="button" onClick={() => setOuvert(defi)} className="min-w-0 flex-1 truncate text-left font-titre text-base font-extrabold hover:underline">
                {defi.emoji} {defi.titre}
              </button>
              {defi.publie ? <Badge ton="vert">Publié</Badge> : <Badge>Brouillon</Badge>}
              <Badge ton="jaune">+{defi.points} pts</Badge>
            </div>
            <p className="text-sm">{defi.texte}</p>
            <p className="text-[13px] text-gris">{decrireRegleDefi(defi)} · {periode(defi)} · ordre {defi.ordre}</p>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-sm font-semibold">🏆 {defi.reussites} réussite{defi.reussites > 1 ? "s" : ""}</span>
              <span className="ml-auto flex flex-wrap gap-2">
                <Bouton petit onClick={() => agir(() => modifierDefi(defi.id, { publie: !defi.publie }), defi.publie ? "Défi repassé en brouillon." : "Défi publié dans l'app ✅")}>
                  {defi.publie ? "Dépublier" : "Publier"}
                </Bouton>
                <Bouton petit onClick={() => setOuvert(defi)}>Modifier</Bouton>
                {defi.reussites === 0 && (
                  <Bouton petit variante="discret" icone={Trash2} titre="Supprimer"
                    onClick={() => window.confirm(`Supprimer le défi « ${defi.titre} » ?`) && agir(() => supprimerDefi(defi.id), "Défi supprimé.")} />
                )}
              </span>
            </div>
          </li>
        ))}
      </ul>
      {ouvert && <ModaleDefi defi={ouvert === "nouveau" ? null : ouvert} onFermer={() => setOuvert(null)} onEnregistre={() => (setMessage("Défi enregistré ✅"), recharger())} />}
    </>
  );
}
