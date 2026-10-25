import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  adresse: string;
  largeur: number;
  hauteur: number;
  secours: ReactNode;
  onPanne: () => void;
  className?: string;
};

export function ImageLieuEnLigne({ adresse, largeur, hauteur, secours, onPanne, className = "" }: Props) {
  const image = useRef<HTMLImageElement>(null);
  const [enPanne, setEnPanne] = useState(false);

  useEffect(() => {
    const element = image.current;
    const casse = Boolean(element?.complete && element.naturalWidth === 0);
    setEnPanne(casse);
    if (casse) onPanne();
  }, [adresse, onPanne]);

  if (enPanne) return secours;
  return (
    <img
      ref={image}
      src={adresse}
      alt=""
      width={largeur}
      height={hauteur}
      onError={() => {
        setEnPanne(true);
        onPanne();
      }}
      className={className}
    />
  );
}
