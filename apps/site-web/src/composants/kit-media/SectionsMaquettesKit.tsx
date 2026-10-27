import { Bouton } from "~/composants/interface/Bouton";
import { CarteMaquetteKit } from "~/composants/kit-media/CarteMaquetteKit";
import { SectionKit } from "~/composants/kit-media/SectionKit";
import {
  TEXTES_MAQUETTES_KITS_PAR_LANGUE, assemblerMaquettesKits, assemblerZipsMaquettes, listerMaquettesKit, type KitMaquettes,
} from "~/contenus/maquettes-kits";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Props = {
  kit: KitMaquettes;
  /** Kit des lieux : les maquettes Miam Safe seulement si la charte est signée */
  miamSafe?: boolean;
  /** Adresse des fichiers du kit : « /kit-media », « /kit-media-pro » ou « /kit-media-lieux » */
  prefixe: string;
  poids: Record<string, string | null>;
};

/**
 * Les maquettes validées d'un kit (affiches en A4, A3 et 40 × 60 cm, imprimés, visuels réseaux), une partie par groupe,
 * avec le zip de tout le groupe quand il y en a un. Rien n'apparaît pour un groupe vide dans ce kit.
 */
export function SectionsMaquettesKit({ kit, miamSafe = true, prefixe, poids }: Props) {
  const T = utiliserTextes(TEXTES_MAQUETTES_KITS_PAR_LANGUE);
  const maquettes = listerMaquettesKit(kit, miamSafe, assemblerMaquettesKits(T));
  const zipsMaquettes = assemblerZipsMaquettes(T);
  const groupesMaquettes = (["affiches", "imprimes", "reseaux"] as const).map((groupe) => ({ groupe, ...T.groupes[groupe] }));
  return (
    <>
      {groupesMaquettes.map(({ groupe, titre, texte }) => {
        const duGroupe = maquettes.filter((m) => m.groupe === groupe);
        if (duGroupe.length === 0) return null;
        const zip = zipsMaquettes.find((z) => z.kit === kit && z.groupe === groupe)?.fichier;
        return (
          <SectionKit key={groupe} id={`maquettes-${groupe}`} titre={titre} texte={texte}>
            {zip ? (
              <div className="mb-6">
                <Bouton href={`${prefixe}/${zip.nom}`} variante="blanc">
                  {T.boutons.toutTelecharger(poids[zip.nom])}
                  <span className="sr-only">&nbsp;: {zip.taille}</span>
                </Bouton>
              </div>
            ) : null}
            <ul className="grid gap-5 md:grid-cols-2">
              {duGroupe.map((m) => <CarteMaquetteKit key={m.id} maquette={m} prefixe={prefixe} poids={poids} />)}
            </ul>
          </SectionKit>
        );
      })}
    </>
  );
}
