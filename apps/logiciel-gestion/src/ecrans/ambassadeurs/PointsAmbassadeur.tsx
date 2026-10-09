import { Award, Minus, Plus } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { RAISONS_POINTS } from "~/contenus/ambassadeurs.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterDate } from "~/fonctions/texte/formater-date.ts";
import { ajouterPoints, changerPalierVille, type FicheAmbassadeur } from "~/services/ambassadeurs.ts";
import { retirerCertification } from "~/services/certification.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

/** Points donnés ou retirés à la main (avec un motif, gardé dans son journal), rôle d'ambassadeur de ville, journal des points. */
export function PointsAmbassadeur({ fiche, onChange }: { fiche: FicheAmbassadeur; onChange: () => void }) {
  const [points, setPoints] = useState("");
  const [motif, setMotif] = useState("");
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });
  const nombre = Number.parseInt(points, 10);
  const valide = Number.isInteger(nombre) && nombre !== 0 && Math.abs(nombre) <= 10_000 && motif.trim().length > 0;
  const deVille = fiche.palier === "ambassadeur-ville";
  /** Réservé aux fondateurs en place d'une ville, pas d'un département (décidé par Hugo le 9 octobre 2026) */
  const villeFondee = fiche.candidatures.find((candidature) => candidature.statut === "acceptee" && candidature.zone?.type === "ville")?.zone ?? null;

  async function agir(action: () => Promise<unknown>, reussite: string) {
    setEtat({ enCours: true, texte: null });
    try {
      await action();
      setEtat({ enCours: false, texte: reussite });
      onChange();
    } catch (probleme) {
      setEtat({ enCours: false, texte: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  return (
    <section className="grid gap-3">
      <h3 className="font-extrabold">Points</h3>
      <div className="grid grid-cols-[7rem_minmax(0,1fr)] items-end gap-3">
        <Champ libelle="Points" type="number" valeur={points} onChange={setPoints} placeholder="20 ou -20" className="w-full min-w-0" />
        <Champ libelle="Motif (dans son journal)" valeur={motif} onChange={setMotif} maxLength={200} placeholder="Merci pour la soirée de lancement !" className="w-full min-w-0" />
      </div>
      <div className="flex flex-wrap gap-2">
        <Bouton
          petit
          variante="principal"
          icone={nombre < 0 ? Minus : Plus}
          desactive={!valide}
          chargement={etat.enCours}
          onClick={() => agir(() => ajouterPoints(fiche.id, nombre, motif.trim()).then(() => { setPoints(""); setMotif(""); }), nombre > 0 ? `+${nombre} points ✅` : `${nombre} points`)}
        >
          {nombre < 0 ? "Retirer" : "Donner"}
        </Bouton>
        {fiche.ambassadeur?.statut === "actif" && (
          <Bouton
            petit
            icone={Award}
            desactive={etat.enCours || (!deVille && !villeFondee)}
            titre={!deVille && !villeFondee ? "Réservé aux fondateurs d'une ville (pas d'un département)" : undefined}
            onClick={() => (deVille || window.confirm(`Nommer ${fiche.prenom} ambassadeur ${villeFondee?.nomAvecDe ?? "de sa ville"} ? C'est le palier le plus haut, donné seulement à la main, parmi les fondateurs de la ville.`))
              && agir(() => changerPalierVille(fiche.id, !deVille), deVille ? "Rôle d'ambassadeur de ville retiré" : "Nommé ambassadeur de ville 🎖️")}
          >
            {deVille ? "Retirer « ambassadeur de ville »" : "Nommer ambassadeur de ville"}
          </Bouton>
        )}
        {fiche.ambassadeur?.certifieLe && (
          <Bouton
            petit
            variante="discret"
            desactive={etat.enCours}
            onClick={() => window.confirm(`Retirer le titre d'ambassadeur certifié à ${fiche.prenom} ? Son palier et ses points ne changent pas.`)
              && agir(() => retirerCertification(fiche.id), "Titre de certifié retiré")}
          >
            Retirer « certifié »
          </Bouton>
        )}
      </div>
      {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
      {fiche.journalPoints.length === 0 ? (
        <p className="text-sm text-gris">Pas encore de points.</p>
      ) : (
        <ul className="grid max-h-56 gap-1 overflow-y-auto rounded-xl border border-ligne p-2 text-sm">
          {fiche.journalPoints.map((ligne) => (
            <li key={ligne.id} className="flex gap-2">
              <span className={`chiffres w-12 shrink-0 text-right font-bold ${ligne.points < 0 ? "text-rouge-texte" : "text-vert"}`}>{ligne.points > 0 ? "+" : ""}{ligne.points}</span>
              <span className="min-w-0 flex-1">
                {RAISONS_POINTS[ligne.raison] ?? ligne.raison}
                {ligne.detail && <span className="text-gris"> · {ligne.detail}</span>}
              </span>
              <span className="shrink-0 text-gris">{formaterDate(ligne.creeLe)}</span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
