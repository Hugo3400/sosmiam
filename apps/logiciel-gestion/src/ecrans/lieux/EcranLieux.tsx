import { Plus, Search } from "lucide-react";
import { useEffect, useRef, useState, type MouseEvent } from "react";

import type { Ecran } from "~/contenus/menu.ts";
import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { CaseACocher } from "~/composants/interface/CaseACocher.tsx";
import { Champ } from "~/composants/interface/Champ.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { EtatVide } from "~/composants/interface/EtatVide.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { Pagination } from "~/composants/interface/Pagination.tsx";
import { Selecteur } from "~/composants/interface/Selecteur.tsx";
import { EnTeteEcran } from "~/composants/mise-en-page/EnTeteEcran.tsx";
import { STATUTS_LIEU, TYPES_LIEU } from "~/contenus/statuts-lieu.ts";
import { compterCategoriesLieux } from "~/fonctions/lieux/compter-categories-lieux.ts";
import { filtrerLieux } from "~/fonctions/lieux/filtrer-lieux.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerLieux, type StatutLieu } from "~/services/lieux.ts";
import { BarreSelectionLieux } from "./BarreSelectionLieux.tsx";
import { CarteLieu } from "./CarteLieu.tsx";
import { FormulaireLieu } from "./FormulaireLieu.tsx";

/** Fiches par page (2 ou 3 par ligne selon la largeur : 30 remplit les deux) */
const PAR_PAGE = 30;

/**
 * Les fiches des lieux : liste par pages, recherche, filtres (statut, type, catégorie), sélection de plusieurs fiches (sur
 * toutes les pages), et la fiche complète à créer ou modifier.
 */
