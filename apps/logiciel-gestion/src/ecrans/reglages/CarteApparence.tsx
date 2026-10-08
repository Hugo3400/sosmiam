import { Keyboard, Palette } from "lucide-react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { Carte } from "~/composants/interface/Carte.tsx";
import { Onglets } from "~/composants/interface/Onglets.tsx";
import type { ChoixTheme } from "~/stockage/reglages-poste.ts";

type Props = { theme: ChoixTheme; onTheme: (theme: ChoixTheme) => void; onRaccourcis: () => void };

/** Apparence du logiciel (clair, sombre, comme Windows) et rappel des raccourcis clavier. */
export function CarteApparence({ theme, onTheme, onRaccourcis }: Props) {
  return (
    <Carte titre={<span className="flex items-center gap-2"><Palette className="size-4" aria-hidden /> Apparence</span>}>
      <div className="grid gap-3 text-sm">
        <Onglets
          libelle="Thème"
          valeur={theme}
          onChange={onTheme}
          options={[{ valeur: "auto", libelle: "Comme Windows" }, { valeur: "clair", libelle: "Clair" }, { valeur: "sombre", libelle: "Sombre" }]}
        />
        <p className="text-gris">« Comme Windows » passe tout seul en sombre le soir si Windows le fait. Les mails et les aperçus restent en clair, comme les verront les gens.</p>
        <Bouton petit icone={Keyboard} className="justify-self-start" onClick={onRaccourcis}>Voir les raccourcis clavier</Bouton>
      </div>
    </Carte>
  );
}
