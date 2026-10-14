import { BarreOngletsApp } from "~/composants/apercus/BarreOngletsApp";
import { CarteSortieEcran, type SortieEcran } from "~/composants/apercus/CarteSortieEcran";
import { EnTeteEcran } from "~/composants/apercus/EnTeteEcran";
import { EtiquetteEcran } from "~/composants/apercus/EtiquetteEcran";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";

const FILTRES = ["Tout", "Vegan", "Petit budget", "Sans alcool", "Calme"];

// Sorties, pseudos et lieux inventés ; le Restaurant du Capitaine Bouiboui est le lieu de démo de SOS Miam
const SORTIES: SortieEcran[] = [
  {
    quand: "Ven. 20 h",
    places: "4 / 6 places",
    public: "Entre filles",
    titre: "Soirée jeux de société",
    lieu: "Le Comptoir des Miamis",
    organisateur: "@nina.miam",
    fond: "#F3E2FF",
    etiquettes: ["Jeux de société", "Sans alcool"],
    correspond: true,
  },
  {
    quand: "Dim. 11 h",
    places: "5 / 8 places",
    titre: "Brunch des nouveaux arrivants",
    lieu: "Restaurant du Capitaine Bouiboui",
    organisateur: "@lea.croque",
    fond: "#FFE1DD",
    etiquettes: ["Végétarien", "LGBT+ friendly", "Timides bienvenus"],
  },
  {
    quand: "Jeu. 19 h 30",
    places: "3 / 6 places",
    titre: "Tournée des crêpes",
    lieu: "La Cantine de la Brigade",
    organisateur: "@malo.galette",
    fond: "#D9EEDF",
    etiquettes: ["Petit budget", "Sucré"],
  },
];

/** Écran des sorties des Miamis : filtres par étiquette, une sortie réservée « Entre filles », deux sorties pour tous. */
export function EcranSorties() {
  return (
    <>
      <EnTeteEcran titre="Sorties des Miamis" surTitre="Communauté" retour />
      <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-hidden px-4">
        <span className="flex shrink-0 gap-1.5 overflow-hidden">
          {FILTRES.map((filtre, rang) => (
            <EtiquetteEcran key={filtre} variante={rang ? "claire" : "sombre"}>{filtre}</EtiquetteEcran>
          ))}
        </span>
        <span className="shrink-0 text-[11px] text-gris">
          {lierPonctuation("Tes envies : ")}
          <b className="font-semibold text-encre">Sans alcool, Calme</b>
        </span>
        {SORTIES.map((sortie) => <CarteSortieEcran key={sortie.titre} sortie={sortie} />)}
      </div>
      <BarreOngletsApp actif="Communauté" />
    </>
  );
}
