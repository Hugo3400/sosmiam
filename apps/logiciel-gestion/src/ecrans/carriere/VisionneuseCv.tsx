import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import travailleur from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { useEffect, useRef, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { Modale } from "~/composants/interface/Modale.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { lireCvCandidature } from "~/services/carriere.ts";
import { ErreurApi } from "~/services/client-gestion.ts";

GlobalWorkerOptions.workerSrc = travailleur;
const PAGES_MAX = 10;

export function VisionneuseCv({ candidatureId, nom, onFermer }: { candidatureId: string; nom: string; onFermer: () => void }) {
  const pages = useRef<HTMLDivElement>(null);
  const [etat, setEtat] = useState<{ chargement: boolean; erreur: string | null; total: number }>({ chargement: true, erreur: null, total: 0 });

  useEffect(() => {
    let annule = false;
    (async () => {
      try {
        const octets = new Uint8Array(await (await lireCvCandidature(candidatureId)).arrayBuffer());
        const document = await getDocument({ data: octets, isEvalSupported: false, enableXfa: false, stopAtErrors: true }).promise;
        for (let numero = 1; numero <= Math.min(document.numPages, PAGES_MAX) && !annule; numero++) {
          const page = await document.getPage(numero);
          const vue = page.getViewport({ scale: 1.5 });
          const toile = window.document.createElement("canvas");
          toile.width = vue.width;
          toile.height = vue.height;
          toile.className = "w-full rounded-lg border border-ligne bg-white";
          await page.render({ canvasContext: toile.getContext("2d")!, viewport: vue }).promise;
          pages.current?.appendChild(toile);
        }
        if (!annule) setEtat({ chargement: false, erreur: null, total: document.numPages });
        await document.destroy();
      } catch (probleme) {
        if (!annule) setEtat({ chargement: false, erreur: probleme instanceof ErreurApi ? expliquerErreur(probleme) : "Ce PDF ne s'affiche pas : il est peut-être abîmé.", total: 0 });
      }
    })();
    return () => void (annule = true);
  }, [candidatureId]);

  return (
    <Modale large titre={`CV de ${nom}`} ouverte onFermer={onFermer} actions={<Bouton onClick={onFermer}>Fermer</Bouton>}>
      <div className="grid gap-3">
        <p className="text-xs text-gris">Affiché comme une image : aucun script ni lien du PDF n'est exécuté. L'ouverture est notée au journal.</p>
        {etat.chargement && <Chargement />}
        {etat.erreur && <p role="alert" className="text-sm font-semibold text-tomate">{etat.erreur}</p>}
        <div ref={pages} className="grid gap-3" />
        {etat.total > PAGES_MAX && <p className="text-sm text-gris">{PAGES_MAX} premières pages sur {etat.total}.</p>}
      </div>
    </Modale>
  );
}
