import { Check, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { ENVIES_FONDATEUR, PALIERS } from "~/contenus/ambassadeurs.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { accepterCandidature, refuserCandidature, type Candidature } from "~/services/ambassadeurs.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

/** onChange reçoit le bilan de la décision (« Malik devient fondateur n° 2 ») */
type Props = { candidature: Candidature; onChange: (bilan: string) => void; onOuvrirCompte?: (compteId: number) => void };

/** Une candidature au titre d'ambassadeur fondateur (10 places, numérotées) : ce que la personne a écrit, et la décision. */
export function CarteCandidature({ candidature, onChange, onOuvrirCompte }: Props) {
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const { compte } = candidature;
  const envies = candidature.envies.split(",").filter(Boolean).map((envie) => ENVIES_FONDATEUR[envie] ?? envie);

  async function decider(accepter: boolean) {
    if (!accepter && !window.confirm(`Refuser la candidature${compte ? ` de ${compte.prenom}` : ""} ? Son compte d'ambassadeur ne change pas.`)) return;
    setEtat({ enCours: true, texte: null });
    try {
      const resultat = accepter ? await accepterCandidature(candidature.id) : await refuserCandidature(candidature.id);
      const qui = compte?.prenom ?? "La personne";
      setEtat({ enCours: false, texte: null });
      onChange("numero" in resultat ? `${qui} devient fondateur n° ${resultat.numero} 🏅 Pense à lui annoncer la nouvelle !` : `Candidature de ${qui} refusée.`);
    } catch (probleme) {
      setEtat({ enCours: false, texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <article className="grid gap-3 rounded-carte border border-ligne bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        {candidature.statut === "en-attente" && <Badge ton="jaune">À décider</Badge>}
        {candidature.statut === "acceptee" && <Badge ton="encre">🏅 Fondateur n° {candidature.numero}</Badge>}
        {candidature.statut === "refusee" && <Badge>Refusée</Badge>}
        {candidature.partantRencontre && <Badge ton="vert">☕ Partant pour se rencontrer</Badge>}
        <span className="ml-auto text-xs text-gris">{formaterDate(candidature.creeLe, true)}</span>
      </div>
      {compte && (
        <div>
          <button type="button" className="font-titre text-xl font-extrabold hover:underline" onClick={() => onOuvrirCompte?.(compte.id)} disabled={!onOuvrirCompte}>
            {compte.prenom}
          </button>
          <p className="text-sm text-gris">
            {[compte.ambassadeur && [compte.ambassadeur.quartier, compte.ambassadeur.ville].filter(Boolean).join(", "), `${PALIERS[compte.palier]?.emoji ?? ""} ${formaterNombre(compte.points)} pts`, compte.email]
              .filter(Boolean).join(" · ")}
          </p>
        </div>
      )}
      <dl className="grid gap-2 text-sm">
        <div><dt className="font-semibold">Ses 3 pépites</dt><dd className="whitespace-pre-line">{candidature.pepites}</dd></div>
        <div><dt className="font-semibold">« Pourquoi toi ? »</dt><dd className="whitespace-pre-line">{candidature.motivation}</dd></div>
        {envies.length > 0 && <div><dt className="font-semibold">Envies</dt><dd>{envies.join(" · ")}</dd></div>}
        {candidature.reseaux && <div><dt className="font-semibold">Réseaux</dt><dd>{candidature.reseaux}</dd></div>}
        {candidature.connuPar && <div><dt className="font-semibold">A connu SOS Miam par</dt><dd>{candidature.connuPar}</dd></div>}
      </dl>
      {candidature.statut === "en-attente" && (
        <div className="flex flex-wrap gap-2">
          <Bouton variante="principal" icone={Check} chargement={etat.enCours} onClick={() => decider(true)}>Accepter (badge Fondateur)</Bouton>
          <Bouton variante="danger" icone={X} desactive={etat.enCours} onClick={() => decider(false)}>Refuser</Bouton>
        </div>
      )}
      {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
    </article>
  );
}
