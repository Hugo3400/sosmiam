import { lieuxExemples } from "~/contenus/lieux-exemples";

/** Téléphone décoratif du haut de l'accueil, qui montre l'app avec deux lieux d'exemple. */
export function MaquetteTelephone() {
  const lieux = lieuxExemples.slice(0, 2);
  return (
    <div aria-hidden="true" className="w-[290px] justify-self-center rotate-0 rounded-[44px] bg-encre p-3 shadow-telephone lg:rotate-[4deg] lg:animate-flotte">
      <div className="flex min-h-[520px] flex-col gap-3.5 rounded-[34px] bg-creme px-4 py-5">
        <div className="flex items-center justify-between text-sm font-semibold">
          <span>📍 Montpellier</span>
          <span className="rounded-lg bg-tomate px-2.5 py-0.5 font-titre text-[.85rem] font-extrabold text-white">SOS</span>
        </div>
        {lieux.map((lieu) => (
          <div key={lieu.id} className="overflow-hidden rounded-[18px] bg-white shadow-douce">
            <div className="grid h-[120px] place-items-center text-5xl"
              style={{ background: `linear-gradient(135deg, ${lieu.couleurs[0]}, ${lieu.couleurs[1]})` }}>
              {lieu.emoji}
            </div>
            <div className="flex flex-col gap-0.5 px-3 pt-2.5 pb-3 text-[.8rem] text-gris">
              <strong className="text-[.95rem] text-encre">{lieu.nom}</strong>
              <span>{lieu.info} · {lieu.quartier}</span>
              {lieu.alerte
                ? <span className="mt-1.5 self-start rounded-full bg-rose-alerte px-2.5 py-0.5 text-xs font-semibold text-rouge-texte">{lieu.alerte}</span>
                : <span className="mt-1.5 self-start rounded-full bg-jaune-clair px-2.5 py-0.5 text-xs font-semibold text-encre">🛟 {lieu.rescousses} rescousses</span>}
            </div>
          </div>
        ))}
        <span className="mt-auto rounded-full border-2 border-encre bg-jaune py-3 text-center text-[.95rem] font-bold">À la rescousse !</span>
      </div>
    </div>
  );
}
