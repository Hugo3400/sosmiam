import { outilsLieux } from "~/contenus/pros";
import { formaterPrix } from "~/fonctions/prix/formater-prix";

/** Carte de la section pros : tous les outils sont gratuits, sans abonnement ni commission. */
export function CarteToutGratuit() {
  return (
    <article className="relative rounded-carte border-2 border-encre bg-jaune px-6 pt-7 pb-6 shadow-brut-grand">
      <span className="absolute -top-3.5 right-4 rounded-full bg-rouge-sos px-3 py-0.5 text-xs font-bold text-white">Pour toujours</span>
      <h3 className="text-xl font-extrabold">Tout est gratuit</h3>
      <p className="mt-2 mb-5 font-titre text-[2.4rem] leading-none font-extrabold">
        {formaterPrix(0)}<small className="text-base font-semibold"> pour ton lieu</small>
      </p>
      <ul className="grid list-disc gap-1.5 pl-5 text-[.95rem] sm:grid-cols-2 sm:gap-x-8">
        {outilsLieux.map((outil) => <li key={outil}>{outil}</li>)}
      </ul>
      <p className="mt-5 rounded-xl border-2 border-dashed border-encre bg-white px-3 py-2 text-center text-[.85rem] font-bold">
        Sans abonnement, sans engagement, sans commission
      </p>
      <p className="mt-3 text-sm">SOS Miam vit de la pub, toujours signalée, qui ne change jamais le classement.</p>
    </article>
  );
}
