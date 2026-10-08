// Journal de ce qui est fait depuis le logiciel de gestion. Jamais de donnée personnelle dans le détail
// (pas d'adresse e-mail effacée, par exemple) : seulement l'action et ce qu'elle a touché.
import { baseDeDonnees } from "../../base-de-donnees/connexion.ts";

export async function noterAction(poste: string, action: string, detail?: string): Promise<void> {
  await baseDeDonnees.journalGestion.create({ data: { poste: poste.slice(0, 40), action: action.slice(0, 60), detail: detail?.slice(0, 300) ?? null } });
}

const PAR_PAGE = 50;

export async function listerJournal(page: number) {
  const [total, entrees] = await Promise.all([
    baseDeDonnees.journalGestion.count(),
    baseDeDonnees.journalGestion.findMany({ orderBy: { id: "desc" }, skip: (page - 1) * PAR_PAGE, take: PAR_PAGE }),
  ]);
  return { total, parPage: PAR_PAGE, entrees };
}
