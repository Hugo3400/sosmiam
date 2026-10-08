import { Bookmark, Heart, MessageCircle, Share2 } from "lucide-react";

import type { Media, SaisiePublication } from "~/services/publications.ts";
import { VignetteMedia } from "./VignetteMedia.tsx";

type Props = {
  publication: SaisiePublication;
  lieu: { nom: string; emoji: string; couleurs: string[] } | null;
  medias: Media[];
};

/** Aperçu de la publication dans le fil « Pour toi » de l'app, en plein écran de téléphone. */
export function ApercuPublication({ publication, lieu, medias }: Props) {
  const video = medias.find((m) => m.type === "video");
  const affiche = medias.find((m) => m.type === "affiche");
  const photo = medias.find((m) => m.type === "photo");
  const nombrePhotos = medias.filter((m) => m.type === "photo").length;
  return (
    <div className="relative mx-auto aspect-[9/16] w-[260px] overflow-hidden rounded-[32px] border-[6px] border-encre bg-encre text-white shadow-brut">
      {video || photo ? (
        <VignetteMedia fichier={(video ?? photo)!.fichier} video={!!video} className="absolute inset-0 size-full" />
      ) : affiche ? (
        <VignetteMedia fichier={affiche.fichier} className="absolute inset-0 size-full" />
      ) : (
        <div className="absolute inset-0 grid place-items-center text-7xl" style={{ background: `linear-gradient(160deg, ${lieu?.couleurs[0] ?? "#FFD60A"}, ${lieu?.couleurs[1] ?? "#FF4D3D"})` }} aria-hidden>
          {lieu?.emoji ?? "🍽️"}
        </div>
      )}
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black/80 to-transparent" aria-hidden />
      {nombrePhotos > 1 && <span className="absolute top-3 right-3 rounded-full bg-black/50 px-2 py-0.5 text-[11px] font-bold">1 / {nombrePhotos}</span>}
      <div className="absolute right-2 bottom-24 grid justify-items-center gap-4 text-[10px] font-bold" aria-hidden>
        <Heart className="size-6" /><MessageCircle className="size-6" /><Bookmark className="size-6" /><Share2 className="size-6" />
      </div>
      <div className="absolute inset-x-3 bottom-3 grid gap-1.5 pr-9 text-[12px] leading-snug [text-shadow:0_1px_6px_rgba(0,0,0,.5)]">
        <p className="font-titre text-[15px] font-extrabold">{lieu ? `${lieu.emoji} ${lieu.nom}` : "Choisis un lieu"}</p>
        {publication.auteurType === "createur" && <p className="font-semibold">@{publication.auteurPseudo || "createur"}</p>}
        {publication.partenariat && <p className="w-fit rounded bg-white/25 px-1.5 text-[10px] font-bold">Collaboration commerciale</p>}
        {publication.illustration && (video || photo) && <p className="w-fit rounded bg-white/25 px-1.5 text-[10px] font-bold">{video ? "Vidéo" : "Photos"} d'illustration</p>}
        <p className="line-clamp-4">{publication.legende || "La légende de la publication…"}</p>
      </div>
    </div>
  );
}
