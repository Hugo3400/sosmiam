import { Download, Radio } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Chargement } from "~/composants/interface/Chargement.tsx";
import { MessageErreur } from "~/composants/interface/MessageErreur.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import { utiliserChargement } from "~/hooks/utiliser-chargement.ts";
import { lireJournalServeur, lireSourcesJournaux, type FiltreJournal } from "~/services/journaux-serveur.ts";
import { enregistrerFichier } from "~/services/systeme.ts";
import { TerminalJournal } from "./TerminalJournal.tsx";

const FILTRES: { valeur: FiltreJournal; libelle: string }[] = [
  { valeur: "tout", libelle: "Tout" },
  { valeur: "problemes", libelle: "Erreurs et avertissements" },
];

export function OngletJournaux({ tour }: { tour: number }) {
  const sources = utiliserChargement(lireSourcesJournaux, [tour]);
  const [source, setSource] = useState("api");
  const [filtre, setFiltre] = useState<FiltreJournal>("tout");
  const [recherche, setRecherche] = useState("");
  const [suivre, setSuivre] = useState(false);
  const journal = utiliserChargement(() => lireJournalServeur(source, filtre), [source, filtre, tour]);
  const relireJournal = journal.recharger;

  useEffect(() => {
    if (!suivre) return;
    const minuteur = setInterval(relireJournal, 5000);
    return () => clearInterval(minuteur);
  }, [suivre, relireJournal]);

  const cherche = recherche.trim();
  const lignes = (journal.donnees?.lignes ?? []).filter((ligne) => !cherche || ligne.texte.toLowerCase().includes(cherche.toLowerCase()));

  async function enregistrer() {
    if (!journal.donnees) return;
    const texte = journal.donnees.lignes.map((ligne) => `${ligne.heure ?? "-"}\t${ligne.niveau}\t${ligne.texte}`).join("\n");
    await enregistrerFichier(`journal-${journal.donnees.id}-${new Date().toISOString().slice(0, 10)}.txt`, texte, "text/plain");
  }

  return (
    <Carte titre="Journaux des programmes" actions={journal.donnees && <span className="font-mono text-xs text-gris">{journal.donnees.fichiers.join(" · ")}</span>}>
      <div className="grid gap-3">
        <MessageErreur erreur={sources.erreur} reessayer={sources.recharger} />
        <div role="group" aria-label="Journal à lire" className="flex flex-wrap gap-1.5">
          {(sources.donnees?.sources ?? []).map((element) => (
            <button
              key={element.id}
              type="button"
              aria-pressed={source === element.id}
              onClick={() => setSource(element.id)}
              className={`inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold ${source === element.id ? "border-nuit bg-nuit text-jaune" : "border-ligne bg-white hover:border-encre"}`}
            >
              {element.erreursRecentes !== null && element.erreursRecentes > 0 && <span className="size-2 rounded-full bg-tomate" aria-label={`${element.erreursRecentes} erreur(s) dans la dernière heure`} />}
              {element.nom}
              {!element.existe && <span className="text-xs font-normal text-gris">(vide)</span>}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-2">
            <Onglets libelle="Lignes affichées" valeur={filtre} options={FILTRES} onChange={setFiltre} />
            <label className="sr-only" htmlFor="recherche-journal">Chercher dans le journal</label>
            <input
              id="recherche-journal"
              type="search"
              value={recherche}
              onChange={(evenement) => setRecherche(evenement.target.value)}
              placeholder="Chercher (ex. courriels)"
              className="h-9 w-56 max-w-full rounded-xl border border-ligne bg-white px-3 text-sm focus:border-encre focus:outline-none"
            />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Bouton petit icone={Radio} variante={suivre ? "principal" : "secondaire"} onClick={() => setSuivre((avant) => !avant)}>{suivre ? "En direct" : "Suivre en direct"}</Bouton>
            <Bouton petit icone={Download} desactive={!journal.donnees?.lignes.length} onClick={() => void enregistrer()}>Enregistrer sur le PC</Bouton>
          </div>
        </div>
        {!journal.donnees && journal.chargement ? <Chargement /> : journal.donnees ? <TerminalJournal lignes={lignes} recherche={cherche} suivre={suivre} horodate={journal.donnees.horodate} /> : <MessageErreur erreur={journal.erreur} reessayer={journal.recharger} />}
        {journal.donnees && (
          <p className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-[12.5px] text-gris">
            <span>Gardés 14 jours. Les e-mails, les IP et les jetons sont masqués avant de quitter le serveur.{journal.donnees.horodate ? "" : " Ce programme n'écrit pas encore l'heure de ses lignes."}</span>
            <span className="chiffres">{lignes.length} ligne{lignes.length > 1 ? "s" : ""} affichée{lignes.length > 1 ? "s" : ""} sur {journal.donnees.total}</span>
          </p>
        )}
      </div>
    </Carte>
  );
}
