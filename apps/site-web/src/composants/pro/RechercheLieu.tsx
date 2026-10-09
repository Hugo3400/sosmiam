import { Form, Link, useNavigate } from "react-router";

import { ChampLieu } from "~/composants/pro/ChampLieu";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import type { LieuTrouve } from "~/types/pro";

type Props = {
  /** La recherche d'avant (?texte=…) */
  texte: string;
  /** Les lieux trouvés côté serveur (sans JavaScript, ou en arrivant avec ?texte=) ; null : pas de recherche */
  trouves: LieuTrouve[] | null;
  /** Rien trouvé, ou l'API ne répond pas */
  message: string | null;
};

/** Le formulaire de demande d'un lieu ; nom et ville suivent, pour un lieu en brouillon (sans fiche publique). */
const adresseLieu = (lieu: LieuTrouve) => `/rattacher/${lieu.id}?${new URLSearchParams({ nom: lieu.nom, ville: lieu.ville })}`;

const classeLien = "font-semibold underline decoration-jaune decoration-[3px] underline-offset-2 hover:decoration-encre";

/**
 * « Chercher mon lieu » : un formulaire GET (/rattacher?texte=…) qui marche sans JavaScript, la page cherchant côté
 * serveur et listant les lieux trouvés (liens /rattacher/:id). Avec JavaScript, le champ propose les lieux au fil de la
 * frappe et en choisir un ouvre directement le formulaire de demande.
 */
export function RechercheLieu({ texte, trouves, message }: Props) {
  const navigate = useNavigate();
  const decrit = ["rattacher-aide", message ? "rattacher-message" : ""].filter(Boolean).join(" ");
  return (
    <div className="rounded-carte border-2 border-encre bg-white p-6 shadow-brut md:p-8">
      <Form method="get" action="/rattacher" role="search" aria-label="Chercher mon lieu">
        <label htmlFor="rattacher-texte" className="mb-1.5 block text-sm font-semibold">Le nom de ton lieu (et sa ville, si tu veux)</label>
        <p id="rattacher-aide" className="mb-2 text-sm text-gris">{lierPonctuation("Seuls les lieux déjà publiés sur SOS Miam apparaissent.")}</p>
        <div className="flex flex-wrap gap-3">
          <ChampLieu
            id="rattacher-texte"
            name="texte"
            valeurInitiale={texte}
            decritPar={decrit}
            invalide={Boolean(message)}
            onChoisir={(lieu) => navigate(adresseLieu(lieu))}
            className="min-w-0 flex-[1_1_14rem]"
          />
          <button
            type="submit"
            className="rounded-full border-2 border-encre bg-jaune px-6 py-3 font-semibold text-encre shadow-brut transition-[translate,box-shadow] duration-150
              hover:-translate-x-0.5 hover:-translate-y-0.5 focus-visible:outline-3 focus-visible:outline-offset-3 focus-visible:outline-encre"
          >
            Chercher
          </button>
        </div>
      </Form>
      {message && <p id="rattacher-message" className="mt-3 font-semibold text-rouge-texte">{lierPonctuation(message)}</p>}
      {trouves && trouves.length > 0 && (
        <div className="mt-6">
          <h2 id="rattacher-trouves" className="mb-2 font-titre text-lg font-extrabold">{lierPonctuation("C'est lequel ?")}</h2>
          <ul aria-labelledby="rattacher-trouves" className="grid gap-2">
            {trouves.map((lieu) => (
              <li key={lieu.id}>
                <span aria-hidden="true">{`${lieu.emoji} `}</span>
                <Link to={adresseLieu(lieu)} className={classeLien}>{lieu.nom}</Link>
                <span className="text-gris">{` (${lieu.quartier ? `${lieu.quartier}, ` : ""}${lieu.ville})`}</span>
                {lieu.statut === "brouillon" && <span className="ml-2 text-sm text-gris">{lierPonctuation("· pas encore publié")}</span>}
                {lieu.estVerifie && <span className="ml-2 text-sm font-semibold">· Vérifié ✓</span>}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
