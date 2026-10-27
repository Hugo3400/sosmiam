import { useEffect, useState } from "react";

import { TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE } from "~/contenus/candidature-fondateur";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  /** « Fondateur n° 3 de Lyon · n° 147 en France » : pour décrire l'aperçu */
  numero: string;
};

type Titre = "fondateur" | "fondatrice";
const ADRESSE_CARTE = "/espace/fondateur/carte.svg";
const classeBouton = `inline-flex items-center justify-center rounded-full border-2 border-encre px-[26px] py-3.5 font-semibold transition-[translate,box-shadow]
  duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand active:translate-x-0.5 active:translate-y-0.5
  focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre`;

/**
 * « Ta carte de fondateur » : l'aperçu, le choix « Fondateur » ou « Fondatrice » (dans l'adresse, rien n'est gardé) et
 * « Télécharger ma carte » (SVG, un formulaire GET qui marche sans JavaScript). Avec JavaScript, l'aperçu suit le choix et
 * un second bouton la convertit en PNG dans le navigateur (pour les réseaux qui refusent le SVG).
 */
export function TelechargerCarte({ numero }: Props) {
  const T = utiliserTextes(TEXTES_CANDIDATURE_FONDATEUR_PAR_LANGUE).carte;
  const [titre, setTitre] = useState<Titre>("fondateur");
  const [pret, setPret] = useState(false);
  const [etatPng, setEtatPng] = useState<"" | "en-cours" | "erreur">("");
  useEffect(() => setPret(true), []);
  const apercu = `${ADRESSE_CARTE}?apercu=1&titre=${titre}`;

  async function telechargerPng() {
    if (etatPng === "en-cours") return;
    setEtatPng("en-cours");
    try {
      const image = new Image();
      image.src = apercu;
      await image.decode();
      const toile = document.createElement("canvas");
      toile.width = 2400;
      toile.height = 1500;
      toile.getContext("2d")?.drawImage(image, 0, 0, toile.width, toile.height);
      const png = await new Promise<Blob | null>((fini) => toile.toBlob(fini, "image/png"));
      if (!png) throw new Error("PNG vide");
      const lien = document.createElement("a");
      lien.href = URL.createObjectURL(png);
      lien.download = `carte-${titre}-sos-miam.png`;
      lien.click();
      window.setTimeout(() => URL.revokeObjectURL(lien.href), 10_000);
      setEtatPng("");
    } catch {
      setEtatPng("erreur");
    }
  }

  return (
    <section aria-labelledby="carte-titre" className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-10">
      <h2 id="carte-titre" className="text-2xl font-extrabold">{T.titre}</h2>
      <p className="mt-1.5 text-gris">{lierPonctuation(T.texte)}</p>
      <img
        src={apercu}
        alt={T.apercu(numero)}
        width={1200}
        height={750}
        className="mt-5 h-auto w-full rounded-2xl"
      />
      <form method="get" action={ADRESSE_CARTE} className="mt-6">
        <fieldset>
          <legend className="mb-2 text-sm font-semibold">{T.legende}</legend>
          <div className="flex flex-wrap gap-x-6 gap-y-2.5">
            {(["fondateur", "fondatrice"] as const).map((choix) => (
              <label key={choix} className="flex cursor-pointer items-center gap-3 font-medium">
                <input
                  type="radio"
                  name="titre"
                  value={choix}
                  checked={titre === choix}
                  onChange={() => setTitre(choix)}
                  className="h-5 w-5 shrink-0 cursor-pointer accent-encre"
                />
                {choix === "fondateur" ? T.fondateur : T.fondatrice}
              </label>
            ))}
          </div>
        </fieldset>
        <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-3">
          <button type="submit" className={`${classeBouton} bg-jaune shadow-brut`}>{T.telecharger}</button>
          {pret && (
            <button type="button" onClick={telechargerPng} aria-disabled={etatPng === "en-cours"} className={`${classeBouton} bg-white shadow-brut`}>
              {etatPng === "en-cours" ? T.preparation : T.png}
            </button>
          )}
        </div>
        <p role="status" className="mt-3 text-sm font-semibold text-rouge-texte">
          {etatPng === "erreur" ? lierPonctuation(T.erreurPng) : ""}
        </p>
      </form>
    </section>
  );
}
