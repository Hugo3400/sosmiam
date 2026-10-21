import { Link } from "react-router";

import type { OffreCarriere } from "../../../../../packages/commun/src/types/carriere.ts";
import { Bouton } from "~/composants/interface/Bouton";
import { domainesOffre, typesOffre } from "~/contenus/carriere";
import { formaterDateAParis } from "~/fonctions/dates/formater-date-a-paris";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const classeCarte = "rounded-carte border-2 border-encre bg-white p-5 shadow-brut md:p-6";

export function DetailOffre({ offre }: { offre: OffreCarriere }) {
  const domaine = domainesOffre[offre.domaine];
  const type = typesOffre.find((t) => t.valeur === offre.type)?.libelle ?? "";
  const publiee = formaterDateAParis(offre.publieeLe);
  const reperes = [
    { titre: "Formule", valeur: type },
    { titre: "Domaine", valeur: domaine.libelle },
    { titre: "Où", valeur: offre.lieu },
    { titre: "Âge", valeur: "Dès 18 ans" },
    ...(offre.type === "freelance" ? [{ titre: "Rémunération", valeur: "Sur devis : tu proposes ton tarif" }] : []),
    ...(publiee ? [{ titre: "Publiée le", valeur: publiee }] : []),
  ];
  const listes = [
    { id: "missions", titre: "Tes missions", emoji: "🎯", lignes: offre.missions },
    { id: "profil", titre: "Ton profil", emoji: "🔎", lignes: offre.profil },
    { id: "en-echange", titre: "En échange", emoji: "🎁", lignes: offre.enEchange },
  ].filter((liste) => liste.lignes.length > 0);

  return (
    <>
      <div className="border-b-2 border-encre bg-jaune">
        <div className="mx-auto w-[min(860px,100%-32px)] pt-6 pb-16">
          <Link to="/carriere" className="font-semibold underline decoration-2 underline-offset-2 hover:decoration-encre">
            <span aria-hidden="true">← </span>Toutes les offres
          </Link>
          <p className="mt-8 text-5xl" aria-hidden="true">{domaine.emoji}</p>
        </div>
      </div>
      <div className="mx-auto -mt-10 w-[min(860px,100%-32px)]">
        <header className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut-grand md:p-8">
          <p className="flex flex-wrap gap-2 text-sm font-semibold">
            <span className={`rounded-full border-2 border-encre px-3 py-0.5 ${offre.type === "benevolat" ? "bg-jaune" : "bg-white"}`}>{type}</span>
            <span className="rounded-full bg-jaune-clair px-3 py-1">{domaine.libelle}</span>
          </p>
          <h1 className="mt-4 text-[clamp(2rem,5vw,3.2rem)] font-extrabold tracking-tight [overflow-wrap:anywhere]">{offre.titre}</h1>
          {offre.resume && <p className="mt-3 text-lg text-gris [overflow-wrap:anywhere]">{lierPonctuation(offre.resume)}</p>}
          <dl className="mt-6 grid gap-x-6 gap-y-3 border-t-2 border-ligne pt-5 sm:grid-cols-2">
            {reperes.map((repere) => (
              <div key={repere.titre}>
                <dt className="text-sm text-gris">{repere.titre}</dt>
                <dd className="font-semibold">{lierPonctuation(repere.valeur)}</dd>
              </div>
            ))}
          </dl>
          <Bouton href="#candidater" className="mt-7 w-full sm:w-auto">Je candidate</Bouton>
        </header>

        <div className="mt-8 grid gap-6">
          {offre.description.trim() && (
            <section aria-labelledby="offre-description" className={classeCarte}>
              <h2 id="offre-description" className="text-2xl font-extrabold">L'offre en quelques mots</h2>
              <p className="mt-3 whitespace-pre-line [overflow-wrap:anywhere]">{lierPonctuation(offre.description)}</p>
            </section>
          )}
          {listes.map((liste) => (
            <section key={liste.id} aria-labelledby={`offre-${liste.id}`} className={classeCarte}>
              <h2 id={`offre-${liste.id}`} className="text-2xl font-extrabold"><span aria-hidden="true">{liste.emoji} </span>{liste.titre}</h2>
              <ul className="mt-3 flex flex-col gap-2">
                {liste.lignes.map((ligne, rang) => (
                  <li key={rang} className="flex gap-2.5 [overflow-wrap:anywhere]">
                    <span aria-hidden="true" className="mt-2.5 h-2 w-2 shrink-0 rounded-full bg-tomate" />
                    <span>{lierPonctuation(ligne)}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </>
  );
}
