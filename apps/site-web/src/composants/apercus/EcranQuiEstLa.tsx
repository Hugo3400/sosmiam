import { AvatarMiami } from "~/composants/apercus/AvatarMiami";
import { BarreOngletsApp } from "~/composants/apercus/BarreOngletsApp";
import { EnTeteEcran } from "~/composants/apercus/EnTeteEcran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

type EtatCoucou = "coucou" | "envoye" | "pote";

// Miamis inventés qui ont choisi d'apparaître ici
const MIAMIS: { pseudo: string; infos: string; fond: string; coucou: EtatCoucou }[] = [
  { pseudo: "@nina.miam", infos: "Végétarien en commun", fond: "#F3E2FF", coucou: "coucou" },
  { pseudo: "@ines.gourmande", infos: "Ambassadrice · organise un pique-nique", fond: "#DDE5FF", coucou: "envoye" },
  { pseudo: "@malo.galette", infos: "Dans ta bande", fond: "#D9EEDF", coucou: "pote" },
  { pseudo: "@yanis.bao", infos: "Nouveau dans la ville", fond: "#FFE1DD", coucou: "coucou" },
];

const BOUTONS: Record<EtatCoucou, { texte: string; style: string }> = {
  coucou: { texte: "👋 Coucou", style: "border border-encre bg-white font-bold" },
  envoye: { texte: "Envoyé ✓", style: "bg-creme text-gris" },
  pote: { texte: "Pote", style: "bg-jaune-clair font-semibold" },
};

/** Écran « Qui est là ? » : se montrer ou pas, un coucou réciproque, et les Miamis de la ville. */
export function EcranQuiEstLa() {
  return (
    <>
      <EnTeteEcran titre={lierPonctuation("Qui est là ?")} surTitre="Ta ville" retour />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-4">
        <div className="flex shrink-0 items-center gap-3 rounded-[16px] border border-ligne bg-white p-3">
          <span className="flex min-w-0 flex-1 flex-col">
            <span className="text-[12.5px] font-bold">Me montrer ici</span>
            <span className="text-[10.5px] text-gris">Pseudo et avatar, jamais ta position.</span>
          </span>
          <span className="flex h-6 w-11 shrink-0 items-center justify-end rounded-full bg-encre p-0.5">
            <span className="h-5 w-5 rounded-full bg-jaune" />
          </span>
        </div>

        <div className="flex shrink-0 flex-col gap-2 rounded-[18px] border-2 border-encre bg-jaune-clair p-3 shadow-brut-petit">
          <span className="flex items-center gap-2">
            <AvatarMiami nom="@sam.frites" fond="#FFF1A8" taille={30} className="border-encre" />
            <span className="text-[12px] font-bold">{lierPonctuation("@sam.frites et toi, vous vous êtes fait coucou !")}</span>
          </span>
          <span className="text-[11px]">{lierPonctuation("2 envies en commun : Végétarien, Calme.")}</span>
          <span className="flex gap-1.5">
            <span className="flex-1 rounded-xl bg-encre py-1.5 text-center text-[11.5px] font-bold text-creme">Ajouter à ma bande</span>
            <span className="rounded-xl border border-encre bg-white px-3 py-1.5 text-[11.5px] font-semibold">Plus tard</span>
          </span>
        </div>

        <div className="flex shrink-0 flex-col divide-y divide-ligne rounded-[16px] border border-ligne bg-white px-3">
          {MIAMIS.map((miami) => (
            <span key={miami.pseudo} className="flex items-center gap-2 py-2">
              <AvatarMiami nom={miami.pseudo} fond={miami.fond} taille={30} />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[12px] font-semibold">{miami.pseudo}</span>
                <span className="text-[10.5px] leading-tight text-gris">{miami.infos}</span>
              </span>
              <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] ${BOUTONS[miami.coucou].style}`}>{BOUTONS[miami.coucou].texte}</span>
            </span>
          ))}
        </div>
        <span className="shrink-0 text-center text-[10.5px] text-gris">
          {lierPonctuation("Pas de coucou en retour ? Rien ne se passe, personne n'est prévenu.")}
        </span>
      </div>
      <BarreOngletsApp actif="Communauté" />
    </>
  );
}
