import { IconeReseau } from "~/composants/liens/IconeReseau";
import type { LienPublic, Reseau } from "~/contenus/liens-publics";

// Pastille de l'icône : la couleur du réseau, pour qu'on le reconnaisse d'un coup d'œil ; la bouée sur jaune clair pour le site
const pastilles: Record<Reseau, string> = {
  prevenu: "bg-jaune",
  ambassadeur: "bg-jaune",
  pro: "bg-jaune",
  "inscrire-lieu": "bg-jaune",
  site: "bg-jaune-clair",
  discord: "bg-[#5865F2] text-white",
  tiktok: "bg-encre text-white",
  instagram: "bg-tomate text-white",
};

type Props = {
  lien: LienPublic;
};

/** Un lien de la page /liens : grande carte cliquable, bord noir et ombre décalée comme les boutons de la marque. */
export function CarteLien({ lien }: Props) {
  return (
    <a
      // Passe par /liens/aller/… pour compter le clic (statistiques sans cookie), puis redirige vers lien.adresse
      href={`/liens/aller/${lien.reseau}`}
      className="group flex items-center gap-4 rounded-carte border-2 border-encre bg-white p-4 shadow-brut
        transition-[translate,box-shadow] duration-150 hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-brut-grand
        active:translate-x-0.5 active:translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
    >
      <span className={`grid size-14 shrink-0 place-items-center rounded-2xl border-2 border-encre ${pastilles[lien.reseau]}`}>
        <IconeReseau reseau={lien.reseau} className={lien.reseau === "site" ? "size-11" : "size-7 text-2xl leading-none"} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block font-titre text-xl font-extrabold leading-tight">{lien.nom}</span>
        <span className="block text-sm font-semibold break-words">{lien.identifiant}</span>
        <span className="mt-1 block text-sm leading-snug text-gris">{lien.accroche}</span>
      </span>
      <span aria-hidden="true" className="shrink-0 text-2xl transition-transform duration-150 group-hover:translate-x-1">→</span>
    </a>
  );
}
