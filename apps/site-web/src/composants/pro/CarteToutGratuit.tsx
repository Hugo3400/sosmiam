import { TEXTES_PROS_PAR_LANGUE } from "~/contenus/pros";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Carte de la section pros : tous les outils sont gratuits, sans abonnement ni commission. */
export function CarteToutGratuit() {
  const T = utiliserTextes(TEXTES_PROS_PAR_LANGUE).carte;
  return (
    <article className="relative rounded-carte border-2 border-encre bg-jaune px-6 pt-7 pb-6 shadow-brut-grand">
      <span className="absolute -top-3.5 right-4 rounded-full bg-rouge-sos px-3 py-0.5 text-xs font-bold text-white">{T.pourToujours}</span>
      <h3 className="text-xl font-extrabold">{T.titre}</h3>
      <p className="mt-2 mb-5 font-titre text-[2.4rem] leading-none font-extrabold">
        {T.prix}<small className="text-base font-semibold"> {T.pourTonLieu}</small>
      </p>
      <ul className="grid list-disc gap-1.5 pl-5 text-[.95rem] sm:grid-cols-2 sm:gap-x-8">
        {T.outils.map((outil) => <li key={outil}>{outil}</li>)}
      </ul>
      <p className="mt-5 rounded-xl border-2 border-dashed border-encre bg-white px-3 py-2 text-center text-[.85rem] font-bold">
        {T.sansEngagement}
      </p>
      <p className="mt-3 text-sm">{T.pub}</p>
    </article>
  );
}
