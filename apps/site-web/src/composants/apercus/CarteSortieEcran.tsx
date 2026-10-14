import { AvatarMiami } from "~/composants/apercus/AvatarMiami";
import { EtiquetteEcran } from "~/composants/apercus/EtiquetteEcran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

export type SortieEcran = {
  quand: string;
  places: string;
  titre: string;
  lieu: string;
  organisateur: string;
  fond: string;
  etiquettes: string[];
  /** Public réservé choisi par l'organisateur (« Entre filles »…) ; sans lui, la sortie est pour tous les Miamis */
  public?: string;
  /** La sortie a une étiquette parmi tes envies */
  correspond?: boolean;
};

/** Une sortie des Miamis dans un écran dessiné : quand, places, public réservé éventuel, lieu vérifié et étiquettes. */
export function CarteSortieEcran({ sortie }: { sortie: SortieEcran }) {
  return (
    <div className="flex shrink-0 flex-col gap-1.5 rounded-[18px] border border-ligne bg-white p-3">
      <span className="flex justify-between text-[11px] text-gris">
        <span className="font-semibold text-encre">{sortie.quand}</span>
        <span>{sortie.places}</span>
      </span>
      {sortie.public && (
        <span className="self-start rounded-lg bg-encre px-2 py-0.5 text-[10.5px] font-bold text-jaune">{lierPonctuation(sortie.public)}</span>
      )}
      <span className="flex flex-col">
        <span className="font-bold">{lierPonctuation(sortie.titre)}</span>
        <span className="text-[11px] text-gris">{lierPonctuation(sortie.lieu)} · vérifié</span>
      </span>
      <span className="flex flex-wrap gap-1">
        {sortie.etiquettes.map((etiquette) => <EtiquetteEcran key={etiquette}>{etiquette}</EtiquetteEcran>)}
        {sortie.correspond && <EtiquetteEcran variante="jaune">♥ Te correspond</EtiquetteEcran>}
      </span>
      <span className="flex items-center gap-1.5 text-[11px] text-gris">
        <AvatarMiami nom={sortie.organisateur} fond={sortie.fond} taille={20} />
        {sortie.organisateur} organise
      </span>
    </div>
  );
}
