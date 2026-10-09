import { EyeOff, FilePen, Globe, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { modifierLieuxEnLot, supprimerLieuxEnLot, type ModificationLot, type ResumeLieu } from "~/services/lieux.ts";
import { ModaleModifierLieux } from "./ModaleModifierLieux.tsx";

type Props = { choisis: ResumeLieu[]; onVider: () => void; onFait: (message: string) => void };

/** Barre collée en bas de l'écran quand des lieux sont sélectionnés : changer leur statut, les modifier, les supprimer. */
export function BarreSelectionLieux({ choisis, onVider, onFait }: Props) {
  const [fenetre, setFenetre] = useState<"modifier" | "supprimer" | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const ids = choisis.map((lieu) => lieu.id);
  const nombre = choisis.length;
  const lieux = `${nombre} lieu${nombre > 1 ? "x" : ""}`;
  const publications = choisis.reduce((total, lieu) => total + lieu._count.publications, 0);

  async function agir(nom: string, action: () => Promise<{ nombre: number }>, message: (n: number) => string) {
    setEnCours(nom);
    setErreur(null);
    try {
      const { nombre: faits } = await action();
      setFenetre(null);
      onFait(message(faits));
    } catch (probleme) {
      setErreur(expliquerErreur(probleme instanceof ErreurApi ? probleme : null));
    } finally {
      setEnCours(null);
    }
  }
  const changerStatut = (statut: NonNullable<ModificationLot["statut"]>, libelle: string) =>
    agir(statut, () => modifierLieuxEnLot(ids, { statut }), (n) => `${n} lieu${n > 1 ? "x" : ""} ${libelle} ✅`);

  return (
    <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center gap-2 rounded-full border-2 border-encre bg-nuit py-2 pr-2 pl-5 text-white shadow-brut">
      <p className="mr-auto font-semibold">{lieux} sélectionné{nombre > 1 ? "s" : ""}</p>
      {erreur && <p role="alert" className="text-sm font-semibold text-tomate">{erreur}</p>}
      <Bouton petit icone={Globe} chargement={enCours === "publie"} onClick={() => changerStatut("publie", "en ligne")}>Mettre en ligne</Bouton>
      <Bouton petit icone={FilePen} chargement={enCours === "brouillon"} onClick={() => changerStatut("brouillon", "passés en brouillon")}>Brouillon</Bouton>
      <Bouton petit icone={EyeOff} chargement={enCours === "masque"} onClick={() => changerStatut("masque", "masqués")}>Masquer</Bouton>
      <Bouton petit icone={Pencil} onClick={() => setFenetre("modifier")}>Modifier…</Bouton>
      <Bouton petit variante="danger" icone={Trash2} onClick={() => setFenetre("supprimer")}>Supprimer</Bouton>
      <button type="button" onClick={onVider} aria-label="Tout désélectionner" title="Tout désélectionner (Échap)" className="rounded-full p-2 text-white/70 hover:bg-white/10 hover:text-white">
        <X className="size-4" aria-hidden />
      </button>

      {fenetre === "modifier" && (
        <ModaleModifierLieux
          nombre={nombre}
          onFermer={() => setFenetre(null)}
          onValider={(modification) => agir("modifier", () => modifierLieuxEnLot(ids, modification), (n) => `${n} lieu${n > 1 ? "x" : ""} modifié${n > 1 ? "s" : ""} ✅`)}
        />
      )}
      <Modale
        titre={`Supprimer ${lieux} ?`}
        ouverte={fenetre === "supprimer"}
        onFermer={() => setFenetre(null)}
        actions={
          <>
            <Bouton onClick={() => setFenetre(null)}>Annuler</Bouton>
            <Bouton
              variante="danger"
              icone={Trash2}
              chargement={enCours === "supprimer"}
              onClick={() => agir("supprimer", () => supprimerLieuxEnLot(ids), (n) => `${n} lieu${n > 1 ? "x" : ""} supprimé${n > 1 ? "s" : ""}`)}
            >
              Supprimer pour de bon
            </Bouton>
          </>
        }
      >
        <p>
          {choisis.slice(0, 6).map((lieu) => lieu.nom).join(", ")}{nombre > 6 ? `… et ${nombre - 6} autre(s)` : ""} disparaissent
          {publications > 0 ? <>, avec <strong>{publications} publication{publications > 1 ? "s" : ""}</strong> et leurs fichiers</> : null}, et tout ce
          qui leur est lié dans l'app (visites, rescousses, cartes de fidélité, SOS).
        </p>
        <p className="mt-2 text-sm text-gris">Pour les cacher sans rien perdre, utilise plutôt « Masquer ».</p>
      </Modale>
    </div>
  );
}
