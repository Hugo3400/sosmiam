import { UserX } from "lucide-react";
import { useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { PROFILS_CERTIFIE } from "~/contenus/ambassadeurs.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerCandidaturesCertification, listerCertifies, retirerCertification } from "~/services/certification.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { CarteCandidatureCertification } from "./CarteCandidatureCertification.tsx";

type Vue = "en-attente" | "certifies" | "refusee";
type Props = { onOuvrirCompte: (compteId: number) => void; tour: number; onDecision: () => void };

/**
 * « Ambassadeur certifié » (docs/decisions.md) : candidatures à décider, certifiés d'aujourd'hui (avec leurs missions
 * faites, et le retrait du titre), candidatures refusées. Pas de liste publique : seulement ici.
 */
export function ListeCertifications({ onOuvrirCompte, tour, onDecision }: Props) {
  const [vue, setVue] = useState<Vue>("en-attente");
  const [bilan, setBilan] = useState<string | null>(null);
  const candidatures = utiliserChargement(async () => (vue === "certifies" ? null : listerCandidaturesCertification(vue)), [vue, tour]);
  const certifies = utiliserChargement(async () => (vue === "certifies" ? listerCertifies() : null), [vue, tour]);
  const apresAction = (texte: string) => {
    setBilan(texte);
    candidatures.recharger();
    certifies.recharger();
    onDecision();
  };

  async function retirer(compteId: number, prenom: string) {
    if (!window.confirm(`Retirer le titre d'ambassadeur certifié à ${prenom} ? Son compte d'ambassadeur, son palier et ses points ne changent pas.`)) return;
    try {
      await retirerCertification(compteId);
      apresAction(`${prenom} n'est plus certifié.`);
    } catch (probleme) {
      setBilan(expliquerErreur(probleme instanceof ErreurApi ? probleme : null));
    }
  }

  const { donnees, erreur, chargement, recharger } = vue === "certifies" ? certifies : candidatures;
  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center gap-3">
        <Onglets
          libelle="Certifiés"
          valeur={vue}
          onChange={(nouvelle) => (setVue(nouvelle), setBilan(null))}
          options={[{ valeur: "en-attente", libelle: "À décider" }, { valeur: "certifies", libelle: "Certifiés" }, { valeur: "refusee", libelle: "Refusées" }]}
        />
        <p className="text-sm text-gris">Un titre à part, pas un palier : pour qui aide les lieux partenaires. Jamais payé par un lieu.</p>
      </div>
      {bilan && <p role="status" className="rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{bilan}</p>}
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && donnees.length === 0 && (
        <Carte>
          <EtatVide emoji="✅" titre={vue === "certifies" ? "Pas encore d'ambassadeur certifié" : vue === "en-attente" ? "Aucune candidature à décider" : "Aucune candidature refusée"}>
            Les ambassadeurs validés candidatent depuis leur espace : leur profil (ambassadeur, pro ou structure), leur ville, et comment ils aident déjà les lieux.
          </EtatVide>
        </Carte>
      )}
      {vue !== "certifies" && (
        <div className="grid gap-4 xl:grid-cols-2">
          {candidatures.donnees?.map((candidature) => <CarteCandidatureCertification key={candidature.id} candidature={candidature} onChange={apresAction} onOuvrirCompte={onOuvrirCompte} />)}
        </div>
      )}
      {vue === "certifies" && certifies.donnees && certifies.donnees.length > 0 && (
        <Carte sansMarge>
          <ul>
            {certifies.donnees.map((certifie) => (
              <li key={certifie.id} className="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-ligne/70 px-5 py-3 text-sm last:border-0">
                <button type="button" onClick={() => onOuvrirCompte(certifie.id)} className="min-w-0 flex-1 text-left">
                  <span className="block truncate font-semibold hover:underline">
                    {certifie.prenom}{certifie.ambassadeur?.structure ? `, pour ${certifie.ambassadeur.structure}` : ""}
                  </span>
                  <span className="block truncate text-gris">{[certifie.ambassadeur?.quartier, certifie.ambassadeur?.ville].filter(Boolean).join(", ")}</span>
                </button>
                <Badge ton="contour">{PROFILS_CERTIFIE[certifie.ambassadeur?.profilCertifie ?? ""] ?? "Certifié"}</Badge>
                <span className="w-32 text-gris">{certifie._count.missions} mission(s) faite(s)</span>
                <span className="w-40 text-gris">certifié le {certifie.ambassadeur?.certifieLe ? formaterDate(certifie.ambassadeur.certifieLe) : "?"}</span>
                <Bouton petit variante="discret" icone={UserX} onClick={() => retirer(certifie.id, certifie.prenom)}>Retirer le titre</Bouton>
              </li>
            ))}
          </ul>
        </Carte>
      )}
    </div>
  );
}
