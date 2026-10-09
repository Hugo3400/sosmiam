import { ChevronRight, RotateCw, Search } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Pagination } from "~/composants/interface/Pagination.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { PastilleEmailVerifie } from "~/composants/interface/PastilleEmailVerifie.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { PALIERS, STATUTS_AMBASSADEUR } from "~/contenus/ambassadeurs.ts";
import { formaterDateRelative } from "~/fonctions/texte/formater-date-relative.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import type { Alertes } from "~/services/alertes.ts";
import { listerComptes, type FiltresComptes } from "~/services/comptes.ts";
import { lireSurveillance } from "~/services/surveillance.ts";
import { FicheCompte } from "./FicheCompte.tsx";
import { PanneauSurveillance } from "./PanneauSurveillance.tsx";

type Props = { ouvrir?: { id: number } | null; surveillance?: Alertes["surveillance"]; onDecision: () => void };

/**
 * Tous les comptes SOS Miam (un seul par personne, pour l'app, l'espace ambassadeur et l'espace pro), et la surveillance
 * des visites : comptes et lieux signalés par les seuils, refus contestés.
 */
export function EcranComptes({ ouvrir, surveillance, onDecision }: Props) {
  const [partie, setPartie] = useState<"comptes" | "signales" | "contestations">("comptes");
  const [role, setRole] = useState<FiltresComptes["role"]>("");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [page, setPage] = useState(1);
  const [ouvert, setOuvert] = useState<number | null>(null);
  // Ouvert depuis ailleurs (recherche Ctrl+K…) sur un élément précis
  useEffect(() => {
    if (ouvrir) setOuvert(ouvrir.id);
  }, [ouvrir]);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerComptes({ recherche, role, page }), [recherche, role, page]);
  const surveille = partie !== "comptes";
  const suivi = utiliserChargement(() => (surveille ? lireSurveillance() : Promise.resolve(null)), [surveille]);
  // Après « vu », « relue » ou de nouveaux seuils : la liste se relit, et les pastilles du menu aussi
  const apresAction = () => {
    suivi.recharger();
    onDecision();
  };
  useEffect(() => {
    const minuteur = setTimeout(() => {
      setRecherche(saisie.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);

  return (
    <>
      <EnTeteEcran
        titre="Comptes"
        sousTitre="Un seul compte par personne : l'app, l'espace ambassadeur et l'espace pro. Aucun mot de passe n'est visible ici, et les données sensibles restent chiffrées."
        actions={
          surveille
            ? <Bouton icone={RotateCw} chargement={suivi.chargement && !!suivi.donnees} onClick={apresAction}>Actualiser</Bouton>
            : <Bouton icone={RotateCw} chargement={chargement && !!donnees} onClick={recharger}>Actualiser</Bouton>
        }
      />
      <div className="mb-5">
        <Onglets
          libelle="Partie"
          valeur={partie}
          onChange={setPartie}
          options={[
            { valeur: "comptes", libelle: "Tous les comptes" },
            { valeur: "signales", libelle: "À surveiller", compteur: surveillance ? surveillance.comptes + surveillance.lieux : undefined },
            { valeur: "contestations", libelle: "Contestations", compteur: surveillance?.contestations },
          ]}
        />
      </div>
      {surveille && (
        <PanneauSurveillance
          vue={partie === "contestations" ? "contestations" : "signales"}
          donnees={suivi.donnees}
          erreur={suivi.erreur}
          chargement={suivi.chargement}
          recharger={apresAction}
          onOuvrir={setOuvert}
        />
      )}
      {!surveille && donnees && (
        <div className="mb-5 grid grid-cols-2 gap-4 xl:grid-cols-3">
          <TuileChiffre libelle="Comptes" valeur={donnees.total} accent />
          <TuileChiffre libelle="Venus cette semaine" valeur={donnees.compteurs.actifsSemaine} detail="connectés au moins une fois en 7 jours" />
          <TuileChiffre libelle="Avec le rôle d'ambassadeur" valeur={donnees.compteurs.ambassadeurs} />
        </div>
      )}
      {!surveille && <Carte sansMarge titre={`Comptes${donnees ? ` (${formaterNombre(donnees.trouves)})` : ""}`}>
        <div className="flex flex-wrap items-end gap-4 border-b border-ligne px-5 py-4">
          <Onglets
            libelle="Rôle"
            valeur={role}
            onChange={(valeur) => { setRole(valeur); setPage(1); }}
            options={[{ valeur: "", libelle: "Tous" }, { valeur: "ambassadeur", libelle: "Ambassadeurs" }, { valeur: "sans-role", libelle: "Sans rôle" }]}
          />
          <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Recherche</span>} valeur={saisie} onChange={setSaisie} placeholder="Prénom ou adresse" className="w-72" />
          <p className="pb-2 text-[13px] text-gris">Les pros auront leur rôle ici quand l'espace pro ouvrira.</p>
        </div>
        <div className="px-5 pt-3"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
        {!donnees && chargement && <Chargement />}
        {donnees && donnees.comptes.length === 0 && (
          <EtatVide emoji="👥" titre={recherche || role ? "Aucun compte ne correspond" : "Pas encore de compte"}>
            Les comptes se créent sur l'espace ambassadeur aujourd'hui, et dans l'app à sa sortie.
          </EtatVide>
        )}
        {donnees && donnees.comptes.length > 0 && (
          <>
            <ul>
              {donnees.comptes.map((compte) => {
                const role = compte.ambassadeur ? STATUTS_AMBASSADEUR[compte.ambassadeur.statut] : null;
                const palier = PALIERS[compte.palier];
                return (
                  <li key={compte.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ligne/70 px-5 py-3 text-sm last:border-0">
                    <button type="button" onClick={() => setOuvert(compte.id)} className="min-w-0 flex-1 text-left">
                      <span className="block truncate font-semibold hover:underline">{compte.prenom} <span className="font-normal text-gris">{compte.pseudo ? `· @${compte.pseudo} ` : ""}· n° {compte.id}{compte.ville ? ` · ${compte.ville}` : ""}</span></span>
                      <span className="block truncate text-gris">{compte.email} · <PastilleEmailVerifie le={compte.emailVerifieLe} /></span>
                    </button>
                    <span className="w-44">{role ? <Badge ton={role.ton}>Ambassadeur · {role.libelle}</Badge> : <Badge>Sans rôle</Badge>}</span>
                    <span className="w-44 truncate">{palier ? `${palier.emoji} ${palier.nom}` : compte.palier}</span>
                    <span className="chiffres w-20 text-right font-semibold">{formaterNombre(compte.points)} pts</span>
                    <span className="w-32 text-gris">{formaterDateRelative(compte.derniereConnexion)}</span>
                    <Bouton petit variante="discret" icone={ChevronRight} titre={`Ouvrir le compte de ${compte.prenom}`} onClick={() => setOuvert(compte.id)} />
                  </li>
                );
              })}
            </ul>
            <div className="px-5 py-3"><Pagination page={page} parPage={donnees.parPage} total={donnees.trouves} onChange={setPage} /></div>
          </>
        )}
      </Carte>}
      {ouvert !== null && <FicheCompte id={ouvert} onFermer={() => setOuvert(null)} onChange={recharger} />}
    </>
  );
}
