import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { creerAdresseLien } from "~/fonctions/hotes/creer-adresse-lien";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function EncartAmbassadeurActus() {
  const T = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).encart;
  return (
    <aside
      aria-labelledby="actus-ambassadeur"
      className="flex flex-col gap-4 rounded-carte border-2 border-encre bg-jaune p-5 shadow-brut md:flex-row md:items-center md:justify-between md:gap-6 md:px-7 md:py-6"
    >
      <div className="flex max-w-[640px] flex-col gap-1.5">
        <h2 id="actus-ambassadeur" className="text-2xl leading-tight font-extrabold">{lierPonctuation(T.titre)}</h2>
        <p>{lierPonctuation(T.texte)}</p>
      </div>
      <Bouton href={creerAdresseLien("ambassadeur", "/programme", "principal")} variante="encre" className="shrink-0 self-start md:self-auto">
        {T.bouton}
      </Bouton>
    </aside>
  );
}
