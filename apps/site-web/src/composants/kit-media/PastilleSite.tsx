/** « sosmiam.fr » dans une grande pastille, en bas des visuels à poster (sur fond sombre : jaune). */
export function PastilleSite({ sombre = false, grande = false }: { sombre?: boolean; grande?: boolean }) {
  const couleurs = sombre ? "bg-jaune text-encre" : "border-4 border-encre bg-encre text-jaune";
  return (
    <p className={`rounded-full font-titre leading-none font-extrabold tracking-tight ${grande ? "px-14 py-6 text-[56px]" : "px-12 py-5 text-[46px]"} ${couleurs}`}>
      sosmiam.fr
    </p>
  );
}
