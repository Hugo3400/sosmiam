import { ImagePlus, Trash2, Video } from "lucide-react";
import { useRef, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { expliquerErreur } from "~/fonctions/texte/expliquer-erreur.ts";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { ErreurApi } from "~/services/client-gestion.ts";
import { ajouterMedia, retirerMedia, type Media, type TypeMedia } from "~/services/publications.ts";
import { VignetteMedia } from "./VignetteMedia.tsx";

const ACCEPTE: Record<TypeMedia, string> = {
  video: "video/mp4,video/quicktime,video/webm",
  affiche: "image/jpeg,image/png,image/webp",
  photo: "image/jpeg,image/png,image/webp",
};

/** Vidéo + affiche, ou photos (10 au plus) : envoi et retrait des fichiers d'une publication déjà enregistrée. */
export function GestionMedias({ idPublication, medias, onChange }: { idPublication: number; medias: Media[]; onChange: (medias: Media[]) => void }) {
  const choixFichier = useRef<HTMLInputElement>(null);
  const [typeEnvoi, setTypeEnvoi] = useState<TypeMedia>("photo");
  const [envoi, setEnvoi] = useState<{ enCours: string | null; erreur: string | null }>({ enCours: null, erreur: null });
  const aDesPhotos = medias.some((m) => m.type === "photo");
  const aUneVideo = medias.some((m) => m.type !== "photo");

  function choisir(type: TypeMedia) {
    setTypeEnvoi(type);
    if (choixFichier.current) {
      choixFichier.current.accept = ACCEPTE[type];
      choixFichier.current.multiple = type === "photo";
      choixFichier.current.click();
    }
  }

  async function envoyer(fichiers: FileList | null) {
    if (!fichiers?.length) return;
    let liste = medias;
    for (const fichier of Array.from(fichiers)) {
      setEnvoi({ enCours: `Envoi de ${fichier.name} (${formaterOctets(fichier.size)})…`, erreur: null });
      try {
        const media = await ajouterMedia(idPublication, typeEnvoi, fichier);
        liste = [...liste.filter((m) => typeEnvoi === "photo" || m.type !== typeEnvoi), media];
        onChange(liste);
      } catch (probleme) {
        return setEnvoi({ enCours: null, erreur: `${fichier.name} : ${expliquerErreur(probleme instanceof ErreurApi ? probleme : null)}` });
      }
    }
    setEnvoi({ enCours: null, erreur: null });
  }

  async function retirer(media: Media) {
    await retirerMedia(idPublication, media.id).then(
      () => onChange(medias.filter((m) => m.id !== media.id)),
      (probleme: unknown) => setEnvoi({ enCours: null, erreur: expliquerErreur(probleme instanceof ErreurApi ? probleme : null) }),
    );
  }

  return (
    <div className="grid gap-3">
      <input ref={choixFichier} type="file" className="hidden" onChange={(e) => { void envoyer(e.target.files); e.target.value = ""; }} />
      <div className="flex flex-wrap gap-2">
        <Bouton petit icone={Video} desactive={aDesPhotos || !!envoi.enCours} onClick={() => choisir("video")}>{medias.some((m) => m.type === "video") ? "Remplacer la vidéo" : "Ajouter une vidéo"}</Bouton>
        <Bouton petit icone={ImagePlus} desactive={aDesPhotos || !!envoi.enCours} onClick={() => choisir("affiche")}>Image d'affiche</Bouton>
        <Bouton petit icone={ImagePlus} desactive={aUneVideo || !!envoi.enCours} onClick={() => choisir("photo")}>Ajouter des photos</Bouton>
      </div>
      <p className="text-[13px] text-gris">
        Une vidéo verticale (MP4 de préférence, 150 Mo au plus) avec son affiche, ou jusqu'à 10 photos verticales. Pas les deux.
      </p>
      {envoi.enCours && <p role="status" className="text-sm font-semibold">{envoi.enCours}</p>}
      {envoi.erreur && <p role="alert" className="text-sm font-semibold text-rouge-texte">{envoi.erreur}</p>}
      {medias.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {medias.map((media) => (
            <li key={media.id} className="grid w-24 gap-1">
              <VignetteMedia fichier={media.fichier} video={media.type === "video"} className="aspect-[9/16] w-24 rounded-xl border border-ligne" />
              <div className="flex items-center justify-between text-[11px] text-gris">
                <span>{media.type === "video" ? "Vidéo" : media.type === "affiche" ? "Affiche" : `Photo ${media.ordre + 1}`}</span>
                <button type="button" onClick={() => retirer(media)} aria-label="Retirer ce fichier" className="rounded p-1 hover:bg-rose-alerte hover:text-rouge-texte">
                  <Trash2 className="size-3.5" aria-hidden />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
