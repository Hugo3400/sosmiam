import { LienNavigation } from "~/composants/mise-en-page/LienNavigation";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserEnTete } from "~/hooks/utiliser-en-tete";

type Props = {
  /** Début des id des titres : deux menus vivent dans la page (le dialogue, et celui sans JavaScript) */
  prefixe: string;
  /** La section de l'accueil à l'écran, dont le lien est mis en valeur */
  sectionVisible: string | null;
  /** Un lien est choisi : le menu se ferme */
  surLien?: () => void;
};

const classeLien =
  "group/lien flex items-center justify-between gap-4 rounded-2xl border-2 border-transparent px-3.5 py-2 transition-colors " +
  "hover:border-encre hover:bg-white focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-encre " +
  "aria-[current=page]:border-encre aria-[current=page]:bg-jaune-clair aria-[current=true]:border-encre aria-[current=true]:bg-jaune-clair";

/**
 * Les liens du menu des petits écrans, en deux groupes (« Découvrir », « Rejoindre ») : en gros, chacun avec sa petite
 * phrase, et la page où l'on est (ou la section qu'on lit) surlignée en jaune.
 */
export function GroupesMenu({ prefixe, sectionVisible, surLien }: Props) {
  const { groupesMenu } = utiliserEnTete();
  return (
    <div className="grid gap-6 md:grid-cols-2">
      {groupesMenu.map((groupe, position) => {
        const idTitre = `${prefixe}-groupe-${position}`;
        return (
          <div key={groupe.titre}>
            <h2 id={idTitre} className="mb-1 px-4 font-titre text-sm font-extrabold tracking-[0.14em] text-gris uppercase">
              {groupe.titre}
            </h2>
            <ul aria-labelledby={idTitre} className="grid gap-0.5">
              {groupe.liens.map((lien) => (
                <li key={lien.adresse}>
                  <LienNavigation lien={lien} sectionVisible={lien.section !== undefined && lien.section === sectionVisible} onClick={surLien} className={classeLien}>
                    <span className="min-w-0">
                      <span className="block font-titre text-[1.3rem] leading-tight font-extrabold">{lien.texte}</span>
                      <span className="block text-sm leading-snug text-gris">{lierPonctuation(lien.detail)}</span>
                    </span>
                    <span
                      aria-hidden="true"
                      className="grid size-8 shrink-0 place-items-center rounded-full border-2 border-encre bg-white text-base font-bold transition-colors group-hover/lien:bg-jaune"
                    >
                      →
                    </span>
                  </LienNavigation>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
