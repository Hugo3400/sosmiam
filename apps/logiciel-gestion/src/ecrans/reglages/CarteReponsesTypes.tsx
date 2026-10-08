import { FileText, Plus, Save, Sparkles, Trash2 } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { ZoneTexte } from "~/composants/interface/ZoneTexte.tsx";
import { CATEGORIES_REPONSES, EXEMPLES_REPONSES } from "~/contenus/reponses-types.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { enregistrerReponseType, listerReponsesTypes, supprimerReponseType, type CategorieReponse, type SaisieReponseType } from "~/services/reponses-types.ts";

const VIDE: SaisieReponseType = { titre: "", categorie: "autre", objet: "", texte: "" };

/** Tes réponses types : les créer, les modifier, les supprimer. « {prenom} » et « {lieu} » sont remplis à l'usage. */
export function CarteReponsesTypes() {
  const { donnees, recharger } = utiliserChargement(listerReponsesTypes, []);
  const [edition, setEdition] = useState<{ id: number | null; saisie: SaisieReponseType } | null>(null);
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });

  async function agir(action: () => Promise<unknown>, reussite: string) {
    setEtat({ enCours: true, texte: null });
    try {
      await action();
      setEtat({ enCours: false, texte: reussite });
      recharger();
    } catch (probleme) {
      setEtat({ enCours: false, texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }
  const changer = (modif: Partial<SaisieReponseType>) => edition && setEdition({ ...edition, saisie: { ...edition.saisie, ...modif } });

  return (
    <Carte
      titre={<span className="flex items-center gap-2"><FileText className="size-4" aria-hidden /> Réponses types</span>}
      actions={<Bouton petit icone={Plus} onClick={() => setEdition({ id: null, saisie: VIDE })}>Nouvelle</Bouton>}
    >
      <div className="grid gap-3 text-sm">
        <p className="text-gris">Tes modèles de mails, à insérer en un clic avec « Réponse type… » (demandes, ambassadeurs, comptes). Écris « {"{prenom}"} » ou « {"{lieu}"} » : ils sont remplis tout seuls.</p>
        {donnees && donnees.length === 0 && !edition && (
          <Bouton petit icone={Sparkles} chargement={etat.enCours} className="justify-self-start"
            onClick={() => agir(() => Promise.all(EXEMPLES_REPONSES.map((exemple) => enregistrerReponseType(null, exemple))), "3 modèles ajoutés : adapte-les à ta façon d'écrire.")}>
            Ajouter 3 modèles pour démarrer
          </Bouton>
        )}
        <ul className="grid gap-1">
          {donnees?.map((modele) => (
            <li key={modele.id} className="flex items-center gap-2">
              <button type="button" className="min-w-0 flex-1 truncate text-left font-semibold hover:underline" onClick={() => setEdition({ id: modele.id, saisie: { titre: modele.titre, categorie: modele.categorie, objet: modele.objet, texte: modele.texte } })}>
                {modele.titre}
              </button>
              <span className="text-xs text-gris">{CATEGORIES_REPONSES[modele.categorie]}</span>
              <Bouton petit variante="discret" icone={Trash2} titre={`Supprimer « ${modele.titre} »`} onClick={() => window.confirm(`Supprimer « ${modele.titre} » ?`) && agir(() => supprimerReponseType(modele.id), "Supprimée.")} />
            </li>
          ))}
        </ul>
        {edition && (
          <div className="grid gap-3 rounded-xl bg-creme p-3">
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_12rem]">
              <Champ libelle="Titre (pour la retrouver)" valeur={edition.saisie.titre} onChange={(titre) => changer({ titre })} maxLength={80} className="w-full min-w-0" />
              <Selecteur
                libelle="Catégorie"
                valeur={edition.saisie.categorie}
                onChange={(categorie) => changer({ categorie: categorie as CategorieReponse })}
                options={Object.entries(CATEGORIES_REPONSES).map(([valeur, libelle]) => ({ valeur: valeur as CategorieReponse, libelle }))}
                className="w-full"
              />
            </div>
            <Champ libelle="Objet du mail" valeur={edition.saisie.objet} onChange={(objet) => changer({ objet })} maxLength={150} className="w-full min-w-0" />
            <ZoneTexte libelle="Texte" valeur={edition.saisie.texte} onChange={(texte) => changer({ texte })} maximum={5000} lignes={8} />
            <div className="flex gap-2">
              <Bouton petit variante="principal" icone={Save} chargement={etat.enCours} desactive={!edition.saisie.titre.trim() || !edition.saisie.texte.trim()}
                onClick={() => agir(() => enregistrerReponseType(edition.id, edition.saisie).then(() => setEdition(null)), "Enregistrée ✅")}>
                Enregistrer
              </Bouton>
              <Bouton petit onClick={() => setEdition(null)}>Annuler</Bouton>
            </div>
          </div>
        )}
        {etat.texte && <p role="status" className="font-semibold">{etat.texte}</p>}
      </div>
    </Carte>
  );
}
