import { useEffect, useRef, useState, type ReactNode } from "react";
import type { GeoJSONSource, Map as CarteMaplibre, MapLayerMouseEvent, MapLibreEvent } from "maplibre-gl";

import { AttributionCarte } from "~/composants/carte-des-lieux/AttributionCarte";
import { BoutonCarte } from "~/composants/carte-des-lieux/BoutonCarte";
import { ajouterCouchesLieux, COUCHES_LIEUX, filtrerLieuChoisi } from "~/composants/carte-des-lieux/couches-lieux";
import { mettreEtiquettesEnFrancais } from "~/composants/carte-des-lieux/etiquettes-en-francais";
import { IconeCarte } from "~/composants/carte-des-lieux/IconeCarte";
import { MessageCarte, type EtatCarte } from "~/composants/carte-des-lieux/MessageCarte";
import { CENTRE_FRANCE, STYLE_FOND_DE_CARTE, ZOOM_FRANCE, ZOOM_UN_LIEU, ZOOM_ZONE } from "~/composants/carte-des-lieux/reglages-carte-des-lieux";
import { TEXTES_CARTE_DES_LIEUX } from "~/contenus/carte-des-lieux";
import { arrondirPosition, type Position } from "~/fonctions/carte-des-lieux/arrondir-position";
import { calculerCadreEpingles } from "~/fonctions/carte-des-lieux/calculer-cadre-epingles";
import { creerDonneesGeojson } from "~/fonctions/carte-des-lieux/creer-donnees-geojson";
import { reecrireAdresseFondDeCarte } from "~/fonctions/carte-des-lieux/reecrire-adresse-fond-de-carte";
import { verifierWebgl } from "~/fonctions/carte-des-lieux/verifier-webgl";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { EpingleLieu } from "~/types/lieux";

type Props = {
  epingles: readonly EpingleLieu[];
  titre: string;
  lieuChoisi?: number | null;
  surChoix?: (id: number) => void;
  variante?: "plusieurs" | "un-seul";
  seulementSos?: boolean;
  meSituer?: boolean;
  gestesCooperatifs?: boolean;
  grand?: boolean;
  lienListe?: string;
  surDeplacement?: (centre: Position) => void;
  avantBoutons?: ReactNode;
  classeBoutons?: string;
  classeAttribution?: string;
  className?: string;
  children?: ReactNode;
};

type EvenementDeplacement = MapLibreEvent<MouseEvent | TouchEvent | WheelEvent | undefined> & { parPersonne?: boolean };

const T = TEXTES_CARTE_DES_LIEUX;
const PAR_PERSONNE = { parPersonne: true };
const DUREE_MESSAGE = 6000;
const MARGE_CADRE = { top: 110, right: 80, bottom: 70, left: 50 };

