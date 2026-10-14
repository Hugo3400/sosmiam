import { Download, FileText } from "lucide-react";
import { useEffect, useState } from "react";

import { Bouton } from "~/composants/interface/Bouton.tsx";
import { formaterOctets } from "~/fonctions/texte/formater-octets.ts";
import { lirePieceMessage, type DossierBoite, type PieceMessage } from "~/services/boite.ts";
import { enregistrerFichierBinaire } from "~/services/systeme.ts";

type Props = { uid: number; dossier: DossierBoite; pieces: PieceMessage[] };

/** Images au-delà de cette taille : pas d'aperçu automatique, seulement « Enregistrer » */
const APERCU_MAX = 8 * 1024 * 1024;
const estImage = (piece: PieceMessage) => /^image\/(png|jpe?g|gif|webp|bmp|avif)$/.test(piece.type) && piece.taille <= APERCU_MAX;

/** Les images du mail en vignettes (clic : en grand), et les autres pièces jointes à enregistrer sur le PC. */
export function PiecesMessage({ uid, dossier, pieces }: Props) {
  const [apercus, setApercus] = useState<Record<number, string>>({});
  const [grande, setGrande] = useState<string | null>(null);
  const [erreur, setErreur] = useState<string | null>(null);
  useEffect(() => {
    let annule = false;
    const adresses: string[] = [];
    void Promise.all(pieces.filter(estImage).map(async (piece) => {
      const fichier = await lirePieceMessage(uid, piece.numero, dossier).catch(() => null);
      if (!fichier || annule) return;
      const adresse = URL.createObjectURL(fichier);
      adresses.push(adresse);
      setApercus((avant) => ({ ...avant, [piece.numero]: adresse }));
    }));
    return () => {
      annule = true;
      adresses.forEach((adresse) => URL.revokeObjectURL(adresse));
      setApercus({});
    };
  }, [uid, dossier, pieces]);

  async function enregistrer(piece: PieceMessage) {
    setErreur(null);
    try {
      await enregistrerFichierBinaire(piece.nom, await lirePieceMessage(uid, piece.numero, dossier));
    } catch {
      setErreur(`« ${piece.nom} » n'a pas pu être récupéré (trop lourd, ou la boîte ne répond pas).`);
    }
  }

  if (pieces.length === 0) return null;
  const images = pieces.filter(estImage);
  const autres = pieces.filter((piece) => !estImage(piece));
  return (
    <section className="grid gap-3" aria-label="Pièces jointes et images">
      {images.length > 0 && (
        <ul className="flex flex-wrap gap-3">
          {images.map((piece) => (
            <li key={piece.numero} className="grid w-36 gap-1">
              <button type="button" onClick={() => apercus[piece.numero] && setGrande(apercus[piece.numero])} className="grid size-36 place-items-center overflow-hidden rounded-xl border border-ligne bg-white">
                {apercus[piece.numero] ? <img src={apercus[piece.numero]} alt={piece.nom} className="size-full object-cover" /> : <span className="text-xs text-gris">Chargement…</span>}
              </button>
              <button type="button" onClick={() => void enregistrer(piece)} className="truncate text-left text-xs text-gris hover:underline" title={`Enregistrer ${piece.nom}`}>
                {piece.nom}
              </button>
            </li>
          ))}
        </ul>
      )}
      {autres.length > 0 && (
        <ul className="flex flex-wrap gap-2">
          {autres.map((piece) => (
            <li key={piece.numero}>
              <Bouton petit icone={piece.type === "application/pdf" ? FileText : Download} onClick={() => void enregistrer(piece)}>
                {piece.nom} · {formaterOctets(piece.taille)}
              </Bouton>
            </li>
          ))}
        </ul>
      )}
      {erreur && <p role="alert" className="text-sm font-semibold text-tomate">{erreur}</p>}
      {grande && (
        <button type="button" onClick={() => setGrande(null)} className="fixed inset-0 z-50 grid place-items-center bg-nuit/80 p-8" aria-label="Fermer l'image">
          <img src={grande} alt="" className="max-h-full max-w-full rounded-xl" />
        </button>
      )}
    </section>
  );
}
