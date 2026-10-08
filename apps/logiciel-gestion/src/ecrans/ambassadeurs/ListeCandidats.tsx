import { Copy, Mail, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Pagination } from "~/composants/interface/Pagination.tsx";
import { creerLienInvitationAmbassadeur } from "~/fonctions/texte/creer-lien-invitation-ambassadeur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerInscrits } from "~/services/newsletter.ts";
import { copier, ouvrirLien } from "~/services/systeme.ts";

/** Les inscrits à la newsletter qui ont coché « ambassadeur fondateur » : à inviter à créer leur compte. */
export function ListeCandidats() {
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [message, setMessage] = useState<string | null>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(
    () => listerInscrits({ recherche, ville: "", ambassadeur: true, beta: false, telephone: "", relance: false, page }),
    [recherche, page],
  );
  useEffect(() => {
    const minuteur = setTimeout(() => {
      setRecherche(saisie);
      setPage(1);
    }, 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);
  const adresses = donnees?.inscrits.map((inscrit) => inscrit.email) ?? [];

  return (
    <Carte
      titre={`Candidats de la newsletter${donnees ? ` (${donnees.trouves})` : ""}`}
      actions={
        adresses.length > 0 && (
          <>
            <Bouton petit icone={Copy} onClick={() => copier(adresses.join(", ")).then(() => setMessage(`${adresses.length} adresse(s) copiée(s) : colle-les en copie cachée (Cci).`))}>
              Copier les adresses
            </Bouton>
            <Bouton petit variante="principal" icone={Mail} onClick={() => ouvrirLien(creerLienInvitationAmbassadeur(adresses))}>Inviter cette page</Bouton>
          </>
        )
      }
      sansMarge
    >
      <div className="flex flex-wrap items-end gap-4 border-b border-ligne px-5 py-4">
        <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Recherche</span>} valeur={saisie} onChange={setSaisie} placeholder="Adresse ou ville" className="w-72" />
        <p className="pb-2 text-[13px] text-gris">Ils ont coché « ambassadeur fondateur » en s'inscrivant à la newsletter. L'invitation part de ta messagerie, en copie cachée.</p>
      </div>
      {message && <p role="status" className="border-b border-ligne px-5 py-2 text-sm font-semibold text-vert">{message}</p>}
      <div className="px-5 pt-3"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.inscrits.length === 0 && (
        <EtatVide emoji="🙋" titre="Pas encore de candidat">Les inscrits qui cochent « ambassadeur fondateur » sur le site arriveront ici.</EtatVide>
      )}
      {donnees && donnees.inscrits.length > 0 && (
        <>
          <ul>
            {donnees.inscrits.map((inscrit) => (
              <li key={inscrit.id} className="flex flex-wrap items-center gap-3 border-b border-ligne/70 px-5 py-2.5 text-sm last:border-0">
                <span className="flex-1 font-semibold">{inscrit.email}</span>
                <span className="w-40 text-gris">{inscrit.ville ?? "—"}</span>
                <span className="chiffres w-28 text-gris">{formaterDate(inscrit.premiereInscription)}</span>
                <Bouton petit variante="discret" icone={Mail} titre={`Inviter ${inscrit.email}`} onClick={() => ouvrirLien(creerLienInvitationAmbassadeur([inscrit.email], inscrit.ville))} />
              </li>
            ))}
          </ul>
          <div className="px-5 py-3"><Pagination page={page} parPage={donnees.parPage} total={donnees.trouves} onChange={setPage} /></div>
        </>
      )}
    </Carte>
  );
}
