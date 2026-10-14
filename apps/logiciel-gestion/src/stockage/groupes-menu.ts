// Les groupes du menu repliés sur ce poste (« Contenus », « Serveur »…), gardés sur l'ordinateur.

const CLE = "sosmiam-gestion:groupes-replies";

export function lireGroupesReplies(): string[] {
  try {
    const lus: unknown = JSON.parse(localStorage.getItem(CLE) ?? "[]");
    return Array.isArray(lus) ? lus.filter((groupe): groupe is string => typeof groupe === "string") : [];
  } catch {
    return [];
  }
}

export function ecrireGroupesReplies(groupes: string[]): void {
  try {
    localStorage.setItem(CLE, JSON.stringify(groupes));
  } catch {
    // Stockage indisponible : le choix vaut jusqu'à la fermeture du logiciel
  }
}
