import { Link } from "react-router";

import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import type { LieuPublic } from "~/types/lieux";

// Couleurs du dégradé saisies dans le logiciel de gestion : on n'accepte que des codes « #RRGGBB » (ou courts)
const COULEUR = /^#[0-9a-f]{3,8}$/i;

/**
 * Carte d'un vrai lieu publié : visuel, nom, ce que c'est, quartier et ville, prix, et qui l'a fait découvrir. Toute la
 * carte mène à sa fiche (/lieux/:id) : le lien est sur le nom, et son ::after couvre la carte (un seul lien, lu une fois).
 */
export function CarteLieu({ lieu }: { lieu: LieuPublic }) {
  const [debut, fin] = lieu.couleurs.length >= 2 && lieu.couleurs.every((couleur) => COULEUR.test(couleur))
    ? lieu.couleurs
    : ["#FFD60A", "#FF4D3D"];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-carte bg-white shadow-douce transition-transform focus-within:ring-4 focus-within:ring-encre hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <div className="relative grid h-40 place-items-center text-6xl" style={{ background: `linear-gradient(135deg, ${debut}, ${fin})` }}>
        <span aria-hidden="true">{lieu.emoji}</span>
        <PictoCategorie type={lieu.type} className="absolute top-3 right-3 h-9 w-9" />
      </div>
      <div className="flex flex-1 flex-col gap-1 px-5 pt-4 pb-5">
        <h3 className="text-xl font-extrabold">
          <Link to={`/lieux/${lieu.id}`} className="underline-offset-4 outline-none group-hover:underline after:absolute after:inset-0 after:content-['']">
            {lieu.nom}
          </Link>
        </h3>
        <p className="text-sm text-gris">{lieu.prix ? `${lieu.info} · ${lieu.prix}` : lieu.info}</p>
        <p className="text-sm text-gris"><span aria-hidden="true">📍 </span>{lieu.quartier}, {lieu.ville}</p>
        {lieu.decouvertPar && (
          <p className="mt-auto pt-3 text-sm font-semibold"><span aria-hidden="true">🛟 </span>Déniché par {lieu.decouvertPar}</p>
        )}
      </div>
    </article>
  );
}