export function EcranLieux({ ouvrir, allerA }: { ouvrir?: { id: number } | null; allerA?: (ecran: Ecran, id: number | null) => void }) {
  const [statut, setStatut] = useState<StatutLieu | "">("");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [type, setType] = useState("");
  const [categorie, setCategorie] = useState("");
  const [page, setPage] = useState(1);
  const haut = useRef<HTMLDivElement>(null);
  const [ouvert, setOuvert] = useState<number | "nouveau" | null>(null);
  // Ouvert depuis ailleurs (recherche Ctrl+K…) sur un élément précis
  useEffect(() => {
    if (ouvrir) setOuvert(ouvrir.id);
  }, [ouvrir]);
  const [choisis, setChoisis] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState<string | null>(null);
  const dernierCoche = useRef<number | null>(null);
  const { donnees, erreur, chargement, recharger } = utiliserChargement(() => listerLieux(recherche, statut), [recherche, statut]);
  const tous = donnees ?? [];
  const duType = filtrerLieux(tous, { type, categorie: "" });
  const categories = compterCategoriesLieux(duType);
  const lieux = filtrerLieux(duType, { type: "", categorie });
  const pages = Math.max(1, Math.ceil(lieux.length / PAR_PAGE));
  const pageLieux = lieux.slice((page - 1) * PAR_PAGE, page * PAR_PAGE);
  const changerPage = (nouvelle: number) => {
    setPage(nouvelle);
    haut.current?.scrollIntoView({ block: "start" });
  };

  useEffect(() => {
    const minuteur = setTimeout(() => setRecherche(saisie), 300);
    return () => clearTimeout(minuteur);
  }, [saisie]);
  // Un nouveau filtre repart de la première page ; après une suppression, la page reste dans les bornes
  useEffect(() => setPage(1), [recherche, statut, type, categorie]);
  useEffect(() => setPage((avant) => Math.min(avant, pages)), [pages]);
  // La sélection ne garde que les lieux encore affichés (après un filtre ou une suppression), toutes pages comprises
  useEffect(() => {
    setChoisis((avant) => new Set([...avant].filter((id) => lieux.some((lieu) => lieu.id === id))));
  }, [donnees, type, categorie]);
  // Échap : tout désélectionner
  useEffect(() => {
    const touche = (evenement: KeyboardEvent) => evenement.key === "Escape" && !document.querySelector("dialog[open]") && setChoisis(new Set());
    window.addEventListener("keydown", touche);
    return () => window.removeEventListener("keydown", touche);
  }, []);

  /** Coche ou décoche un lieu ; Maj + clic coche toute la plage depuis le dernier lieu coché. */
  function cocher(id: number, evenement: MouseEvent) {
    const index = lieux.findIndex((lieu) => lieu.id === id);
    const depuis = lieux.findIndex((lieu) => lieu.id === dernierCoche.current);
    setChoisis((avant) => {
      const suivant = new Set(avant);
      if (evenement.shiftKey && depuis >= 0) {
        for (const lieu of lieux.slice(Math.min(depuis, index), Math.max(depuis, index) + 1)) suivant.add(lieu.id);
      } else if (suivant.has(id)) suivant.delete(id);
      else suivant.add(id);
      return suivant;
    });
    dernierCoche.current = id;
  }

  if (ouvert !== null) {
    return <FormulaireLieu id={ouvert === "nouveau" ? null : ouvert} allerA={allerA} onFermer={() => { setOuvert(null); recharger(); }} />;
  }
  const tousChoisis = lieux.length > 0 && lieux.every((lieu) => choisis.has(lieu.id));
  return (
    <>
      <EnTeteEcran
        titre="Lieux"
        sousTitre="Les fiches des restos, pâtisseries, bars et sorties. Seuls les lieux « En ligne » seront montrés dans l'app."
        actions={<Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Nouveau lieu</Bouton>}
      />
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Recherche</span>} valeur={saisie} onChange={setSaisie} placeholder="Nom, ville, quartier…" className="w-72" />
        <Onglets
          libelle="Statut"
          valeur={statut}
          onChange={setStatut}
          options={[{ valeur: "", libelle: "Tous" }, ...Object.entries(STATUTS_LIEU).map(([valeur, { libelle }]) => ({ valeur: valeur as StatutLieu, libelle }))]}
        />
        <Selecteur
          libelle="Type"
          valeur={type}
          onChange={(nouveau) => {
            setType(nouveau);
            setCategorie("");
          }}
          options={[
            { valeur: "", libelle: `Tous les types (${tous.length})` },
            ...Object.entries(TYPES_LIEU).map(([valeur, libelle]) => ({ valeur, libelle: `${libelle} (${tous.filter((lieu) => lieu.type === valeur).length})` })),
          ]}
          className="w-48"
        />
        <Selecteur
          libelle="Catégorie"
          valeur={categorie}
          onChange={setCategorie}
          options={[
            { valeur: "", libelle: `Toutes (${duType.length})` },
            ...categories.map(({ libelle, nombre }) => ({ valeur: libelle, libelle: `${libelle} (${nombre})` })),
          ]}
          className="w-60"
        />
        {lieux.length > 0 && (
          <div className="ml-auto pb-2">
            <CaseACocher
              libelle={tousChoisis ? "Tout désélectionner" : `Tout sélectionner (${lieux.length})`}
              coche={tousChoisis}
              onChange={(coche) => setChoisis(coche ? new Set(lieux.map((lieu) => lieu.id)) : new Set())}
            />
          </div>
        )}
      </div>
      <div ref={haut} className="mb-3 flex scroll-mt-6 flex-wrap items-center gap-3">
        {donnees && <p className="text-sm text-gris">{lieux.length} lieu{lieux.length > 1 ? "x" : ""}{lieux.length !== tous.length ? ` sur ${tous.length}` : ""}</p>}
        <div className="ml-auto"><Pagination page={page} parPage={PAR_PAGE} total={lieux.length} onChange={changerPage} /></div>
      </div>
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && lieux.length === 0 && (
        <Carte>
          <EtatVide emoji="🏪" titre={recherche || statut || type || categorie ? "Aucun lieu ne correspond" : "Pas encore de lieu"} action={<Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Créer le premier</Bouton>}>
            Chaque fiche décrit un lieu indépendant : son histoire, son plat signature, ses horaires. Les publications du fil s'y rattachent.
          </EtatVide>
        </Carte>
      )}
      {lieux.length > 0 && (
        <ul className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
          {pageLieux.map((lieu) => (
            <li key={lieu.id}>
              <CarteLieu
                lieu={lieu}
                choisi={choisis.has(lieu.id)}
                enSelection={choisis.size > 0}
                onCocher={(evenement) => cocher(lieu.id, evenement)}
                onOuvrir={() => setOuvert(lieu.id)}
              />
            </li>
          ))}
        </ul>
      )}
      {lieux.length > PAR_PAGE && <div className="mt-4"><Pagination page={page} parPage={PAR_PAGE} total={lieux.length} onChange={changerPage} /></div>}
      {choisis.size > 0 && (
        <BarreSelectionLieux
          choisis={lieux.filter((lieu) => choisis.has(lieu.id))}
          onVider={() => setChoisis(new Set())}
          onFait={(texte) => {
            setMessage(texte);
            setChoisis(new Set());
            recharger();
          }}
        />
      )}
    </>
  );
}
