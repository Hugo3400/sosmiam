import { useState, type ReactNode } from "react";
import { useLocation } from "react-router";

import { Bouton } from "~/composants/interface/Bouton";
import { TEXTES_CONSENTEMENT_PAR_LANGUE, type IdCategorieFacultative } from "~/contenus/cookies-consentement";
import { TEXTES_PAGES_LEGALES_PAR_LANGUE } from "~/contenus/legal/liens-legaux";
import { choisirAffichageContenuExterne } from "~/fonctions/consentement/choisir-affichage-contenu-externe";
import { ecrireRetourConsentement } from "~/fonctions/consentement/ecrire-retour-consentement";
import { lierPonctuation } from "~/fonctions/texte/lier-ponctuation";
import { utiliserConsentement } from "~/hooks/utiliser-consentement";
import { utiliserJavascriptActif } from "~/hooks/utiliser-javascript-actif";
import { utiliserTextes } from "~/hooks/utiliser-textes";

type Genre = "video" | "carte" | "publication";

type Props = {
  /** Qui fournit le contenu (« YouTube », « Instagram »…) : un partenaire déclaré de la catégorie */
  fournisseur: string;
  genre: Genre;
  /** Titre du contenu : dans la vignette, et pour les lecteurs d'écran */
  titre: string;
  /** Le contenu chez le fournisseur : lien « Voir sur … », qui marche sans JavaScript et sans accord */
  lienDirect: string;
  /** Proportions de la vignette et du contenu (« 16 / 9 ») */
  proportions?: string;
  categorie?: IdCategorieFacultative;
  /** Le contenu tiers (iframe, script…) : rendu seulement dans le navigateur, après accord ou « Afficher quand même » */
  children: ReactNode;
};

/**
 * Un contenu d'un autre site (vidéo YouTube, carte, publication Instagram ou TikTok). Tant qu'il n'y a pas d'accord, une
 * vignette le remplace : « Cette vidéo vient de YouTube, qui pose des cookies. [Afficher quand même] [Toujours afficher
 * les vidéos] ». Aucun script ni iframe du fournisseur n'est chargé avant ; et jamais dans le HTML du serveur.
 * « Afficher quand même » vaut pour ce contenu, le temps de la page ; « Toujours afficher » accepte la catégorie (POST
 * /cookies/choix, aussi sans JavaScript) et n'apparaît que si elle est active (partenaire déclaré).
 */
export function ContenuExterne({ fournisseur, genre, titre, lienDirect, proportions = "16 / 9", categorie = "contenus-externes", children }: Props) {
  const { aConsenti, aChoisir, actionFormulaire, envoyerFormulaire } = utiliserConsentement();
  const location = useLocation();
  const javascript = utiliserJavascriptActif();
  const [afficheUneFois, setAfficheUneFois] = useState(false);
  const affichage = choisirAffichageContenuExterne({ consenti: aConsenti(categorie), afficheUneFois, navigateur: javascript });
  const T = utiliserTextes(TEXTES_CONSENTEMENT_PAR_LANGUE).contenuExterne;
  const { gererCookies } = utiliserTextes(TEXTES_PAGES_LEGALES_PAR_LANGUE);
  const { vientDe, toujours } = T[genre];

  if (affichage === "contenu") return <div style={{ aspectRatio: proportions }}>{children}</div>;
  if (affichage === "attente") {
    return <div style={{ aspectRatio: proportions }} className="grid place-items-center rounded-carte bg-creme text-gris">{titre}</div>;
  }
  return (
    <figure
      style={{ aspectRatio: proportions }}
      className="flex flex-col items-center justify-center gap-3 overflow-auto rounded-carte border-2 border-encre bg-creme p-5 text-center"
    >
      <figcaption className="grid gap-1">
        <span className="font-titre text-lg font-extrabold">{titre}</span>
        <span className="text-[.95rem] text-gris">{lierPonctuation(vientDe(fournisseur))}</span>
      </figcaption>
      <div className="flex flex-wrap justify-center gap-2.5">
        {javascript && <Bouton petit onClick={() => setAfficheUneFois(true)}>{T.afficherQuandMeme}</Bouton>}
        {aChoisir.some((candidate) => candidate.id === categorie) && (
          <form method="post" action={actionFormulaire} onSubmit={envoyerFormulaire}>
            <input type="hidden" name="retour" value={ecrireRetourConsentement(location.pathname, location.search)} />
            <input type="hidden" name="categorie" value={categorie} />
            <Bouton type="submit" name="geste" value="accepter-categorie" variante="blanc" petit>{toujours}</Bouton>
          </form>
        )}
      </div>
      <p className="text-sm text-gris">
        <a href={lienDirect} className="font-semibold text-encre underline decoration-jaune decoration-2 underline-offset-2">
          {T.voirSur(fournisseur)}
        </a>
        {aChoisir.some((candidate) => candidate.id === categorie) &&
          lierPonctuation(T.portee(gererCookies))}
      </p>
    </figure>
  );
}