export function CarteDesLieux({
  epingles,
  titre,
  lieuChoisi = null,
  surChoix,
  variante = "plusieurs",
  seulementSos = false,
  meSituer = false,
  gestesCooperatifs = false,
  grand = false,
  lienListe,
  surDeplacement,
  avantBoutons,
  classeBoutons = "top-4 right-4",
  classeAttribution,
  className = "relative",
  children,
}: Props) {
  const conteneur = useRef<HTMLDivElement>(null);
  const carte = useRef<CarteMaplibre | null>(null);
  const [etat, setEtat] = useState<EtatCarte>("attente");
  const [message, setMessage] = useState("");
  const rappels = useRef({ surChoix, surDeplacement });
  rappels.current = { surChoix, surDeplacement };
  const dernieresEpingles = useRef<readonly EpingleLieu[] | null>(null);
  const unSeul = variante === "un-seul";

  useEffect(() => {
    if (!verifierWebgl()) return setEtat("sans-webgl");
    setEtat("chargement");
    let annule = false;
    let instance: CarteMaplibre | null = null;
    let styleRecu = false;
    import("~/composants/carte-des-lieux/charger-maplibre")
      .then(({ chargerMaplibre }) => {
        if (annule || !conteneur.current) return;
        const maplibre = chargerMaplibre();
        const nouvelle = new maplibre.Map({
          container: conteneur.current,
          style: STYLE_FOND_DE_CARTE,
          center: CENTRE_FRANCE,
          zoom: ZOOM_FRANCE,
          minZoom: 3,
          maxZoom: 18,
          attributionControl: false,
          locale: { ...T.maplibre, "Map.Title": titre },
          dragRotate: false,
          pitchWithRotate: false,
          touchPitch: false,
          cooperativeGestures: gestesCooperatifs,
          transformRequest: (adresse) => ({ url: reecrireAdresseFondDeCarte(adresse, window.location.origin) }),
        });
        instance = nouvelle;
        carte.current = nouvelle;
        nouvelle.touchZoomRotate.disableRotation();
        nouvelle.keyboard.disableRotation();
        nouvelle.on("styledata", () => {
          styleRecu = true;
        });
        nouvelle.once("style.load", () => mettreEtiquettesEnFrancais(nouvelle));
        nouvelle.on("error", () => {
          if (!styleRecu && !annule) setEtat("erreur");
        });
        nouvelle.on("load", () => {
          ajouterCouchesLieux(nouvelle, creerDonneesGeojson([], T.lettres), !unSeul);
          brancherEvenements(nouvelle);
          setEtat("prete");
        });
      })
      .catch(() => {
        if (!annule) setEtat("erreur");
      });
    return () => {
      annule = true;
      instance?.remove();
      carte.current = null;
    };
  }, []);

  useEffect(() => {
    const instance = carte.current;
    if (!instance || etat !== "prete") return;
    instance.getSource<GeoJSONSource>(COUCHES_LIEUX.source)?.setData(creerDonneesGeojson(epingles, T.lettres, seulementSos));
    if (dernieresEpingles.current === epingles) return;
    const premiere = dernieresEpingles.current === null;
    dernieresEpingles.current = epingles;
    cadrer(instance, !premiere);
  }, [epingles, seulementSos, etat]);

  useEffect(() => {
    const instance = carte.current;
    if (!instance || etat !== "prete") return;
    instance.setFilter(COUCHES_LIEUX.choisi, filtrerLieuChoisi(lieuChoisi));
    const cible = epingles.find((epingle) => epingle.id === lieuChoisi);
    if (cible && !instance.getBounds().contains([cible.longitude, cible.latitude])) {
      instance.flyTo({ center: [cible.longitude, cible.latitude], zoom: Math.max(instance.getZoom(), ZOOM_UN_LIEU) });
    }
  }, [lieuChoisi, epingles, etat]);

  useEffect(() => {
    if (!message) return;
    const minuteur = window.setTimeout(() => setMessage(""), DUREE_MESSAGE);
    return () => window.clearTimeout(minuteur);
  }, [message]);

  function cadrer(instance: CarteMaplibre, anime: boolean) {
    const choisie = epingles.find((epingle) => epingle.id === lieuChoisi) ?? (unSeul ? epingles[0] : undefined);
    if (choisie) {
      instance.jumpTo({ center: [choisie.longitude, choisie.latitude], zoom: ZOOM_UN_LIEU });
      return;
    }
    const cadre = calculerCadreEpingles(seulementSos ? epingles.filter((epingle) => epingle.sos) : epingles);
    if (cadre) instance.fitBounds(cadre, { padding: MARGE_CADRE, maxZoom: 14, animate: anime });
  }

  function brancherEvenements(instance: CarteMaplibre) {
    const toile = instance.getCanvas();
    instance.on("click", COUCHES_LIEUX.groupes, async (evenement: MapLayerMouseEvent) => {
      const groupe = evenement.features?.[0];
      const idGroupe = groupe?.properties?.cluster_id;
      const source = instance.getSource<GeoJSONSource>(COUCHES_LIEUX.source);
      if (!groupe || groupe.geometry.type !== "Point" || typeof idGroupe !== "number" || !source) return;
      const zoom = await source.getClusterExpansionZoom(idGroupe);
      const [longitude, latitude] = groupe.geometry.coordinates;
      instance.easeTo({ center: [longitude, latitude], zoom }, PAR_PERSONNE);
    });
    for (const couche of [COUCHES_LIEUX.points, COUCHES_LIEUX.lettres]) {
      instance.on("click", couche, (evenement: MapLayerMouseEvent) => {
        const id = evenement.features?.[0]?.properties?.id;
        if (typeof id === "number") rappels.current.surChoix?.(id);
      });
    }
    for (const couche of [COUCHES_LIEUX.groupes, COUCHES_LIEUX.points, COUCHES_LIEUX.lettres]) {
      instance.on("mouseenter", couche, () => {
        if (!unSeul || rappels.current.surChoix) toile.style.cursor = "pointer";
      });
      instance.on("mouseleave", couche, () => {
        toile.style.cursor = "";
      });
    }
    instance.on("moveend", (evenement: EvenementDeplacement) => {
      if (!evenement.originalEvent && !evenement.parPersonne) return;
      const centre = instance.getCenter();
      rappels.current.surDeplacement?.({ latitude: centre.lat, longitude: centre.lng });
    });
  }

  function situer() {
    if (!("geolocation" in navigator)) return setMessage(T.meSituer.indisponible);
    setMessage(T.meSituer.recherche);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const zone = arrondirPosition({ latitude: coords.latitude, longitude: coords.longitude }, 2);
        carte.current?.flyTo({ center: [zone.longitude, zone.latitude], zoom: ZOOM_ZONE }, PAR_PERSONNE);
        setMessage(T.meSituer.trouve);
      },
      (erreur) => setMessage(erreur.code === erreur.PERMISSION_DENIED ? T.meSituer.refus : T.meSituer.indisponible),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 10 * 60_000 },
    );
  }

  const prete = etat === "prete";
  const icone = grand ? "size-6" : "size-5";

  return (
    <div className={`overflow-hidden bg-[#F4ECD8] ${className}`}>
      <div ref={conteneur} className="h-full w-full" />
      {!prete && <MessageCarte etat={etat} lienListe={lienListe} />}
      <div className={`absolute z-10 flex flex-col gap-2 ${classeBoutons}`}>
        {avantBoutons}
        {prete && (
          <>
            <BoutonCarte etiquette={T.boutons.zoomer} grand={grand} surClic={() => carte.current?.zoomIn({}, PAR_PERSONNE)}>
              <IconeCarte nom="plus" className={icone} />
            </BoutonCarte>
            <BoutonCarte etiquette={T.boutons.dezoomer} grand={grand} surClic={() => carte.current?.zoomOut({}, PAR_PERSONNE)}>
              <IconeCarte nom="moins" className={icone} />
            </BoutonCarte>
            {meSituer && (
              <BoutonCarte etiquette={T.boutons.meSituer} grand={grand} surClic={situer}>
                <IconeCarte nom="situer" className={icone} />
              </BoutonCarte>
            )}
          </>
        )}
      </div>
      {prete && children}
      <p role="status" className={message ? "absolute top-4 left-1/2 z-20 w-max max-w-[calc(100%-120px)] -translate-x-1/2 rounded-xl border-2 border-encre bg-white px-3 py-2 text-center text-sm font-semibold shadow-brut-petit" : "sr-only"}>
        {message ? lierPonctuation(message) : ""}
      </p>
      <AttributionCarte className={classeAttribution} />
    </div>
  );
}
