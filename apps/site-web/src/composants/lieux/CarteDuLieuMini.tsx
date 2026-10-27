import { lazy, Suspense, useEffect, useMemo, useReducer, useRef } from "react";

import { CLASSE_LIEN, CLASSE_TITRE_COTE } from "~/composants/lieux/classes-fiche-lieu";
import { IconeFiche } from "~/composants/lieux/IconeFiche";
import { TEXTES_CARTE_DES_LIEUX } from "~/contenus/carte-des-lieux";
import { TEXTES_FICHE_LIEU } from "~/contenus/fiche-lieu";
import { avancerCarteMini } from "~/fonctions/carte-des-lieux/avancer-carte-mini";
import { guetterApproche } from "~/fonctions/carte-des-lieux/guetter-approche";
import { verifierWebgl } from "~/fonctions/carte-des-lieux/verifier-webgl";
import { creerLienItineraire } from "~/fonctions/lieux/creer-lien-itineraire";
import { ecrireAdresseLieu } from "~/fonctions/lieux/ecrire-adresse-lieu";
import type { EpingleLieu } from "~/types/lieux";
import type { FichePublique } from "~/types/pro";

const CarteDesLieux = lazy(() => import("~/composants/carte-des-lieux/CarteDesLieux").then((module) => ({ default: module.CarteDesLieux })));

const FOND_EMPLACEMENT = {
  backgroundColor: "#F4ECD8",
  backgroundImage: "linear-gradient(90deg, transparent 47%, #fff 47%, #fff 50%, transparent 50%), linear-gradient(0deg, transparent 40%, #fff 40%, #fff 45%, transparent 45%)",
};

export function CarteDuLieuMini({ lieu }: { lieu: FichePublique }) {
  const T = TEXTES_FICHE_LIEU.ouCest;
  const boite = useRef<HTMLDivElement>(null);
  const [etat, avancer] = useReducer(avancerCarteMini, "repos");
  const { id, nom, type, position } = lieu;
  const enSos = Boolean(lieu.sos);
  const latitude = position?.latitude ?? null;
  const longitude = position?.longitude ?? null;
  const epingles = useMemo<EpingleLieu[]>(
    () => (latitude === null || longitude === null ? [] : [{ id, nom, type, latitude, longitude, sos: enSos }]),
    [id, nom, type, latitude, longitude, enSos],
  );

  useEffect(() => {
    if (!boite.current || epingles.length === 0) return;
    return guetterApproche(boite.current, () => avancer({ type: "approche", webgl: verifierWebgl() }));
  }, [epingles.length]);

  const montree = etat === "chargement" || etat === "prete";
  return (
    <section aria-labelledby="fiche-ou" className="overflow-hidden rounded-carte border-2 border-encre bg-white">
      {position && (
        <div ref={boite} className="relative h-[200px] border-b-2 border-encre" style={FOND_EMPLACEMENT}>
          <span aria-hidden="true" className="absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-[3px] border-encre bg-tomate text-white shadow-brut-petit">
            <IconeFiche nom="epingle" className="h-5 w-5" />
          </span>
          {montree && (
            <div
              data-carte-du-lieu={etat}
              inert={etat !== "prete"}
              className={`absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none ${etat === "prete" ? "opacity-100" : "opacity-0"}`}
            >
              <Suspense fallback={null}>
                <CarteDesLieux
                  variante="un-seul"
                  epingles={epingles}
                  lieuChoisi={id}
                  titre={TEXTES_CARTE_DES_LIEUX.titreUnLieu(nom)}
                  gestesCooperatifs
                  classeBoutons="top-3 left-3"
                  surEtat={(etatCarte) => avancer({ type: "carte", etat: etatCarte })}
                  className="relative h-full"
                />
              </Suspense>
            </div>
          )}
          <a
            href={`/lieux?lieu=${id}&vue=carte`}
            className="absolute top-3 right-3 z-20 inline-flex items-center gap-1.5 rounded-full border-2 border-encre bg-white px-3.5 py-2 text-sm font-bold text-encre no-underline shadow-brut-petit focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
          >
            <IconeFiche nom="agrandir" className="h-4 w-4" />
            {T.agrandir}
          </a>
        </div>
      )}
      <div className="flex flex-col gap-1.5 px-5 py-[18px] md:px-[22px]">
        <h2 id="fiche-ou" className={CLASSE_TITRE_COTE}>{T.titre}</h2>
        <p className="text-[15px] [overflow-wrap:anywhere]">{ecrireAdresseLieu(lieu)}</p>
        <a href={creerLienItineraire(lieu)} rel="noopener nofollow" className={`self-start text-[15px] ${CLASSE_LIEN}`}>
          {T.itineraire}
          <span aria-hidden="true"> →</span>
          <span className="sr-only">{TEXTES_FICHE_LIEU.actions.vers(nom)}</span>
        </a>
      </div>
    </section>
  );
}
