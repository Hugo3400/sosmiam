import { Badge } from "~/composants/interface/Badge.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireCouverture } from "~/services/ambassadeurs.ts";

/** Où sont les ambassadeurs actifs, ville par ville et quartier par quartier, face aux lieux en ligne : où recruter. */
export function CarteCouverture({ tour }: { tour: number }) {
  const { donnees, erreur, chargement, recharger } = utiliserChargement(lireCouverture, [tour]);
  const villes = donnees ?? [];
  const sansAmbassadeur = villes.filter((v) => v.ambassadeurs === 0);
  return (
    <div className="grid gap-5">
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && (
        <>
          <div className="grid grid-cols-2 gap-4 xl:grid-cols-3">
            <TuileChiffre libelle="Villes avec un ambassadeur" valeur={villes.length - sansAmbassadeur.length} accent />
            <TuileChiffre libelle="Ambassadeurs actifs" valeur={villes.reduce((total, v) => total + v.ambassadeurs, 0)} />
            <TuileChiffre libelle="Villes à couvrir" valeur={sansAmbassadeur.length} detail="des lieux en ligne, personne sur place" />
          </div>
          <Carte titre="Ville par ville" sansMarge>
            {villes.length === 0 ? (
              <EtatVide emoji="🗺️" titre="La carte est encore vide">Elle se remplit avec les ambassadeurs validés et les lieux en ligne.</EtatVide>
            ) : (
              <table className="w-full text-sm">
                <thead className="border-b border-ligne text-left text-gris">
                  <tr>
                    <th className="px-5 py-2 font-semibold">Ville</th>
                    <th className="chiffres px-3 py-2 text-right font-semibold">Ambassadeurs</th>
                    <th className="chiffres px-3 py-2 text-right font-semibold">Lieux en ligne</th>
                    <th className="px-5 py-2 font-semibold">Quartiers</th>
                  </tr>
                </thead>
                <tbody>
                  {villes.map((ville) => (
                    <tr key={ville.ville} className="border-b border-ligne/70 align-top last:border-0">
                      <td className="px-5 py-2.5 font-semibold">
                        {ville.ville}
                        {ville.ambassadeurs === 0 && <span className="ml-2"><Badge ton="rouge">À couvrir</Badge></span>}
                        {ville.ambassadeurs > 0 && ville.lieux === 0 && <span className="ml-2"><Badge ton="jaune">Pas encore de lieu</Badge></span>}
                      </td>
                      <td className="chiffres px-3 py-2.5 text-right">{formaterNombre(ville.ambassadeurs)}</td>
                      <td className="chiffres px-3 py-2.5 text-right">{formaterNombre(ville.lieux)}</td>
                      <td className="px-5 py-2.5 text-gris">
                        {ville.quartiers.length === 0 ? "—" : ville.quartiers.sort((a, b) => b.ambassadeurs - a.ambassadeurs).map((q) => `${q.quartier} (${q.ambassadeurs})`).join(" · ")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </Carte>
        </>
      )}
    </div>
  );
}
