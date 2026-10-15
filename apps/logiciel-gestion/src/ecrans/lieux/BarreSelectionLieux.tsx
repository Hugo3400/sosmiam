import { EyeOff, FilePen, Globe, Pencil, Trash2, X } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { decouperEnPaquets } from "~/fonctions/lieux/decouper-en-paquets.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterNombre } from "~/fonctions/texte/formater-nombre.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { modifierLieuxEnLot, supprimerLieuxEnLot, type ModificationLot, type ResumeLieu } from "~/services/lieux.ts";
import { ModaleModifierLieux } from "./ModaleModifierLieux.tsx";

type Props = { choisis: ResumeLieu[]; onVider: () => void; onFait: (message: string) => void };

/** L'API prend au plus 500 lieux par envoi ; une suppression efface aussi des fichiers, d'où des paquets plus petits */
const PAQUET_MODIFICATION = 500;
const PAQUET_SUPPRESSION = 100;

/** Barre collée en bas de l'écran quand des lieux sont sélectionnés : changer leur statut, les modifier, les supprimer. */
export function BarreSelectionLieux({ choisis, onVider, onFait }: Props) {
  const [fenetre, setFenetre] = useState<"modifier" | "supprimer" | null>(null);
  const [enCours, setEnCours] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  const [avancement, setAvancement] = useState<{ faits: number; total: number } | null>(null);
  const idsChoisis = choisis.map((lieu) => lieu.id);
  // Un lieu sans position ne se met pas en ligne : l'app ne saurait pas dire s'il est proche (« Autour de moi »)
  const sansPosition = choisis.filter((lieu) => lieu.latitude === null || lieu.longitude === null).length;
  const publiables = choisis.filter((lieu) => lieu.latitude !== null && lieu.longitude !== null).map((lieu) => lieu.id);
  const nombre = choisis.length;
  const lieux = `${formaterNombre(nombre)} lieu${nombre > 1 ? "x" : ""}`;
  const publications = choisis.reduce((total, lieu) => total + lieu._count.publications, 0);

  /** Envoie la sélection par paquets, l'un après l'autre ; s'arrête au premier refus en disant ce qui est déjà fait */
  async function agir(nom: string, taille: number, action: (paquet: number[]) => Promise<{ nombre: number }>, message: (n: number) => string, ids = idsChoisis) {
    setEnCours(nom);
    setErreur(null);
    let faits = 0;
    let envoyes = 0;
    try {
      for (const paquet of decouperEnPaquets(ids, taille)) {
        if (ids.length > taille) setAvancement({ faits: envoyes, total: ids.length });
        faits += (await action(paquet)).nombre;
        envoyes += paquet.length;
      }
      setFenetre(null);
      onFait(message(faits));
    } catch (probleme) {
      const raison = expliquerErreur(probleme instanceof ErreurApi ? probleme : null);
      setErreur(envoyes > 0 ? `${formaterNombre(envoyes)} lieux traités sur ${formaterNombre(ids.length)}, puis : ${raison}` : raison);
    } finally {
      setEnCours(null);
      setAvancement(null);
    }
  }
  const pluriel = (n: number) => `${formaterNombre(n)} lieu${n > 1 ? "x" : ""}`;
  const changerStatut = (statut: NonNullable<ModificationLot["statut"]>, libelle: string) =>
    agir(statut, PAQUET_MODIFICATION, (paquet) => modifierLieuxEnLot(paquet, { statut }), (n) => `${pluriel(n)} ${libelle} ✅`);
  function mettreEnLigne() {
    if (publiables.length === 0) return setErreur("Aucun de ces lieux n'a de position : ajoute-la dans la fiche (ou dans « Contrôle », « Sans position »).");
    const laisses = sansPosition ? ` · ${pluriel(sansPosition)} sans position laissé${sansPosition > 1 ? "s" : ""} de côté (voir « Contrôle »)` : "";
    void agir("publie", PAQUET_MODIFICATION, (paquet) => modifierLieuxEnLot(paquet, { statut: "publie" }), (n) => `${pluriel(n)} en ligne ✅${laisses}`, publiables);
  }

  return (
    <div className="sticky bottom-4 z-20 mt-6 flex flex-wrap items-center gap-2 rounded-full border-2 border-encre bg-nuit py-2 pr-2 pl-5 text-white shadow-brut">
      <p className="mr-auto font-semibold">{lieux} sélectionné{nombre > 1 ? "s" : ""}</p>
      {avancement && <p role="status" className="chiffres text-sm text-white/80">{formaterNombre(avancement.faits)} / {formaterNombre(avancement.total)}…</p>}
      {erreur && <p role="alert" className="text-sm font-semibold text-tomate">{erreur}</p>}
      <Bouton petit icone={Globe} chargement={enCours === "publie"} titre={sansPosition ? `${sansPosition} sans position ne seront pas mis en ligne` : undefined} onClick={mettreEnLigne}>Mettre en ligne</Bouton>
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
          onValider={(modification) => agir("modifier", PAQUET_MODIFICATION, (paquet) => modifierLieuxEnLot(paquet, modification), (n) => `${pluriel(n)} modifié${n > 1 ? "s" : ""} ✅`)}
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
              onClick={() => agir("supprimer", PAQUET_SUPPRESSION, (paquet) => supprimerLieuxEnLot(paquet), (n) => `${pluriel(n)} supprimé${n > 1 ? "s" : ""}`)}
            >
              Supprimer pour de bon
            </Bouton>
          </>
        }
      >
        <p>
          {choisis.slice(0, 6).map((lieu) => lieu.nom).join(", ")}{nombre > 6 ? `… et ${nombre - 6} autre(s)` : ""} disparaissent
          {publications > 0 ? <>, avec <strong>{publications} publication{publications > 1 ? "s" : ""}</strong> et leurs fichiers</> : null}, et tout ce
          qui leur est lié dans l'app (visites, rescousses, cartes de fidélité, SOS, sorties proposées, places dans les listes).
        </p>
        <p className="mt-2 text-sm text-gris">Pour les cacher sans rien perdre, utilise plutôt « Masquer ».</p>
      </Modale>
    </div>
  );
}
