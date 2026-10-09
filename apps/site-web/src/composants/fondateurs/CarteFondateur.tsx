import { Logo } from "~/composants/interface/Logo";
import { Bouee } from "~/composants/marque/Bouee";
import { couleursMarque as c } from "~/composants/marque/couleurs-marque";
import { Ecusson } from "~/composants/marque/Ecusson";

type Props = {
  prenom: string;
  /** « Fondateur » ou « Fondatrice » (au choix, rien n'est gardé) */
  titre: string;
  /** « Fondateur n° 3 de Lyon · n° 147 en France » */
  numero: string;
  annee: number;
  /** Polices à glisser dans le fichier (adresses data:), pour qu'il garde son allure ouvert seul */
  polices?: { url: string; plage: string }[];
};

const LARGEUR = 1200;
const HAUTEUR = 750;
const MARGE = 72;
const POLICE = "'Bricolage Grotesque Variable', 'Bricolage Grotesque', system-ui, sans-serif";

/** Taille de texte pour que `texte` tienne dans `largeur` (Bricolage Grotesque 800 : environ 0,6 em par caractère). */
function ajuster(texte: string, largeur: number, maximum: number): number {
  return Math.round(Math.min(maximum, largeur / (0.6 * Math.max(1, [...texte].length))));
}

/**
 * La carte de fondateur numérique, en SVG autonome (1200 × 750) : logo, écusson, prénom, « Fondateur n° 3 de Lyon ·
 * n° 147 en France » et l'année. Servie par routes/ressources/carte-fondateur.ts, qui la rend en texte.
 */
export function CarteFondateur({ prenom, titre, numero, annee, polices = [] }: Props) {
  const libelle = `Carte SOS Miam de ${prenom} : ${numero}, ${annee}`;
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox={`0 0 ${LARGEUR} ${HAUTEUR}`} width={LARGEUR} height={HAUTEUR} role="img" aria-label={libelle}>
      <title>{libelle}</title>
      {polices.length > 0 && (
        <style>
          {polices.map(({ url, plage }) =>
            `@font-face{font-family:'Bricolage Grotesque Variable';font-style:normal;font-weight:200 800;src:url(${url}) format('woff2');unicode-range:${plage};}`).join("")}
        </style>
      )}
      <defs>
        <clipPath id="carte-bord">
          <rect x="6" y="6" width={LARGEUR - 12} height={HAUTEUR - 12} rx="48" />
        </clipPath>
      </defs>
      <rect x="6" y="6" width={LARGEUR - 12} height={HAUTEUR - 12} rx="48" fill={c.jaune} />
      {/* Grande bouée coupée par le bord en bas à droite, comme un tampon, et la bande tomate */}
      <g clipPath="url(#carte-bord)">
        <g opacity="0.18">
          <Bouee x={820} y={380} taille={520} expression="clin" />
        </g>
        <rect x="0" y={HAUTEUR - 150} width={LARGEUR} height="18" fill={c.tomate} />
      </g>
      <rect x="6" y="6" width={LARGEUR - 12} height={HAUTEUR - 12} rx="48" fill="none" stroke={c.encre} strokeWidth="12" />
      <Logo x={MARGE} y={MARGE} largeur={330} />
      <g transform={`rotate(-6 ${LARGEUR - MARGE - 125} ${MARGE + 125})`}>
        <Ecusson ruban={titre.toUpperCase()} x={LARGEUR - MARGE - 250} y={MARGE} taille={250} />
      </g>
      <text x={MARGE} y="300" fontFamily={POLICE} fontWeight="800" fontSize="34" letterSpacing="6" fill={c.encre}>
        {`CARTE DE ${titre.toUpperCase()}`}
      </text>
      <text x={MARGE} y="430" fontFamily={POLICE} fontWeight="800" fontSize={ajuster(prenom, 760, 140)} fill={c.encre}>{prenom}</text>
      <text x={MARGE} y="520" fontFamily={POLICE} fontWeight="700" fontSize={ajuster(numero, LARGEUR - 2 * MARGE, 50)} fill={c.encre}>{numero}</text>
      <text x={MARGE} y={HAUTEUR - 60} fontFamily={POLICE} fontWeight="700" fontSize="34" fill={c.encre}>sosmiam.fr</text>
      <text x={LARGEUR - MARGE} y={HAUTEUR - 60} textAnchor="end" fontFamily={POLICE} fontWeight="800" fontSize="44" fill={c.encre}>{annee}</text>
    </svg>
  );
}
