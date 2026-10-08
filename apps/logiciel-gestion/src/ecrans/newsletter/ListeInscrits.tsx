import { Download, Search, UserMinus } from "lucide-react";
import { useEffect, useState } from "react";

import { Badge } from "~/composants/interface/Badge.tsx";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { Pagination } from "~/composants/interface/Pagination.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { TuileChiffre } from "~/composants/interface/TuileChiffre.tsx";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { desinscrire, exporterInscrits, listerInscrits, type FiltresInscrits, type Inscrit } from "~/services/newsletter.ts";
import { enregistrerFichier } from "~/services/systeme.ts";
import { CarteBoiteMail } from "./CarteBoiteMail.tsx";

const FILTRES_VIDES: FiltresInscrits = { recherche: "", ville: "", ambassadeur: false, beta: false, telephone: "", relance: false, page: 1 };

/** Liste des inscrits : recherche, filtres, export CSV et désinscription (droit à l'effacement). */
export function ListeInscrits() {
  const [filtres, setFiltres] = useState(FILTRES_VIDES);
  const [recherche, setRecherche] = useState("");
  const [aDesinscrire, setADesinscrire] = useState<Inscrit | null>(null);
  const [action, setAction] = useState<{ enCours: boolean; erreur: string | null; message: string | null }>({ enCours: false, erreur: null, message: null });
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerInscrits(filtres), [filtres]);
  const changer = (modif: Partial<FiltresInscrits>) => setFiltres((avant) => ({ ...avant, page: 1, ...modif }));

  // La recherche part 300 ms après la dernière touche
  useEffect(() => {
    const minuteur = setTimeout(() => recherche !== filtres.recherche && changer({ recherche }), 300);
    return () => clearTimeout(minuteur);
  }, [recherche, filtres.recherche]);

  async function exporter() {
    setAction({ enCours: true, erreur: null, message: null });
    try {
      const csv = await exporterInscrits();
      const enregistre = await enregistrerFichier(`inscrits-sos-miam-${new Date().toISOString().slice(0, 10)}.csv`, csv);
      setAction({ enCours: false, erreur: null, message: enregistre ? "Export enregistré. Garde-le à l'abri : il contient des adresses e-mail." : null });
    } catch (probleme) {
      setAction({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) || "Export impossible.", message: null });
    }
  }

  async function confirmerDesinscription() {
    if (!aDesinscrire) return;
    setAction({ enCours: true, erreur: null, message: null });
    try {
      await desinscrire(aDesinscrire.id);
      setAction({ enCours: false, erreur: null, message: `${aDesinscrire.email} est désinscrit et effacé.` });
      setADesinscrire(null);
      recharger();
    } catch (probleme) {
      setAction({ enCours: false, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null), message: null });
    }
  }

  const compteurs = donnees?.compteurs;
  return (
    <div className="grid gap-5">
      {donnees && compteurs && (
        <div className="grid grid-cols-2 gap-4 xl:grid-cols-4">
          <TuileChiffre libelle="Inscrits" valeur={donnees.total} detail={`+${formaterNombre(compteurs.recents)} ces 7 derniers jours`} accent />
          <TuileChiffre libelle="Futurs ambassadeurs" valeur={compteurs.ambassadeurs} />
          <TuileChiffre libelle="Bêta-testeurs" valeur={compteurs.beta} detail={`${formaterNombre(compteurs.iphone)} sur iPhone, ${formaterNombre(compteurs.android)} sur Android (tous inscrits confondus)`} />
          <TuileChiffre libelle="À relancer (3 ans sans nouvelles)" valeur={compteurs.aRelancer} detail="On leur redemande s'ils veulent continuer, sinon on efface." />
        </div>
      )}

      <Carte
        titre="Inscrits"
        actions={<Bouton petit icone={Download} chargement={action.enCours && !aDesinscrire} onClick={exporter}>Exporter en CSV</Bouton>}
        sansMarge
      >
        <div className="flex flex-wrap items-end gap-4 border-b border-ligne px-5 py-4">
          <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Recherche</span>} valeur={recherche} onChange={setRecherche} placeholder="Adresse ou ville" className="w-64" />
          <Selecteur
            libelle="Ville"
            valeur={filtres.ville}
            onChange={(ville) => changer({ ville })}
            options={[{ valeur: "", libelle: "Toutes" }, ...(donnees?.villes ?? []).filter((v) => v.ville !== "Sans ville").map((v) => ({ valeur: v.ville, libelle: `${v.ville} (${v.nombre})` }))]}
            className="w-52"
          />
          <Selecteur
            libelle="Téléphone"
            valeur={filtres.telephone}
            onChange={(telephone) => changer({ telephone })}
            options={[{ valeur: "", libelle: "Tous" }, { valeur: "iphone", libelle: "iPhone" }, { valeur: "android", libelle: "Android" }]}
            className="w-36"
          />
          <div className="flex flex-wrap gap-4 pb-2">
            <CaseACocher libelle="Ambassadeurs" coche={filtres.ambassadeur} onChange={(ambassadeur) => changer({ ambassadeur })} />
            <CaseACocher libelle="Bêta" coche={filtres.beta} onChange={(beta) => changer({ beta })} />
            <CaseACocher libelle="À relancer" coche={filtres.relance} onChange={(relance) => changer({ relance })} />
          </div>
        </div>
        {(action.message || action.erreur) && (
          <p role="status" className={`border-b border-ligne px-5 py-2 text-sm font-semibold ${action.erreur ? "text-rouge-texte" : "text-vert"}`}>{action.erreur ?? action.message}</p>
        )}
        <div className="px-5 pt-3"><MessageErreur erreur={erreur} reessayer={recharger} /></div>
        {!donnees && chargement ? (
          <Chargement />
        ) : donnees && donnees.inscrits.length === 0 ? (
          <EtatVide emoji="📭" titre={donnees.total === 0 ? "Personne pour l'instant" : "Personne ne correspond"}>
            {donnees.total === 0 ? "Les inscriptions du formulaire « Préviens-moi » arriveront ici." : "Essaie d'enlever un filtre."}
          </EtatVide>
        ) : donnees ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-xs tracking-wide text-gris uppercase">
                <tr className="border-b border-ligne">
                  <th scope="col" className="px-5 py-2 font-bold">Adresse</th>
                  <th scope="col" className="px-3 py-2 font-bold">Ville</th>
                  <th scope="col" className="px-3 py-2 font-bold">Téléphone</th>
                  <th scope="col" className="px-3 py-2 font-bold">Envies</th>
                  <th scope="col" className="px-3 py-2 font-bold">Inscrit le</th>
                  <th scope="col" className="px-3 py-2 font-bold">Dernier signe</th>
                  <th scope="col" className="px-5 py-2"><span className="sr-only">Actions</span></th>
                </tr>
              </thead>
              <tbody>
                {donnees.inscrits.map((inscrit) => (
                  <tr key={inscrit.id} className="border-b border-ligne/70 last:border-0 hover:bg-creme/60">
                    <td className="px-5 py-2.5 font-semibold">{inscrit.email}</td>
                    <td className="px-3 py-2.5">{inscrit.ville ?? <span className="text-gris">—</span>}</td>
                    <td className="px-3 py-2.5">{inscrit.telephone === "iphone" ? "iPhone" : inscrit.telephone === "android" ? "Android" : <span className="text-gris">—</span>}</td>
                    <td className="px-3 py-2.5">
                      <span className="flex flex-wrap gap-1">
                        {inscrit.ambassadeur && <Badge ton="jaune">Ambassadeur</Badge>}
                        {inscrit.beta && <Badge ton="vert">Bêta</Badge>}
                        {inscrit.aRelancer && <Badge ton="rouge">À relancer</Badge>}
                      </span>
                    </td>
                    <td className="chiffres px-3 py-2.5 whitespace-nowrap">{formaterDate(inscrit.premiereInscription)}</td>
                    <td className="chiffres px-3 py-2.5 whitespace-nowrap">{formaterDate(inscrit.derniereInscription)}</td>
                    <td className="px-5 py-2.5 text-right">
                      <Bouton petit variante="discret" icone={UserMinus} titre={`Désinscrire ${inscrit.email}`} onClick={() => setADesinscrire(inscrit)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-3"><Pagination page={filtres.page} parPage={donnees.parPage} total={donnees.trouves} onChange={(page) => setFiltres((avant) => ({ ...avant, page }))} /></div>
          </div>
        ) : null}
      </Carte>
      <CarteBoiteMail apresSynchro={recharger} />

      <Modale
        titre="Désinscrire et effacer ?"
        ouverte={aDesinscrire !== null}
        onFermer={() => setADesinscrire(null)}
        actions={
          <>
            <Bouton onClick={() => setADesinscrire(null)}>Annuler</Bouton>
            <Bouton variante="danger" icone={UserMinus} chargement={action.enCours} onClick={confirmerDesinscription}>Désinscrire</Bouton>
          </>
        }
      >
        <p>
          <strong>{aDesinscrire?.email}</strong> ne recevra plus rien. Sa ligne est effacée de la base (ville comprise), et son adresse est
          notée dans la liste des désinscrits du serveur pour qu'une ancienne inscription par mail ne la fasse pas revenir.
        </p>
        <p className="mt-3 text-sm text-gris">À faire quand la personne le demande (mail, « STOP », droit à l'effacement). On ne peut pas revenir en arrière.</p>
      </Modale>
    </div>
  );
}
