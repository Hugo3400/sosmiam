export function ApercuPopUp({ titre, texte, emoji, bouton }: { titre: string; texte: string; emoji: string; bouton: string }) {
  return (
    <div className="relative grid min-h-[420px] content-center self-start overflow-hidden rounded-[28px] bg-nuit p-5" aria-label="Aperçu dans l'app">
      <div className="absolute inset-0 grid grid-cols-2 gap-2 p-4 opacity-25" aria-hidden>
        {Array.from({ length: 6 }, (_, i) => <div key={i} className="h-24 rounded-xl bg-white/40" />)}
      </div>
      <div className="relative grid gap-3 rounded-2xl border-2 border-encre bg-white p-5 text-center shadow-brut">
        {emoji && <p className="text-4xl" aria-hidden>{emoji}</p>}
        <p className="font-titre text-lg font-extrabold">{titre || "Le titre de la pop-up"}</p>
        <p className="text-sm whitespace-pre-line">{texte || "Ce que tu veux dire aux Miamis en ouvrant l'app."}</p>
        {bouton && <span className="mx-auto rounded-full border-2 border-encre bg-jaune px-4 py-1.5 text-sm font-extrabold text-nuit">{bouton}</span>}
        <span className="text-sm font-semibold text-gris">Fermer</span>
      </div>
    </div>
  );
}
