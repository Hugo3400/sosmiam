/** Bandeau en haut de toutes les pages publiques : l'app n'est pas encore sortie, on peut être prévenu. */
export function BandeauDeveloppement() {
  return (
    <p className="bg-encre px-4 py-2.5 text-center text-sm text-creme">
      🛠️ L'app SOS Miam est en développement : elle arrive bientôt partout en France.{" "}
      <a href="/#inscription" className="font-semibold whitespace-nowrap text-jaune underline decoration-2 underline-offset-4">
        Préviens-moi
      </a>
    </p>
  );
}
