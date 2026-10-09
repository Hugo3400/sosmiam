import { FileUp, Plus, Search } from "lucide-react";
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
import { compterValeursLieux } from "~/fonctions/lieux/compter-valeurs-lieux.ts";
import { filtrerLieux } from "~/fonctions/lieux/filtrer-lieux.ts";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { listerLieux, type StatutLieu } from "~/services/lieux.ts";
import { BandeauSuggestions } from "./BandeauSuggestions.tsx";
import { BarreSelectionLieux } from "./BarreSelectionLieux.tsx";
import { CarteGeographiqueLieux } from "./CarteGeographiqueLieux.tsx";
import { CarteLieu } from "./CarteLieu.tsx";
import { FormulaireLieu } from "./FormulaireLieu.tsx";
import { ModaleImportLieux } from "./ModaleImportLieux.tsx";
import { PanneauControleLieux } from "./PanneauControleLieux.tsx";

/** Fiches par page (2 ou 3 par ligne selon la largeur : 30 remplit les deux) */
const PAR_PAGE = 30;

/**
 * Les fiches des lieux : liste par pages, recherche, filtres (statut, type, ville, catégorie), sélection de plusieurs fiches (sur
 * toutes les pages), et la fiche complète à créer ou modifier.
 */
export function EcranLieux({ ouvrir, allerA }: { ouvrir?: { id: number } | null; allerA?: (ecran: Ecran, id: number | null) => void }) {
  const [statut, setStatut] = useState<StatutLieu | "">("");
  const [saisie, setSaisie] = useState("");
  const [recherche, setRecherche] = useState("");
  const [type, setType] = useState("");
  const [categorie, setCategorie] = useState("");
  const [ville, setVille] = useState("");
  const [qualite, setQualite] = useState<"" | "a-completer" | "complete">("");
  const [pro, setPro] = useState<"" | "verifies" | "non-verifies">("");
  const [vue, setVue] = useState<"liste" | "carte" | "controle">("liste");
  const [importOuvert, setImport] = useState(false);
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
  // Chaque liste compte les lieux qui répondent aux autres filtres (choisir « Bar » ne montre que les villes qui en ont)
  const sansType = filtrerLieux(tous, { type: "", categorie, ville, qualite, pro });
  const sansCategorie = filtrerLieux(tous, { type, categorie: "", ville, qualite, pro });
  const sansVille = filtrerLieux(tous, { type, categorie, ville: "", qualite, pro });
  const sansQualite = filtrerLieux(tous, { type, categorie, ville, pro });
  const sansPro = filtrerLieux(tous, { type, categorie, ville, qualite });
  const verifies = sansPro.filter((lieu) => lieu.verifie).length;
  const aCompleter = sansQualite.filter((lieu) => lieu.manques.length > 0).length;
  const categories = compterValeursLieux(sansCategorie, "info", categorie);
  const villes = compterValeursLieux(sansVille, "ville", ville);
  const lieux = filtrerLieux(tous, { type, categorie, ville, qualite, pro });
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
  useEffect(() => setPage(1), [recherche, statut, type, categorie, ville, qualite, pro]);
  useEffect(() => setPage((avant) => Math.min(avant, pages)), [pages]);
  // La sélection ne garde que les lieux encore affichés (après un filtre ou une suppression), toutes pages comprises
  useEffect(() => {
    setChoisis((avant) => new Set([...avant].filter((id) => lieux.some((lieu) => lieu.id === id))));
  }, [donnees, type, categorie, ville, qualite, pro]);
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
    // Fiche suivante et précédente : dans l'ordre de la liste filtrée (toutes pages), pour enchaîner les fiches à compléter
    const rang = ouvert === "nouveau" ? -1 : lieux.findIndex((lieu) => lieu.id === ouvert);
    const voisin = (decalage: number) => (rang >= 0 && lieux[rang + decalage] ? () => setOuvert(lieux[rang + decalage]!.id) : null);
    return (
      <FormulaireLieu
        key={ouvert}
        id={ouvert === "nouveau" ? null : ouvert}
        allerA={allerA}
        onFermer={() => { setOuvert(null); recharger(); }}
        navigation={rang >= 0 ? { position: `${rang + 1} / ${lieux.length}`, precedente: voisin(-1), suivante: voisin(1) } : undefined}
        manques={rang >= 0 ? lieux[rang]!.manques : undefined}
      />
    );
  }
  const tousChoisis = lieux.length > 0 && lieux.every((lieu) => choisis.has(lieu.id));
  return (
    <>
      <EnTeteEcran
        titre="Lieux"
        sousTitre="Les fiches des restos, pâtisseries, bars et sorties. Seuls les lieux « En ligne » seront montrés dans l'app."
        actions={
          <>
            <Bouton icone={FileUp} onClick={() => setImport(true)}>Importer un CSV</Bouton>
            <Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Nouveau lieu</Bouton>
          </>
        }
      />
      <BandeauSuggestions onOuvrir={setOuvert} />
      <div className="mb-5 flex flex-wrap items-end gap-4">
        <Champ libelle={<span className="inline-flex items-center gap-1"><Search className="size-3.5" aria-hidden /> Recherche</span>} valeur={saisie} onChange={setSaisie} placeholder="Nom, ville, quartier…" className="w-72" />
        <Onglets
          libelle="Statut"
          valeur={statut}
          onChange={setStatut}
          options={[{ valeur: "", libelle: "Tous" }, ...Object.entries(STATUTS_LIEU).map(([valeur, { libelle }]) => ({ valeur: valeur as StatutLieu, libelle }))]}
        />
        <div className="flex basis-full flex-wrap items-end gap-4">
          <Selecteur
            libelle="Type"
            valeur={type}
            onChange={setType}
            options={[
              { valeur: "", libelle: `Tous les types (${sansType.length})` },
              ...Object.entries(TYPES_LIEU).map(([valeur, libelle]) => ({ valeur, libelle: `${libelle} (${sansType.filter((lieu) => lieu.type === valeur).length})` })),
            ]}
            className="w-48"
          />
          <Selecteur
            libelle="Ville"
            valeur={ville}
            onChange={setVille}
            options={[
              { valeur: "", libelle: `Toutes les villes (${sansVille.length})` },
              ...villes.map(({ libelle, nombre }) => ({ valeur: libelle, libelle: `${libelle} (${nombre})` })),
            ]}
            className="w-56"
          />
          <Selecteur
            libelle="Catégorie"
            valeur={categorie}
            onChange={setCategorie}
            options={[
              { valeur: "", libelle: `Toutes (${sansCategorie.length})` },
              ...categories.map(({ libelle, nombre }) => ({ valeur: libelle, libelle: `${libelle} (${nombre})` })),
            ]}
            className="w-60"
          />
          <Selecteur
            libelle="Fiche"
            valeur={qualite}
            onChange={setQualite}
            options={[
              { valeur: "", libelle: `Toutes les fiches (${sansQualite.length})` },
              { valeur: "a-completer", libelle: `À compléter (${aCompleter})` },
              { valeur: "complete", libelle: `Complètes (${sansQualite.length - aCompleter})` },
            ]}
            className="w-52"
          />
          <Selecteur
            libelle="Compte pro"
            valeur={pro}
            onChange={setPro}
            options={[
              { valeur: "", libelle: `Tous (${sansPro.length})` },
              { valeur: "verifies", libelle: `Vérifiés ✓ (${verifies})` },
              { valeur: "non-verifies", libelle: `Non vérifiés (${sansPro.length - verifies})` },
            ]}
            className="w-48"
          />
        </div>
      </div>
      <div ref={haut} className="mb-3 flex scroll-mt-6 flex-wrap items-center gap-x-5 gap-y-2">
        <Onglets
          libelle="Vue"
          valeur={vue}
          onChange={setVue}
          options={[{ valeur: "liste", libelle: "Liste" }, { valeur: "carte", libelle: "Carte" }, { valeur: "controle", libelle: "Contrôle" }]}
        />
        {donnees && <p className="text-sm text-gris">{lieux.length} lieu{lieux.length > 1 ? "x" : ""}{lieux.length !== tous.length ? ` sur ${tous.length}` : ""}</p>}
        {vue === "liste" && lieux.length > 0 && (
          <CaseACocher
            libelle={tousChoisis ? "Tout désélectionner" : `Tout sélectionner (${lieux.length})`}
            coche={tousChoisis}
            onChange={(coche) => setChoisis(coche ? new Set(lieux.map((lieu) => lieu.id)) : new Set())}
          />
        )}
        {vue === "liste" && <div className="ml-auto"><Pagination page={page} parPage={PAR_PAGE} total={lieux.length} onChange={changerPage} /></div>}
      </div>
      {message && <p role="status" className="mb-4 rounded-xl bg-vert-clair px-4 py-2 text-sm font-semibold text-vert">{message}</p>}
      <MessageErreur erreur={erreur} reessayer={recharger} />
      {!donnees && chargement && <Chargement />}
      {donnees && vue === "carte" && <CarteGeographiqueLieux lieux={lieux} onOuvrir={setOuvert} />}
      {donnees && vue === "controle" && <PanneauControleLieux tous={lieux} onOuvrir={setOuvert} />}
      {donnees && vue === "liste" && lieux.length === 0 && (
        <Carte>
          <EtatVide emoji="🏪" titre={recherche || statut || type || categorie || ville || qualite || pro ? "Aucun lieu ne correspond" : "Pas encore de lieu"} action={<Bouton variante="principal" icone={Plus} onClick={() => setOuvert("nouveau")}>Créer le premier</Bouton>}>
            Chaque fiche décrit un lieu indépendant : son histoire, son plat signature, ses horaires. Les publications du fil s'y rattachent.
          </EtatVide>
        </Carte>
      )}
      {vue === "liste" && lieux.length > 0 && (
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
      {vue === "liste" && lieux.length > PAR_PAGE && <div className="mt-4"><Pagination page={page} parPage={PAR_PAGE} total={lieux.length} onChange={changerPage} /></div>}
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
      {importOuvert && <ModaleImportLieux onFermer={() => setImport(false)} onImporte={(bilan) => { setImport(false); setMessage(bilan); recharger(); }} />}
    </>
  );
}
