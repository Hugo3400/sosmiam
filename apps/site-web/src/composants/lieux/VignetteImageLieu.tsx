import type { ImageSignalable } from "~/fonctions/lieux/lister-images-signalables";

export function VignetteImageLieu({ quelle, source }: { quelle: ImageSignalable; source: string | null | undefined }) {
  if (!source) return null;
  return quelle === "banniere" ? (
    <img src={source} alt="" width={1600} height={500} className="h-11 w-[141px] shrink-0 rounded-lg border-2 border-encre bg-ligne object-cover" />
  ) : (
    <img src={source} alt="" width={512} height={512} className="size-11 shrink-0 rounded-lg border-2 border-encre bg-white object-cover" />
  );
}
