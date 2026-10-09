import { FileUp, Upload } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { LIBELLES_CHAMPS_LIEU } from "~/contenus/champs-lieu.ts";
import { TYPES_LIEU } from "~/contenus/statuts-lieu.ts";
import { convertirLignesLieux } from "~/fonctions/lieux/convertir-lignes-lieux.ts";
import { lireCsv } from "~/fonctions/lieux/lire-csv.ts";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { importerLieux, verifierImportLieux, type LigneImportVerifiee } from "~/services/lieux.ts";

const MAX_LIGNES = 500;
const PAQUET = 50;
type Apercu = { lieux: Record<string, unknown>[]; verifiees: LigneImportVerifiee[]; reconnues: string[]; ignorees: string[]; tronque: boolean };

/** Une ligne est cochée d'office si elle est valable, pas déjà en base, et la première de ses doublons dans le fichier */
const cocherDOffice = (verifiees: LigneImportVerifiee[]) =>
  new Set(verifiees.flatMap((ligne, index) => (ligne.ok && ligne.semblables.length === 0 && ligne.dansLeFichier.every((autre) => autre > index) ? [index] : [])));

/**
 * Importer des lieux depuis un fichier CSV (export d'un tableur) : colonnes reconnues par leur nom, aperçu ligne par
 * ligne (valable ou non, déjà en base, en double dans le fichier), puis création en brouillon, par paquets de 50.
 */
export function ModaleImportLieux({ onFermer, onImporte }: { onFermer: () => void; onImporte: (bilan: string) => void }) {
  const [apercu, setApercu] = useState<Apercu | null>(null);
  const [coches, setCoches] = useState<Set<number>>(new Set());
  const [etat, setEtat] = useState<{ enCours: boolean; texte: string | null }>({ enCours: false, texte: null });

  async function lireFichier(fichier: File | undefined) {
    if (!fichier) return;
    setEtat({ enCours: true, texte: null });
    try {
      const { lieux, reconnues, ignorees } = convertirLignesLieux(lireCsv(await fichier.text()));
      if (!reconnues.length || !lieux.length) throw new Error("vide");
      const gardes = lieux.slice(0, MAX_LIGNES);
      const verifiees = await verifierImportLieux(gardes);
      setApercu({ lieux: gardes, verifiees, reconnues, ignorees, tronque: lieux.length > MAX_LIGNES });
      setCoches(cocherDOffice(verifiees));
      setEtat({ enCours: false, texte: null });
    } catch (probleme) {
      setEtat({ enCours: false, texte: probleme instanceof ErreurApi ? expliquerErreur(probleme) : "Ce fichier ne ressemble pas à un CSV de lieux : il faut une première ligne avec au moins « Nom » et « Ville »." });
    }
  }

  async function importer() {
    if (!apercu) return;
    const choisis = apercu.lieux.filter((_, index) => coches.has(index));
    setEtat({ enCours: true, texte: null });
    let crees = 0;
    let placees = 0;
    try {
      for (let debut = 0; debut < choisis.length; debut += PAQUET) {
        setEtat({ enCours: true, texte: `Import en cours : ${debut} / ${choisis.length}…` });
        const resultat = await importerLieux(choisis.slice(debut, debut + PAQUET));
        crees += resultat.crees;
        placees += resultat.placees;
      }
      onImporte(`${crees} fiche(s) importée(s) en brouillon, dont ${placees} placée(s) sur la carte grâce à leur adresse. Le contrôle qualité dit quoi compléter.`);
    } catch (probleme) {
      const bilan = crees ? `${crees} fiche(s) déjà importée(s), puis : ` : "";
      setEtat({ enCours: false, texte: bilan + expliquerErreur(probleme instanceof ErreurApi ? probleme : null) });
    }
  }

  const etatLigne = (ligne: LigneImportVerifiee) =>
    !ligne.ok ? `❌ ${LIBELLES_CHAMPS_LIEU[ligne.champ ?? ""] ?? ligne.champ} à corriger`
      : ligne.semblables.length ? `👯 déjà en base : ${ligne.semblables.map((s) => s.nom).join(", ")}`
        : ligne.dansLeFichier.length ? `👯 aussi ligne ${ligne.dansLeFichier.map((i) => i + 2).join(", ")}`
          : "✅ prête";

  return (
    <Modale
      large
      titre="Importer des lieux (CSV)"
      ouverte
      onFermer={onFermer}
      actions={
        <>
          <Bouton onClick={onFermer}>Annuler</Bouton>
          {apercu && <Bouton variante="principal" icone={Upload} chargement={etat.enCours} desactive={coches.size === 0} onClick={importer}>Importer {coches.size} lieu{coches.size > 1 ? "x" : ""} en brouillon</Bouton>}
        </>
      }
    >
      <div className="grid gap-4">
        <p className="text-sm text-gris">
          Un fichier CSV avec une première ligne de titres : <strong>Nom</strong> et <strong>Ville</strong> obligatoires ; aussi reconnus : Type, Catégorie, Adresse,
          Quartier, Latitude, Longitude, Horaires, Plat, Téléphone, Site web, Instagram, Prix, Présentation. Les lieux arrivent en brouillon.
        </p>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-full border-2 border-encre px-4 py-2 text-sm font-bold">
          <FileUp className="size-4" aria-hidden /> Choisir le fichier CSV
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(evenement) => void lireFichier(evenement.target.files?.[0])} />
        </label>
        {apercu && (
          <>
            <p className="text-sm">
              Colonnes reconnues : <strong>{apercu.reconnues.join(", ")}</strong>
              {apercu.ignorees.length > 0 && <span className="text-gris"> · ignorées : {apercu.ignorees.join(", ")}</span>}
              {apercu.tronque && <span className="font-semibold"> · seulement les {MAX_LIGNES} premières lignes (importe le reste ensuite)</span>}
            </p>
            <div className="max-h-[50vh] overflow-auto rounded-xl border border-ligne">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-white text-left text-gris">
                  <tr><th className="px-3 py-2"><span className="sr-only">Importer</span></th><th className="px-3 py-2">Ligne</th><th className="px-3 py-2">Nom</th><th className="px-3 py-2">Ville</th><th className="px-3 py-2">Type</th><th className="px-3 py-2">État</th></tr>
                </thead>
                <tbody>
                  {apercu.lieux.map((lieu, index) => (
                    <tr key={index} className="border-t border-ligne/70">
                      <td className="px-3 py-1.5">
                        <CaseACocher
                          libelle={<span className="sr-only">Importer la ligne {index + 2}</span>}
                          coche={coches.has(index)}
                          onChange={(coche) => setCoches((avant) => { const suivant = new Set(avant); if (coche && apercu.verifiees[index]?.ok) suivant.add(index); else suivant.delete(index); return suivant; })}
                        />
                      </td>
                      <td className="chiffres px-3 py-1.5 text-gris">{index + 2}</td>
                      <td className="px-3 py-1.5 font-semibold">{String(lieu.nom ?? "—")}</td>
                      <td className="px-3 py-1.5">{String(lieu.ville ?? "—")}</td>
                      <td className="px-3 py-1.5">{TYPES_LIEU[String(lieu.type ?? "resto")] ?? String(lieu.type)}</td>
                      <td className="px-3 py-1.5">{apercu.verifiees[index] ? etatLigne(apercu.verifiees[index]!) : "…"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
        {etat.texte && <p role="status" className="text-sm font-semibold">{etat.texte}</p>}
      </div>
    </Modale>
  );
}
