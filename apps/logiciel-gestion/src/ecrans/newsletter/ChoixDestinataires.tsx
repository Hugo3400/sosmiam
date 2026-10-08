import { Search } from "lucide-react";
import { useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import type { Destinataire, PublicEnvoi } from "~/services/courriels.ts";

type Props = {
  cible: PublicEnvoi;
  onCible: (cible: PublicEnvoi) => void;
  destinataires: Destinataire[] | null;
  /** Adresses décochées (tout le public est coché au départ) */
  decoches: Set<string>;
  onDecoches: (decoches: Set<string>) => void;
  villes: string[];
  synchronisee: boolean;
};

const NEWSLETTER: PublicEnvoi = { public: "newsletter", ville: "", candidats: false, beta: false, telephone: "" };
const AMBASSADEURS: PublicEnvoi = { public: "ambassadeurs", statut: "actif", ville: "" };

/** À qui envoyer : le public (inscrits ou ambassadeurs), ses filtres, puis la liste exacte, à cocher une par une. */
export function ChoixDestinataires({ cible, onCible, destinataires, decoches, onDecoches, villes, synchronisee }: Props) {
  const [recherche, setRecherche] = useState("");
  const liste = destinataires ?? [];
  const visibles = recherche ? liste.filter((d) => `${d.adresse} ${d.ville} ${d.detail}`.toLowerCase().includes(recherche.toLowerCase())) : liste;
  const coches = liste.filter((d) => !decoches.has(d.adresse)).length;
  const basculer = (adresse: string, coche: boolean) => {
    const suivant = new Set(decoches);
    if (coche) suivant.delete(adresse);
    else suivant.add(adresse);
    onDecoches(suivant);
  };

  return (
    <section className="grid gap-3">
      <Onglets
        libelle="Public"
        valeur={cible.public}
        onChange={(valeur) => onCible(valeur === "newsletter" ? NEWSLETTER : AMBASSADEURS)}
        options={[{ valeur: "newsletter", libelle: "Inscrits à la newsletter" }, { valeur: "ambassadeurs", libelle: "Ambassadeurs" }]}
      />
      <div className="flex flex-wrap items-end gap-3">
        <Champ libelle="Ville" valeur={cible.ville} onChange={(ville) => onCible({ ...cible, ville })} placeholder="Toutes" list="villes-envoi" className="w-48" />
        <datalist id="villes-envoi">{villes.map((ville) => <option key={ville} value={ville} />)}</datalist>
        {cible.public === "newsletter" ? (
          <>
            <Selecteur
              libelle="Téléphone"
              valeur={cible.telephone}
              onChange={(telephone) => onCible({ ...cible, telephone })}
              options={[{ valeur: "", libelle: "Tous" }, { valeur: "iphone", libelle: "iPhone" }, { valeur: "android", libelle: "Android" }]}
              className="w-36"
            />
            <div className="grid gap-1 pb-1">
              <CaseACocher libelle="Candidats ambassadeurs" coche={cible.candidats} onChange={(candidats) => onCible({ ...cible, candidats })} />
              <CaseACocher libelle="Bêta-testeurs" coche={cible.beta} onChange={(beta) => onCible({ ...cible, beta })} />
            </div>
          </>
        ) : (
          <Selecteur
            libelle="Statut"
            valeur={cible.statut}
            onChange={(statut) => onCible({ ...cible, statut })}
            options={[{ valeur: "actif", libelle: "Actifs seulement" }, { valeur: "tous", libelle: "Tous, sauf refusés" }]}
            className="w-48"
          />
        )}
      </div>
      {!synchronisee && cible.public === "newsletter" && (
        <p className="rounded-xl bg-jaune-clair px-3 py-2 text-sm font-semibold">
          La liste des inscrits n'a jamais été synchronisée avec la boîte mail : fais-le une fois dans « Inscrits » pour la voir ici.
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <p className="flex-1 text-sm font-semibold">
          {destinataires === null ? "Chargement…" : `${coches} destinataire${coches > 1 ? "s" : ""} coché${coches > 1 ? "s" : ""} sur ${liste.length}`}
        </p>
        <Bouton petit variante="discret" desactive={decoches.size === 0} onClick={() => onDecoches(new Set())}>Tout cocher</Bouton>
        <Bouton petit variante="discret" desactive={coches === 0} onClick={() => onDecoches(new Set(liste.map((d) => d.adresse)))}>Tout décocher</Bouton>
      </div>
      {liste.length > 8 && (
        <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Chercher dans la liste</span>} valeur={recherche} onChange={setRecherche} className="w-72" />
      )}
      <ul className="grid max-h-64 overflow-y-auto rounded-xl border border-ligne">
        {visibles.map((d) => (
          <li key={d.adresse} className="flex items-center gap-3 border-b border-ligne/70 px-3 py-1.5 text-sm last:border-0">
            <input
              type="checkbox"
              aria-label={`Envoyer à ${d.adresse}`}
              checked={!decoches.has(d.adresse)}
              onChange={(e) => basculer(d.adresse, e.target.checked)}
              className="size-4 accent-encre"
            />
            <span className="min-w-0 flex-1 truncate font-semibold">{d.adresse}</span>
            <span className="w-32 truncate text-gris">{d.ville || "—"}</span>
            <span className="w-48 truncate text-gris">{d.detail}</span>
          </li>
        ))}
        {destinataires !== null && visibles.length === 0 && <li className="px-3 py-3 text-sm text-gris">Personne ne correspond à ces filtres.</li>}
      </ul>
    </section>
  );
}
