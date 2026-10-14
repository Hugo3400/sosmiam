import { serialiserDonneesStructurees } from "~/fonctions/seo/serialiser-donnees-structurees";

type Props = {
  /** Un objet schema.org (avec « @context ») ou une liste d'objets */
  donnees: object | object[];
};

/**
 * Données structurées (JSON-LD) rendues côté serveur, lues par Google pour comprendre la page. Le JSON est échappé par
 * serialiserDonneesStructurees : un texte venu d'une fiche (nom, présentation) ne peut pas fermer la balise.
 */
export function DonneesStructurees({ donnees }: Props) {
  return <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serialiserDonneesStructurees(donnees) }} />;
}
