import { Check, X } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { BoutonEcrireMail } from "~/composants/interface/BoutonEcrireMail.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { PastilleEmailVerifie } from "~/composants/interface/PastilleEmailVerifie.tsx";
import { ENVIES_CERTIFIE, PALIERS, PROFILS_CERTIFIE } from "~/contenus/ambassadeurs.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { accepterCertification, refuserCertification, type CandidatureCertification } from "~/services/certification.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

type Props = { candidature: CandidatureCertification; onChange: (bilan: string) => void; onOuvrirCompte: (compteId: number) => void };

/** Une candidature au titre d'ambassadeur certifié : qui, où, comment la personne aide déjà les lieux, et la décision. */
export function CarteCandidatureCertification({ candidature, onChange, onOuvrirCompte }: Props) {
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const { compte } = candidature;
  const envies = candidature.envies.split(",").filter(Boolean).map((envie) => ENVIES_CERTIFIE[envie] ?? envie);
  const qui = candidature.structure ? `${compte.prenom}, pour ${candidature.structure}` : compte.prenom;

  async function decider(accepter: boolean) {
    if (!accepter && !window.confirm(`Refuser la candidature de ${compte.prenom} ? Son compte d'ambassadeur ne change pas.`)) return;
    setEtat({ enCours: true, texte: null });
    try {
      if (accepter) {
        const { bienvenue } = await accepterCertification(candidature.id);
        onChange(`${qui} est maintenant Ambassadeur certifié ✓${bienvenue ? " Mail de bienvenue envoyé." : " (pas de mail : l'envoi n'est pas réglé)."}`);
      } else {
        await refuserCertification(candidature.id);
        onChange(`Candidature de ${compte.prenom} refusée.`);
      }
    } catch (probleme) {
      const erreur = probleme instanceof ErreurApi ? probleme : null;
      setEtat({ enCours: false, texte: erreur?.code === "pas-ambassadeur" ? `${compte.prenom} n'est plus ambassadeur : le titre s'ajoute à un compte d'ambassadeur.` : expliquerErreur(erreur) });
    }
  }

  return (
    <article className="grid gap-3 rounded-carte border border-ligne bg-white p-5">
      <div className="flex flex-wrap items-center gap-2">
        {candidature.statut === "en-attente" && <Badge ton="jaune">À décider</Badge>}
        {candidature.statut === "acceptee" && <Badge ton="vert">Acceptée</Badge>}
        {candidature.statut === "refusee" && <Badge>Refusée</Badge>}
        <Badge ton="contour">{PROFILS_CERTIFIE[candidature.profil] ?? candidature.profil}</Badge>
        {candidature.commune && <Badge ton="contour">📍 {candidature.commune.nom} ({candidature.commune.codeDepartement})</Badge>}
        <span className="ml-auto text-xs text-gris">{formaterDate(candidature.creeLe, true)}</span>
      </div>
      <div>
        <button type="button" className="font-titre text-xl font-extrabold hover:underline" onClick={() => onOuvrirCompte(compte.id)}>{qui}</button>
        <p className="text-sm text-gris">
          {[compte.ambassadeur && [compte.ambassadeur.quartier, compte.ambassadeur.ville].filter(Boolean).join(", "), `${PALIERS[compte.palier]?.emoji ?? ""} ${formaterNombre(compte.points)} pts`, compte.email].filter(Boolean).join(" · ")}
          {" · "}<PastilleEmailVerifie le={compte.emailVerifieLe} />
        </p>
      </div>
      <dl className="grid gap-2 text-sm">
        <div><dt className="font-semibold">Comment la personne aide déjà les lieux</dt><dd className="whitespace-pre-line">{candidature.aide}</dd></div>
        {envies.length > 0 && <div><dt className="font-semibold">Envies</dt><dd>{envies.join(" · ")}</dd></div>}
        <div><dt className="font-semibold">Engagement</dt><dd>{candidature.engagementGratuit ? "✅ Jamais payé par un lieu (sinon « Collaboration commerciale »)" : "⚠️ Case non cochée"}</dd></div>
      </dl>
      <div className="flex flex-wrap gap-2">
        {candidature.statut === "en-attente" && (
          <>
            <Bouton variante="principal" icone={Check} chargement={etat.enCours} onClick={() => decider(true)}>Certifier</Bouton>
            <Bouton variante="danger" icone={X} desactive={etat.enCours} onClick={() => decider(false)}>Refuser</Bouton>
          </>
        )}
        <BoutonEcrireMail petit={false} destinataire={{ compteId: compte.id, adresse: compte.email, prenom: compte.prenom }} categorie="ambassadeur" />
      </div>
      {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
    </article>
  );
}
