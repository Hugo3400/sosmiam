import { useEffect, useRef } from "react";

import type { LigneJournal } from "~/services/journaux-serveur.ts";

const heure = new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit", second: "2-digit", timeZone: "Europe/Paris" });
const jour = new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "2-digit", timeZone: "Europe/Paris" });
const NIVEAUX = { info: { libelle: "info", classe: "text-[#8FD1AC]" }, avert: { libelle: "avert.", classe: "text-[#F2C94C]" }, erreur: { libelle: "erreur", classe: "text-[#FF8F85]" } };

function surligner(texte: string, recherche: string) {
  if (!recherche) return texte;
  const morceaux = texte.split(new RegExp(`(${recherche.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi"));
  return morceaux.map((morceau, rang) => (rang % 2 === 1 ? <mark key={rang} className="rounded-sm bg-jaune px-0.5 text-nuit">{morceau}</mark> : morceau));
}

function nommerHeure(valeur: string | null) {
  if (!valeur) return "—";
  const date = new Date(valeur);
  const aujourdhui = jour.format(new Date()) === jour.format(date);
  return aujourdhui ? heure.format(date) : `${jour.format(date)} ${heure.format(date).slice(0, 5)}`;
}

export function TerminalJournal({ lignes, recherche, suivre, horodate }: { lignes: LigneJournal[]; recherche: string; suivre: boolean; horodate: boolean }) {
  const zone = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = zone.current;
    if (element && suivre) element.scrollTop = element.scrollHeight;
  }, [lignes, suivre]);
  useEffect(() => {
    const element = zone.current;
    if (element) element.scrollTop = element.scrollHeight;
  }, []);

  return (
    <div ref={zone} role="log" aria-live={suivre ? "polite" : "off"} tabIndex={0} className="max-h-[460px] min-h-48 overflow-auto rounded-xl bg-nuit py-2.5 font-mono text-[12.5px] leading-relaxed text-[#EAE5D9]">
      {lignes.length === 0 ? (
        <p className="px-4 py-8 text-center font-texte text-sm text-[#8F8A80]">{recherche ? `Rien ne correspond à « ${recherche} ».` : "Rien d'anormal dans ce journal. Le Capitaine peut dormir tranquille."}</p>
      ) : (
        lignes.map((ligne, rang) => (
          <div key={`${rang}-${ligne.heure ?? ""}`} className={`grid gap-2.5 px-4 hover:bg-white/5 ${horodate ? "grid-cols-[92px_56px_minmax(0,1fr)]" : "grid-cols-[56px_minmax(0,1fr)]"} ${ligne.niveau === "erreur" ? "bg-[#FF4D3D]/10" : ""}`}>
            {horodate && <time className="chiffres text-[#8F8A80]">{nommerHeure(ligne.heure)}</time>}
            <span className={`font-bold ${NIVEAUX[ligne.niveau].classe}`}>{NIVEAUX[ligne.niveau].libelle}</span>
            <code className="break-words whitespace-pre-wrap">{surligner(ligne.texte, recherche)}</code>
          </div>
        ))
      )}
    </div>
  );
}
