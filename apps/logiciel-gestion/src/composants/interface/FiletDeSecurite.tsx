import { House, RotateCw, TriangleAlert } from "lucide-react";
import { Component, type ErrorInfo, type ReactNode } from "react";

import { Bouton } from "./Bouton.tsx";

type Proprietes = { children: ReactNode; retour?: () => void; pleinEcran?: boolean };
type Etat = { erreur: Error | null };

export class FiletDeSecurite extends Component<Proprietes, Etat> {
  state: Etat = { erreur: null };

  static getDerivedStateFromError(erreur: unknown): Etat {
    return { erreur: erreur instanceof Error ? erreur : new Error(String(erreur)) };
  }

  componentDidCatch(erreur: unknown, infos: ErrorInfo) {
    console.error("Écran planté :", erreur, infos.componentStack);
  }

  render() {
    const { erreur } = this.state;
    if (!erreur) return this.props.children;
    const { retour, pleinEcran } = this.props;
    return (
      <div role="alert" className={pleinEcran ? "grid h-full place-items-center bg-creme p-8" : "py-10"}>
        <div className="mx-auto grid max-w-xl gap-4 rounded-carte border border-ligne bg-white p-6">
          <p className="flex items-center gap-2 font-titre text-xl font-extrabold">
            <TriangleAlert className="size-6 text-rouge-texte" aria-hidden /> {pleinEcran ? "Le logiciel a planté" : "Cet écran a planté"}
          </p>
          <p className="text-sm">
            Rien n'est perdu côté serveur : c'est l'affichage qui a calé. {pleinEcran ? "Recharge le logiciel pour repartir." : "Le reste du logiciel marche toujours."}
          </p>
          <p className="break-words rounded-xl bg-creme px-3 py-2 font-mono text-[12px] text-gris">{erreur.message.slice(0, 300) || erreur.name}</p>
          <div className="flex flex-wrap gap-2">
            {!pleinEcran && <Bouton icone={RotateCw} onClick={() => this.setState({ erreur: null })}>Réessayer</Bouton>}
            {retour && <Bouton icone={House} onClick={retour}>Retour au tableau de bord</Bouton>}
            <Bouton variante={pleinEcran ? "principal" : undefined} icone={RotateCw} onClick={() => window.location.reload()}>Recharger le logiciel</Bouton>
          </div>
        </div>
      </div>
    );
  }
}
