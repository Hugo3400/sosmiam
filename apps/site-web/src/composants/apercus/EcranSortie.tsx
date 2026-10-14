import { AvatarMiami } from "~/composants/apercus/AvatarMiami";
import { EnTeteEcran } from "~/composants/apercus/EnTeteEcran";
import { EtiquetteEcran } from "~/composants/apercus/EtiquetteEcran";
import { PictoCategorie } from "~/composants/marque/PictoCategorie";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

// Qui vient : pseudos inventés
const PARTICIPANTS: [string, string, string][] = [
  ["@lea.croque", "#FFE1DD", "organise"],
  ["@ines.gourmande", "#DDE5FF", "habituée"],
  ["@malo.galette", "#D9EEDF", "dans ta bande"],
];

/** Écran d'une sortie : habitués, qui vient, place gardée pour un nouveau, liste d'attente, rappel et QR du comptoir. */
export function EcranSortie() {
  return (
    <>
      <EnTeteEcran titre="Brunch des nouveaux arrivants" surTitre="Sortie des Miamis" retour />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-4">
        <span className="flex shrink-0 flex-wrap gap-1">
          <EtiquetteEcran variante="sombre">Dim. 11 h</EtiquetteEcran>
          <EtiquetteEcran variante="jaune">Chaque semaine · 3 habitués</EtiquetteEcran>
        </span>

        <div className="flex shrink-0 items-center gap-2.5 rounded-[16px] border border-ligne bg-white p-2.5">
          <PictoCategorie type="resto" className="h-9 w-9 shrink-0" />
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[12.5px] font-bold">Restaurant du Capitaine Bouiboui</span>
            <span className="text-[11px] text-gris">Brunch · à 800 m</span>
          </span>
          <span className="shrink-0 rounded-full bg-jaune-clair px-2 py-0.5 text-[10.5px] font-bold">Vérifié ✓</span>
        </div>

        <span className="flex shrink-0 items-baseline justify-between">
          <span className="font-titre text-[15px] font-extrabold">Qui vient</span>
          <span className="text-[11px] text-gris">8 / 8 · complet</span>
        </span>
        <div className="flex shrink-0 flex-col gap-1.5">
          {PARTICIPANTS.map(([pseudo, fond, note]) => (
            <span key={pseudo} className="flex items-center gap-2 text-[12px]">
              <AvatarMiami nom={pseudo} fond={fond} taille={26} />
              <span className="font-semibold">{pseudo}</span>
              <span className="text-[11px] text-gris">{note}</span>
            </span>
          ))}
          <span className="pl-[34px] text-[11px] text-gris">et 5 autres Miamis</span>
        </div>

        <div className="shrink-0 rounded-[14px] border-2 border-dashed border-encre bg-jaune-clair px-3 py-2 text-[11.5px] font-semibold">
          🌱 1 place gardée pour quelqu'un de nouveau dans l'app ou dans la ville.
        </div>
        <div className="flex shrink-0 items-center gap-2 rounded-[14px] bg-white px-3 py-2 text-[11.5px]">
          <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-creme font-bold">2</span>
          <span>
            <b>{lierPonctuation("Liste d'attente : tu es 2e.")}</b> Tu entres dès qu'une place se libère.
          </span>
        </div>
        <span className="shrink-0 text-[11px] text-gris">
          {lierPonctuation("🔔 Rappel la veille. « Je ne peux plus venir » libère ta place en un geste.")}
        </span>
      </div>
      <div className="shrink-0 px-4 pt-2 pb-5">
        <span className="flex items-center justify-center gap-2 rounded-2xl bg-encre py-3 text-[14px] font-bold text-creme">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4h6v6H4zm10 0h6v6h-6zM4 14h6v6H4zm10 0h2v2h-2zm4 0h2m-6 4h2v2m2-2h2v2" />
          </svg>
          Je suis là · QR du comptoir
        </span>
      </div>
    </>
  );
}
