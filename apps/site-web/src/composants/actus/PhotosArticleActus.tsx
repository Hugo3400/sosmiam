import { ImageArticleActus } from "~/composants/actus/ImageArticleActus";
import { TEXTES_ACTUS_PAR_LANGUE } from "~/contenus/actus";
import { utiliserTextes } from "~/hooks/utiliser-textes";

export function PhotosArticleActus({ photos }: { photos: readonly string[] }) {
  const A = utiliserTextes(TEXTES_ACTUS_PAR_LANGUE).article;
  if (photos.length === 0) return null;
  return (
    <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {photos.map((photo, rang) => (
        <li key={photo} className="overflow-hidden rounded-carte border-2 border-encre bg-ligne empty:hidden">
          <ImageArticleActus adresse={photo} alt={A.photo(rang + 1)} largeur={1200} hauteur={900} className="aspect-[4/3] h-auto w-full object-cover" />
        </li>
      ))}
    </ul>
  );
}
