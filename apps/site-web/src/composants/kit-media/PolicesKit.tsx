import { POLICES_KIT_MEDIA, TEXTES_KIT_MEDIA_PAR_LANGUE } from "~/contenus/kit-media";
import { utiliserTextes } from "~/hooks/utiliser-textes";

/** Les deux polices de la marque, chacune avec un exemple et son lien Google Fonts (gratuites). */
export function PolicesKit() {
  const T = utiliserTextes(TEXTES_KIT_MEDIA_PAR_LANGUE);
  const policesKitMedia = POLICES_KIT_MEDIA.map((police, i) => ({ ...police, usage: T.usagesPolices[i] }));
  return (
    <ul className="grid gap-4 md:grid-cols-2">
      {policesKitMedia.map((police) => (
        <li key={police.nom} className="rounded-carte border-2 border-encre bg-white p-5">
          <p aria-hidden="true" className={`text-[2.1rem] leading-tight ${police.titre ? "font-titre font-extrabold" : "font-texte"}`}>
            {T.polices.exemple}
          </p>
          <h3 className="mt-4 text-lg font-extrabold">{police.nom}</h3>
          <p className="text-gris">{police.usage}</p>
          <a href={police.lien} className="mt-2 inline-block font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre">
            {T.polices.telecharger}<span className="sr-only"> ({police.nom})</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
