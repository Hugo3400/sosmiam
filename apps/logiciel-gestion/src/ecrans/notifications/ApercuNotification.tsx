/** Aperçu d'une notification telle qu'elle s'affichera sur l'écran verrouillé d'un téléphone. */
export function ApercuNotification({ titre, texte }: { titre: string; texte: string }) {
  return (
    <div className="grid content-start gap-3 self-start rounded-[28px] bg-nuit p-4 pb-16" aria-label="Aperçu sur un téléphone">
      <p className="text-center font-titre text-4xl font-extrabold text-white/90">20:41</p>
      <div className="flex gap-3 rounded-2xl bg-white/85 p-3 backdrop-blur">
        <img src="/favicon.svg" alt="" className="size-9 shrink-0 rounded-lg" />
        <div className="min-w-0 flex-1">
          <div className="flex justify-between gap-2 text-[12px] text-gris"><span className="font-semibold tracking-wide uppercase">SOS Miam</span><span>maintenant</span></div>
          <p className="truncate text-sm font-bold">{titre || "Titre de la notification"}</p>
          <p className="line-clamp-3 text-sm">{texte || "Le texte, court et qui donne envie."}</p>
        </div>
      </div>
    </div>
  );
}
