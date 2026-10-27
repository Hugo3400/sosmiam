import { SOURCES_FOND_DE_CARTE } from "~/composants/carte-des-lieux/reglages-carte-des-lieux";

export function AttributionCarte({ className = "right-2 bottom-2" }: { className?: string }) {
  return (
    <p className={`absolute z-10 flex flex-wrap gap-x-1.5 rounded-md bg-white/85 px-2 py-0.5 text-[11px] text-gris ${className}`}>
      {SOURCES_FOND_DE_CARTE.map((source) => (
        <a key={source.adresse} href={source.adresse} rel="noopener" className="underline-offset-2 hover:underline focus-visible:outline-2 focus-visible:outline-encre">
          {source.texte}
        </a>
      ))}
    </p>
  );
}
